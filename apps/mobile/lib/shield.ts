export interface ShieldSchedule {
  id: string;
  name?: string;
  enabled: boolean;
  start: string; // "HH:mm" (24h)
  end: string;   // "HH:mm" (24h)
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

export interface ShieldConfig {
  enabled: boolean;
  blockedSites: string[];
  allowedSites: string[];
  blockedApps: string[];
  /** Enforce blocked sites inside browsers via the accessibility service (Android dev build). */
  urlBlocking: boolean;
  strictMode?: boolean;
  schedules?: ShieldSchedule[];
}

export const DEFAULT_BLOCKED_SITES: string[] = [
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'reddit.com',
  'tiktok.com',
  'youtube.com',
];

export const DEFAULT_BLOCKED_APPS: string[] = [
  'com.facebook.katana',
  'com.instagram.android',
  'com.twitter.android',
  'com.reddit.frontpage',
  'com.zhiliaoapp.musically',
  'com.google.android.youtube',
  'com.discord',
];

export const DEFAULT_SHIELD_SCHEDULES: ShieldSchedule[] = [
  {
    id: 'work-hours',
    name: 'Work Hours',
    enabled: false,
    start: '09:00',
    end: '17:00',
    days: [1, 2, 3, 4, 5],
  },
];

export const DEFAULT_SHIELD_CONFIG: ShieldConfig = {
  enabled: true,
  blockedSites: DEFAULT_BLOCKED_SITES,
  allowedSites: [],
  blockedApps: DEFAULT_BLOCKED_APPS,
  urlBlocking: false,
  strictMode: false,
  schedules: DEFAULT_SHIELD_SCHEDULES,
};

/** Strip scheme, www prefix, path, and port from a user-entered domain. */
export function normalizeSite(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/:?#]/)[0]
    .trim();
}

/**
 * Normalize a user-entered app entry for mobile.
 * Accepts Android package names (com.example.app) or plain names.
 * Unlike desktop, no `.exe` suffix is added.
 */
export function normalizeAppName(input: string): string {
  return input.trim().toLowerCase();
}

function extractHostname(target: string): string {
  try {
    return new URL(target).hostname.toLowerCase();
  } catch {
    try {
      return new URL(`https://${target}`).hostname.toLowerCase();
    } catch {
      return target.toLowerCase();
    }
  }
}

function matchesSiteList(target: string, hostname: string, list: string[]): boolean {
  const lowerTarget = target.toLowerCase();
  return list.some((site) => {
    const clean = normalizeSite(site);
    if (!clean) return false;
    return hostname.includes(clean) || lowerTarget.includes(clean);
  });
}

/**
 * Mirror of extension/desktop `isUrlBlocked`: allowedSites always win over
 * blockedSites, and internal pages are never blocked.
 */
export function isSiteBlocked(
  targetUrl: string,
  blockedSites: string[],
  allowedSites: string[] = [],
): boolean {
  if (!targetUrl) return false;
  const lower = targetUrl.toLowerCase();
  if (
    lower.startsWith('chrome://') ||
    lower.startsWith('chrome-extension://') ||
    lower.startsWith('about:') ||
    lower.startsWith('edge://') ||
    lower.startsWith('exp://') ||
    lower.startsWith('focus://')
  ) {
    return false;
  }
  const hostname = extractHostname(targetUrl);
  if (matchesSiteList(targetUrl, hostname, allowedSites)) return false;
  return matchesSiteList(targetUrl, hostname, blockedSites);
}

export function isScheduleActive(
  schedules?: ShieldSchedule[] | null,
  now: Date = new Date(),
): boolean {
  if (!schedules || schedules.length === 0) return false;
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return schedules.some((rule) => {
    if (!rule.enabled) return false;
    if (rule.days && rule.days.length > 0 && !rule.days.includes(currentDay)) {
      return false;
    }
    const [startH, startM] = (rule.start || '09:00').split(':').map(Number);
    const [endH, endM] = (rule.end || '17:00').split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
      return false;
    }
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      return currentMinutes >= startTotal && currentMinutes < endTotal;
    } else {
      return currentMinutes >= startTotal || currentMinutes < endTotal;
    }
  });
}

export function getActiveSchedule(
  schedules?: ShieldSchedule[] | null,
  now: Date = new Date(),
): ShieldSchedule | null {
  if (!schedules || schedules.length === 0) return null;
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const rule of schedules) {
    if (!rule.enabled) continue;
    if (rule.days && rule.days.length > 0 && !rule.days.includes(currentDay)) {
      continue;
    }
    const [startH, startM] = (rule.start || '09:00').split(':').map(Number);
    const [endH, endM] = (rule.end || '17:00').split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
      continue;
    }
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    const matches =
      startTotal <= endTotal
        ? currentMinutes >= startTotal && currentMinutes < endTotal
        : currentMinutes >= startTotal || currentMinutes < endTotal;

    if (matches) return rule;
  }
  return null;
}

export function isBlocklistLocked(
  shield: { strictMode?: boolean } | null | undefined,
  isActive: boolean,
  timerState: string,
): boolean {
  return Boolean(shield?.strictMode && isActive && timerState === 'FLOW');
}

/** Shield enforces during active Flow sessions or during scheduled shield hours. */
export function isBlockingRequired(
  shield: ShieldConfig | boolean,
  isActive: boolean,
  timerState: 'FLOW' | 'BREAK' | string,
  now: Date = new Date(),
): boolean {
  if (typeof shield === 'boolean') {
    return shield && isActive && timerState === 'FLOW';
  }
  const inSchedule = isScheduleActive(shield.schedules, now);
  const isEnabled = shield.enabled || inSchedule;
  const inFlow = isActive && timerState === 'FLOW';
  return isEnabled && (inFlow || inSchedule);
}
