import { getStoredState, saveStoredState } from "../lib/storage";
import { AppStateData } from "../types";

let timerInterval: ReturnType<typeof setInterval> | null = null;

// Helper: check if a URL matches any blocked domain
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

// Actively inspect all open tabs and redirect any tab visiting a blocked domain
async function enforceTabBlocking(state?: AppStateData) {
  if (typeof chrome === "undefined" || !chrome.tabs) return;

  const currentState = state || (await getStoredState());
  const isBlockingRequired =
    currentState.shield.enabled &&
    currentState.isActive &&
    currentState.timerState === "WORK";

  if (!isBlockingRequired) return;

  chrome.tabs.query({}, (tabs) => {
    if (!tabs) return;
    for (const tab of tabs) {
      if (tab.id && tab.url && isUrlBlocked(tab.url, currentState.shield.blockedSites)) {
        const blockedPageUrl = chrome.runtime.getURL(
          `blocked.html?target=${encodeURIComponent(tab.url)}`
        );
        chrome.tabs.update(tab.id, { url: blockedPageUrl });

        // Record distraction log
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

async function updateBadge(timeLeft: number, isActive: boolean, timerState: string) {
  if (typeof chrome === "undefined" || !chrome.action) return;

  if (!isActive) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const badgeText = mins > 0 ? `${mins}m` : `${secs}s`;

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({
    color: timerState === "WORK" ? "#000000" : "#525252",
  });
}

async function startBackgroundTimer() {
  if (timerInterval) clearInterval(timerInterval);

  // Enforce blocking immediately upon starting timer
  enforceTabBlocking();

  timerInterval = setInterval(async () => {
    const state = await getStoredState();
    if (!state.isActive) {
      if (timerInterval) clearInterval(timerInterval);
      updateBadge(state.timeLeft, false, state.timerState);
      return;
    }

    // Periodically re-check open tabs every second while timer is active
    if (state.timerState === "WORK" && state.shield.enabled) {
      enforceTabBlocking(state);
    }

    if (state.timeLeft > 1) {
      const nextTime = state.timeLeft - 1;
      await saveStoredState({ timeLeft: nextTime });
      updateBadge(nextTime, true, state.timerState);
    } else {
      // Session completed!
      if (timerInterval) clearInterval(timerInterval);
      const isWork = state.timerState === "WORK";
      const nextState = isWork ? "BREAK" : "WORK";
      const nextTime = isWork
        ? state.pomodoroSettings.break * 60
        : state.pomodoroSettings.work * 60;

      const newSessionList = isWork
        ? [
            ...state.sessions,
            {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              duration: state.pomodoroSettings.work * 60,
              mode: state.timerMode,
              sessionName: state.sessionName || "Focus Session",
            },
          ]
        : state.sessions;

      const updatedTodayMins = isWork
        ? state.stats.todayMinutes + state.pomodoroSettings.work
        : state.stats.todayMinutes;

      await saveStoredState({
        isActive: false,
        timerState: nextState,
        timeLeft: nextTime,
        sessions: newSessionList,
        stats: {
          ...state.stats,
          todayMinutes: updatedTodayMins,
        },
      });

      updateBadge(nextTime, false, nextState);

      // Desktop notification
      if (typeof chrome !== "undefined" && chrome.notifications) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/></svg>",
          title: isWork ? "Focus Session Completed!" : "Break Finished!",
          message: isWork
            ? "Session complete. Take a short break."
            : "Break is over. Ready to start focusing?",
          priority: 2,
        });
      }
    }
  }, 1000);
}

// Tab navigation listener
if (typeof chrome !== "undefined" && chrome.tabs) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const url = changeInfo.url || tab.url;
    if (url) {
      const state = await getStoredState();
      if (state.shield.enabled && state.isActive && state.timerState === "WORK") {
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
    if (state.shield.enabled && state.isActive && state.timerState === "WORK") {
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

// Storage Listener
if (typeof chrome !== "undefined" && chrome.storage) {
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.focus_extension_state_v2) {
      const newState: AppStateData = changes.focus_extension_state_v2.newValue;
      if (newState?.isActive) {
        startBackgroundTimer();
      } else {
        if (timerInterval) clearInterval(timerInterval);
        updateBadge(newState?.timeLeft || 0, false, newState?.timerState || "WORK");
      }
    }
  });
}

// Init
getStoredState().then((state) => {
  if (state.isActive) {
    startBackgroundTimer();
  } else {
    updateBadge(state.timeLeft, false, state.timerState);
  }
});
