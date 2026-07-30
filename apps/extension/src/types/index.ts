export type TimerMode = "POMODORO" | "STOPWATCH" | "FLOW";
export type TimerState = "WORK" | "BREAK" | "FLOW";
export type PriorityType = "low" | "medium" | "high" | "urgent";
export type RecurringType = "none" | "daily" | "weekly" | "monthly";
export type ThemeMode = "dark" | "light";
export type BackgroundTheme = "default" | "gradient" | "mountain" | "library" | "cafe" | "anime-room";

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
  recurring?: RecurringType;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  groupId?: string;
  subtasks?: SubTask[];
  completedAt?: string;
}

export interface MoodNote {
  id: string;
  date: string;
  mood: string;
  text: string;
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
}

export interface AppStateData {
  themeMode: ThemeMode;
  background: BackgroundTheme; // "default" | "gradient" | "mountain" | "library" | "cafe" | "anime-room"
  
  timerMode: TimerMode;
  timerState: TimerState;
  previousMode: "POMODORO" | "FLOW";
  timeLeft: number; // seconds
  isActive: boolean;
  sessionStartTime: string | null;
  sessionName: string;
  selectedTodoId: string | null;

  pomodoroSettings: {
    work: number; // minutes
    break: number; // minutes
    autoStartBreak: boolean;
  };
  
  todos: TodoItem[];
  groups: Group[];
  moodNotes: MoodNote[];
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

  isMusicPlaying?: boolean;
  musicVolume?: number;
}
