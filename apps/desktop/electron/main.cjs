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
const fs = require("fs");
const { execFile, spawn } = require("child_process");

// Set application name and Windows AppUserModelID for notifications.
// The explicit AppUserModelID doubles as our identity for external-audio
// detection: the watcher excludes our own media session so our Lo-Fi music
// never counts as "external" audio.
const APP_USER_MODEL_ID = "com.yogacode.focus-desktop";
app.setName("Focus Desktop");
if (process.platform === "win32") {
    app.setAppUserModelId(APP_USER_MODEL_ID);
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

    ipcMain.handle("shield:list-running-apps", async () => {
        try {
            const apps = await listRunningAppsForPicker();
            return { success: true, apps };
        } catch (err) {
            console.error("Shield list-running-apps failed:", err);
            return { success: false, error: String((err && err.message) || err), apps: [] };
        }
    });

    ipcMain.handle("shield:get-app-icon", async (_event, imageName) => {
        try {
            const icon = await getAppIconForImage(imageName);
            return { success: true, icon };
        } catch (err) {
            console.error("Shield get-app-icon failed:", err);
            return { success: false, error: String((err && err.message) || err), icon: "" };
        }
    });

    ipcMain.handle("shield:list-installed-apps", async (_event, refresh) => {
        try {
            const apps = await listInstalledApps(!!refresh);
            // Keep exe paths main-side; the renderer only needs names.
            return {
                success: true,
                apps: apps.map((a) => ({
                    displayName: a.displayName,
                    image: a.image,
                    source: a.source,
                })),
            };
        } catch (err) {
            console.error("Shield list-installed-apps failed:", err);
            return { success: false, error: String((err && err.message) || err), apps: [] };
        }
    });

    ipcMain.handle("audio:get-external-state", () => {
        return { supported: externalAudioSupported, playing: externalAudioPlaying };
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
        if (action === "terminate-cooldown") {
            // A blocked app was just terminated: keep both overlays quiet for
            // a short while in case the process lingers. Not a snooze — if
            // the app is still alive afterwards, detections resume.
            const until = Date.now() + SHIELD_TERMINATE_COOLDOWN_MS;
            for (const key of keys) {
                if (key) shieldCooldownKeys.set(String(key), until);
            }
            return;
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("shield-overlay-action", { action, keys });
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
// Quiet period after a successful "Close app" in case the process lingers.
const SHIELD_TERMINATE_COOLDOWN_MS = 30 * 1000;
// Grace after pause/disable so an in-flight poll can't resurrect the overlay.
const SHIELD_SETTLE_MS = 2000;

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
const shieldCooldownKeys = new Map();
// Keys already delivered to a currently-visible overlay window. Repeat polls
// skip these so the overlay isn't re-sent (and re-focused) every 5 seconds.
const shieldVisibleKeys = new Set();
let shieldCalmUntil = 0;

function isShieldKeySnoozed(key) {
    const until = shieldSnoozedKeys.get(key) ?? 0;
    if (Date.now() < until) return true;
    shieldSnoozedKeys.delete(key);
    return false;
}

function isShieldKeyCoolingDown(key) {
    const until = shieldCooldownKeys.get(key) ?? 0;
    if (Date.now() < until) return true;
    shieldCooldownKeys.delete(key);
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
        // Entering a non-enforcing state (pause/disable/break): brief calm
        // so an in-flight poll that started before this sync can't pop the
        // overlay back up after the user just dismissed it via pause.
        shieldCalmUntil = Date.now() + SHIELD_SETTLE_MS;
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

function execFileAsync(file, args, env) {
    return new Promise((resolve) => {
        execFile(
            file,
            args,
            {
                timeout: 8000,
                windowsHide: true,
                ...(env ? { env: { ...process.env, ...env } } : {}),
            },
            (err, stdout) => {
                if (err) return resolve("");
                resolve(stdout || "");
            }
        );
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

// --- Running-app picker + app icons ------------------------------------------
// Powers the "select from running apps" picker in the Shield page and the
// real exe icons shown next to blocked apps. Only processes with a visible
// window are listed, which keeps the picker relevant and icon extraction
// cheap (typically a dozen entries instead of hundreds of background
// processes). Icons are resolved with Electron's app.getFileIcon and cached
// by exe path.

const SHIELD_PICKER_SCRIPT =
    "Get-Process | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle.Trim() -ne '' } | ForEach-Object { try { $exePath = $_.Path } catch { $exePath = '' }; if (-not $exePath) { $exePath = '' }; \"$($_.ProcessName)`t$($_.Id)`t$($exePath)`t$($_.MainWindowTitle)\" }";

const shieldAppIconCache = new Map();

async function getFileIconDataUrl(exePath) {
    if (!exePath) return "";
    const key = String(exePath).toLowerCase();
    if (shieldAppIconCache.has(key)) return shieldAppIconCache.get(key);
    try {
        const img = await app.getFileIcon(exePath, { size: "normal" });
        const url = img && !img.isEmpty() ? img.toDataURL() : "";
        shieldAppIconCache.set(key, url);
        if (shieldAppIconCache.size > 120) {
            const oldest = shieldAppIconCache.keys().next().value;
            shieldAppIconCache.delete(oldest);
        }
        return url;
    } catch {
        shieldAppIconCache.set(key, "");
        return "";
    }
}

function sanitizeImageName(imageName) {
    return String(imageName || "")
        .trim()
        .toLowerCase()
        .split(/[/\\]/)
        .pop()
        .replace(/[^a-z0-9._-]/g, "")
        .slice(0, 80);
}

async function listWindowedProcessesRaw() {
    if (process.platform !== "win32") return [];
    const out = await execFileAsync("powershell", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        SHIELD_PICKER_SCRIPT,
    ]);
    const rows = [];
    for (const line of out.split(/\r?\n/)) {
        if (!line || line.indexOf("\t") === -1) continue;
        const parts = line.split("\t");
        if (parts.length < 4) continue;
        const procName = (parts[0] || "").trim();
        const exePath = (parts[2] || "").trim();
        const title = parts.slice(3).join("\t").trim();
        if (!procName || !title) continue;
        rows.push({ procName, exePath, title });
    }
    return rows;
}

/**
 * List user-visible apps for the Shield picker. Each entry carries the exe
 * image name used by the blocked-apps list, a friendly display name, the
 * foreground window title, and (on Windows) the real exe icon as a data URL.
 */
async function listRunningAppsForPicker() {
    if (process.platform !== "win32") {
        const out = await execFileAsync("ps", ["-ax", "-o", "comm="]);
        const seen = new Set();
        const apps = [];
        for (const line of out.split(/\r?\n/)) {
            const base = line.trim().split("/").pop();
            if (!base || seen.has(base.toLowerCase())) continue;
            seen.add(base.toLowerCase());
            apps.push({
                image: base,
                displayName: base.replace(/\.exe$/i, ""),
                title: "",
                icon: "",
            });
            if (apps.length >= 100) break;
        }
        return apps;
    }
    const rows = await listWindowedProcessesRaw();
    const seen = new Set();
    const unique = [];
    for (const row of rows) {
        const image = `${row.procName}.exe`.toLowerCase();
        if (seen.has(image)) continue;
        seen.add(image);
        unique.push(row);
        if (unique.length >= 60) break;
    }
    return Promise.all(
        unique.map(async (row) => ({
            image: `${row.procName}.exe`.toLowerCase(),
            displayName: row.procName,
            title: row.title,
            icon: await getFileIconDataUrl(row.exePath),
        }))
    );
}

/**
 * Resolve the real exe icon for a blocked-app entry (e.g. "discord.exe").
 * Matches against currently running windowed processes so the exact on-disk
 * exe path is known. Returns "" when the app is not running or has no icon.
 */
async function getAppIconForImage(imageName) {
    const safe = sanitizeImageName(imageName);
    if (!safe || process.platform !== "win32") return "";
    const rows = await listWindowedProcessesRaw();
    const withExt = safe.includes(".") ? safe : `${safe}.exe`;
    const hit = rows.find(
        (row) => `${row.procName}.exe`.toLowerCase() === withExt
    );
    if (hit && hit.exePath) return getFileIconDataUrl(hit.exePath);
    // Fallback: installed but not currently running.
    try {
        const installed = await listInstalledApps(false);
        const found = installed.find((a) => a.image === withExt);
        if (found && found.path) return getFileIconDataUrl(found.path);
    } catch {
        // Best effort: missing icon degrades to the generic app glyph.
    }
    return "";
}

// --- Installed-app discovery -------------------------------------------------
// Lets the Shield picker offer every installed app — not just running ones —
// so e.g. Spotify can be blocklisted without launching it first. Sources:
// Start Menu shortcuts (friendly name + resolved exe target) supplemented by
// registry uninstall entries whose DisplayIcon points at an exe. Blocking
// itself is unchanged: detection polls the process list, so an installed app
// is flagged the moment it launches.

const SHIELD_INSTALLED_SCRIPT = [
    "$shieldSeen = @{}",
    "$shell = New-Object -ComObject WScript.Shell",
    "$skipShortcut = '(?i)uninstall|unins|help|update|readme|manual|documentation|website|support|license|changelog|repair|remove'",
    "$menus = @((Join-Path $env:ProgramData 'Microsoft\\Windows\\Start Menu\\Programs'), (Join-Path $env:AppData 'Microsoft\\Windows\\Start Menu\\Programs'))",
    "foreach ($menu in $menus) {",
    "  if (-not (Test-Path -LiteralPath $menu)) { continue }",
    "  Get-ChildItem -LiteralPath $menu -Filter *.lnk -Recurse -ErrorAction SilentlyContinue | ForEach-Object {",
    "    $lnkName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)",
    "    if ($lnkName -match $skipShortcut) { return }",
    "    try { $t = $shell.CreateShortcut($_.FullName).TargetPath } catch { return }",
    "    if (-not $t) { return }",
    "    $t = ([string]$t).Trim()",
    "    if ($t -notmatch '(?i)\\.exe$') { return }",
    "    $t = [System.Environment]::ExpandEnvironmentVariables($t)",
    "    if (-not (Test-Path -LiteralPath $t -PathType Leaf)) { return }",
    "    $img = [System.IO.Path]::GetFileName($t).ToLower()",
    "    if (-not $shieldSeen.ContainsKey($img)) { $shieldSeen[$img] = $true; \"$lnkName`t$img`t$t`tstart-menu\" }",
    "  }",
    "}",
    "$skipReg = '(?i)^(update for|security update|hotfix|kb\\d+)|redistributable|windows sdk|\\.net |visual c\\+\\+|driver|firmware'",
    "$regKeys = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')",
    "Get-ItemProperty $regKeys -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -and -not $_.SystemComponent -and -not $_.ParentKeyName -and $_.DisplayIcon } | ForEach-Object {",
    "  $dn = ([string]$_.DisplayName).Trim()",
    "  if ($dn -match $skipReg) { return }",
    "  $ic = ([string]$_.DisplayIcon).Trim()",
    "  $exe = ''",
    "  if ($ic -match '\"([^\"]+\\.exe)\"?') { $exe = $Matches[1] }",
    "  elseif ($ic -match '([^,]+\\.exe)') { $exe = $Matches[1] }",
    "  if (-not $exe) { return }",
    "  $exe = [System.Environment]::ExpandEnvironmentVariables($exe)",
    "  if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { return }",
    "  $img = [System.IO.Path]::GetFileName($exe).ToLower()",
    "  if (-not $shieldSeen.ContainsKey($img)) { $shieldSeen[$img] = $true; \"$dn`t$img`t$exe`tregistry\" }",
    "}",
].join("\n");

let shieldInstalledCache = null;
let shieldInstalledAt = 0;
const SHIELD_INSTALLED_TTL_MS = 5 * 60 * 1000;
const SHIELD_INSTALLED_MAX = 300;

async function listInstalledApps(refresh) {
    if (process.platform !== "win32") return [];
    const now = Date.now();
    if (!refresh && shieldInstalledCache && now - shieldInstalledAt < SHIELD_INSTALLED_TTL_MS) {
        return shieldInstalledCache;
    }
    const out = await execFileAsync("powershell", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        SHIELD_INSTALLED_SCRIPT,
    ]);
    const apps = [];
    for (const line of out.split(/\r?\n/)) {
        if (!line || line.indexOf("\t") === -1) continue;
        const parts = line.split("\t");
        if (parts.length < 4) continue;
        const displayName = (parts[0] || "").trim().slice(0, 100);
        const image = (parts[1] || "").trim().toLowerCase().slice(0, 80);
        const exePath = (parts[2] || "").trim();
        const source = (parts[parts.length - 1] || "").trim();
        if (!displayName || !image || !exePath) continue;
        if (!/^[\w.\-]+\.exe$/.test(image)) continue;
        if (source !== "start-menu" && source !== "registry") continue;
        apps.push({ displayName, image, path: exePath, source });
        if (apps.length >= SHIELD_INSTALLED_MAX) break;
    }
    apps.sort((a, b) => a.displayName.localeCompare(b.displayName));
    shieldInstalledCache = apps;
    shieldInstalledAt = now;
    return apps;
}

function reportShieldViolation(violation) {
    const key = `${violation.kind}:${violation.match}`;
    // Re-checked here (not just at poll entry): a pause/disable that lands
    // mid-poll must not resurrect the overlay after its awaits resolve.
    if (!isShieldBlockingRequired()) return;
    if (Date.now() < shieldCalmUntil) return;
    if (isShieldKeySnoozed(key)) return;
    if (isShieldKeyCoolingDown(key)) return;
    // Already on screen: skip re-sending so repeat polls don't duplicate or
    // re-focus the overlay every 5 seconds.
    if (shieldVisibleKeys.has(key) && shieldWindow && !shieldWindow.isDestroyed() && shieldWindow.isVisible()) {
        return;
    }
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

    // Fullscreen takeover: reliably covers the offending app or browser
    // window regardless of monitor layout, DPI, or window state.
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
        shieldVisibleKeys.clear();
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
    // State may have changed while loading (e.g. user paused): never reveal
    // stale detections.
    if (!isShieldBlockingRequired()) {
        shieldPendingViolations = [];
        return;
    }
    for (const v of shieldPendingViolations) {
        shieldWindow.webContents.send("shield-violation", v);
        shieldVisibleKeys.add(`${v.kind}:${v.match}`);
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
        if (!isShieldBlockingRequired()) return;
        const win = createShieldWindow();
        if (win.isDestroyed()) return;
        if (!shieldWindowReady) {
            // Still loading: queue the violation and reveal once painted.
            shieldPendingViolations.push(violation);
            return;
        }
        win.webContents.send("shield-violation", violation);
        shieldVisibleKeys.add(`${violation.kind}:${violation.match}`);
        revealShieldWindow();
    } catch (err) {
        console.error("Shield overlay show failed:", err);
    }
}

function hideShieldOverlay() {
    shieldVisibleKeys.clear();
    try {
        if (shieldWindow && !shieldWindow.isDestroyed() && shieldWindow.isVisible()) {
            shieldWindow.hide();
        }
    } catch (err) {
        console.error("Shield overlay hide failed:", err);
    }
}

// --- External Audio Detection ------------------------------------------------
// Mirrors the extension's auto-pause-on-external-audio behavior on desktop.
// Windows has no chrome.tabs API, so a small PowerShell watcher polls the
// system media-session manager (SMTC) and reports when another app starts or
// stops media playback. The renderer's MediaPlayer listens for
// "audio:external-state" and fades the ambient music out/in accordingly.

const EXTERNAL_AUDIO_POLL_MS = 1500;

let externalAudioSupported = process.platform === "win32";
let externalAudioPlaying = false;
let externalAudioProc = null;

function setExternalAudioPlaying(playing) {
    const next = !!playing;
    if (next === externalAudioPlaying) return;
    externalAudioPlaying = next;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("audio:external-state", {
            playing: externalAudioPlaying,
        });
    }
}

function startExternalAudioMonitor() {
    if (process.platform !== "win32") {
        externalAudioSupported = false;
        return;
    }
    if (externalAudioProc) return;
    // In packaged builds this file is unpacked from the asar archive (see
    // asarUnpack in package.json) because PowerShell cannot execute a script
    // from inside app.asar.
    let scriptPath = path.join(__dirname, "external-audio-watch.ps1");
    if (app.isPackaged) {
        scriptPath = scriptPath.replace("app.asar", "app.asar.unpacked");
    }
    // Guard so a missing script degrades to "unsupported" instead of a crash.
    if (!fs.existsSync(scriptPath)) {
        console.error("External audio monitor unavailable: missing", scriptPath);
        externalAudioSupported = false;
        return;
    }
    try {
        const child = spawn(
            "powershell",
            [
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                scriptPath,
                "-PollMs",
                String(EXTERNAL_AUDIO_POLL_MS),
                "-ExcludeAppId",
                APP_USER_MODEL_ID,
            ],
            { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }
        );
        externalAudioProc = child;
        let buffer = "";
        child.stdout.on("data", (chunk) => {
            buffer += chunk.toString();
            let idx;
            while ((idx = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, idx).trim();
                buffer = buffer.slice(idx + 1);
                if (line === "EXTERNAL_PLAYING") setExternalAudioPlaying(true);
                else if (line === "EXTERNAL_STOPPED") setExternalAudioPlaying(false);
                else if (line === "EXTERNAL_UNSUPPORTED") {
                    externalAudioSupported = false;
                }
            }
        });
        child.on("exit", () => {
            if (externalAudioProc === child) externalAudioProc = null;
        });
        child.on("error", () => {
            externalAudioSupported = false;
            externalAudioProc = null;
        });
    } catch (err) {
        console.error("External audio monitor failed to start:", err);
        externalAudioSupported = false;
        externalAudioProc = null;
    }
}

function stopExternalAudioMonitor() {
    try {
        if (externalAudioProc && !externalAudioProc.killed) {
            externalAudioProc.kill();
        }
    } catch {
        // Best-effort cleanup on shutdown.
    }
    externalAudioProc = null;
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
    startExternalAudioMonitor();
    registerShortcuts();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
    stopExternalAudioMonitor();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
