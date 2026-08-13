let musicAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!musicAudio) {
    const url = (typeof chrome !== "undefined" && chrome.runtime?.getURL)
      ? chrome.runtime.getURL("music1.mp3")
      : "/music1.mp3";
    musicAudio = new Audio(url);
    musicAudio.loop = true;
    musicAudio.volume = 0.8;
  }
  return musicAudio;
}

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.target !== "offscreen") return;

    switch (message.action) {
      case "PLAY_MUSIC": {
        const audio = getAudio();
        if (typeof message.volume === "number") {
          audio.volume = Math.max(0, Math.min(1, message.volume));
        }
        audio.play().then(() => {
          sendResponse({ status: "playing" });
        }).catch((err) => {
          console.error("Offscreen audio play error:", err);
          sendResponse({ status: "error", error: String(err) });
        });
        return true;
      }

      case "PAUSE_MUSIC": {
        const audio = getAudio();
        audio.pause();
        sendResponse({ status: "paused" });
        break;
      }

      case "SET_MUSIC_VOLUME": {
        const audio = getAudio();
        if (typeof message.volume === "number") {
          audio.volume = Math.max(0, Math.min(1, message.volume));
        }
        sendResponse({ status: "volume_set", volume: audio.volume });
        break;
      }

      case "PLAY_SOUND_EFFECT": {
        try {
          const sfxUrl = (typeof chrome !== "undefined" && chrome.runtime?.getURL)
            ? chrome.runtime.getURL("soundeffect.mp3")
            : "/soundeffect.mp3";
          const sfx = new Audio(sfxUrl);
          if (typeof message.volume === "number") {
            sfx.volume = Math.max(0, Math.min(1, message.volume));
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
