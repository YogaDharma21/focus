export type TimerMode = "FLOW";
export type TimerState = "FLOW" | "BREAK";
export type PriorityType = "low" | "medium" | "high" | "urgent";
export type ThemeMode = "light" | "dark";

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Group {
  id: string;
  name: string;
  type: "system" | "custom";
}

export interface TodoItem {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  priority?: PriorityType;
  category?: string;
  dueDate?: string;
  dueTime?: string;
  notes?: string;
  groupId?: string;
  subtasks?: SubTask[];
  completedAt?: string;
}

export interface Session {
  id: string;
  date: string;
  duration: number; // in seconds
  mode: TimerMode;
  sessionName?: string;
  todoId?: string;
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

export interface AppStateData {
  themeMode: ThemeMode;
  
  timerMode: TimerMode;
  timerState: TimerState;
  previousMode: "FLOW";
  timeLeft: number; // seconds
  isActive: boolean;
  sessionStartTime: string | null;
  sessionName: string;
  selectedTodoId: string | null;
  
  todos: TodoItem[];
  groups: Group[];
  sessions: Session[];
  distractions: Distraction[];
  
  shield: ShieldConfig;
  
  stats: {
    todayMinutes: number;
    completedTasksCount: number;
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
