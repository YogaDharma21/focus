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

export async function getStoredState(): Promise<AppStateData> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY]) {
          resolve({ ...DEFAULT_STATE, ...result[STORAGE_KEY] });
        } else {
          resolve(DEFAULT_STATE);
        }
      });
    });
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed reading localStorage", e);
  }
  return DEFAULT_STATE;
}

export async function saveStoredState(state: Partial<AppStateData>): Promise<AppStateData> {
  const current = await getStoredState();
  const nextState = { ...current, ...state };

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
      if (areaName === "local" && changes[STORAGE_KEY]) {
        callback(changes[STORAGE_KEY].newValue);
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
