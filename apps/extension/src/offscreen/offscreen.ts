import {
  soundscapeEngine,
  DEFAULT_CHANNELS,
  type SoundChannelId,
  type SoundChannelState,
} from "@focus/utils";

let musicAudio: HTMLAudioElement | null = null;
let currentFadeInterval: ReturnType<typeof setInterval> | null = null;
let targetMusicVolume = 0.8;
let playPromise: Promise<void> | null = null;

let currentSoundChannels: SoundChannelState[] = [...DEFAULT_CHANNELS];
let currentSoundscapeMasterVolume = 60;
let isSoundscapeRunning = false;

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
        if (isSoundscapeRunning && message.stopSoundscape !== false) {
          isSoundscapeRunning = false;
          soundscapeEngine.stopAll();
        }

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

      case "START_SOUNDSCAPE": {
        if (musicAudio && !musicAudio.paused) {
          clearFade();
          void safePause(musicAudio);
        }

        if (Array.isArray(message.channels)) {
          currentSoundChannels = message.channels;
        }
        if (typeof message.masterVolume === "number") {
          currentSoundscapeMasterVolume = Math.max(0, Math.min(100, Math.round(message.masterVolume)));
        }

        isSoundscapeRunning = true;
        soundscapeEngine.sync(
          currentSoundChannels,
          currentSoundscapeMasterVolume,
          currentSoundscapeMasterVolume === 0,
          true
        );
        sendResponse({
          status: "soundscape_started",
          channels: currentSoundChannels,
          masterVolume: currentSoundscapeMasterVolume,
        });
        return true;
      }

      case "STOP_SOUNDSCAPE": {
        isSoundscapeRunning = false;
        soundscapeEngine.stopAll();
        sendResponse({ status: "soundscape_stopped" });
        return true;
      }

      case "SET_SOUNDSCAPE_CHANNEL_VOLUME": {
        const { id, volume, enabled } = message;
        const numVol = typeof volume === "number" ? Math.max(0, Math.min(100, Math.round(volume))) : 50;
        currentSoundChannels = currentSoundChannels.map((ch) => {
          if (ch.id === id) {
            const isEnabled = typeof enabled === "boolean" ? enabled : (numVol > 0 ? (ch.enabled || true) : ch.enabled);
            return { ...ch, volume: numVol, enabled: isEnabled };
          }
          return ch;
        });

        if (isSoundscapeRunning) {
          const ch = currentSoundChannels.find((c) => c.id === id);
          if (ch && ch.enabled && numVol > 0) {
            soundscapeEngine.startChannel(id as SoundChannelId, numVol);
          } else {
            soundscapeEngine.stopChannel(id as SoundChannelId);
          }
        }
        sendResponse({ status: "channel_volume_set", id, volume: numVol });
        return true;
      }

      case "TOGGLE_SOUNDSCAPE_CHANNEL": {
        const { id, enabled } = message;
        currentSoundChannels = currentSoundChannels.map((ch) => {
          if (ch.id === id) {
            const nextEnabled = typeof enabled === "boolean" ? enabled : !ch.enabled;
            return { ...ch, enabled: nextEnabled };
          }
          return ch;
        });

        if (isSoundscapeRunning) {
          const ch = currentSoundChannels.find((c) => c.id === id);
          if (ch && ch.enabled && ch.volume > 0) {
            soundscapeEngine.startChannel(id as SoundChannelId, ch.volume);
          } else {
            soundscapeEngine.stopChannel(id as SoundChannelId);
          }
        }
        sendResponse({ status: "channel_toggled", id });
        return true;
      }

      case "SET_SOUNDSCAPE_MASTER_VOLUME": {
        const vol = typeof message.volume === "number" ? Math.max(0, Math.min(100, Math.round(message.volume))) : 60;
        currentSoundscapeMasterVolume = vol;
        soundscapeEngine.setMasterVolume(vol, vol === 0);
        sendResponse({ status: "master_volume_set", volume: vol });
        return true;
      }

      case "APPLY_SOUNDSCAPE_PRESET": {
        const presetChannels: Partial<Record<SoundChannelId, number>> = message.channels || {};
        currentSoundChannels = currentSoundChannels.map((ch) => {
          const targetVol = presetChannels[ch.id];
          if (targetVol !== undefined) {
            return { ...ch, volume: targetVol, enabled: targetVol > 0 };
          }
          return { ...ch, enabled: false };
        });

        if (isSoundscapeRunning) {
          soundscapeEngine.sync(
            currentSoundChannels,
            currentSoundscapeMasterVolume,
            currentSoundscapeMasterVolume === 0,
            true
          );
        }
        sendResponse({ status: "preset_applied", channels: currentSoundChannels });
        return true;
      }

      case "GET_SOUNDSCAPE_STATUS": {
        sendResponse({
          status: "ok",
          isRunning: isSoundscapeRunning,
          masterVolume: currentSoundscapeMasterVolume,
          channels: currentSoundChannels,
        });
        return true;
      }
    }
  });
}
