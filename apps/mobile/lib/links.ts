import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { isBlockingRequired, isSiteBlocked, normalizeSite } from './shield';
import { useAppStore } from './store';

function isHttpUrl(url: string): boolean {
  const lower = url.trim().toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://');
}

/** Check current shield state without opening anything. */
export function isUrlShieldBlocked(url: string): boolean {
  const { shield, isActive, timerState } = useAppStore.getState();
  if (!isBlockingRequired(shield.enabled, isActive, timerState)) return false;
  return isSiteBlocked(url, shield.blockedSites, shield.allowedSites);
}

/**
 * Open a URL only if Shield allows it.
 * When blocked during an active FLOW session, logs a distraction and
 * returns `{ blocked: true }` without leaving the app.
 * Works in Expo Go - only guards in-app links, not external browsers.
 */
export async function openShieldCheckedUrl(url: string): Promise<{ blocked: boolean }> {
  if (isUrlShieldBlocked(url)) {
    useAppStore.getState().addDistraction(normalizeSite(url) || 'Blocked Site');
    return { blocked: true };
  }
  try {
    if (isHttpUrl(url) && process.env.EXPO_OS !== 'web') {
      await WebBrowser.openBrowserAsync(url);
    } else {
      await Linking.openURL(url);
    }
  } catch {
    // Ignore open failures to match existing link behavior.
  }
  return { blocked: false };
}
