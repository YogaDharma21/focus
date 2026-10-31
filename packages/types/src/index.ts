export type TimerMode = "STOPWATCH" | "FLOW";
export type TimerState = "FLOW" | "BREAK";
export type BreakRatio = "1/5" | "1/4" | "1/3";
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
  breakRatio?: BreakRatio;
}
