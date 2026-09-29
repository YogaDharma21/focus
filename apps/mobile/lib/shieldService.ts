import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import {
  areNotificationsEnabled,
  canDrawOverlays,
  drainViolations,
  hasUsageAccess,
  isAccessibilityEnabled,
  isFocusShieldAvailable,
  isIgnoringBatteryOptimizations,
  isServiceRunning,
  startShield,
  stopShield,
} from 'focus-shield';
import { isBlockingRequired } from './shield';
import { useAppStore } from './store';

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** True only in an Android dev/production build where the native module is linked. */
export function isNativeShieldSupported(): boolean {
  return Platform.OS === 'android' && !isExpoGo() && isFocusShieldAvailable();
}

export interface NativeShieldStatus {
  supported: boolean;
  expoGo: boolean;
  hasUsageAccess: boolean;
  canDrawOverlays: boolean;
  serviceRunning: boolean;
  ignoringBatteryOptimizations: boolean;
  accessibilityEnabled: boolean;
  notificationsEnabled: boolean;
}

export function getNativeShieldStatus(): NativeShieldStatus {
  const supported = isNativeShieldSupported();
  return {
    supported,
    expoGo: isExpoGo(),
    hasUsageAccess: supported && hasUsageAccess(),
    canDrawOverlays: supported && canDrawOverlays(),
    serviceRunning: supported && isServiceRunning(),
    ignoringBatteryOptimizations: supported && isIgnoringBatteryOptimizations(),
    accessibilityEnabled: supported && isAccessibilityEnabled(),
    notificationsEnabled: supported ? areNotificationsEnabled() : true,
  };
}

export async function openUsageAccessSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.USAGE_ACCESS_SETTINGS);
  } catch {
    // Settings screen unavailable (e.g. iOS or restricted device).
  }
}

export async function openOverlaySettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_OVERLAY_PERMISSION, {
      data: `package:${Application.applicationId ?? ''}`,
    });
  } catch {
    // Settings screen unavailable.
  }
}

export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
      { data: `package:${Application.applicationId ?? ''}` },
    );
  } catch {
    // Settings screen unavailable.
  }
}

export async function openAccessibilitySettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.ACCESSIBILITY_SETTINGS);
  } catch {
    // Settings screen unavailable.
  }
}

export async function openAppDetailsSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
      { data: `package:${Application.applicationId ?? ''}` },
    );
  } catch {
    // Settings screen unavailable.
  }
}

/**
 * Start or stop the native foreground blocking service to match current state.
 * No-op in Expo Go or without the required special-access grants.
 */
export function syncShieldService(): void {
  if (!isNativeShieldSupported()) return;
  const { shield, isActive, timerState } = useAppStore.getState();
  const shouldRun =
    isBlockingRequired(shield.enabled, isActive, timerState) && hasUsageAccess() && canDrawOverlays();
  if (shouldRun) {
    startShield(shield.blockedApps, shield.urlBlocking, shield.blockedSites, shield.allowedSites);
  } else if (isServiceRunning()) {
    stopShield();
  }
}

/** Drain violations recorded while the app was backgrounded into distractions. */
export function drainShieldViolations(): number {
  if (!isNativeShieldSupported()) return 0;
  const violations = drainViolations();
  if (violations.length === 0) return 0;
  const { addDistraction } = useAppStore.getState();
  for (const v of violations) {
    if (v.kind === 'site') {
      addDistraction(v.match ? `Shield Blocked Site: ${v.match}` : 'Shield Blocked Site');
    } else {
      const target = v.match || v.packageName;
      addDistraction(target ? `Shield Blocked App: ${target}` : 'Shield Blocked App');
    }
  }
  return violations.length;
}
