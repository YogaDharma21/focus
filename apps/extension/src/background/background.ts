import { getStoredState, saveStoredState } from "../lib/storage";

let timerInterval: ReturnType<typeof setInterval> | null = null;

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
    color: timerState === "WORK" ? "#10b981" : "#06b6d4",
  });
}

async function startBackgroundTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(async () => {
    const state = await getStoredState();
    if (!state.isActive) {
      if (timerInterval) clearInterval(timerInterval);
      updateBadge(state.timeLeft, false, state.timerState);
      return;
    }

    if (state.timeLeft > 1) {
      const nextTime = state.timeLeft - 1;
      await saveStoredState({ timeLeft: nextTime });
      updateBadge(nextTime, true, state.timerState);
    } else {
      // Session finished!
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

      // Trigger Desktop Notification
      if (typeof chrome !== "undefined" && chrome.notifications) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/></svg>",
          title: isWork ? "🎉 Work Session Completed!" : "🔔 Break Finished!",
          message: isWork
            ? "Great job staying focused! Time to take a refreshing break."
            : "Break is over! Ready to get back into the focus zone?",
          priority: 2,
        });
      }
    }
  }, 1000);
}

// Listen for tab navigation to block distracting sites during active focus session
if (typeof chrome !== "undefined" && chrome.tabs) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url || tab.url) {
      const targetUrl = changeInfo.url || tab.url;
      if (!targetUrl || targetUrl.startsWith("chrome://") || targetUrl.startsWith("chrome-extension://")) {
        return;
      }

      const state = await getStoredState();
      if (!state.shield.enabled) return;

      const isBlockingRequired =
        state.shield.blockMode === "ALWAYS" ||
        (state.shield.blockMode === "ALWAYS_WHEN_ACTIVE" && state.isActive && state.timerState === "WORK");

      if (isBlockingRequired) {
        const isBlocked = state.shield.blockedSites.some((site) => {
          const cleanSite = site.toLowerCase().trim();
          return targetUrl.toLowerCase().includes(cleanSite);
        });

        if (isBlocked) {
          const blockedPageUrl = chrome.runtime.getURL(
            `blocked.html?target=${encodeURIComponent(targetUrl)}`
          );
          chrome.tabs.update(tabId, { url: blockedPageUrl });

          // Record distraction entry
          saveStoredState({
            distractions: [
              ...state.distractions,
              {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                category: "Website Shield",
                website: targetUrl,
              },
            ],
          });
        }
      }
    }
  });
}

// Storage Listener to start/stop timer dynamically when toggled from Popup or Dashboard
if (typeof chrome !== "undefined" && chrome.storage) {
  chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.focus_extension_state_v1) {
      const newState = changes.focus_extension_state_v1.newValue;
      if (newState?.isActive) {
        startBackgroundTimer();
      } else {
        if (timerInterval) clearInterval(timerInterval);
        updateBadge(newState?.timeLeft || 0, false, newState?.timerState || "WORK");
      }
    }
  });
}

// Initialize on service worker startup
getStoredState().then((state) => {
  if (state.isActive) {
    startBackgroundTimer();
  } else {
    updateBadge(state.timeLeft, false, state.timerState);
  }
});
