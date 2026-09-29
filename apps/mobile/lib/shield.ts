export interface ShieldConfig {
  enabled: boolean;
  blockedSites: string[];
  allowedSites: string[];
  blockedApps: string[];
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

export const DEFAULT_SHIELD_CONFIG: ShieldConfig = {
  enabled: true,
  blockedSites: DEFAULT_BLOCKED_SITES,
  allowedSites: [],
  blockedApps: DEFAULT_BLOCKED_APPS,
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

/** Shield only enforces while a Flow session is actively running. */
export function isBlockingRequired(
  shieldEnabled: boolean,
  isActive: boolean,
  timerState: 'FLOW' | 'BREAK',
): boolean {
  return shieldEnabled && isActive && timerState === 'FLOW';
}
