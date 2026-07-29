import { getStoredState, saveStoredState } from "../lib/storage";
import { AppStateData } from "../types";

let timerInterval: ReturnType<typeof setInterval> | null = null;

const KEEPALIVE_ALARM = "focus-keepalive";

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

    if ((state.timerState === "WORK" || state.timerState === "FLOW") && state.shield.enabled) {
      enforceTabBlocking(state);
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

        if (state.timerState === "WORK") {
          prevMode = "POMODORO";
          nextState = "BREAK";
          nextTime = state.pomodoroSettings.break * 60;
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

        const minsLogged = Math.max(1, Math.round(loggedDuration / 60));
        const dayName = new Date().toLocaleDateString("en-US", { weekday: "short" });
        const updatedWeekly = { ...state.stats.weeklyMinutes };
        if (state.timerState === "WORK") {
          updatedWeekly[dayName] = (updatedWeekly[dayName] || 0) + minsLogged;
        }

        const newSessionList = [
          ...state.sessions,
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            duration: loggedDuration,
            mode: state.timerMode,
            sessionName: state.sessionName || "Focus Session",
          },
        ];

        const updatedTodayMins = state.timerState === "WORK"
          ? state.stats.todayMinutes + minsLogged
          : state.stats.todayMinutes;

        const autoStart = state.timerState === "WORK" && state.pomodoroSettings.autoStartBreak;

        await saveStoredState({
          isActive: autoStart,
          timerState: nextState,
          previousMode: prevMode,
          timeLeft: nextTime,
          sessions: newSessionList,
          stats: {
            ...state.stats,
            todayMinutes: updatedTodayMins,
            weeklyMinutes: updatedWeekly,
          },
        });

        if (autoStart) {
          startBackgroundTimer();
        }

        updateBadge(nextTime, autoStart, nextState);

        if (typeof chrome !== "undefined" && chrome.notifications) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/></svg>",
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

// ─── Tab Listeners ─────────────────────────────────────────────────────

if (typeof chrome !== "undefined" && chrome.tabs) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
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
      const newState: AppStateData = changes.focus_extension_state_v6.newValue;
      if (newState?.isActive) {
        if (timerInterval === null) {
          startBackgroundTimer();
        }
      } else {
        stopBackgroundTimer();
        updateBadge(newState?.timeLeft || 0, false, newState?.timerState || "WORK");
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
  }
});
