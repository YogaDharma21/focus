const musicAudio = new Audio(chrome.runtime.getURL("music1.mp3"));
musicAudio.loop = true;
musicAudio.volume = 0.8;

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.target !== "offscreen") return;

    switch (message.action) {
      case "PLAY_MUSIC":
        if (typeof message.volume === "number") {
          musicAudio.volume = message.volume;
        }
        musicAudio.play().then(() => {
          sendResponse({ status: "playing" });
        }).catch((err) => {
          console.error("Offscreen audio play error:", err);
          sendResponse({ status: "error", error: String(err) });
        });
        return true;

      case "PAUSE_MUSIC":
        musicAudio.pause();
        sendResponse({ status: "paused" });
        break;

      case "SET_MUSIC_VOLUME":
        if (typeof message.volume === "number") {
          musicAudio.volume = Math.max(0, Math.min(1, message.volume));
        }
        sendResponse({ status: "volume_set", volume: musicAudio.volume });
        break;

      case "PLAY_SOUND_EFFECT":
        try {
          const sfx = new Audio(chrome.runtime.getURL("soundeffect.mp3"));
          sfx.play().catch((err) => console.log("SFX play error:", err));
        } catch (e) {
          console.error("SFX error:", e);
        }
        sendResponse({ status: "sfx_triggered" });
        break;
    }
  });
}
