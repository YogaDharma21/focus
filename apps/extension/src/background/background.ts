import { getStoredState, saveStoredState, getWeeklyMinutesFromSessions, getTodayMinutesFromSessions, calculateStreaksFromSessions } from "../lib/storage";
import { AppStateData } from "../types";

let timerInterval: ReturnType<typeof setInterval> | null = null;

const KEEPALIVE_ALARM = "focus-keepalive";
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

// ─── Auto-Pause State Persistence ─────────────────────────────────────────
// Persisted in chrome.storage.session so state survives service worker sleep/wakeups
// without modifying focus_extension_state_v6.
const SESSION_MUSIC_AUTO_PAUSED_KEY = "focus_music_auto_paused";
const SESSION_MUSIC_CURRENT_TIME_KEY = "focus_music_current_time";
let cachedMusicAutoPaused = false;
let cachedMusicCurrentTime = 0;

async function getMusicAutoPaused(): Promise<boolean> {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      const res = await chrome.storage.session.get(SESSION_MUSIC_AUTO_PAUSED_KEY);
      if (res && typeof res[SESSION_MUSIC_AUTO_PAUSED_KEY] === "boolean") {
        cachedMusicAutoPaused = res[SESSION_MUSIC_AUTO_PAUSED_KEY];
        return cachedMusicAutoPaused;
      }
    } catch {
      // Fallback to cache if storage.session is unavailable
    }
  }
  return cachedMusicAutoPaused;
}

async function setMusicAutoPaused(val: boolean): Promise<void> {
  cachedMusicAutoPaused = val;
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      await chrome.storage.session.set({ [SESSION_MUSIC_AUTO_PAUSED_KEY]: val });
    } catch {
      // Ignore if session storage fails
    }
  }
}

async function getMusicCurrentTime(): Promise<number> {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      const res = await chrome.storage.session.get(SESSION_MUSIC_CURRENT_TIME_KEY);
      if (res && typeof res[SESSION_MUSIC_CURRENT_TIME_KEY] === "number") {
        cachedMusicCurrentTime = res[SESSION_MUSIC_CURRENT_TIME_KEY];
        return cachedMusicCurrentTime;
      }
    } catch {
      // Fallback to cache if storage.session is unavailable
    }
  }
  return cachedMusicCurrentTime;
}

async function setMusicCurrentTime(val: number): Promise<void> {
  cachedMusicCurrentTime = val;
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      await chrome.storage.session.set({ [SESSION_MUSIC_CURRENT_TIME_KEY]: val });
    } catch {
      // Ignore if session storage fails
    }
  }
}

// ─── Offscreen Audio Helpers ───────────────────────────────────────────

async function hasOffscreenDocument(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.offscreen) return false;
  if ("hasDocument" in chrome.offscreen) {
    return await chrome.offscreen.hasDocument();
  }
  const contexts = await (chrome.runtime as any).getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
  });
  return contexts.length > 0;
}

let creatingOffscreenPromise: Promise<void> | null = null;

async function ensureOffscreenDocument() {
  if (typeof chrome === "undefined" || !chrome.offscreen) return;
  const exists = await hasOffscreenDocument();
  if (exists) return;

  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return;
  }

  creatingOffscreenPromise = (async () => {
    try {
      await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: "Background music playback and timer completion sound effects",
      });
    } catch (e: any) {
      if (!String(e?.message || e).includes("Only a single offscreen document may be created")) {
        console.log("Offscreen document creation error:", e);
      }
    } finally {
      creatingOffscreenPromise = null;
    }
  })();

  await creatingOffscreenPromise;
}

async function sendToOffscreen(action: string, payload: Record<string, any> = {}) {
  await ensureOffscreenDocument();
  try {
    return await chrome.runtime.sendMessage({
      target: "offscreen",
      action,
      ...payload
    });
  } catch (e) {
    // Retry once in case the newly created offscreen document is still attaching its message listener
    try {
      await new Promise((r) => setTimeout(r, 80));
      return await chrome.runtime.sendMessage({
        target: "offscreen",
        action,
        ...payload
      });
    } catch (retryErr) {
      console.log("Error sending message to offscreen:", retryErr);
    }
  }
}

// ─── Runtime Message Listener ───────────────────────────────────────────

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.target === "background") {
      if (message.action === "TOGGLE_MUSIC") {
        getStoredState().then(async (state) => {
          const nextPlaying = !state.isMusicPlaying;
          await saveStoredState({ isMusicPlaying: nextPlaying });
          await scheduleSyncExternalAudioState("TOGGLE_MUSIC");
          sendResponse({ isMusicPlaying: nextPlaying });
        });
        return true;
      } else if (message.action === "SET_MUSIC_VOLUME") {
        saveStoredState({ musicVolume: message.volume }).then(() => {
          sendToOffscreen("SET_MUSIC_VOLUME", { volume: message.volume });
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "SET_SOUND_EFFECT_VOLUME") {
        const vol = typeof message.volume === "number" ? Math.max(0, Math.min(1, message.volume)) : 0.8;
        saveStoredState({ soundEffectVolume: vol }).then(() => {
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "SET_SOUND_EFFECT_ENABLED") {
        saveStoredState({ soundEffectEnabled: Boolean(message.enabled) }).then(() => {
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "PLAY_SOUND_EFFECT") {
        getStoredState().then((state) => {
          const enabled = state.soundEffectEnabled ?? true;
          if (enabled || message.force) {
            const rawVol = typeof message.volume === "number" ? message.volume : (state.soundEffectVolume ?? 0.8);
            const vol = Math.max(0, Math.min(1, rawVol));
            sendToOffscreen("PLAY_SOUND_EFFECT", { volume: vol });
          }
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "RESTORE_BLOCKED_TABS") {
        restoreBlockedTabs();
        sendResponse({ success: true });
        return true;
      } else if (message.action === "SET_AUTO_PAUSE_ON_EXTERNAL_AUDIO") {
        const enabled = Boolean(message.enabled);
        saveStoredState({ autoPauseOnExternalAudio: enabled }).then(async () => {
          await scheduleSyncExternalAudioState("SET_AUTO_PAUSE_ON_EXTERNAL_AUDIO");
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "SET_AUTO_PAUSE_FADE_DURATION") {
        const duration = typeof message.duration === "number" ? Math.max(0, Math.min(10, message.duration)) : 2;
        saveStoredState({ autoPauseFadeDuration: duration }).then(() => {
          sendResponse({ success: true });
        });
        return true;
      }
    }
  });
}

// ─── URL Blocking Helpers ──────────────────────────────────────────────

function isUrlBlocked(targetUrl: string, blockedSites: string[]): boolean {
  if (!targetUrl || targetUrl.startsWith("chrome://") || targetUrl.startsWith("chrome-extension://") || targetUrl.startsWith("about:")) {
    return false;
  }

  let hostname = "";
  try {
    const parsed = new URL(targetUrl);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    hostname = targetUrl.toLowerCase();
  }

  return blockedSites.some((site) => {
    const cleanSite = site.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
    if (!cleanSite) return false;
    return hostname.includes(cleanSite) || targetUrl.toLowerCase().includes(cleanSite);
  });
}

async function enforceTabBlocking(state?: AppStateData) {
  if (typeof chrome === "undefined" || !chrome.tabs) return;

  const currentState = state || (await getStoredState());
  const isBlockingRequired =
    currentState.shield.enabled &&
    currentState.isActive &&
    (currentState.timerState === "WORK" || currentState.timerState === "FLOW");

  if (!isBlockingRequired) return;

  chrome.tabs.query({}, (tabs) => {
    if (!tabs) return;
    for (const tab of tabs) {
      if (tab.id && tab.url && isUrlBlocked(tab.url, currentState.shield.blockedSites)) {
        const blockedPageUrl = chrome.runtime.getURL(
          `blocked.html?target=${encodeURIComponent(tab.url)}`
        );
        chrome.tabs.update(tab.id, { url: blockedPageUrl });

        saveStoredState({
          distractions: [
            ...currentState.distractions,
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              category: "Shield Blocked Tab",
              website: tab.url,
            },
          ],
        });
      }
    }
  });
}

async function restoreBlockedTabs() {
  if (typeof chrome === "undefined" || !chrome.tabs) return;

  const blockedPageBase = chrome.runtime.getURL("blocked.html");

  chrome.tabs.query({}, (tabs) => {
    if (!tabs) return;
    for (const tab of tabs) {
      if (tab.id && tab.url && tab.url.startsWith(blockedPageBase)) {
        try {
          const blockedUrl = new URL(tab.url);
          const targetUrl = blockedUrl.searchParams.get("target");
          if (targetUrl) {
            chrome.tabs.update(tab.id, { url: targetUrl });
          }
        } catch {}
      }
    }
  });
}

// ─── Badge ─────────────────────────────────────────────────────────────

async function updateBadge(timeLeft: number, isActive: boolean, timerState: string) {
  if (typeof chrome === "undefined" || !chrome.action) return;

  if (!isActive) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const badgeText = timerState === "FLOW" ? `${mins}m` : (mins > 0 ? `${mins}m` : `${secs}s`);

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({
    color: timerState === "WORK" ? "#000000" : timerState === "FLOW" ? "#262626" : "#525252",
  });
}

// ─── Keepalive Alarm ───────────────────────────────────────────────────

async function startKeepalive() {
  if (typeof chrome !== "undefined" && chrome.alarms) {
    await chrome.alarms.create(KEEPALIVE_ALARM, { periodInMinutes: 0.4 }); // ~24s
  }
}

async function stopKeepalive() {
  if (typeof chrome !== "undefined" && chrome.alarms) {
    await chrome.alarms.clear(KEEPALIVE_ALARM);
  }
}

function stopBackgroundTimer() {
  if (timerInterval !== null) {
    if (timerInterval !== (-1 as any)) {
      clearInterval(timerInterval);
    }
    timerInterval = null;
  }
  stopKeepalive();
}

// ─── Background Timer ──────────────────────────────────────────────────

async function startBackgroundTimer() {
  if (timerInterval !== null) {
    return;
  }
  timerInterval = -1 as any;

  try {
    await startKeepalive();
    const initialState = await getStoredState();
    if (!initialState.isActive) {
      stopBackgroundTimer();
      return;
    }

    enforceTabBlocking(initialState);
    updateBadge(initialState.timeLeft, true, initialState.timerState);

    if (timerInterval !== (-1 as any)) {
      if (timerInterval !== null) {
        clearInterval(timerInterval);
      }
    }

    timerInterval = setInterval(async () => {
      const state = await getStoredState();
      if (!state.isActive) {
        stopBackgroundTimer();
        updateBadge(state.timeLeft, false, state.timerState);
        return;
      }

      if (state.timerState === "FLOW") {
        // Stopwatch mode: count up
        const nextTime = state.timeLeft + 1;
        await saveStoredState({ timeLeft: nextTime });
        updateBadge(nextTime, true, "FLOW");
      } else {
        // Countdown mode: WORK or BREAK
        if (state.timeLeft > 0) {
          const nextTime = state.timeLeft - 1;
          await saveStoredState({ timeLeft: nextTime });
          updateBadge(nextTime, true, state.timerState);
        } else {
        // Session complete automatically when countdown finishes (00:00)
        stopBackgroundTimer();

        let nextState: "WORK" | "BREAK" | "FLOW" = "BREAK";
        let nextTime = 0;
        let prevMode = state.previousMode;
        let loggedDuration = 0;
        let nextPomodoroCount = state.pomodoroCount || 0;

        if (state.timerState === "WORK") {
          nextPomodoroCount = (state.pomodoroCount || 0) + 1;
          const isLongBreak = nextPomodoroCount % 4 === 0;
          const breakDuration = isLongBreak
            ? (state.pomodoroSettings.longBreak || 15) * 60
            : (state.pomodoroSettings.break || 5) * 60;

          prevMode = "POMODORO";
          nextState = "BREAK";
          nextTime = breakDuration;
          loggedDuration = state.pomodoroSettings.work * 60;
        } else {
          // Returning from BREAK back to previous mode (FLOW or POMODORO)
          loggedDuration = state.pomodoroSettings.break * 60;
          if (state.previousMode === "FLOW") {
            nextState = "FLOW";
            nextTime = 0;
          } else {
            nextState = "WORK";
            nextTime = state.pomodoroSettings.work * 60;
          }
        }

        const isWork = state.timerState === "WORK";
        const newSessionList = isWork
          ? [
              ...state.sessions,
              {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration: loggedDuration,
                mode: state.timerMode,
                sessionName: state.sessionName || "Focus Session",
              },
            ]
          : state.sessions;

        const updatedWeekly = getWeeklyMinutesFromSessions(newSessionList);
        const updatedTodayMins = getTodayMinutesFromSessions(newSessionList);
        const streaks = calculateStreaksFromSessions(newSessionList);

        const autoStart = isWork ? state.pomodoroSettings.autoStartBreak : state.pomodoroSettings.autoStartTimer;
        const nextIsMusicPlaying = !isWork && autoStart;

        let updatedTodos = state.todos;
        if (isWork && state.selectedTodoId) {
          updatedTodos = state.todos.map(t => {
            if (t.id === state.selectedTodoId) {
              const newCompleted = (t.completedPomodoros || 0) + 1;
              const est = t.estimatedPomodoros || 1;
              const isFinished = newCompleted >= est;
              return {
                ...t,
                completedPomodoros: newCompleted,
                completed: t.completed || isFinished,
                completedAt: (t.completed || isFinished) ? (t.completedAt || new Date().toISOString()) : undefined,
                groupId: (t.completed || isFinished) ? "finished" : t.groupId
              };
            }
            return t;
          });
        }
        const updatedCompletedTasksCount = updatedTodos.filter(t => t.completed).length;

        await saveStoredState({
          isActive: autoStart,
          isMusicPlaying: nextIsMusicPlaying,
          deepFocusMode: !isWork && autoStart,
          timerMode: nextState === "FLOW" ? "FLOW" : "POMODORO",
          timerState: nextState,
          previousMode: prevMode,
          timeLeft: nextTime,
          pomodoroCount: nextPomodoroCount,
          todos: updatedTodos,
          sessions: newSessionList,
          stats: {
            ...state.stats,
            todayMinutes: updatedTodayMins,
            weeklyMinutes: updatedWeekly,
            streakDays: streaks.current,
            longestStreak: streaks.best,
            completedTasksCount: updatedCompletedTasksCount,
          },
        });

        if (autoStart) {
          startBackgroundTimer();
        }

        updateBadge(nextTime, autoStart, nextState);

        if (state.soundEffectEnabled ?? true) {
          sendToOffscreen("PLAY_SOUND_EFFECT", { volume: state.soundEffectVolume ?? 0.8 });
        }
        restoreBlockedTabs();

        if (typeof chrome !== "undefined" && chrome.notifications) {
          const iconUrl = typeof chrome.runtime?.getURL === "function"
            ? chrome.runtime.getURL("icons/icon128.png")
            : "icons/icon128.png";
          chrome.notifications.create({
            type: "basic",
            iconUrl,
            title: "Session Finished!",
            message: state.timerState === "WORK"
              ? "Pomodoro session complete! Starting break."
              : `Break finished! Returning to ${prevMode} mode.`,
            priority: 2,
          });
        }
      }
    }
  }, 1000);
  } catch (err) {
    stopBackgroundTimer();
  }
}

// ─── External Audio Detection & Synchronization ─────────────────────────

/**
 * Checks whether any non-extension tab is currently producing audio.
 * Excludes the extension's own pages (offscreen document, popup, blocked page) and muted tabs.
 */
async function checkAnyTabAudible(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) return false;
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({ audible: true }, (tabs) => {
        if (chrome.runtime?.lastError || !tabs || tabs.length === 0) {
          resolve(false);
          return;
        }
        const extensionOrigin = chrome.runtime.getURL("");
        const hasExternalAudio = tabs.some((t) => {
          // Tab must be audible and not explicitly muted
          if (!t.audible || t.mutedInfo?.muted) return false;
          // Ignore extension's own pages if url is available
          if (t.url && t.url.startsWith(extensionOrigin)) return false;
          return true;
        });
        resolve(hasExternalAudio);
      });
    } catch {
      resolve(false);
    }
  });
}

let syncQueue: Promise<void> = Promise.resolve();

/**
 * Serialized coordinator for ambient music auto-pause based on external tab audio.
 * Uses a FIFO promise queue to prevent concurrency race conditions when multiple events occur.
 */
function scheduleSyncExternalAudioState(reason?: string): Promise<void> {
  syncQueue = syncQueue
    .then(() => performSyncExternalAudioState(reason))
    .catch((err) => {
      console.error("Error during syncExternalAudioState:", err);
    });
  return syncQueue;
}

async function performSyncExternalAudioState(_reason?: string): Promise<void> {
  const state = await getStoredState();
  const autoPauseEnabled = Boolean(state.autoPauseOnExternalAudio);
  const isMusicPlaying = Boolean(state.isMusicPlaying);
  const fadeDuration = typeof state.autoPauseFadeDuration === "number" ? state.autoPauseFadeDuration : 2;
  const musicVolume = state.musicVolume ?? 0.8;
  const wasAutoPaused = await getMusicAutoPaused();

  if (!isMusicPlaying) {
    if (wasAutoPaused) {
      await setMusicAutoPaused(false);
      await setMusicCurrentTime(0);
    }
    await sendToOffscreen("PAUSE_MUSIC");
    return;
  }

  // Music is intended to be playing
  if (!autoPauseEnabled) {
    if (wasAutoPaused) {
      await setMusicAutoPaused(false);
      await setMusicCurrentTime(0);
    }
    await sendToOffscreen("PLAY_MUSIC", { volume: musicVolume, fadeDuration });
    return;
  }

  const isExternalAudible = await checkAnyTabAudible();

  if (isExternalAudible) {
    if (!wasAutoPaused) {
      // First detection of external audio -> pause music and save playback position.
      // Only do this on the initial transition. Repeated PAUSE_MUSIC calls while
      // already paused would hit a recycled offscreen document (fresh Audio element
      // at currentTime=0) and overwrite the saved position with 0.
      await setMusicAutoPaused(true);
      const pauseResult = await sendToOffscreen("PAUSE_MUSIC", { fadeDuration });
      if (pauseResult && typeof pauseResult.currentTime === "number") {
        await setMusicCurrentTime(pauseResult.currentTime);
      }
    }
    // Already auto-paused: skip. Position is already saved in session storage.
  } else {
    // No external tab is producing audio
    if (wasAutoPaused) {
      // Resume from auto-pause - restore saved playback position
      const savedTime = await getMusicCurrentTime();
      await setMusicAutoPaused(false);
      await setMusicCurrentTime(0);
      await sendToOffscreen("PLAY_MUSIC", { volume: musicVolume, fadeDuration, currentTime: savedTime });
    } else {
      // Ensure music is playing
      await sendToOffscreen("PLAY_MUSIC", { volume: musicVolume });
    }
  }
}

// ─── Tab & Window Listeners ───────────────────────────────────────────

if (typeof chrome !== "undefined" && chrome.tabs) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // URL blocking
    const url = changeInfo.url || tab.url;
    if (url) {
      const state = await getStoredState();
      if (state.shield.enabled && state.isActive && (state.timerState === "WORK" || state.timerState === "FLOW")) {
        if (isUrlBlocked(url, state.shield.blockedSites)) {
          const blockedPageUrl = chrome.runtime.getURL(
            `blocked.html?target=${encodeURIComponent(url)}`
          );
          chrome.tabs.update(tabId, { url: blockedPageUrl });
        }
      }
    }

    // Always trigger audio synchronization on tab updates (audible, url, title, status changes)
    scheduleSyncExternalAudioState("tabs.onUpdated");
  });

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const state = await getStoredState();
    if (state.shield.enabled && state.isActive && (state.timerState === "WORK" || state.timerState === "FLOW")) {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab?.id && tab.url && isUrlBlocked(tab.url, state.shield.blockedSites)) {
          const blockedPageUrl = chrome.runtime.getURL(
            `blocked.html?target=${encodeURIComponent(tab.url)}`
          );
          chrome.tabs.update(tab.id, { url: blockedPageUrl });
        }
      });
    }
    scheduleSyncExternalAudioState("tabs.onActivated");
  });

  chrome.tabs.onCreated.addListener(() => {
    scheduleSyncExternalAudioState("tabs.onCreated");
  });

  chrome.tabs.onRemoved.addListener(() => {
    scheduleSyncExternalAudioState("tabs.onRemoved");
  });

  if (chrome.tabs.onReplaced) {
    chrome.tabs.onReplaced.addListener(() => {
      scheduleSyncExternalAudioState("tabs.onReplaced");
    });
  }
}

if (typeof chrome !== "undefined" && chrome.windows && chrome.windows.onFocusChanged) {
  chrome.windows.onFocusChanged.addListener(() => {
    scheduleSyncExternalAudioState("windows.onFocusChanged");
  });
}

// ─── Alarm Listener (keepalive wakeup) ─────────────────────────────────

if (typeof chrome !== "undefined" && chrome.alarms) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === KEEPALIVE_ALARM) {
      const state = await getStoredState();
      if (state.isActive && timerInterval === null) {
        startBackgroundTimer();
      } else if (!state.isActive) {
        stopBackgroundTimer();
      }
      scheduleSyncExternalAudioState("alarm");
    }
  });
}

// ─── Storage Listener ──────────────────────────────────────────────────

if (typeof chrome !== "undefined" && chrome.storage) {
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.focus_extension_state_v6) {
      const newState: AppStateData | undefined = changes.focus_extension_state_v6.newValue;
      const oldState: AppStateData | undefined = changes.focus_extension_state_v6.oldValue;
      if (!newState) return;

      const wasActive = Boolean(oldState?.isActive);
      const isNowActive = Boolean(newState.isActive);

      if (isNowActive) {
        if (timerInterval === null) {
          startBackgroundTimer();
        } else {
          // If shield was toggled or blocked sites updated during an active session
          const oldShield = oldState ? JSON.stringify(oldState.shield) : "";
          const newShield = JSON.stringify(newState.shield);
          if (oldShield !== newShield && newState.shield.enabled) {
            enforceTabBlocking(newState);
          }
        }
      } else {
        stopBackgroundTimer();
        updateBadge(newState.timeLeft || 0, false, newState.timerState || "WORK");
        if (wasActive) {
          restoreBlockedTabs();
        }
      }

      const musicChanged =
        !oldState ||
        newState.isMusicPlaying !== oldState.isMusicPlaying ||
        newState.autoPauseOnExternalAudio !== oldState.autoPauseOnExternalAudio ||
        newState.musicVolume !== oldState.musicVolume ||
        newState.autoPauseFadeDuration !== oldState.autoPauseFadeDuration;

      if (musicChanged) {
        scheduleSyncExternalAudioState("storage.onChanged");
      }
    }
  });
}

// ─── Runtime Lifecycle Listeners ───────────────────────────────────────

if (typeof chrome !== "undefined" && chrome.runtime) {
  if (chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(() => {
      setMusicAutoPaused(false);
      setMusicCurrentTime(0);
      scheduleSyncExternalAudioState("runtime.onStartup");
    });
  }
  if (chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(() => {
      setMusicAutoPaused(false);
      setMusicCurrentTime(0);
      scheduleSyncExternalAudioState("runtime.onInstalled");
    });
  }
}

// ─── Init ──────────────────────────────────────────────────────────────

getStoredState().then(async (state) => {
  if (state.isActive) {
    startBackgroundTimer();
  } else {
    updateBadge(state.timeLeft, false, state.timerState);
    restoreBlockedTabs();
  }
  scheduleSyncExternalAudioState("init");
});

