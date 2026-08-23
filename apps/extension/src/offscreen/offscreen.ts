let musicAudio: HTMLAudioElement | null = null;
let currentFadeInterval: ReturnType<typeof setInterval> | null = null;
let targetMusicVolume = 0.8;

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

        const fadeDuration = typeof message.fadeDuration === "number" ? message.fadeDuration : 0;
        if (fadeDuration > 0 && targetMusicVolume > 0) {
          const startVol = audio.paused ? 0 : audio.volume;
          audio.volume = startVol;
          const durationMs = fadeDuration * 1000;
          const stepInterval = 25;
          const totalSteps = Math.max(1, Math.round(durationMs / stepInterval));
          const delta = (targetMusicVolume - startVol) / totalSteps;

          audio.play().then(() => {
            currentFadeInterval = setInterval(() => {
              const nextVol = audio.volume + delta;
              if (nextVol >= targetMusicVolume - 0.005 || audio.paused) {
                audio.volume = targetMusicVolume;
                clearFade();
              } else {
                audio.volume = Math.max(0, Math.min(1, nextVol));
              }
            }, stepInterval);
            sendResponse({ status: "playing", fading: true });
          }).catch((err) => {
            console.error("Offscreen audio play error:", err);
            sendResponse({ status: "error", error: String(err) });
          });
        } else {
          audio.volume = targetMusicVolume;
          audio.play().then(() => {
            sendResponse({ status: "playing" });
          }).catch((err) => {
            console.error("Offscreen audio play error:", err);
            sendResponse({ status: "error", error: String(err) });
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

          currentFadeInterval = setInterval(() => {
            const nextVol = audio.volume - delta;
            if (nextVol <= 0.005 || audio.paused) {
              audio.pause();
              audio.volume = targetMusicVolume;
              clearFade();
            } else {
              audio.volume = Math.max(0, Math.min(1, nextVol));
            }
          }, stepInterval);
          sendResponse({ status: "fading_out" });
        } else {
          audio.pause();
          audio.volume = targetMusicVolume;
          sendResponse({ status: "paused" });
        }
        break;
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
