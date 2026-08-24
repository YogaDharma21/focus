const SESSION_MUSIC_POSITION_KEY = "focus_music_position";

let musicAudio: HTMLAudioElement | null = null;
let currentFadeInterval: ReturnType<typeof setInterval> | null = null;
let targetMusicVolume = 0.8;
let playPromise: Promise<void> | null = null;
let cachedMusicPosition = 0;
let lastSaveTime = 0;
let pendingSaveTimeout: ReturnType<typeof setTimeout> | null = null;
let isRestoringPosition = false;

async function loadPersistedMusicPosition(): Promise<number> {
  if (typeof chrome !== "undefined") {
    if (chrome.storage?.session) {
      try {
        const res = await chrome.storage.session.get(SESSION_MUSIC_POSITION_KEY);
        if (res && typeof res[SESSION_MUSIC_POSITION_KEY] === "number" && isFinite(res[SESSION_MUSIC_POSITION_KEY]) && res[SESSION_MUSIC_POSITION_KEY] > 0) {
          cachedMusicPosition = res[SESSION_MUSIC_POSITION_KEY];
          return cachedMusicPosition;
        }
      } catch {
        // Fallback to local storage
      }
    }
    if (chrome.storage?.local) {
      try {
        const res = await chrome.storage.local.get(SESSION_MUSIC_POSITION_KEY);
        if (res && typeof res[SESSION_MUSIC_POSITION_KEY] === "number" && isFinite(res[SESSION_MUSIC_POSITION_KEY]) && res[SESSION_MUSIC_POSITION_KEY] > 0) {
          cachedMusicPosition = res[SESSION_MUSIC_POSITION_KEY];
          return cachedMusicPosition;
        }
      } catch {
        // Fallback to cache
      }
    }
  }
  return cachedMusicPosition;
}

function writePositionToStorage(position: number) {
  if (typeof chrome === "undefined") return;
  if (chrome.storage?.session) {
    chrome.storage.session.set({ [SESSION_MUSIC_POSITION_KEY]: position }).catch(() => {});
  }
  if (chrome.storage?.local) {
    chrome.storage.local.set({ [SESSION_MUSIC_POSITION_KEY]: position }).catch(() => {});
  }
}

function persistMusicPosition(pos: number, immediate = false): void {
  if (!isFinite(pos) || pos < 0 || isRestoringPosition) return;
  cachedMusicPosition = pos;

  const now = Date.now();
  if (immediate) {
    if (pendingSaveTimeout !== null) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
    }
    lastSaveTime = now;
    writePositionToStorage(pos);
    return;
  }

  if (now - lastSaveTime >= 1000) {
    lastSaveTime = now;
    if (pendingSaveTimeout !== null) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
    }
    writePositionToStorage(pos);
  } else if (!pendingSaveTimeout) {
    pendingSaveTimeout = setTimeout(() => {
      pendingSaveTimeout = null;
      lastSaveTime = Date.now();
      writePositionToStorage(cachedMusicPosition);
    }, 1000 - (now - lastSaveTime));
  }
}

async function prepareAndPlayAudio(audio: HTMLAudioElement, targetPosition?: number): Promise<void> {
  const pos = typeof targetPosition === "number" && isFinite(targetPosition) && targetPosition > 0
    ? targetPosition
    : await loadPersistedMusicPosition();

  if (pos > 0) {
    isRestoringPosition = true;
    if (audio.readyState >= 1) {
      try {
        if (!audio.duration || pos < audio.duration - 0.5) {
          audio.currentTime = pos;
        } else {
          audio.currentTime = 0;
        }
      } catch (e) {
        console.warn("Could not set currentTime on ready audio:", e);
      }
      isRestoringPosition = false;
    } else {
      await new Promise<void>((resolve) => {
        let settled = false;
        const cleanupAndResolve = () => {
          if (settled) return;
          settled = true;
          audio.removeEventListener("loadedmetadata", onMetadata);
          audio.removeEventListener("canplay", onMetadata);
          audio.removeEventListener("error", onMetadata);
          try {
            if (!audio.duration || pos < audio.duration - 0.5) {
              audio.currentTime = pos;
            } else {
              audio.currentTime = 0;
            }
          } catch (e) {
            console.warn("Could not set currentTime on metadata load:", e);
          }
          isRestoringPosition = false;
          resolve();
        };

        const onMetadata = () => cleanupAndResolve();
        audio.addEventListener("loadedmetadata", onMetadata);
        audio.addEventListener("canplay", onMetadata);
        audio.addEventListener("error", onMetadata);
        setTimeout(cleanupAndResolve, 350);
      });
    }
  }

  await safePlay(audio);
}

function getAudio(): HTMLAudioElement {
  if (!musicAudio) {
    const url = (typeof chrome !== "undefined" && chrome.runtime?.getURL)
      ? chrome.runtime.getURL("music1.mp3")
      : "/music1.mp3";
    musicAudio = new Audio();
    musicAudio.preload = "auto";
    musicAudio.loop = true;
    musicAudio.volume = targetMusicVolume;
    musicAudio.src = url;

    musicAudio.addEventListener("timeupdate", () => {
      if (musicAudio && !musicAudio.paused && !isRestoringPosition && musicAudio.currentTime > 0) {
        persistMusicPosition(musicAudio.currentTime, false);
      }
    });

    musicAudio.addEventListener("pause", () => {
      if (musicAudio && !isRestoringPosition) {
        persistMusicPosition(musicAudio.currentTime, true);
      }
    });

    musicAudio.addEventListener("seeking", () => {
      if (musicAudio && !isRestoringPosition) {
        persistMusicPosition(musicAudio.currentTime, true);
      }
    });

    musicAudio.addEventListener("ended", () => {
      persistMusicPosition(0, true);
    });

    loadPersistedMusicPosition().then((savedPos) => {
      if (savedPos > 0 && musicAudio && musicAudio.paused) {
        isRestoringPosition = true;
        if (musicAudio.readyState >= 1) {
          if (!musicAudio.duration || savedPos < musicAudio.duration - 0.5) {
            musicAudio.currentTime = savedPos;
          }
          isRestoringPosition = false;
        } else {
          const onMeta = () => {
            if (musicAudio) {
              if (!musicAudio.duration || savedPos < musicAudio.duration - 0.5) {
                musicAudio.currentTime = savedPos;
              }
            }
            isRestoringPosition = false;
            musicAudio?.removeEventListener("loadedmetadata", onMeta);
          };
          musicAudio.addEventListener("loadedmetadata", onMeta, { once: true });
        }
      }
    });
  }
  return musicAudio;
}

// Preload persisted position on offscreen document initialization
loadPersistedMusicPosition();

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (musicAudio && !isRestoringPosition) {
      persistMusicPosition(musicAudio.currentTime, true);
    }
  });
}

function clearFade() {
  if (currentFadeInterval !== null) {
    clearInterval(currentFadeInterval);
    currentFadeInterval = null;
  }
}

async function safePlay(audio: HTMLAudioElement): Promise<void> {
  try {
    playPromise = audio.play();
    await playPromise;
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      console.error("Offscreen audio play error:", err);
    }
  } finally {
    playPromise = null;
  }
}

async function safePause(audio: HTMLAudioElement): Promise<void> {
  if (playPromise) {
    try {
      await playPromise;
    } catch {
      // Ignore AbortError when play is aborted by pause
    }
  }
  audio.pause();
}

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.target !== "offscreen") return;

    switch (message.action) {
      case "PLAY_MUSIC": {
        const audio = getAudio();
        if (typeof message.volume === "number") {
          targetMusicVolume = Math.max(0, Math.min(1, message.volume));
        }
        clearFade();

        const positionToRestore = typeof message.position === "number" && isFinite(message.position) && message.position > 0
          ? message.position
          : cachedMusicPosition;

        const fadeDuration = typeof message.fadeDuration === "number" ? message.fadeDuration : 0;
        if (fadeDuration > 0 && targetMusicVolume > 0) {
          const startVol = audio.paused ? 0 : audio.volume;
          audio.volume = startVol;
          const durationMs = fadeDuration * 1000;
          const stepInterval = 25;
          const totalSteps = Math.max(1, Math.round(durationMs / stepInterval));
          const delta = (targetMusicVolume - startVol) / totalSteps;

          prepareAndPlayAudio(audio, positionToRestore).then(() => {
            currentFadeInterval = setInterval(() => {
              const nextVol = audio.volume + delta;
              if (nextVol >= targetMusicVolume - 0.005 || audio.paused) {
                audio.volume = targetMusicVolume;
                clearFade();
              } else {
                audio.volume = Math.max(0, Math.min(1, nextVol));
              }
            }, stepInterval);
          });
          sendResponse({ status: "playing", fading: true });
        } else {
          audio.volume = targetMusicVolume;
          prepareAndPlayAudio(audio, positionToRestore).then(() => {
            sendResponse({ status: "playing" });
          });
        }
        return true;
      }

      case "PAUSE_MUSIC": {
        const audio = getAudio();
        clearFade();

        const fadeDuration = typeof message.fadeDuration === "number" ? message.fadeDuration : 0;
        if (fadeDuration > 0 && !audio.paused && audio.volume > 0.01) {
          const startVol = audio.volume;
          const durationMs = fadeDuration * 1000;
          const stepInterval = 25;
          const totalSteps = Math.max(1, Math.round(durationMs / stepInterval));
          const delta = startVol / totalSteps;

          currentFadeInterval = setInterval(async () => {
            const nextVol = audio.volume - delta;
            if (nextVol <= 0.005 || audio.paused) {
              await safePause(audio);
              persistMusicPosition(audio.currentTime, true);
              audio.volume = targetMusicVolume;
              clearFade();
            } else {
              audio.volume = Math.max(0, Math.min(1, nextVol));
            }
          }, stepInterval);
          sendResponse({ status: "fading_out" });
        } else {
          safePause(audio).then(() => {
            persistMusicPosition(audio.currentTime, true);
            audio.volume = targetMusicVolume;
          });
          sendResponse({ status: "paused" });
        }
        return true;
      }

      case "SET_MUSIC_VOLUME": {
        const audio = getAudio();
        if (typeof message.volume === "number") {
          targetMusicVolume = Math.max(0, Math.min(1, message.volume));
          if (currentFadeInterval === null) {
            audio.volume = targetMusicVolume;
          }
        }
        sendResponse({ status: "volume_set", volume: targetMusicVolume });
        break;
      }

      case "PLAY_SOUND_EFFECT": {
        try {
          const sfxUrl = (typeof chrome !== "undefined" && chrome.runtime?.getURL)
            ? chrome.runtime.getURL("soundeffect.mp3")
            : "/soundeffect.mp3";
          const sfx = new Audio(sfxUrl);
          const targetVol = typeof message.volume === "number" ? message.volume : parseFloat(message.volume);
          if (!isNaN(targetVol)) {
            sfx.volume = Math.max(0, Math.min(1, targetVol));
          } else {
            sfx.volume = 0.8;
          }
          sfx.play().catch((err) => console.log("SFX play error:", err));
        } catch (e) {
          console.error("SFX error:", e);
        }
        sendResponse({ status: "sfx_triggered" });
        break;
      }
    }
  });
}
