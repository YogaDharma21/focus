import { requireOptionalNativeModule } from 'expo-modules-core';

export interface NativeShieldViolation {
  kind: string;
  match: string;
  packageName: string;
  /** Epoch millis as string. */
  timestamp: string;
}

export interface InstalledShieldApp {
  packageName: string;
  label: string;
}

type FocusShieldNativeModule = {
  hasUsageAccess(): boolean;
  canDrawOverlays(): boolean;
  isServiceRunning(): boolean;
  isIgnoringBatteryOptimizations(): boolean;
  isAccessibilityEnabled(): boolean;
  areNotificationsEnabled(): boolean;
  startShield(blockedApps: string[], urlBlocking: boolean, blockedSites: string[], allowedSites: string[]): boolean;
  stopShield(): boolean;
  getPendingViolations(): NativeShieldViolation[];
  getInstalledApps(): InstalledShieldApp[];
};

const native = requireOptionalNativeModule<FocusShieldNativeModule>('FocusShield');

export function isFocusShieldAvailable(): boolean {
  return native != null;
}

export function hasUsageAccess(): boolean {
  try {
    return native?.hasUsageAccess() ?? false;
  } catch {
    return false;
  }
}

export function canDrawOverlays(): boolean {
  try {
    return native?.canDrawOverlays() ?? false;
  } catch {
    return false;
  }
}

export function isServiceRunning(): boolean {
  try {
    return native?.isServiceRunning() ?? false;
  } catch {
    return false;
  }
}

export function startShield(
  blockedApps: string[],
  urlBlocking: boolean,
  blockedSites: string[],
  allowedSites: string[],
): boolean {
  try {
    return native?.startShield(blockedApps, urlBlocking, blockedSites, allowedSites) ?? false;
  } catch {
    return false;
  }
}

export function stopShield(): boolean {
  try {
    return native?.stopShield() ?? false;
  } catch {
    return false;
  }
}

export function drainViolations(): NativeShieldViolation[] {
  try {
    return native?.getPendingViolations() ?? [];
  } catch {
    return [];
  }
}

export function isIgnoringBatteryOptimizations(): boolean {
  try {
    return native?.isIgnoringBatteryOptimizations() ?? false;
  } catch {
    return false;
  }
}

export function getInstalledApps(): InstalledShieldApp[] {
  try {
    return native?.getInstalledApps() ?? [];
  } catch {
    return [];
  }
}

export function isAccessibilityEnabled(): boolean {
  try {
    return native?.isAccessibilityEnabled() ?? false;
  } catch {
    return false;
  }
}

export function areNotificationsEnabled(): boolean {
  try {
    return native?.areNotificationsEnabled() ?? false;
  } catch {
    return false;
  }
}
