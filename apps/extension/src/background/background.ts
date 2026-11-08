import {
  getStoredState,
  saveStoredState,
  getEffectiveTimeLeft,
  getWeeklyMinutesFromSessions,
  getTodayMinutesFromSessions,
  calculateStreaksFromSessions,
  isShieldEnforcing,
} from "../lib/storage";
import { AppStateData, Session } from "../types";

const BREAK_ALARM = "focus-break-end";
const POMODORO_WORK_ALARM = "focus-pomodoro-work-end";
const SCHEDULE_CHECK_ALARM = "focus-schedule-check";
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

// ─── Auto-Pause Timing (fixed constants) ────────────────────────────────────
// External audio must be continuously audible for this long before the music
// pauses, so brief blips (play then instantly pause a video) are ignored.
// Likewise, silence must persist this long before the music resumes, so
// buffering/seeking gaps don't cause pause/resume flapping.
const EXTERNAL_AUDIO_MIN_DURATION_MS = 3000;
const RESUME_MIN_SILENCE_MS = 3000;
// Fade transition used for auto-pause/resume. Fixed; no longer user-configurable.
const AUTO_PAUSE_FADE_DURATION = 2;

const SESSION_EXTERNAL_AUDIO_SINCE_KEY = "focus_external_audio_since";
const SESSION_SILENCE_SINCE_KEY = "focus_silence_since";
let cachedExternalAudioSince = 0;
let cachedSilenceSince = 0;
let delayedAudioSyncTimer: ReturnType<typeof setTimeout> | null = null;

async function getSessionNumber(key: string): Promise<number> {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      const res = await chrome.storage.session.get(key);
      if (res && typeof res[key] === "number") {
        return res[key];
      }
    } catch {
      // Fallback to cache
    }
  }
  return key === SESSION_EXTERNAL_AUDIO_SINCE_KEY ? cachedExternalAudioSince : cachedSilenceSince;
}

async function setSessionNumber(key: string, val: number): Promise<void> {
  if (key === SESSION_EXTERNAL_AUDIO_SINCE_KEY) cachedExternalAudioSince = val;
  else cachedSilenceSince = val;
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      await chrome.storage.session.set({ [key]: val });
    } catch {
      // Ignore if session storage fails
    }
  }
}

async function clearAudioDelayTracking(): Promise<void> {
  if (delayedAudioSyncTimer !== null) {
    clearTimeout(delayedAudioSyncTimer);
    delayedAudioSyncTimer = null;
  }
  await setSessionNumber(SESSION_EXTERNAL_AUDIO_SINCE_KEY, 0);
  await setSessionNumber(SESSION_SILENCE_SINCE_KEY, 0);
}

function scheduleDelayedAudioSync(delayMs: number): void {
  if (delayedAudioSyncTimer !== null) {
    clearTimeout(delayedAudioSyncTimer);
    delayedAudioSyncTimer = null;
  }
  delayedAudioSyncTimer = setTimeout(() => {
    delayedAudioSyncTimer = null;
    scheduleSyncExternalAudioState("delayed-audio-check");
  }, Math.max(0, delayMs));
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
          const soundEnabled = state.soundEnabled ?? true;
          const musicEnabled = state.musicEnabled ?? true;
          if (!soundEnabled || !musicEnabled) {
            sendResponse({ isMusicPlaying: false });
            return;
          }
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
      } else if (message.action === "SET_SOUND_ENABLED") {
        const enabled = Boolean(message.enabled);
        saveStoredState({ soundEnabled: enabled }).then(async () => {
          if (!enabled) {
            await sendToOffscreen("PAUSE_MUSIC");
          }
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "SET_MUSIC_ENABLED") {
        const enabled = Boolean(message.enabled);
        saveStoredState({ musicEnabled: enabled }).then(async () => {
          if (!enabled) {
            await sendToOffscreen("PAUSE_MUSIC");
            await saveStoredState({ isMusicPlaying: false });
          }
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "PLAY_SOUND_EFFECT") {
        getStoredState().then((state) => {
          const masterEnabled = state.soundEnabled ?? true;
          const sfxEnabled = state.soundEffectEnabled ?? true;
          if (masterEnabled && sfxEnabled) {
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
      } else if (message.action === "CHECK_BREAK_END") {
        getStoredState().then(async (state) => {
          if (state.isActive && state.timerState === "BREAK" && state.targetEndTime && state.targetEndTime <= Date.now()) {
            await handleBreakFinished();
          }
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "CHECK_POMODORO_END") {
        getStoredState().then(async (state) => {
          const isPomo = state.timerSettings?.timerMode === "pomodoro" || state.timerMode === "pomodoro";
          if (isPomo && state.isActive && state.timerState === "FLOW" && state.targetEndTime && state.targetEndTime <= Date.now()) {
            await handlePomodoroFinished();
          }
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "SET_AUTO_PAUSE_ON_EXTERNAL_AUDIO") {
        const enabled = Boolean(message.enabled);
        saveStoredState({ autoPauseOnExternalAudio: enabled }).then(async () => {
          await clearAudioDelayTracking();
          await scheduleSyncExternalAudioState("SET_AUTO_PAUSE_ON_EXTERNAL_AUDIO");
          sendResponse({ success: true });
        });
        return true;
      } else if (message.action === "SET_AUTO_PAUSE_FADE_DURATION") {
        // Legacy no-op kept for back-compat: fade is now a fixed constant.
        sendResponse({ success: true });
        return true;
      }
    }
  });
}

// ─── URL Blocking Helpers ──────────────────────────────────────────────

function isUrlBlocked(targetUrl: string, blockedSites: string[], allowedSites: string[] = []): boolean {
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

  if (allowedSites.some((site) => {
    const cleanSite = site.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
    if (!cleanSite) return false;
    return hostname.includes(cleanSite) || targetUrl.toLowerCase().includes(cleanSite);
  })) {
    return false;
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
  const isBlockingRequired = isShieldEnforcing(currentState);

  if (!isBlockingRequired) return;

  chrome.tabs.query({}, (tabs) => {
    if (!tabs) return;
    for (const tab of tabs) {
      if (tab.id && tab.url && isUrlBlocked(tab.url, currentState.shield.blockedSites, currentState.shield.allowedSites)) {
        const blockedPageUrl = chrome.runtime.getURL(
          `blocked.html?target=${encodeURIComponent(tab.url)}`
        );
        chrome.tabs.update(tab.id, { url: blockedPageUrl }).catch(() => {});

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
            chrome.tabs.update(tab.id, { url: targetUrl }).catch(() => {});
          }
        } catch {}
      }
    }
  });
}

// ─── Badge ─────────────────────────────────────────────────────────────

async function updateBadgeForState(state?: AppStateData) {
  if (typeof chrome === "undefined" || !chrome.action) return;

  const currentState = state || (await getStoredState());
  if (!currentState.isActive) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  const timeLeft = getEffectiveTimeLeft(currentState);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isPomo = currentState.timerSettings?.timerMode === "pomodoro" || currentState.timerMode === "pomodoro";

  let badgeText = "";
  if (currentState.timerState === "FLOW") {
    badgeText = isPomo ? (mins > 0 ? `${mins}m` : `${secs}s`) : `${mins}m`;
  } else {
    badgeText = mins > 0 ? `${mins}m` : `${secs}s`;
  }

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({
    color: currentState.timerState === "FLOW" ? "#262626" : "#525252",
  });
}

// ─── Break & Pomodoro Handling & Alarms ───────────────────────────────────

async function syncTimerAlarms(state: AppStateData) {
  if (typeof chrome === "undefined" || !chrome.alarms) return;

  const isPomo = state.timerSettings?.timerMode === "pomodoro" || state.timerMode === "pomodoro";

  if (state.isActive && state.timerState === "BREAK" && state.targetEndTime) {
    if (state.targetEndTime <= Date.now()) {
      await handleBreakFinished();
    } else {
      await chrome.alarms.create(BREAK_ALARM, { when: state.targetEndTime });
    }
    await chrome.alarms.clear(POMODORO_WORK_ALARM);
  } else if (isPomo && state.isActive && state.timerState === "FLOW" && state.targetEndTime) {
    if (state.targetEndTime <= Date.now()) {
      await handlePomodoroFinished();
    } else {
      await chrome.alarms.create(POMODORO_WORK_ALARM, { when: state.targetEndTime });
    }
    await chrome.alarms.clear(BREAK_ALARM);
  } else {
    await chrome.alarms.clear(BREAK_ALARM);
    await chrome.alarms.clear(POMODORO_WORK_ALARM);
  }
}

async function handlePomodoroFinished() {
  if (typeof chrome !== "undefined" && chrome.alarms) {
    await chrome.alarms.clear(POMODORO_WORK_ALARM);
  }

  const state = await getStoredState();
  const isPomo = state.timerSettings?.timerMode === "pomodoro" || state.timerMode === "pomodoro";
  if (!state.isActive || state.timerState !== "FLOW" || !isPomo) {
    return;
  }

  const workMins = state.timerSettings?.pomodoro?.workDuration ?? 25;
  const workSecs = workMins * 60;
  const breakMins = state.timerSettings?.pomodoro?.breakDuration ?? 5;
  const breakSecs = breakMins * 60;

  const focusedTask = (state.tasks || []).find((t) => t.id === state.selectedTaskId);
  const newSession: Session = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    duration: workSecs,
    mode: "pomodoro",
    taskId: focusedTask?.id,
    taskName: focusedTask?.text,
  };
  const newSessions = [newSession, ...(state.sessions || [])];
  const updatedWeekly = getWeeklyMinutesFromSessions(newSessions);
  const updatedToday = getTodayMinutesFromSessions(newSessions);
  const streaks = calculateStreaksFromSessions(newSessions);

  const autoStartBreak = Boolean(state.timerSettings?.autoStartBreak);
  const soundEnabled = state.soundEnabled ?? true;
  const musicEnabled = state.musicEnabled ?? true;
  const sfxEnabled = state.soundEffectEnabled ?? true;

  const targetEnd = autoStartBreak ? Date.now() + (breakSecs * 1000) : null;

  const nextState = await saveStoredState({
    isActive: autoStartBreak,
    isMusicPlaying: false,
    deepFocusMode: false,
    timerState: "BREAK",
    timeLeft: breakSecs,
    timerAnchorTimestamp: null,
    targetEndTime: targetEnd,
    sessions: newSessions,
    stats: {
      ...state.stats,
      todayMinutes: updatedToday,
      weeklyMinutes: updatedWeekly,
      streakDays: streaks.current,
      longestStreak: streaks.best,
    },
  });

  await updateBadgeForState(nextState);

  if (soundEnabled && sfxEnabled) {
    sendToOffscreen("PLAY_SOUND_EFFECT", { volume: state.soundEffectVolume ?? 0.8 });
  }

  if (isShieldEnforcing(nextState)) {
    enforceTabBlocking(nextState);
  } else {
    restoreBlockedTabs();
  }

  if (typeof chrome !== "undefined" && chrome.notifications) {
    const iconUrl = typeof chrome.runtime?.getURL === "function"
      ? chrome.runtime.getURL("icons/icon128.png")
      : "icons/icon128.png";
    chrome.notifications.create({
      type: "basic",
      iconUrl,
      title: "Pomodoro Finished!",
      message: `Focus session complete. Time for a ${breakMins}-minute break.`,
      priority: 2,
    });
  }

  scheduleSyncExternalAudioState("pomodoro.finished");
}

async function handleBreakFinished() {
  if (typeof chrome !== "undefined" && chrome.alarms) {
    await chrome.alarms.clear(BREAK_ALARM);
  }

  const state = await getStoredState();
  if (!state.isActive || state.timerState !== "BREAK") {
    return;
  }

  const isPomo = state.timerSettings?.timerMode === "pomodoro" || state.timerMode === "pomodoro";
  const autoStart = Boolean(state.timerSettings?.autoStartTimer);
  const soundEnabled = state.soundEnabled ?? true;
  const musicEnabled = state.musicEnabled ?? true;
  const sfxEnabled = state.soundEffectEnabled ?? true;

  const workMins = state.timerSettings?.pomodoro?.workDuration ?? 25;
  const workSecs = workMins * 60;

  let timeLeft = 0;
  let anchor: number | null = null;
  let targetEnd: number | null = null;

  if (isPomo) {
    timeLeft = workSecs;
    if (autoStart) {
      targetEnd = Date.now() + (workSecs * 1000);
    }
  } else {
    timeLeft = 0;
    if (autoStart) {
      anchor = Date.now();
    }
  }

  const nextState = await saveStoredState({
    isActive: autoStart,
    isMusicPlaying: autoStart && soundEnabled && musicEnabled,
    deepFocusMode: false,
    timerMode: isPomo ? "pomodoro" : "FLOW",
    timerState: "FLOW",
    previousMode: "FLOW",
    timeLeft,
    timerAnchorTimestamp: anchor,
    targetEndTime: targetEnd,
  });

  await updateBadgeForState(nextState);

  if (soundEnabled && sfxEnabled) {
    sendToOffscreen("PLAY_SOUND_EFFECT", { volume: state.soundEffectVolume ?? 0.8 });
  }

  if (isShieldEnforcing(nextState)) {
    enforceTabBlocking(nextState);
  } else {
    restoreBlockedTabs();
  }

  if (typeof chrome !== "undefined" && chrome.notifications) {
    const iconUrl = typeof chrome.runtime?.getURL === "function"
      ? chrome.runtime.getURL("icons/icon128.png")
      : "icons/icon128.png";
    chrome.notifications.create({
      type: "basic",
      iconUrl,
      title: "Break Finished!",
      message: "Break is over. Ready to focus again.",
      priority: 2,
    });
  }

  scheduleSyncExternalAudioState("break.finished");
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
  const soundEnabled = state.soundEnabled ?? true;
  const musicEnabled = state.musicEnabled ?? true;
  const autoPauseEnabled = Boolean(state.autoPauseOnExternalAudio);
  const isMusicPlaying = Boolean(state.isMusicPlaying);
  const fadeDuration = AUTO_PAUSE_FADE_DURATION;
  const musicVolume = state.musicVolume ?? 0.8;
  const wasAutoPaused = await getMusicAutoPaused();

  if (!isMusicPlaying || !soundEnabled || !musicEnabled) {
    if (wasAutoPaused) {
      await setMusicAutoPaused(false);
      await setMusicCurrentTime(0);
    }
    await clearAudioDelayTracking();
    await sendToOffscreen("PAUSE_MUSIC");
    return;
  }

  // Music is intended to be playing
  if (!autoPauseEnabled) {
    if (wasAutoPaused) {
      await setMusicAutoPaused(false);
      await setMusicCurrentTime(0);
    }
    await clearAudioDelayTracking();
    await sendToOffscreen("PLAY_MUSIC", { volume: musicVolume, fadeDuration });
    return;
  }

  const isExternalAudible = await checkAnyTabAudible();
  const now = Date.now();

  if (isExternalAudible) {
    // External audio present: drop any pending silence tracking.
    await setSessionNumber(SESSION_SILENCE_SINCE_KEY, 0);
    if (wasAutoPaused) {
      // Already auto-paused: skip. Position is already saved in session storage.
      await setSessionNumber(SESSION_EXTERNAL_AUDIO_SINCE_KEY, 0);
      return;
    }
    // Require sustained audible audio before pausing so sub-3s blips are ignored.
    let since = await getSessionNumber(SESSION_EXTERNAL_AUDIO_SINCE_KEY);
    if (!since) {
      since = now;
      await setSessionNumber(SESSION_EXTERNAL_AUDIO_SINCE_KEY, since);
    }
    const elapsed = now - since;
    if (elapsed < EXTERNAL_AUDIO_MIN_DURATION_MS) {
      scheduleDelayedAudioSync(EXTERNAL_AUDIO_MIN_DURATION_MS - elapsed);
      return;
    }
    // Sustained external audio -> pause music and save playback position.
    // Only do this on the initial transition. Repeated PAUSE_MUSIC calls while
    // already paused would hit a recycled offscreen document (fresh Audio element
    // at currentTime=0) and overwrite the saved position with 0.
    await setSessionNumber(SESSION_EXTERNAL_AUDIO_SINCE_KEY, 0);
    await setMusicAutoPaused(true);
    const pauseResult = await sendToOffscreen("PAUSE_MUSIC", { fadeDuration });
    if (pauseResult && typeof pauseResult.currentTime === "number") {
      await setMusicCurrentTime(pauseResult.currentTime);
    }
  } else {
    // No external tab is producing audio: drop any pending audible tracking
    // so a blip that ended early never pauses.
    await setSessionNumber(SESSION_EXTERNAL_AUDIO_SINCE_KEY, 0);
    if (wasAutoPaused) {
      // Require sustained silence before resuming.
      let silenceSince = await getSessionNumber(SESSION_SILENCE_SINCE_KEY);
      if (!silenceSince) {
        silenceSince = now;
        await setSessionNumber(SESSION_SILENCE_SINCE_KEY, silenceSince);
      }
      const silentFor = now - silenceSince;
      if (silentFor < RESUME_MIN_SILENCE_MS) {
        scheduleDelayedAudioSync(RESUME_MIN_SILENCE_MS - silentFor);
        return;
      }
      // Resume from auto-pause - restore saved playback position
      const savedTime = await getMusicCurrentTime();
      await setSessionNumber(SESSION_SILENCE_SINCE_KEY, 0);
      await setMusicAutoPaused(false);
      await setMusicCurrentTime(0);
      await sendToOffscreen("PLAY_MUSIC", { volume: musicVolume, fadeDuration, currentTime: savedTime });
    } else {
      await setSessionNumber(SESSION_SILENCE_SINCE_KEY, 0);
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
    const state = await getStoredState();
    if (url) {
      if (isShieldEnforcing(state)) {
        if (isUrlBlocked(url, state.shield.blockedSites, state.shield.allowedSites)) {
          const blockedPageUrl = chrome.runtime.getURL(
            `blocked.html?target=${encodeURIComponent(url)}`
          );
          chrome.tabs.update(tabId, { url: blockedPageUrl }).catch(() => {});
        }
      }
    }

    await updateBadgeForState(state);
    // Always trigger audio synchronization on tab updates (audible, url, title, status changes)
    scheduleSyncExternalAudioState("tabs.onUpdated");
  });

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const state = await getStoredState();
    if (isShieldEnforcing(state)) {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab?.id && tab.url && isUrlBlocked(tab.url, state.shield.blockedSites, state.shield.allowedSites)) {
          const blockedPageUrl = chrome.runtime.getURL(
            `blocked.html?target=${encodeURIComponent(tab.url)}`
          );
          chrome.tabs.update(tab.id, { url: blockedPageUrl }).catch(() => {});
        }
      });
    }
    await updateBadgeForState(state);
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
  chrome.windows.onFocusChanged.addListener(async () => {
    await updateBadgeForState();
    scheduleSyncExternalAudioState("windows.onFocusChanged");
  });
}

// ─── Alarm Listener (break & pomodoro timers) ───────────────────────────

if (typeof chrome !== "undefined" && chrome.alarms) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === BREAK_ALARM) {
      await handleBreakFinished();
    } else if (alarm.name === POMODORO_WORK_ALARM) {
      await handlePomodoroFinished();
    } else if (alarm.name === SCHEDULE_CHECK_ALARM) {
      const state = await getStoredState();
      if (isShieldEnforcing(state)) {
        enforceTabBlocking(state);
      } else if (!state.isActive || state.timerState !== "FLOW") {
        restoreBlockedTabs();
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

      await syncTimerAlarms(newState);

      const oldEnforcing = oldState ? isShieldEnforcing(oldState) : false;
      const newEnforcing = isShieldEnforcing(newState);

      if (newEnforcing) {
        enforceTabBlocking(newState);
      } else if (oldEnforcing && !newEnforcing) {
        restoreBlockedTabs();
      }

      await updateBadgeForState(newState);

      const musicChanged =
        !oldState ||
        newState.isMusicPlaying !== oldState.isMusicPlaying ||
        newState.autoPauseOnExternalAudio !== oldState.autoPauseOnExternalAudio ||
        newState.musicVolume !== oldState.musicVolume ||
        newState.soundEnabled !== oldState.soundEnabled ||
        newState.musicEnabled !== oldState.musicEnabled;

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
      clearAudioDelayTracking();
      scheduleSyncExternalAudioState("runtime.onStartup");
    });
  }
  if (chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(() => {
      setMusicAutoPaused(false);
      setMusicCurrentTime(0);
      clearAudioDelayTracking();
      scheduleSyncExternalAudioState("runtime.onInstalled");
    });
  }
}

// ─── Init ──────────────────────────────────────────────────────────────

getStoredState().then(async (state) => {
  if (typeof chrome !== "undefined" && chrome.alarms) {
    chrome.alarms.clear("focus-keepalive").catch(() => {});
    chrome.alarms.create(SCHEDULE_CHECK_ALARM, { periodInMinutes: 1 });
  }

  if (isShieldEnforcing(state)) {
    enforceTabBlocking(state);
  } else {
    restoreBlockedTabs();
  }
  if (state.isActive) {
    await syncTimerAlarms(state);
  }
  await updateBadgeForState(state);
  scheduleSyncExternalAudioState("init");
});

