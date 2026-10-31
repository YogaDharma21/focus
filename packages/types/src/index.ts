export type TimerMode = "STOPWATCH" | "FLOW";
export type TimerState = "FLOW" | "BREAK";
export type ThemeMode = "light" | "dark";
export type ViewType = "FOCUS" | "TASKS" | "JOURNAL" | "SETTINGS" | "SHIELD";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface SubtaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: TaskPriority;
  deadline?: string;
  subtasks?: SubtaskItem[];
  completedAt?: string;
}

export type TodoItem = TaskItem;

export interface Session {
  id: string;
  date: string;
  duration: number; // in seconds
  mode: TimerMode | string;
  taskId?: string;
  taskName?: string;
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
}

export type SoundChannelId =
  | "rain"
  | "whitenoise"
  | "pinknoise"
  | "brownnoise"
  | "cafe"
  | "campfire"
  | "birds"
  | "binauralAlpha"
  | "binauralTheta";

export interface SoundChannelState {
  id: SoundChannelId;
  label: string;
  category: "nature" | "noise" | "binaural";
  volume: number; // 0 - 100
  enabled: boolean;
}

export interface SoundscapePreset {
  id: string;
  name: string;
  channels: Partial<Record<SoundChannelId, number>>;
}

