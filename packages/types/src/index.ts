export type TimerMode = "STOPWATCH" | "FLOW";
export type TimerState = "FLOW" | "BREAK";
export type ThemeMode = "light" | "dark";
export type ViewType = "FOCUS" | "JOURNAL" | "SETTINGS" | "SHIELD";

export interface Session {
  id: string;
  date: string;
  duration: number; // in seconds
  mode: TimerMode | string;
}

export interface Distraction {
  id: string;
  timestamp: string;
  category: string;
  website?: string;
  app?: string;
}

export interface PlaylistItem {
  id: string;
  title: string;
  artist: string;
  url: string;
}

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
  strictMode?: boolean;
  schedules?: ShieldSchedule[];
}

export interface TimerSettings {
  autoStartBreak?: boolean;
  autoStartTimer?: boolean;
  autoStartFlow?: boolean;
}
