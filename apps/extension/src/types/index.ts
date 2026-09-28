export type TimerMode = "FLOW";
export type TimerState = "FLOW" | "BREAK";
export type ThemeMode = "light" | "dark";

export interface Session {
  id: string;
  date: string;
  duration: number; // in seconds
  mode: TimerMode;
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

export interface TimerSettings {
  autoStartBreak?: boolean;
  autoStartTimer?: boolean;
}

export interface AppStateData {
  themeMode: ThemeMode;
  
  timerMode: TimerMode;
  timerState: TimerState;
  previousMode: "FLOW";
  timeLeft: number; // seconds
  isActive: boolean;
  sessionStartTime: string | null;
  
  timerSettings?: TimerSettings;

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
