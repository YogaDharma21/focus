const SESSION_MUSIC_POSITION_KEY = "focus_music_position";

let musicAudio: HTMLAudioElement | null = null;
let currentFadeInterval: ReturnType<typeof setInterval> | null = null;
let targetMusicVolume = 0.8;
let playPromise: Promise<void> | null = null;
let cachedMusicPosition = 0;
let lastSaveTime = 0;
let pendingSaveTimeout: ReturnType<typeof setTimeout> | null = null;

async function loadPersistedMusicPosition(): Promise<number> {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    try {
      const res = await chrome.storage.session.get(SESSION_MUSIC_POSITION_KEY);
      if (res && typeof res[SESSION_MUSIC_POSITION_KEY] === "number" && isFinite(res[SESSION_MUSIC_POSITION_KEY])) {
        cachedMusicPosition = res[SESSION_MUSIC_POSITION_KEY];
        return cachedMusicPosition;
      }
    } catch {
      // Fallback to cache if storage.session is unavailable
    }
  }
  return cachedMusicPosition;
}

function persistMusicPosition(pos: number, immediate = false): void {
  if (!isFinite(pos) || pos < 0) return;
  cachedMusicPosition = pos;

  const now = Date.now();
  if (immediate) {
    if (pendingSaveTimeout !== null) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
    }
    lastSaveTime = now;
    if (typeof chrome !== "undefined" && chrome.storage?.session) {
      chrome.storage.session.set({ [SESSION_MUSIC_POSITION_KEY]: pos }).catch(() => {});
    }
    return;
  }

  if (now - lastSaveTime >= 1000) {
    lastSaveTime = now;
    if (pendingSaveTimeout !== null) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
    }
    if (typeof chrome !== "undefined" && chrome.storage?.session) {
      chrome.storage.session.set({ [SESSION_MUSIC_POSITION_KEY]: pos }).catch(() => {});
    }
  } else if (!pendingSaveTimeout) {
    pendingSaveTimeout = setTimeout(() => {
      pendingSaveTimeout = null;
      lastSaveTime = Date.now();
      if (typeof chrome !== "undefined" && chrome.storage?.session) {
        chrome.storage.session.set({ [SESSION_MUSIC_POSITION_KEY]: cachedMusicPosition }).catch(() => {});
      }
    }, 1000 - (now - lastSaveTime));
  }
}

function applyPlaybackPosition(audio: HTMLAudioElement, targetPos: number): void {
  if (!isFinite(targetPos) || targetPos <= 0) return;

  const setTime = () => {
    try {
      if (audio.duration && targetPos >= audio.duration - 0.5) {
        audio.currentTime = 0;
      } else if (Math.abs(audio.currentTime - targetPos) > 0.3) {
        audio.currentTime = targetPos;
      }
    } catch (err) {
      console.warn("Could not set audio.currentTime:", err);
    }
  };

  if (audio.readyState >= 1) {
    setTime();
  } else {
    const onMetadata = () => {
      setTime();
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("canplay", onMetadata);
    };
    audio.addEventListener("loadedmetadata", onMetadata, { once: true });
    audio.addEventListener("canplay", onMetadata, { once: true });
  }
}

function getAudio(): HTMLAudioElement {
  if (!musicAudio) {
    const url = (typeof chrome !== "undefined" && chrome.runtime?.getURL)
      ? chrome.runtime.getURL("music1.mp3")
      : "/music1.mp3";
    musicAudio = new Audio(url);
    musicAudio.loop = true;
    musicAudio.volume = targetMusicVolume;

    musicAudio.addEventListener("timeupdate", () => {
      if (musicAudio && !musicAudio.paused && musicAudio.currentTime > 0) {
        persistMusicPosition(musicAudio.currentTime, false);
      }
    });

    musicAudio.addEventListener("pause", () => {
      if (musicAudio) {
        persistMusicPosition(musicAudio.currentTime, true);
      }
    });

    musicAudio.addEventListener("seeking", () => {
      if (musicAudio) {
        persistMusicPosition(musicAudio.currentTime, true);
      }
    });

    musicAudio.addEventListener("ended", () => {
      persistMusicPosition(0, true);
    });

    loadPersistedMusicPosition().then((savedPos) => {
      if (savedPos > 0 && musicAudio) {
        applyPlaybackPosition(musicAudio, savedPos);
      }
    });
  }
  return musicAudio;
}

// Preload persisted position on offscreen document init
loadPersistedMusicPosition();

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (musicAudio) {
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

        if (positionToRestore > 0) {
          applyPlaybackPosition(audio, positionToRestore);
        }

        const fadeDuration = typeof message.fadeDuration === "number" ? message.fadeDuration : 0;
        if (fadeDuration > 0 && targetMusicVolume > 0) {
          const startVol = audio.paused ? 0 : audio.volume;
          audio.volume = startVol;
          const durationMs = fadeDuration * 1000;
          const stepInterval = 25;
          const totalSteps = Math.max(1, Math.round(durationMs / stepInterval));
          const delta = (targetMusicVolume - startVol) / totalSteps;

          safePlay(audio).then(() => {
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
          safePlay(audio).then(() => {
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
