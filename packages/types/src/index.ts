export type TimerMode = "STOPWATCH" | "POMODORO" | "FLOW";
export type TimerState = "FLOW" | "BREAK";
export type ThemeMode = "light" | "dark";
export type ViewType = "FOCUS" | "JOURNAL" | "SETTINGS" | "SHIELD";
export type PomodoroInterval = "25/5" | "50/10";
export type SessionTag = "work" | "study" | "code" | string;

export interface Session {
  id: string;
  date: string;
  duration: number; // in seconds
  mode: TimerMode | string;
  tag?: SessionTag;
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

export interface ShieldConfig {
  enabled: boolean;
  blockedSites: string[];
  allowedSites: string[];
}

export interface TimerSettings {
  autoStartBreak?: boolean;
  autoStartTimer?: boolean;
  autoStartFlow?: boolean;
  dailyTargetMinutes?: number;
  pomodoroInterval?: PomodoroInterval;
  activeTag?: SessionTag;
}
