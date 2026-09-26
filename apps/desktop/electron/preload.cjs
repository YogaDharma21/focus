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
  },
  syncShieldState: (payload) => ipcRenderer.send('shield:sync', payload),
  getExternalAudioState: () => ipcRenderer.invoke('audio:get-external-state'),
  onExternalAudioState: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('audio:external-state', handler);
    return () => ipcRenderer.removeListener('audio:external-state', handler);
  },
  terminateBlockedProcess: (imageName) => ipcRenderer.invoke('shield:terminate-process', imageName),
  onShieldViolation: (callback) => {
    const handler = (_event, violation) => callback(violation);
    ipcRenderer.on('shield-violation', handler);
    return () => ipcRenderer.removeListener('shield-violation', handler);
  },
  sendShieldOverlayAction: (action, keys) => ipcRenderer.send('shield:overlay-action', { action, keys }),
  onShieldOverlayAction: (callback) => {
    const handler = (_event, action) => callback(action);
    ipcRenderer.on('shield-overlay-action', handler);
    return () => ipcRenderer.removeListener('shield-overlay-action', handler);
  }
});
