import { AppStateData } from "../types";

const STORAGE_KEY = "focus_extension_state_v2";

export const DEFAULT_STATE: AppStateData = {
  themeMode: "dark",
  timerMode: "POMODORO",
  timerState: "WORK",
  timeLeft: 25 * 60,
  isActive: false,
  sessionStartTime: null,
  sessionName: "",
  pomodoroSettings: {
    work: 25,
    break: 5,
    autoStartBreak: false,
  },
  todos: [
    {
      id: "demo-1",
      text: "Set up daily focus goals",
      completed: false,
      priority: "high",
      category: "Productivity",
      subtasks: [
        { id: "sub-1", text: "Choose key priorities", completed: true },
        { id: "sub-2", text: "Start 25-minute Pomodoro session", completed: false }
      ]
    },
    {
      id: "demo-2",
      text: "Review focus analytics",
      completed: false,
      priority: "medium",
      category: "Work"
    }
  ],
  moodNotes: [
    {
      id: "note-1",
      date: new Date().toISOString().split("T")[0],
      mood: "Focused",
      text: "Started the morning with zero distractions and completed primary tasks!"
    }
  ],
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
  ambientPlaying: null,
  ambientVolume: 0.5,
  stats: {
    todayMinutes: 45,
    completedTasksCount: 3,
    streakDays: 4
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
