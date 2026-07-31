const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.send('set-always-on-top', alwaysOnTop),
  isAlwaysOnTop: () => ipcRenderer.invoke('is-always-on-top'),
  setWindowSize: (width, height) => ipcRenderer.send('set-window-size', { width, height }),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  onShortcut: (callback) => {
    const handler = (_event, command) => callback(command);
    ipcRenderer.on('global-shortcut', handler);
    return () => ipcRenderer.removeListener('global-shortcut', handler);
  },
  onTimerAction: (callback) => {
    const handler = (_event, action) => callback(action);
    ipcRenderer.on('timer-action', handler);
    return () => ipcRenderer.removeListener('timer-action', handler);
  }
});
