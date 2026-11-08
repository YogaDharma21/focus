import { AppStateData, ShieldSchedule } from "../types";
import { validateBackupJson, DEFAULT_CHANNELS } from "@focus/utils";

const STORAGE_KEY = "focus_extension_state_v6";
const THEME_MIRROR_KEY = "focus_extension_theme";

function rememberTheme(mode: unknown) {
  if (mode !== "dark" && mode !== "light") return;
  try {
    localStorage.setItem(THEME_MIRROR_KEY, mode);
  } catch {}
  try {
    if (typeof document !== "undefined" && document.documentElement) {
      const isDark = mode === "dark";
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.classList.toggle("light", !isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      if (document.body) {
        document.body.classList.toggle("dark", isDark);
        document.body.classList.toggle("light", !isDark);
      }
    }
  } catch {}
}

export const DEFAULT_STATE: AppStateData = {
  themeMode: "dark",
  timerMode: "FLOW",
  timerState: "FLOW",
  previousMode: "FLOW",
  timeLeft: 0,
  timerAnchorTimestamp: null,
  targetEndTime: null,
  isActive: false,
  sessionStartTime: null,
  sessions: [],
  distractions: [],
  shield: {
    enabled: true,
    strictMode: false,
    schedules: [],
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
  timerSettings: {
    autoStartBreak: false,
    autoStartTimer: false,
    breakRatio: "1/5",
    timerMode: "flow",
    pomodoro: {
      workDuration: 25,
      breakDuration: 5,
    },
  },
  tasks: [],
  selectedTaskId: null,
  soundEnabled: true,
  musicEnabled: true,
  isMusicPlaying: false,
  musicVolume: 0.8,
  soundEffectVolume: 0.8,
  soundEffectEnabled: true,
  autoPauseOnExternalAudio: false,
  autoPauseFadeDuration: 2,
  audioSourceType: "lofi",
  isSoundscapePlaying: false,
  soundscapeMasterVolume: 60,
  soundChannels: DEFAULT_CHANNELS,
  soundscapeActivePreset: null
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
      rememberTheme(cachedState.themeMode);
    }
  });
}

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY] && changes[STORAGE_KEY].newValue) {
      cachedState = migrateState({ ...DEFAULT_STATE, ...changes[STORAGE_KEY].newValue });
      rememberTheme(cachedState.themeMode);
    }
  });
}

export function getCachedState(): AppStateData | null {
  return cachedState;
}

function migrateState(fresh: AppStateData): AppStateData {
  // Drop stale task and session-goal fields from previous versions so stored
  // state keeps timer/shield data but sheds todos, groups, task links,
  // and legacy sessionName fields.
  const legacy = fresh as unknown as Record<string, unknown>;
  delete legacy.todos;
  delete legacy.groups;
  delete legacy.selectedTodoId;
  delete legacy.sessionName;
  const stats = legacy.stats as Record<string, unknown> | undefined;
  if (stats && typeof stats === "object") {
    delete stats.completedTasksCount;
  }
  if (Array.isArray(legacy.sessions)) {
    legacy.sessions = (legacy.sessions as Array<Record<string, unknown>>).map((s) => {
      if (s && typeof s === "object" && ("todoId" in s || "sessionName" in s)) {
        const { todoId: _dropped, sessionName: _droppedName, ...rest } = s;
        return rest;
      }
      return s;
    });
  }
  if (fresh.shield) {
    if (!('allowedSites' in fresh.shield)) {
      fresh.shield = Object.assign({}, fresh.shield, { allowedSites: [] });
    }
    if (fresh.shield.strictMode === undefined) {
      fresh.shield.strictMode = false;
    }
    if (!Array.isArray(fresh.shield.schedules)) {
      fresh.shield.schedules = [];
    }
  }
  if (!Array.isArray(fresh.tasks)) {
    fresh.tasks = [];
  }
  fresh.selectedTaskId = fresh.selectedTaskId ?? null;
  if (!fresh.timerSettings) {
    fresh.timerSettings = {
      autoStartBreak: false,
      autoStartTimer: false,
      breakRatio: "1/5",
      timerMode: "flow",
      pomodoro: {
        workDuration: 25,
        breakDuration: 5,
      },
    };
  } else {
    fresh.timerSettings = {
      autoStartBreak: fresh.timerSettings.autoStartBreak ?? false,
      autoStartTimer: fresh.timerSettings.autoStartTimer ?? false,
      breakRatio: fresh.timerSettings.breakRatio ?? "1/5",
      timerMode: fresh.timerSettings.timerMode ?? (fresh.timerMode === "pomodoro" ? "pomodoro" : "flow"),
      pomodoro: {
        workDuration: fresh.timerSettings.pomodoro?.workDuration ?? fresh.timerSettings.workDuration ?? 25,
        breakDuration: fresh.timerSettings.pomodoro?.breakDuration ?? fresh.timerSettings.breakDuration ?? 5,
      },
    };
  }
  if (fresh.timerAnchorTimestamp === undefined) {
    fresh.timerAnchorTimestamp = null;
  }
  if (fresh.targetEndTime === undefined) {
    fresh.targetEndTime = null;
  }
  if (fresh.isActive) {
    const isPomodoro = fresh.timerSettings?.timerMode === "pomodoro" || fresh.timerMode === "pomodoro";
    if (fresh.timerState === "FLOW") {
      if (isPomodoro && !fresh.targetEndTime) {
        fresh.targetEndTime = Date.now() + ((fresh.timeLeft || 0) * 1000);
      } else if (!isPomodoro && !fresh.timerAnchorTimestamp) {
        fresh.timerAnchorTimestamp = Date.now() - ((fresh.timeLeft || 0) * 1000);
      }
    } else if (fresh.timerState === "BREAK" && !fresh.targetEndTime) {
      fresh.targetEndTime = Date.now() + ((fresh.timeLeft || 0) * 1000);
    }
  }
  if (!Array.isArray(fresh.soundChannels) || fresh.soundChannels.length === 0) {
    fresh.soundChannels = DEFAULT_CHANNELS;
  } else {
    const existingIds = new Set(fresh.soundChannels.map((c) => c.id));
    const missing = DEFAULT_CHANNELS.filter((c) => !existingIds.has(c.id));
    if (missing.length > 0) {
      fresh.soundChannels = [...fresh.soundChannels, ...missing];
    }
  }
  if (typeof fresh.soundscapeMasterVolume !== "number") {
    fresh.soundscapeMasterVolume = 60;
  }
  if (typeof fresh.isSoundscapePlaying !== "boolean") {
    fresh.isSoundscapePlaying = false;
  }
  if (fresh.audioSourceType !== "lofi" && fresh.audioSourceType !== "soundscape") {
    fresh.audioSourceType = "lofi";
  }
  if (fresh.soundscapeActivePreset === undefined) {
    fresh.soundscapeActivePreset = null;
  }
  return fresh;
}

export function getEffectiveTimeLeft(state: AppStateData, now: number = Date.now()): number {
  if (!state.isActive) {
    return Math.max(0, state.timeLeft || 0);
  }

  if (state.timerState === "BREAK") {
    if (state.targetEndTime) {
      return Math.max(0, Math.round((state.targetEndTime - now) / 1000));
    }
    return Math.max(0, state.timeLeft || 0);
  }

  const isPomodoro = state.timerSettings?.timerMode === "pomodoro" || state.timerMode === "pomodoro";
  if (isPomodoro) {
    if (state.targetEndTime) {
      return Math.max(0, Math.round((state.targetEndTime - now) / 1000));
    }
    return Math.max(0, state.timeLeft || 0);
  }

  if (state.timerAnchorTimestamp) {
    return Math.max(0, Math.floor((now - state.timerAnchorTimestamp) / 1000));
  }

  return Math.max(0, state.timeLeft || 0);
}

export function isScheduleActive(schedule: ShieldSchedule, now: Date = new Date()): boolean {
  if (!schedule || !schedule.enabled) return false;
  if (!schedule.startTime || !schedule.endTime) return false;
  if (!Array.isArray(schedule.days) || schedule.days.length === 0) return false;

  const [startH, startM] = schedule.startTime.split(":").map(Number);
  const [endH, endM] = schedule.endTime.split(":").map(Number);
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false;

  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH === 23 && endM === 59 ? 1440 : endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    if (!schedule.days.includes(currentDay)) return false;
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight window (e.g. 22:00 to 06:00)
    if (schedule.days.includes(currentDay) && currentMinutes >= startMinutes) {
      return true;
    }
    const prevDay = (currentDay + 6) % 7;
    if (schedule.days.includes(prevDay) && currentMinutes < endMinutes) {
      return true;
    }
    return false;
  }
}

export function isAnyScheduleActive(schedules?: ShieldSchedule[], now: Date = new Date()): boolean {
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) return false;
  return schedules.some((s) => isScheduleActive(s, now));
}

export function isShieldEnforcing(state: AppStateData, now: Date = new Date()): boolean {
  if (!state || !state.shield) return false;

  if (isAnyScheduleActive(state.shield.schedules, now)) {
    return true;
  }

  return Boolean(state.shield.enabled && state.isActive && state.timerState === "FLOW");
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
          rememberTheme(fresh.themeMode);
          resolve(fresh);
        } else {
          cachedState = DEFAULT_STATE;
          rememberTheme(DEFAULT_STATE.themeMode);
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
      rememberTheme(fresh.themeMode);
      return fresh;
    }
  } catch (e) {
    console.error("Failed reading localStorage", e);
  }
  cachedState = DEFAULT_STATE;
  rememberTheme(DEFAULT_STATE.themeMode);
  return DEFAULT_STATE;
}

export async function saveStoredState(state: Partial<AppStateData>): Promise<AppStateData> {
  const current = cachedState || (await getStoredState());
  const nextState = { ...current, ...state };
  cachedState = nextState;
  // Mirror the theme synchronously so the blocking pre-paint script in
  // popup.html / blocked.html can apply it without waiting for
  // chrome.storage.local (async) on the next open.
  rememberTheme(nextState.themeMode);

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

export async function replaceStoredState(state: AppStateData): Promise<AppStateData> {
  const nextState = migrateState(state);
  cachedState = nextState;
  rememberTheme(nextState.themeMode);

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

export async function exportFullBackup(): Promise<string> {
  const currentState = await getStoredState();
  const payload = {
    version: 6,
    exportedAt: new Date().toISOString(),
    state: currentState,
  };
  return JSON.stringify(payload, null, 2);
}

export async function restoreFullBackup(
  jsonData: string | Record<string, unknown>
): Promise<{ success: boolean; error?: string; state?: AppStateData }> {
  try {
    const raw = typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData);
    const validation = validateBackupJson(raw);
    if (!validation.isValid || !validation.data) {
      return {
        success: false,
        error: validation.error || "Invalid backup file structure.",
      };
    }

    const restoredData = validation.data as Partial<AppStateData>;

    const sanitizedSessions = Array.isArray(restoredData.sessions)
      ? restoredData.sessions.filter(
          (s) => s && typeof s === "object" && typeof s.id === "string"
        )
      : [];

    const sanitizedTasks = Array.isArray(restoredData.tasks)
      ? restoredData.tasks.filter(
          (t) => t && typeof t === "object" && typeof t.id === "string"
        )
      : [];

    const sanitizedDistractions = Array.isArray(restoredData.distractions)
      ? restoredData.distractions.filter(
          (d) => d && typeof d === "object" && typeof d.id === "string"
        )
      : [];

    const isRestoredPomo =
      restoredData.timerSettings?.timerMode === "pomodoro" || restoredData.timerMode === "pomodoro";
    const defaultPomoWork = (restoredData.timerSettings?.pomodoro?.workDuration ?? 25) * 60;

    const targetState: AppStateData = {
      ...DEFAULT_STATE,
      ...restoredData,
      sessions: sanitizedSessions,
      tasks: sanitizedTasks,
      distractions: sanitizedDistractions,
      isActive: false,
      timeLeft: isRestoredPomo ? defaultPomoWork : 0,
      timerAnchorTimestamp: null,
      targetEndTime: null,
      timerState: "FLOW",
      sessionStartTime: null,
    };

    const weeklyMinutes = getWeeklyMinutesFromSessions(targetState.sessions);
    const todayMinutes = getTodayMinutesFromSessions(targetState.sessions);
    const streaks = calculateStreaksFromSessions(targetState.sessions);
    targetState.stats = {
      todayMinutes,
      weeklyMinutes,
      streakDays: streaks.current,
      longestStreak: streaks.best,
    };

    const saved = await replaceStoredState(targetState);
    return { success: true, state: saved };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to restore backup.";
    return { success: false, error: msg };
  }
}

export function subscribeToStateChanges(callback: (newState: AppStateData) => void): () => void {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "local" && changes[STORAGE_KEY] && changes[STORAGE_KEY].newValue) {
        const fresh = migrateState({ ...DEFAULT_STATE, ...changes[STORAGE_KEY].newValue });
        cachedState = fresh;
        rememberTheme(fresh.themeMode);
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
