const {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    Notification,
    globalShortcut,
    nativeImage,
} = require("electron");
const path = require("path");
const { execFile } = require("child_process");

// Set application name and Windows AppUserModelID for notifications
app.setName("Focus Desktop");
if (process.platform === "win32") {
    app.setAppUserModelId("Focus Desktop");
}

let mainWindow = null;
let shieldWindow = null;
let shieldWindowReady = false;
let shieldPendingViolations = [];
let tray = null;

function createDummyTrayIcon() {
    // Create a 16x16 solid blue/cyan circle icon using nativeImage data URL
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="7" fill="#06b6d4" />
    <circle cx="8" cy="8" r="4" fill="#09090b" />
    <circle cx="8" cy="8" r="2" fill="#06b6d4" />
  </svg>`;
    return nativeImage.createFromBuffer(Buffer.from(svg));
}

function createWindow() {
    const iconPath = path.join(__dirname, "../public/favicon.ico");
    mainWindow = new BrowserWindow({
        title: "Focus Desktop",
        icon: iconPath,
        width: 1200,
        height: 800,
        minWidth: 380,
        minHeight: 500,
        frame: false,
        backgroundColor: "#09090b",
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
        },
    });

    const isDev =
        process.env.VITE_DEV_SERVER_URL || process.argv.includes("--dev");
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

    if (isDev) {
        let isLoaded = false;
        const loadDevServer = () => {
            if (isLoaded || !mainWindow) return;
            mainWindow.loadURL(devUrl).catch(() => {
                if (!isLoaded && mainWindow) {
                    setTimeout(loadDevServer, 500);
                }
            });
        };

        mainWindow.webContents.on(
            "did-fail-load",
            (_event, _errorCode, _errorDescription, _validatedURL, isMainFrame) => {
                if (isMainFrame && !isLoaded && mainWindow) {
                    setTimeout(loadDevServer, 500);
                }
            }
        );

        mainWindow.webContents.on("did-finish-load", () => {
            isLoaded = true;
            if (mainWindow && !mainWindow.isVisible()) {
                mainWindow.show();
            }
        });

        loadDevServer();
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }

    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

function createTray() {
    try {
        const trayIconPath = path.join(__dirname, "../public/icon16.png");
        let icon = nativeImage.createFromPath(trayIconPath);
        if (icon.isEmpty()) {
            icon = createDummyTrayIcon();
        }
        tray = new Tray(icon);
        tray.setToolTip("Focus Desktop");

        const contextMenu = Menu.buildFromTemplate([
            {
                label: "Focus Desktop",
                enabled: false,
            },
            { type: "separator" },
            {
                label: "Show / Hide App",
                click: () => {
                    if (!mainWindow) return;
                    if (mainWindow.isVisible()) {
                        mainWindow.hide();
                    } else {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                },
            },
            {
                label: "Play / Pause Timer",
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.send("timer-action", "toggle");
                    }
                },
            },
            {
                label: "Toggle Always On Top",
                click: () => {
                    if (!mainWindow) return;
                    const isTop = mainWindow.isAlwaysOnTop();
                    mainWindow.setAlwaysOnTop(!isTop);
                },
            },
            { type: "separator" },
            {
                label: "Quit Focus",
                click: () => {
                    app.isQuitting = true;
                    app.quit();
                },
            },
        ]);

        tray.setContextMenu(contextMenu);
        tray.on("click", () => {
            if (!mainWindow) return;
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        });
    } catch (err) {
        console.error("Tray creation failed:", err);
    }
}

function setupIPC() {
    ipcMain.on("minimize-window", () => {
        if (mainWindow) mainWindow.minimize();
    });

    ipcMain.on("maximize-window", () => {
        if (!mainWindow) return;
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on("close-window", () => {
        if (mainWindow) mainWindow.close();
    });

    ipcMain.on("set-always-on-top", (_event, flag) => {
        if (mainWindow) mainWindow.setAlwaysOnTop(!!flag);
    });

    ipcMain.handle("is-always-on-top", () => {
        return mainWindow ? mainWindow.isAlwaysOnTop() : false;
    });

    ipcMain.on("set-window-size", (_event, { width, height }) => {
        if (mainWindow) mainWindow.setSize(width, height);
    });

    ipcMain.on("show-notification", (_event, { title, body }) => {
        if (Notification.isSupported()) {
            new Notification({
                title: title || "Focus Desktop",
                body: body || "",
            }).show();
        }
    });

    ipcMain.on("shield:sync", (_event, payload) => {
        updateShieldState(payload);
    });

    ipcMain.handle("shield:terminate-process", async (_event, imageName) => {
        return terminateBlockedProcess(imageName);
    });

    ipcMain.on("shield:overlay-action", (_event, payload) => {
        const action = typeof payload === "string" ? payload : payload?.action;
        const keys = typeof payload === "object" && Array.isArray(payload?.keys)
            ? payload.keys
            : [];
        if (action === "dismiss") {
            // Snooze the dismissed detections so repeat polls stop
            // re-showing the overlay for the next 10 minutes.
            const until = Date.now() + SHIELD_SNOOZE_MS;
            for (const key of keys) {
                if (key) shieldSnoozedKeys.set(String(key), until);
            }
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("shield-overlay-action", action);
        }
        hideShieldOverlay();
    });
}

// --- Focus Shield Enforcement ------------------------------------------------
// Mirrors the extension's site-blocking behavior on desktop: while a Flow
// session is active and the shield is enabled, the main process polls the
// OS process list (blocked apps) and visible window titles (blocked sites,
// since Electron cannot observe external browser tabs). Detections are
// reported to the renderer — nothing is killed without user consent.

const SHIELD_POLL_INTERVAL_MS = 5000;
const SHIELD_NOTIFY_COOLDOWN_MS = 60000;
const SHIELD_SNOOZE_MS = 10 * 60 * 1000;

let shieldConfig = {
    enabled: false,
    blockedSites: [],
    allowedSites: [],
    blockedApps: [],
};
let shieldSession = { isActive: false, timerState: "FLOW" };
let shieldPollTimer = null;
const shieldLastNotified = new Map();
const shieldSnoozedKeys = new Map();

function isShieldKeySnoozed(key) {
    const until = shieldSnoozedKeys.get(key) ?? 0;
    if (Date.now() < until) return true;
    shieldSnoozedKeys.delete(key);
    return false;
}

function updateShieldState(payload) {
    if (!payload || typeof payload !== "object") return;
    if (payload.shield && typeof payload.shield === "object") {
        const s = payload.shield;
        shieldConfig = {
            enabled: !!s.enabled,
            blockedSites: Array.isArray(s.blockedSites) ? s.blockedSites : [],
            allowedSites: Array.isArray(s.allowedSites) ? s.allowedSites : [],
            blockedApps: Array.isArray(s.blockedApps) ? s.blockedApps : [],
        };
    }
    if (payload.session && typeof payload.session === "object") {
        shieldSession = {
            isActive: !!payload.session.isActive,
            timerState: payload.session.timerState === "BREAK" ? "BREAK" : "FLOW",
        };
    }
    if (!isShieldBlockingRequired()) {
        hideShieldOverlay();
    }
}

function isShieldBlockingRequired() {
    return (
        shieldConfig.enabled &&
        shieldSession.isActive &&
        shieldSession.timerState === "FLOW" &&
        (shieldConfig.blockedApps.length > 0 || shieldConfig.blockedSites.length > 0)
    );
}

function normalizeSiteEntry(site) {
    return String(site || "")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split(/[/:?#]/)[0]
        .trim();
}

function extractHostname(target) {
    const text = String(target || "").trim();
    if (!text) return "";
    try {
        return new URL(text).hostname.toLowerCase();
    } catch {
        try {
            return new URL(`https://${text}`).hostname.toLowerCase();
        } catch {
            return text.toLowerCase();
        }
    }
}

function siteKeyword(site) {
    const clean = normalizeSiteEntry(site);
    const labels = clean.split(".").filter(Boolean);
    if (labels.length < 2) return null;
    const name = labels[labels.length - 2];
    return name.length >= 4 ? name : null;
}

function titleMatchesBlockedSite(title) {
    if (!title) return null;
    const lowerTitle = String(title).toLowerCase();
    const hostname = extractHostname(title);

    const matchesEntry = (site) => {
        const clean = normalizeSiteEntry(site);
        if (!clean) return false;
        if (hostname.includes(clean) || lowerTitle.includes(clean)) return true;
        const keyword = siteKeyword(site);
        return keyword !== null && lowerTitle.includes(keyword);
    };

    if (shieldConfig.allowedSites.some(matchesEntry)) return null;
    for (const site of shieldConfig.blockedSites) {
        const clean = normalizeSiteEntry(site);
        if (!clean) continue;
        if (
            hostname.includes(clean) ||
            lowerTitle.includes(clean) ||
            (siteKeyword(site) !== null && lowerTitle.includes(siteKeyword(site)))
        ) {
            return clean;
        }
    }
    return null;
}

function matchBlockedApp(processImage) {
    const proc = String(processImage || "").trim().toLowerCase();
    if (!proc) return null;
    const procBase = proc.split(/[/\\]/).pop();
    const stripExe = (s) => s.replace(/\.exe$/, "");
    for (const entry of shieldConfig.blockedApps) {
        const clean = String(entry || "").trim().toLowerCase();
        if (!clean) continue;
        const cleanBase = clean.split(/[/\\]/).pop();
        if (procBase === cleanBase || stripExe(procBase) === stripExe(cleanBase)) {
            return entry;
        }
    }
    return null;
}

function execFileAsync(file, args) {
    return new Promise((resolve) => {
        execFile(file, args, { timeout: 8000, windowsHide: true }, (err, stdout) => {
            if (err) return resolve("");
            resolve(stdout || "");
        });
    });
}

async function listRunningProcesses() {
    if (process.platform === "win32") {
        const out = await execFileAsync("tasklist", ["/FO", "CSV", "/NH"]);
        return out
            .split(/\r?\n/)
            .map((line) => {
                const m = line.match(/^"([^"]+)"/);
                return m ? m[1] : "";
            })
            .filter(Boolean);
    }
    const out = await execFileAsync("ps", ["-ax", "-o", "comm="]);
    return out
        .split(/\r?\n/)
        .map((line) => line.trim().split("/").pop())
        .filter(Boolean);
}

async function listWindowTitles() {
    // Window-title inspection is currently implemented for Windows only.
    if (process.platform !== "win32") return [];
    const script =
        "Get-Process | Where-Object { $_.MainWindowTitle } | ForEach-Object { \"$($_.ProcessName)`t$($_.MainWindowTitle)\" }";
    const out = await execFileAsync("powershell", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        script,
    ]);
    return out
        .split(/\r?\n/)
        .map((line) => {
            const tab = line.indexOf("\t");
            if (tab === -1) return null;
            return {
                process: line.slice(0, tab).trim(),
                title: line.slice(tab + 1).trim(),
            };
        })
        .filter((w) => w && w.title);
}

function shouldNotify(key) {
    const now = Date.now();
    const last = shieldLastNotified.get(key) || 0;
    if (now - last < SHIELD_NOTIFY_COOLDOWN_MS) return false;
    shieldLastNotified.set(key, now);
    return true;
}

function reportShieldViolation(violation) {
    const key = `${violation.kind}:${violation.match}`;
    if (isShieldKeySnoozed(key)) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("shield-violation", violation);
    }
    showShieldOverlay(violation);
    if (shouldNotify(key) && Notification.isSupported()) {
        const label =
            violation.kind === "app"
                ? `Blocked app detected: ${violation.match}`
                : `Blocked site detected: ${violation.match}`;
        new Notification({
            title: "Focus Shield",
            body: `${label} — take action in the Shield overlay.`,
        }).show();
    }
}

async function pollShield() {
    if (!isShieldBlockingRequired()) return;
    try {
        const violations = [];

        if (shieldConfig.blockedApps.length > 0) {
            const seen = new Set();
            const processes = await listRunningProcesses();
            for (const image of processes) {
                const matched = matchBlockedApp(image);
                if (matched && !seen.has(matched.toLowerCase())) {
                    seen.add(matched.toLowerCase());
                    violations.push({
                        kind: "app",
                        match: matched,
                        process: image,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        }

        if (shieldConfig.blockedSites.length > 0) {
            const seenTitles = new Set();
            const windows = await listWindowTitles();
            for (const w of windows) {
                const matched = titleMatchesBlockedSite(w.title);
                if (matched && !seenTitles.has(matched)) {
                    seenTitles.add(matched);
                    violations.push({
                        kind: "site",
                        match: matched,
                        process: w.process,
                        title: w.title,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        }

        for (const v of violations) reportShieldViolation(v);
    } catch (err) {
        console.error("Shield poll failed:", err);
    }
}

function startShieldMonitor() {
    if (shieldPollTimer) return;
    shieldPollTimer = setInterval(pollShield, SHIELD_POLL_INTERVAL_MS);
    if (typeof shieldPollTimer.unref === "function") shieldPollTimer.unref();
}

/**
 * Terminate a blocked app process. Only executes when the requested image
 * matches the current blocked-apps list — never an arbitrary process name.
 */
async function terminateBlockedProcess(imageName) {
    const matched = matchBlockedApp(imageName);
    if (!matched) {
        return { success: false, error: "Process is not in the blocked-apps list." };
    }
    try {
        if (process.platform === "win32") {
            const base = String(imageName).split(/[/\\]/).pop();
            await execFileAsync("taskkill", ["/F", "/IM", base]);
        } else {
            const base = String(imageName).split(/[/\\]/).pop().replace(/\.exe$/, "");
            await execFileAsync("pkill", ["-x", base]);
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: String((err && err.message) || err) };
    }
}

function createShieldWindow() {
    if (shieldWindow && !shieldWindow.isDestroyed()) return shieldWindow;

    shieldWindowReady = false;

    shieldWindow = new BrowserWindow({
        fullscreen: true,
        frame: false,
        transparent: true,
        backgroundColor: "#00000000",
        show: false,
        skipTaskbar: true,
        resizable: false,
        minimizable: false,
        maximizable: false,
        closable: true,
        focusable: true,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: true,
        },
    });
    // Sit above fullscreen apps and the taskbar while visible.
    shieldWindow.setAlwaysOnTop(true, "screen-saver");

    const isDev =
        process.env.VITE_DEV_SERVER_URL || process.argv.includes("--dev");
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    if (isDev) {
        shieldWindow.loadURL(`${devUrl}?overlay=shield`).catch(() => {});
    } else {
        shieldWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
            query: { overlay: "shield" },
        });
    }

    shieldWindow.on("closed", () => {
        shieldWindow = null;
        shieldWindowReady = false;
        shieldPendingViolations = [];
    });

    // Reveal only after the first paint so the window never flashes blank.
    // Reloads (dev HMR) re-mark readiness via did-finish-load.
    shieldWindow.once("ready-to-show", () => {
        shieldWindowReady = true;
        flushShieldPending();
    });
    shieldWindow.webContents.on("did-finish-load", () => {
        if (shieldWindow && !shieldWindow.isDestroyed() && shieldWindow.isVisible()) {
            shieldWindowReady = true;
        }
    });

    return shieldWindow;
}

function flushShieldPending() {
    if (
        !shieldWindow ||
        shieldWindow.isDestroyed() ||
        !shieldWindowReady ||
        shieldPendingViolations.length === 0
    ) {
        return;
    }
    for (const v of shieldPendingViolations) {
        shieldWindow.webContents.send("shield-violation", v);
    }
    shieldPendingViolations = [];
    revealShieldWindow();
}

function revealShieldWindow() {
    if (!shieldWindow || shieldWindow.isDestroyed() || shieldWindow.isVisible()) return;
    shieldWindow.show();
    shieldWindow.moveTop();
    shieldWindow.focus();
}

function showShieldOverlay(violation) {
    try {
        const win = createShieldWindow();
        if (win.isDestroyed()) return;
        if (!shieldWindowReady) {
            // Still loading: queue the violation and reveal once painted.
            shieldPendingViolations.push(violation);
            return;
        }
        win.webContents.send("shield-violation", violation);
        revealShieldWindow();
    } catch (err) {
        console.error("Shield overlay show failed:", err);
    }
}

function hideShieldOverlay() {
    try {
        if (shieldWindow && !shieldWindow.isDestroyed() && shieldWindow.isVisible()) {
            shieldWindow.hide();
        }
    } catch (err) {
        console.error("Shield overlay hide failed:", err);
    }
}

function registerShortcuts() {
    try {
        globalShortcut.register("CommandOrControl+Alt+F", () => {
            if (mainWindow)
                mainWindow.webContents.send(
                    "global-shortcut",
                    "toggle-deep-focus",
                );
        });

        globalShortcut.register("CommandOrControl+Alt+P", () => {
            if (mainWindow)
                mainWindow.webContents.send("global-shortcut", "toggle-timer");
        });
    } catch (err) {
        console.error("Failed to register global shortcuts:", err);
    }
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    setupIPC();
    startShieldMonitor();
    registerShortcuts();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
