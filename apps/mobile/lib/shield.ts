export interface ShieldConfig {
  enabled: boolean;
  blockedSites: string[];
  allowedSites: string[];
  blockedApps: string[];
}

export const DEFAULT_SHIELD: ShieldConfig = {
  enabled: true,
  blockedSites: [
    'facebook.com',
    'twitter.com',
    'x.com',
    'instagram.com',
    'reddit.com',
    'tiktok.com',
    'youtube.com',
  ],
  allowedSites: [],
  blockedApps: [],
};

export function normalizeSite(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .trim();
}

function matchesSite(target: string, hostname: string, site: string): boolean {
  const clean = normalizeSite(site);
  if (!clean) return false;
  const lowerTarget = target.toLowerCase();
  return hostname.includes(clean) || lowerTarget.includes(clean);
}

export function isUrlBlocked(
  targetUrl: string,
  blockedSites: string[],
  allowedSites: string[] = []
): boolean {
  if (!targetUrl) return false;
  const lower = targetUrl.toLowerCase();
  if (
    lower.startsWith('chrome://') ||
    lower.startsWith('chrome-extension://') ||
    lower.startsWith('about:') ||
    lower.startsWith('focus://') ||
    lower.startsWith('exp://')
  ) {
    return false;
  }

  let hostname = '';
  try {
    hostname = new URL(targetUrl).hostname.toLowerCase();
  } catch {
    hostname = lower;
  }

  if (allowedSites.some((site) => matchesSite(targetUrl, hostname, site))) {
    return false;
  }

  return blockedSites.some((site) => matchesSite(targetUrl, hostname, site));
}

export function isAppBlocked(appId: string, blockedApps: string[]): boolean {
  const clean = appId.toLowerCase().trim();
  if (!clean) return false;
  return blockedApps.some((app) => {
    const cleanApp = app.toLowerCase().trim();
    if (!cleanApp) return false;
    return clean.includes(cleanApp) || cleanApp.includes(clean);
  });
}

export function isShieldActive(
  shieldEnabled: boolean,
  isActive: boolean,
  timerState: string
): boolean {
  return shieldEnabled && isActive && timerState === 'FLOW';
}

export function extractDomain(targetUrl: string): string {
  try {
    return new URL(targetUrl).hostname;
  } catch {
    return targetUrl;
  }
}
