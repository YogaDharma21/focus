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

// Set application name and Windows AppUserModelID for notifications
app.setName("Focus Desktop");
if (process.platform === "win32") {
    app.setAppUserModelId("Focus Desktop");
}

let mainWindow = null;
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
        mainWindow.loadURL(devUrl);
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
