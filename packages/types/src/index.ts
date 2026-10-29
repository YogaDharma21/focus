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

export type AudioMode = "stream" | "noise";
export type NoiseColorType = "brown" | "pink" | "white";

export interface StreamStation {
  id: string;
  name: string;
  url: string;
  genre?: string;
  isCustom?: boolean;
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
}
