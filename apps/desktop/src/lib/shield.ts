import {
  isBlocklistLocked as utilIsBlocklistLocked,
  isScheduleActive as utilIsScheduleActive,
  getActiveSchedule as utilGetActiveSchedule,
  DEFAULT_SHIELD_SCHEDULES,
} from "@focus/utils";

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
  strictMode: boolean;
  schedules: ShieldSchedule[];
}

export { DEFAULT_SHIELD_SCHEDULES };
export const isScheduleActive = utilIsScheduleActive;
export const getActiveSchedule = utilGetActiveSchedule;
export const isBlocklistLocked = utilIsBlocklistLocked;

export interface ShieldViolation {
  kind: "app" | "site";
  /** Normalized match value: exe name for apps, domain for sites. */
  match: string;
  /** Raw process image name (app violations). */
  process?: string;
  /** Raw window title that triggered the match (site violations). */
  title?: string;
  timestamp: string;
}

export const DEFAULT_BLOCKED_SITES: string[] = [
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "reddit.com",
  "tiktok.com",
  "youtube.com",
];

export const DEFAULT_BLOCKED_APPS: string[] = [
  "discord.exe",
  "steam.exe",
  "epicgameslauncher.exe",
  "spotify.exe",
];

export const DEFAULT_SHIELD_CONFIG: ShieldConfig = {
  enabled: true,
  blockedSites: DEFAULT_BLOCKED_SITES,
  allowedSites: [],
  blockedApps: DEFAULT_BLOCKED_APPS,
  strictMode: false,
  schedules: DEFAULT_SHIELD_SCHEDULES,
};

/** Strip scheme, www prefix, path, and port from a user-entered domain. */
export function normalizeSite(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/:?#]/)[0]
    .trim();
}

/** Normalize a user-entered app entry to a comparable exe name. */
export function normalizeAppName(input: string): string {
  const clean = input.trim().toLowerCase();
  if (!clean) return "";
  const base = clean.split(/[/\\]/).pop() ?? clean;
  return base.includes(".") ? base : `${base}.exe`;
}

/** Extract a hostname from a URL or free-form text. */
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

function matchesSiteList(
  target: string,
  hostname: string,
  list: string[],
): boolean {
  const lowerTarget = target.toLowerCase();
  return list.some((site) => {
    const clean = normalizeSite(site);
    if (!clean) return false;
    return hostname.includes(clean) || lowerTarget.includes(clean);
  });
}

/**
 * Mirror of the extension's `isUrlBlocked`: allowedSites always win over
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
    lower.startsWith("chrome://") ||
    lower.startsWith("chrome-extension://") ||
    lower.startsWith("about:") ||
    lower.startsWith("edge://")
  ) {
    return false;
  }
  const hostname = extractHostname(targetUrl);
  if (matchesSiteList(targetUrl, hostname, allowedSites)) return false;
  return matchesSiteList(targetUrl, hostname, blockedSites);
}

/**
 * Derive a matchable keyword from a blocked domain (registrable label
 * without TLD, e.g. "reddit" from "reddit.com"). Returns null for short
 * names like "x" where keyword matching would over-match.
 */
export function siteKeyword(site: string): string | null {
  const clean = normalizeSite(site);
  const labels = clean.split(".").filter(Boolean);
  if (labels.length < 2) return null;
  const name = labels[labels.length - 2];
  return name.length >= 4 ? name : null;
}

/**
 * Check whether a window title indicates a blocked site is visible.
 * Used by the main-process monitor since Electron cannot observe
 * external browser tabs directly. Matches full domains first, then falls
 * back to registrable-label keywords because browser titles rarely
 * contain the full domain (e.g. "Reddit - Dive into anything").
 */
export function titleMatchesBlockedSite(
  title: string,
  blockedSites: string[],
  allowedSites: string[] = [],
): string | null {
  if (!title) return null;
  const lowerTitle = title.toLowerCase();
  const hostname = extractHostname(title);

  const isAllowed = (site: string): boolean => {
    const clean = normalizeSite(site);
    if (!clean) return false;
    if (hostname.includes(clean) || lowerTitle.includes(clean)) return true;
    const keyword = siteKeyword(site);
    return keyword !== null && lowerTitle.includes(keyword);
  };
  if (allowedSites.some(isAllowed)) return null;

  for (const site of blockedSites) {
    const clean = normalizeSite(site);
    if (!clean) continue;
    if (hostname.includes(clean) || lowerTitle.includes(clean)) return clean;
    const keyword = siteKeyword(site);
    if (keyword !== null && lowerTitle.includes(keyword)) return clean;
  }
  return null;
}

/** Check whether a running process image matches the blocked-apps list. */
export function matchBlockedApp(
  processImage: string,
  blockedApps: string[],
): string | null {
  const proc = processImage.trim().toLowerCase();
  if (!proc) return null;
  const procBase = proc.split(/[/\\]/).pop() ?? proc;
  for (const entry of blockedApps) {
    const clean = entry.trim().toLowerCase();
    if (!clean) continue;
    const cleanBase = clean.split(/[/\\]/).pop() ?? clean;
    if (procBase === cleanBase) return entry;
    // Allow entries without extension to match `name.exe` and vice versa.
    const stripExe = (s: string) => s.replace(/\.exe$/, "");
    if (stripExe(procBase) === stripExe(cleanBase)) return entry;
  }
  return null;
}

/** Shield enforces during active Flow sessions or during scheduled shield hours. */
export function isBlockingRequired(
  shield: ShieldConfig | boolean,
  isActive: boolean,
  timerState: "FLOW" | "BREAK" | string,
  now: Date = new Date(),
): boolean {
  if (typeof shield === "boolean") {
    return shield && isActive && timerState === "FLOW";
  }
  const inSchedule = isScheduleActive(shield.schedules, now);
  const isEnabled = shield.enabled || inSchedule;
  const inFlow = isActive && timerState === "FLOW";
  return isEnabled && (inFlow || inSchedule);
}
