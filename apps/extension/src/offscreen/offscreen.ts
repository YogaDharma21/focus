let musicAudio: HTMLAudioElement | null = null;
let currentFadeInterval: ReturnType<typeof setInterval> | null = null;
let targetMusicVolume = 0.8;
let playPromise: Promise<void> | null = null;

function getAudio(): HTMLAudioElement {
  if (!musicAudio) {
    const url = (typeof chrome !== "undefined" && chrome.runtime?.getURL)
      ? chrome.runtime.getURL("music1.mp3")
      : "/music1.mp3";
    musicAudio = new Audio(url);
    musicAudio.loop = true;
    musicAudio.volume = targetMusicVolume;
  }
  return musicAudio;
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

        // Restore playback position if the offscreen document was recycled
        if (typeof message.currentTime === "number" && message.currentTime > 0) {
          const duration = audio.duration;
          if (isFinite(duration) && duration > 0) {
            audio.currentTime = message.currentTime % duration;
          } else {
            // Duration not yet known (new Audio element), restore once metadata loads
            audio.currentTime = message.currentTime;
          }
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

        // Capture playback position before pausing so the background can persist it
        const pausedAt = audio.currentTime || 0;

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
              audio.volume = targetMusicVolume;
              clearFade();
            } else {
              audio.volume = Math.max(0, Math.min(1, nextVol));
            }
          }, stepInterval);
          sendResponse({ status: "fading_out", currentTime: pausedAt });
        } else {
          safePause(audio).then(() => {
            audio.volume = targetMusicVolume;
          });
          sendResponse({ status: "paused", currentTime: pausedAt });
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
