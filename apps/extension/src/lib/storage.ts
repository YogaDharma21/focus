import { AppStateData } from "../types";

const STORAGE_KEY = "focus_extension_state_v5";

export const DEFAULT_STATE: AppStateData = {
  themeMode: "dark",
  timerMode: "POMODORO",
  timerState: "WORK",
  previousMode: "POMODORO",
  timeLeft: 25 * 60,
  isActive: false,
  sessionStartTime: null,
  sessionName: "",
  selectedTodoId: "demo-1",
  pomodoroSettings: {
    work: 25,
    break: 5,
    autoStartBreak: false,
  },
  todos: [
    {
      id: "demo-1",
      text: "Build extension feature set",
      description: "Complete key requirements for the Focus extension",
      completed: false,
      priority: "urgent",
      groupId: "current",
      dueDate: new Date().toISOString().split("T")[0],
      dueTime: "18:00",
      notes: "Focus on clean monochrome UX and robust timer reactivity",
      recurring: "none",
      estimatedPomodoros: 4,
      completedPomodoros: 1,
      subtasks: [
        { id: "sub-1", text: "Implement Flow stopwatch mode", completed: true },
        { id: "sub-2", text: "Add distraction button & settings modal", completed: false }
      ]
    },
    {
      id: "demo-2",
      text: "Review focus analytics & weekly trend",
      description: "Analyze daily focus minutes and completion rates",
      completed: false,
      priority: "medium",
      groupId: "current",
      estimatedPomodoros: 2,
      completedPomodoros: 0,
      subtasks: []
    }
  ],
  groups: [
    { id: "current", name: "Current Tasks", type: "system" },
    { id: "finished", name: "Finished", type: "system" }
  ],
  moodNotes: [
    {
      id: "note-1",
      date: new Date().toISOString().split("T")[0],
      mood: "😊 Calm",
      text: "Productive morning session with clear goals."
    }
  ],
  sessions: [],
  distractions: [
    { id: "dist-1", timestamp: new Date().toISOString(), category: "Phone" },
    { id: "dist-2", timestamp: new Date().toISOString(), category: "Social Media" }
  ],
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
    todayMinutes: 50,
    completedTasksCount: 2,
    streakDays: 5,
    longestStreak: 8,
    weeklyMinutes: {
      "Mon": 45,
      "Tue": 60,
      "Wed": 50,
      "Thu": 75,
      "Fri": 30,
      "Sat": 90,
      "Sun": 40
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
