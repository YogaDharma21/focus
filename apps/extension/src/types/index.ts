export type TimerMode = "POMODORO" | "STOPWATCH";
export type TimerState = "WORK" | "BREAK";
export type BackgroundType = "dark" | "gradient" | "mountain" | "library" | "cafe" | "anime-room";
export type PriorityType = "low" | "medium" | "high" | "urgent";

export interface TodoItem {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  priority?: PriorityType;
  category?: string;
  dueDate?: string;
  subtasks?: { id: string; text: string; completed: boolean }[];
  completedAt?: string;
  groupId?: string;
}

export interface MoodNote {
  id: string;
  date: string;
  mood: string; // e.g., '🔥 Energetic', '🎯 Focused', '☕ Calm', '😴 Tired', '⚡ Productive'
  text: string;
}

export interface Session {
  id: string;
  date: string;
  duration: number; // in seconds
  mode: TimerMode;
  sessionName?: string;
}

export interface Distraction {
  id: string;
  timestamp: string;
  category: string;
  website?: string;
}

export interface ShieldConfig {
  enabled: boolean;
  blockedSites: string[]; // e.g., ['facebook.com', 'twitter.com', 'x.com', 'reddit.com', 'instagram.com', 'tiktok.com', 'youtube.com']
  blockMode: "ALWAYS_WHEN_ACTIVE" | "ALWAYS"; // block during active timer, or always
}

export interface AmbientTrack {
  id: string;
  title: string;
  category: "rain" | "waves" | "piano" | "lofi" | "whitenoise";
  url?: string;
  iconName: string;
}

export interface AppStateData {
  timerMode: TimerMode;
  timerState: TimerState;
  timeLeft: number; // seconds
  isActive: boolean;
  sessionStartTime: string | null;
  sessionName: string;
  pomodoroSettings: {
    work: number; // minutes
    break: number; // minutes
    autoStartBreak: boolean;
  };
  
  todos: TodoItem[];
  moodNotes: MoodNote[];
  sessions: Session[];
  distractions: Distraction[];
  
  shield: ShieldConfig;
  
  ambientPlaying: string | null; // ambient track id or null
  ambientVolume: number; // 0 to 1
  
  background: BackgroundType;
  deepFocusMode: boolean;
  
  stats: {
    todayMinutes: number;
    completedTasksCount: number;
    streakDays: number;
  };
}
