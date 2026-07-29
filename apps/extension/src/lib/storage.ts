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
    autoStartBreak: false,
  },
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
    ]
  },
  stats: {
    todayMinutes: 0,
    completedTasksCount: 0,
    streakDays: 0,
    longestStreak: 0,
    weeklyMinutes: {
      "Mon": 0,
      "Tue": 0,
      "Wed": 0,
      "Thu": 0,
      "Fri": 0,
      "Sat": 0,
      "Sun": 0
    }
  }
};

let cachedState: AppStateData | null = null;

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY] && changes[STORAGE_KEY].newValue) {
      cachedState = { ...DEFAULT_STATE, ...changes[STORAGE_KEY].newValue };
    }
  });
}

export async function getStoredState(): Promise<AppStateData> {
  if (cachedState) {
    return cachedState;
  }

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY]) {
          const fresh = { ...DEFAULT_STATE, ...result[STORAGE_KEY] };
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
      const fresh = { ...DEFAULT_STATE, ...JSON.parse(raw) };
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
        const fresh = { ...DEFAULT_STATE, ...changes[STORAGE_KEY].newValue };
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
