import type { TaskItem, TaskPriority, SubtaskItem, BreakRatio } from "@focus/types";

export type { TaskItem, TaskPriority, SubtaskItem, BreakRatio };

export type TimerMode = "STOPWATCH" | "FLOW" | "flow" | "pomodoro";
export type TimerState = "FLOW" | "BREAK";
export type ThemeMode = "light" | "dark";

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
  category: "Phone" | "Social Media" | "Bathroom" | "Meeting" | "Other" | string;
  website?: string;
}

export interface ShieldConfig {
  enabled: boolean;
  blockedSites: string[];
  allowedSites: string[];
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
}

export interface TimerSettings {
  autoStartBreak?: boolean;
  autoStartTimer?: boolean;
  breakRatio?: BreakRatio;
  timerMode?: "flow" | "pomodoro";
  pomodoro?: PomodoroSettings;
  workDuration?: number;
  breakDuration?: number;
}

export interface AppStateData {
  themeMode: ThemeMode;
  
  timerMode: TimerMode;
  timerState: TimerState;
  previousMode: "FLOW";
  timeLeft: number; // seconds
  isActive: boolean;
  sessionStartTime: string | null;
  timerAnchorTimestamp?: number | null;
  targetEndTime?: number | null;
  
  timerSettings?: TimerSettings;

  tasks: TaskItem[];
  selectedTaskId?: string | null;

  sessions: Session[];
  distractions: Distraction[];
  
  shield: ShieldConfig;
  
  stats: {
    todayMinutes: number;
    streakDays: number;
    longestStreak: number;
    weeklyMinutes: { [day: string]: number };
  };

  deepFocusMode?: boolean;
  soundEnabled?: boolean;
  musicEnabled?: boolean;
  isMusicPlaying?: boolean;
  musicVolume?: number;
  soundEffectVolume?: number;
  soundEffectEnabled?: boolean;
  autoPauseOnExternalAudio?: boolean;
  autoPauseFadeDuration?: number;
}
