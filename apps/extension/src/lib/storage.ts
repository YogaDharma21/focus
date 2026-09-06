import { AppStateData } from "../types";

const STORAGE_KEY = "focus_extension_state_v6";

export const DEFAULT_STATE: AppStateData = {
  themeMode: "dark",
  background: "default",
  timerMode: "POMODORO",
  timerState: "WORK",
  previousMode: "POMODORO",
  timeLeft: 25 * 60,
  isActive: false,
  sessionStartTime: null,
  sessionName: "",
  selectedTodoId: null,
  pomodoroSettings: {
    work: 25,
    break: 5,
    longBreak: 15,
    autoStartBreak: false,
    autoStartTimer: false,
  },
  pomodoroCount: 0,
  todos: [],
  groups: [
    { id: "current", name: "Current Tasks", type: "system" },
    { id: "finished", name: "Finished", type: "system" }
  ],
  moodNotes: [],
  sessions: [],
  distractions: [],
  shield: {
    enabled: true,
    blockedSites: [
      "facebook.com",
      "twitter.com",
      "x.com",
      "instagram.com",
      "reddit.com",
      "tiktok.com",
      "youtube.com"
    ],
    allowedSites: []
  },
  stats: {
    todayMinutes: 0,
    completedTasksCount: 0,
    streakDays: 0,
    longestStreak: 0,
    weeklyMinutes: {
      "Sun": 0,
      "Mon": 0,
      "Tue": 0,
      "Wed": 0,
      "Thu": 0,
      "Fri": 0,
      "Sat": 0
    }
  },
  deepFocusMode: false,
  isMusicPlaying: false,
  musicVolume: 0.8,
  soundEffectVolume: 0.8,
  soundEffectEnabled: true,
  autoPauseOnExternalAudio: false,
  autoPauseFadeDuration: 2
};

export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function getWeeklyMinutesFromSessions(sessions: { date: string; duration: number }[] = []): Record<string, number> {
  const weeklyMinutes: Record<string, number> = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
  };

  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - currentDayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  (sessions || []).forEach((s) => {
    if (!s || !s.date) return;
    const sessionDate = new Date(s.date);
    if (sessionDate >= sunday && sessionDate <= saturday) {
      const dayName = DAYS_OF_WEEK[sessionDate.getDay()];
      const mins = Math.round((s.duration || 0) / 60);
      weeklyMinutes[dayName] = (weeklyMinutes[dayName] || 0) + mins;
    }
  });

  return weeklyMinutes;
}

export function getTodayMinutesFromSessions(sessions: { date: string; duration: number }[] = []): number {
  const now = new Date();
  const todaySessions = (sessions || []).filter((s) => {
    if (!s || !s.date) return false;
    const sDate = new Date(s.date);
    return (
      sDate.getFullYear() === now.getFullYear() &&
      sDate.getMonth() === now.getMonth() &&
      sDate.getDate() === now.getDate()
    );
  });
  return todaySessions.reduce((acc, s) => acc + Math.round((s.duration || 0) / 60), 0);
}

export function calculateStreaksFromSessions(sessions: { date: string }[] = []): { current: number; best: number } {
  if (!sessions || sessions.length === 0) return { current: 0, best: 0 };
  const dates = Array.from(
    new Set(
      sessions
        .filter((s) => s && s.date)
        .map((s) => {
          const d = new Date(s.date);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        })
    )
  ).sort();

  if (dates.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let tempStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > best) best = tempStreak;
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${day}`;

  const yDate = new Date(now.getTime() - 86400000);
  const yy = yDate.getFullYear();
  const ym = String(yDate.getMonth() + 1).padStart(2, "0");
  const yday = String(yDate.getDate()).padStart(2, "0");
  const yesterday = `${yy}-${ym}-${yday}`;

  const lastDate = dates[dates.length - 1];

  let current = 0;
  if (lastDate === today || lastDate === yesterday) {
    current = tempStreak;
  }

  return { current, best: Math.max(best, current) };
};

let cachedState: AppStateData | null = null;

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    if (result && result[STORAGE_KEY]) {
      cachedState = migrateState({ ...DEFAULT_STATE, ...result[STORAGE_KEY] });
    }
  });
}

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY] && changes[STORAGE_KEY].newValue) {
      cachedState = migrateState({ ...DEFAULT_STATE, ...changes[STORAGE_KEY].newValue });
    }
  });
}

export function getCachedState(): AppStateData | null {
  return cachedState;
}

function migrateState(fresh: AppStateData): AppStateData {
  if (fresh.shield && !('allowedSites' in fresh.shield)) {
    fresh.shield = Object.assign({}, fresh.shield, { allowedSites: [] });
  }
  return fresh;
}

export async function getStoredState(): Promise<AppStateData> {
  if (cachedState) {
    return cachedState;
  }

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY]) {
          const fresh = migrateState({ ...DEFAULT_STATE, ...result[STORAGE_KEY] });
          cachedState = fresh;
          resolve(fresh);
        } else {
          cachedState = DEFAULT_STATE;
          resolve(DEFAULT_STATE);
        }
      });
    });
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const fresh = migrateState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
      cachedState = fresh;
      return fresh;
    }
  } catch (e) {
    console.error("Failed reading localStorage", e);
  }
  cachedState = DEFAULT_STATE;
  return DEFAULT_STATE;
}

export async function saveStoredState(state: Partial<AppStateData>): Promise<AppStateData> {
  const current = cachedState || (await getStoredState());
  const nextState = { ...current, ...state };
  cachedState = nextState;

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: nextState }, () => {
        resolve(nextState);
      });
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (e) {
    console.error("Failed saving to localStorage", e);
  }
  return nextState;
}

export function subscribeToStateChanges(callback: (newState: AppStateData) => void): () => void {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "local" && changes[STORAGE_KEY] && changes[STORAGE_KEY].newValue) {
        const fresh = migrateState({ ...DEFAULT_STATE, ...changes[STORAGE_KEY].newValue });
        cachedState = fresh;
        callback(fresh);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  const interval = setInterval(async () => {
    const state = await getStoredState();
    callback(state);
  }, 1000);

  return () => clearInterval(interval);
}
