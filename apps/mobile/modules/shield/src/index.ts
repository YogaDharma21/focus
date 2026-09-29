import { requireOptionalNativeModule } from 'expo-modules-core';

export interface NativeShieldViolation {
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
  startShield(blockedApps: string[]): boolean;
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

export function startShield(blockedApps: string[]): boolean {
  try {
    return native?.startShield(blockedApps) ?? false;
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
