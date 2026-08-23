import { getStoredState, saveStoredState, getWeeklyMinutesFromSessions, getTodayMinutesFromSessions, calculateStreaksFromSessions } from "../lib/storage";
import { AppStateData } from "../types";

let timerInterval: ReturnType<typeof setInterval> | null = null;

const KEEPALIVE_ALARM = "focus-keepalive";
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

// In-memory flag: true when music was auto-paused due to external tab audio.
// Not persisted to storage to avoid triggering the storage.onChanged play/pause sync.
let musicAutoPaused = false;

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

async function ensureOffscreenDocument() {
  if (typeof chrome === "undefined" || !chrome.offscreen) return;
  const exists = await hasOffscreenDocument();
  if (!exists) {
    try {
      await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: "Background music playback and timer completion sound effects",
      });
    } catch (e) {
      console.log("Offscreen document creation error:", e);
    }
  }
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
    console.log("Error sending message to offscreen:", e);
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
          if (nextPlaying) {
            await sendToOffscreen("PLAY_MUSIC", { volume: state.musicVolume ?? 0.8 });
          } else {
            await sendToOffscreen("PAUSE_MUSIC");
          }
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
        saveStoredState({ autoPauseOnExternalAudio: Boolean(message.enabled) }).then(() => {
          // If feature is being disabled while music is auto-paused, resume playback
          if (!message.enabled && musicAutoPaused) {
            musicAutoPaused = false;
            getStoredState().then((s) => {
              if (s.isMusicPlaying) {
                sendToOffscreen("PLAY_MUSIC", { volume: s.musicVolume ?? 0.8 });
              }
            });
          }
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

        if (nextIsMusicPlaying) {
          sendToOffscreen("PLAY_MUSIC", { volume: state.musicVolume ?? 0.8 });
        } else {
          sendToOffscreen("PAUSE_MUSIC");
        }

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

// ─── External Audio Detection Helpers ──────────────────────────────────

/**
 * Checks whether any non-extension tab is currently producing audio.
 * Excludes the extension's own pages (offscreen document, popup, blocked page).
 */
async function checkAnyTabAudible(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.tabs) return false;
  return new Promise((resolve) => {
    chrome.tabs.query({ audible: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        resolve(false);
        return;
      }
      const extensionOrigin = chrome.runtime.getURL("");
      const hasExternalAudio = tabs.some(
        (t) => t.url && !t.url.startsWith(extensionOrigin)
      );
      resolve(hasExternalAudio);
    });
  });
}

/**
 * Called when a tab's audible state changes or an audible tab is removed.
 * Handles auto-pausing and auto-resuming the extension's music.
 */
async function handleAudibleChange(tabBecameAudible: boolean, tabUrl?: string) {
  const state = await getStoredState();
  if (!state.autoPauseOnExternalAudio) return;

  // Ignore audible changes from the extension's own pages
  if (tabUrl) {
    const extensionOrigin = chrome.runtime.getURL("");
    if (tabUrl.startsWith(extensionOrigin)) return;
  }

  if (tabBecameAudible) {
    // External tab started playing audio — auto-pause music if it's playing
    if (state.isMusicPlaying && !musicAutoPaused) {
      musicAutoPaused = true;
      await sendToOffscreen("PAUSE_MUSIC");
    }
  } else {
    // A tab stopped being audible — check if ANY other tab is still audible
    if (musicAutoPaused) {
      const stillAudible = await checkAnyTabAudible();
      if (!stillAudible) {
        musicAutoPaused = false;
        if (state.isMusicPlaying) {
          await sendToOffscreen("PLAY_MUSIC", { volume: state.musicVolume ?? 0.8 });
        }
      }
    }
  }
}

// ─── Tab Listeners ─────────────────────────────────────────────────────

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

    // External audio detection
    if (changeInfo.audible !== undefined) {
      handleAudibleChange(changeInfo.audible, tab.url);
    }
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
  });

  // When an audible tab is closed, check if music should resume
  chrome.tabs.onRemoved.addListener(async () => {
    if (musicAutoPaused) {
      handleAudibleChange(false);
    }
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

      if (oldState && newState.isMusicPlaying !== oldState.isMusicPlaying) {
        // User manually toggled music — reset auto-pause tracking
        musicAutoPaused = false;
        if (newState.isMusicPlaying) {
          await sendToOffscreen("PLAY_MUSIC", { volume: newState.musicVolume ?? 0.8 });
        } else {
          await sendToOffscreen("PAUSE_MUSIC");
        }
      }
    }
  });
}

// ─── Init ──────────────────────────────────────────────────────────────

getStoredState().then((state) => {
  if (state.isActive) {
    startBackgroundTimer();
  } else {
    updateBadge(state.timeLeft, false, state.timerState);
    restoreBlockedTabs();
  }
  if (state.isMusicPlaying) {
    sendToOffscreen("PLAY_MUSIC", { volume: state.musicVolume ?? 0.8 });
  }
});

