export type TimerMode = "POMODORO" | "STOPWATCH" | "FLOW";
export type TimerState = "WORK" | "BREAK" | "FLOW";
export type PriorityType = "low" | "medium" | "high" | "urgent";
export type RecurringType = "none" | "daily" | "weekly" | "monthly";
export type ThemeMode = "dark" | "light";

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
  dueDate?: string; // ISO format or date string
  dueTime?: string;
  notes?: string;
  recurring?: RecurringType;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  groupId?: string; // group ID
  subtasks?: SubTask[];
  completedAt?: string;
}

export interface MoodNote {
  id: string;
  date: string;
  mood: string; // Emoji: 😄 Happy, 😊 Calm, 😐 Normal, 😔 Sad, 😤 Frustrated, 😴 Exhausted, 🤯 Overwhelmed
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
  category: string;
  website?: string;
}

export interface ShieldConfig {
  enabled: boolean;
  blockedSites: string[];
}

export interface AppStateData {
  themeMode: ThemeMode;
  
  timerMode: TimerMode; // "POMODORO" | "STOPWATCH" | "FLOW"
  timerState: TimerState; // "WORK" | "BREAK" | "FLOW"
  timeLeft: number; // seconds remaining for Pomodoro, or seconds elapsed for FLOW
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
    weeklyMinutes: { [day: string]: number }; // e.g. { "Mon": 45, "Tue": 60, ... }
  };
}
