import type { ShieldViolation } from "./shield";

export interface ShieldSyncPayload {
  shield: {
    enabled: boolean;
    blockedSites: string[];
    allowedSites: string[];
    blockedApps: string[];
  };
  session: {
    isActive: boolean;
    timerState: "FLOW" | "BREAK";
  };
}

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  setAlwaysOnTop: (alwaysOnTop: boolean) => void;
  isAlwaysOnTop: () => Promise<boolean>;
  setWindowSize: (width: number, height: number) => void;
  showNotification: (title: string, body: string) => void;
  onShortcut: (callback: (command: string) => void) => () => void;
  onTimerAction: (callback: (action: string) => void) => () => void;
  syncShieldState: (payload: ShieldSyncPayload) => void;
  terminateBlockedProcess: (imageName: string) => Promise<{ success: boolean; error?: string }>;
  onShieldViolation: (callback: (violation: ShieldViolation) => void) => () => void;
  sendShieldOverlayAction: (action: ShieldOverlayAction, keys?: string[]) => void;
  onShieldOverlayAction: (callback: (action: ShieldOverlayAction) => void) => () => void;
}

export type ShieldOverlayAction = 'pause-timer' | 'disable-shield' | 'dismiss';

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export const electron = {
  minimizeWindow: () => {
    if (window.electron) window.electron.minimizeWindow();
  },
  maximizeWindow: () => {
    if (window.electron) window.electron.maximizeWindow();
  },
  closeWindow: () => {
    if (window.electron) window.electron.closeWindow();
  },
  setAlwaysOnTop: (alwaysOnTop: boolean) => {
    if (window.electron) window.electron.setAlwaysOnTop(alwaysOnTop);
  },
  isAlwaysOnTop: async (): Promise<boolean> => {
    if (window.electron) return await window.electron.isAlwaysOnTop();
    return false;
  },
  setWindowSize: (width: number, height: number) => {
    if (window.electron) window.electron.setWindowSize(width, height);
  },
  showNotification: (title: string, body: string) => {
    if (window.electron) {
      window.electron.showNotification(title, body);
    } else if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  },
  onShortcut: (callback: (command: string) => void) => {
    if (window.electron) return window.electron.onShortcut(callback);
    return () => {};
  },
  onTimerAction: (callback: (action: string) => void) => {
    if (window.electron) return window.electron.onTimerAction(callback);
    return () => {};
  },
  syncShieldState: (payload: ShieldSyncPayload) => {
    if (window.electron) window.electron.syncShieldState(payload);
  },
  terminateBlockedProcess: async (imageName: string) => {
    if (window.electron) return window.electron.terminateBlockedProcess(imageName);
    return { success: false, error: "Not running inside Electron." };
  },
  onShieldViolation: (callback: (violation: ShieldViolation) => void) => {
    if (window.electron) return window.electron.onShieldViolation(callback);
    return () => {};
  },
  sendShieldOverlayAction: (action: ShieldOverlayAction, keys?: string[]) => {
    if (window.electron) window.electron.sendShieldOverlayAction(action, keys);
  },
  onShieldOverlayAction: (callback: (action: ShieldOverlayAction) => void) => {
    if (window.electron) return window.electron.onShieldOverlayAction(callback);
    return () => {};
  }
};
