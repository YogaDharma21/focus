import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';
import { useAppStore } from './store';
import {
  DEFAULT_SHIELD,
  extractDomain,
  isAppBlocked,
  isShieldActive,
  isUrlBlocked,
} from './shield';

export interface BlockedTarget {
  kind: 'site' | 'app';
  url?: string;
  appId?: string;
  display: string;
}

interface ShieldGateState {
  blockedTarget: BlockedTarget | null;
  showBlocked: (target: BlockedTarget) => void;
  clearBlocked: () => void;
}

export const useShieldGateStore = create<ShieldGateState>()((set) => ({
  blockedTarget: null,
  showBlocked: (target) => set({ blockedTarget: target }),
  clearBlocked: () => set({ blockedTarget: null }),
}));

export async function openGuardedUrl(url: string): Promise<{ blocked: boolean }> {
  const { shield, isActive, timerState, addDistraction } = useAppStore.getState();
  const activeShield = shield ?? DEFAULT_SHIELD;
  if (
    isShieldActive(activeShield.enabled, isActive, timerState) &&
    isUrlBlocked(url, activeShield.blockedSites, activeShield.allowedSites)
  ) {
    addDistraction('Shield Blocked Tab', url);
    useShieldGateStore
      .getState()
      .showBlocked({ kind: 'site', url, display: extractDomain(url) });
    return { blocked: true };
  }

  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      // Ignore open failures; the caller already validated the URL.
    }
  }
  return { blocked: false };
}

export function logBlockedAppAttempt(appId: string): { blocked: boolean } {
  const { shield, isActive, timerState, addDistraction } = useAppStore.getState();
  const activeShield = shield ?? DEFAULT_SHIELD;
  const clean = appId.trim();
  if (!clean) return { blocked: false };
  if (
    !isShieldActive(activeShield.enabled, isActive, timerState) ||
    !isAppBlocked(clean, activeShield.blockedApps)
  ) {
    return { blocked: false };
  }
  addDistraction('Shield Blocked App', clean);
  useShieldGateStore.getState().showBlocked({ kind: 'app', appId: clean, display: clean });
  return { blocked: true };
}
