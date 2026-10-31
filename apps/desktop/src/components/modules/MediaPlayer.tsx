import React, { useRef, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, BellRing, ChevronDown, Disc, Volume1, Sliders, Waves } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import { playTestCompletionSound } from '../../lib/sound';
import { soundscapeEngine, SOUNDSCAPE_PRESETS } from '@focus/utils';
import type { SoundscapePreset } from '@focus/types';

// ─── Auto-Pause Timing (fixed constants) ────────────────────────────────────
// External audio must be continuously active for this long before the music
// pauses, so brief blips are ignored. Likewise, silence must persist this
// long before the music resumes, so gaps don't cause pause/resume flapping.
const EXTERNAL_AUDIO_MIN_DURATION_MS = 3000;
const RESUME_MIN_SILENCE_MS = 3000;
// Fade transition used for auto-pause/resume. Fixed; no longer user-configurable.
const AUTO_PAUSE_FADE_DURATION = 2;

export const MediaPlayer: React.FC = () => {
  const {
    mediaPlayerOpen,
    setMediaPlayerOpen,
    isMusicPlaying,
    setIsMusicPlaying,
    soundEffectEnabled,
    setSoundEffectEnabled,
    soundEffectVolume,
    setSoundEffectVolume,
    volume,
    setVolume,
    autoPauseOnExternalAudio,
    audioSourceType = "lofi",
    setAudioSourceType,
    soundChannels,
    setChannelVolume,
    toggleChannel,
    applySoundscapePreset,
  } = useDesktopStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPausedRef = useRef(false);
  const autoPauseArmedRef = useRef(false);
  const externalActiveRef = useRef(false);
  const savedTimeRef = useRef(0);
  const externalSinceRef = useRef(0);
  const silenceSinceRef = useRef(0);
  const audioDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFade = () => {
    if (fadeIntervalRef.current !== null) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  const clearAudioDelay = () => {
    if (audioDelayTimerRef.current !== null) {
      clearTimeout(audioDelayTimerRef.current);
      audioDelayTimerRef.current = null;
    }
    externalSinceRef.current = 0;
    silenceSinceRef.current = 0;
  };

  useEffect(() => () => { clearFade(); clearAudioDelay(); }, []);

  useEffect(() => {
    if (audioRef.current && fadeIntervalRef.current === null) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const fadeOutThenPause = (audio: HTMLAudioElement, fadeDuration: number) => {
    clearFade();
    try {
      savedTimeRef.current = audio.currentTime || 0;
    } catch {
      savedTimeRef.current = 0;
    }
    if (!(fadeDuration > 0) || audio.paused || audio.volume <= 0.01) {
      autoPauseArmedRef.current = true;
      audio.pause();
      return;
    }
    const startVol = audio.volume;
    const totalSteps = Math.max(1, Math.round((fadeDuration * 1000) / 25));
    const delta = startVol / totalSteps;
    fadeIntervalRef.current = setInterval(() => {
      const nextVol = audio.volume - delta;
      if (nextVol <= 0.005 || audio.paused) {
        clearFade();
        audio.volume = useDesktopStore.getState().volume ?? 0.8;
        autoPauseArmedRef.current = true;
        audio.pause();
      } else {
        audio.volume = Math.max(0, Math.min(1, nextVol));
      }
    }, 25);
  };

  const fadeInAndPlay = (audio: HTMLAudioElement, targetVolume: number, fadeDuration: number, startTime: number) => {
    clearFade();
    if (startTime > 0) {
      try {
        audio.currentTime = startTime;
      } catch {
        // Seeking may fail before metadata loads; playback still resumes.
      }
    }
    if (!(fadeDuration > 0) || !(targetVolume > 0)) {
      audio.volume = Math.max(0, Math.min(1, targetVolume));
      audio.play().catch((err) => {
        console.warn("Audio play failed", err);
      });
      return;
    }
    audio.volume = 0;
    audio.play().then(() => {
      const totalSteps = Math.max(1, Math.round((fadeDuration * 1000) / 25));
      const delta = targetVolume / totalSteps;
      fadeIntervalRef.current = setInterval(() => {
        const nextVol = audio.volume + delta;
        if (nextVol >= targetVolume - 0.005 || audio.paused) {
          audio.volume = targetVolume;
          clearFade();
        } else {
          audio.volume = Math.max(0, Math.min(1, nextVol));
        }
      }, 25);
    }).catch((err) => {
      console.warn("Audio play failed", err);
      autoPausedRef.current = false;
    });
  };

  const scheduleDelayedAudioCheck = (delayMs: number) => {
    if (audioDelayTimerRef.current !== null) {
      clearTimeout(audioDelayTimerRef.current);
    }
    audioDelayTimerRef.current = setTimeout(() => {
      audioDelayTimerRef.current = null;
      handleExternalAudio(externalActiveRef.current);
    }, Math.max(0, delayMs));
  };

  const handleExternalAudio = (playing: boolean) => {
    externalActiveRef.current = playing;
    const audio = audioRef.current;
    if (!audio) return;
    const state = useDesktopStore.getState();
    if (!state.autoPauseOnExternalAudio) {
      clearAudioDelay();
      if (!playing && autoPausedRef.current && state.isMusicPlaying) {
        autoPausedRef.current = false;
        fadeInAndPlay(audio, state.volume ?? 0.8, AUTO_PAUSE_FADE_DURATION, savedTimeRef.current);
      }
      return;
    }
    const now = Date.now();
    if (playing) {
      // External audio present: drop any pending silence tracking.
      silenceSinceRef.current = 0;
      if (autoPausedRef.current) {
        // Already auto-paused: skip.
        externalSinceRef.current = 0;
        return;
      }
      if (!state.isMusicPlaying || audio.paused) {
        externalSinceRef.current = 0;
        return;
      }
      // Require sustained external audio before pausing so sub-3s blips are ignored.
      if (!externalSinceRef.current) externalSinceRef.current = now;
      const elapsed = now - externalSinceRef.current;
      if (elapsed < EXTERNAL_AUDIO_MIN_DURATION_MS) {
        scheduleDelayedAudioCheck(EXTERNAL_AUDIO_MIN_DURATION_MS - elapsed);
        return;
      }
      externalSinceRef.current = 0;
      autoPausedRef.current = true;
      fadeOutThenPause(audio, AUTO_PAUSE_FADE_DURATION);
    } else if (autoPausedRef.current && state.isMusicPlaying) {
      // No external audio: drop any pending audible tracking so a blip that
      // ended early never pauses.
      externalSinceRef.current = 0;
      // Require sustained silence before resuming.
      if (!silenceSinceRef.current) silenceSinceRef.current = now;
      const silentFor = now - silenceSinceRef.current;
      if (silentFor < RESUME_MIN_SILENCE_MS) {
        scheduleDelayedAudioCheck(RESUME_MIN_SILENCE_MS - silentFor);
        return;
      }
      silenceSinceRef.current = 0;
      autoPausedRef.current = false;
      fadeInAndPlay(audio, state.volume ?? 0.8, AUTO_PAUSE_FADE_DURATION, savedTimeRef.current);
    } else {
      externalSinceRef.current = 0;
      silenceSinceRef.current = 0;
    }
  };

  useEffect(() => {
    let disposed = false;
    electron.getExternalAudioState().then((s) => {
      if (!disposed && s && s.playing) handleExternalAudio(true);
    }).catch(() => {});
    const cleanup = electron.onExternalAudioState((s) => {
      handleExternalAudio(!!s?.playing);
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (audioSourceType === "soundscape") {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        audio.pause();
      }
      soundscapeEngine.sync(soundChannels, Math.round(volume * 100), volume === 0, isMusicPlaying);
    } else {
      soundscapeEngine.stopAll();
    }
  }, [audioSourceType, soundChannels, volume, isMusicPlaying]);

  useEffect(() => {
    return () => {
      soundscapeEngine.stopAll();
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    if (audioSourceType === "soundscape") {
      if (!audio.paused) audio.pause();
      return;
    }
    if (isMusicPlaying) {
      const state = useDesktopStore.getState();
      if (state.autoPauseOnExternalAudio && externalActiveRef.current) {
        autoPausedRef.current = true;
        return;
      }
      autoPausedRef.current = false;
      audio.play().catch((err) => {
        console.warn("Audio play failed", err);
        setIsMusicPlaying(false);
      });
    } else {
      clearFade();
      clearAudioDelay();
      autoPausedRef.current = false;
      audio.pause();
    }
  }, [isMusicPlaying, setIsMusicPlaying, audioSourceType]);

  const togglePlay = () => {
    setIsMusicPlaying(!isMusicPlaying);
  };

  // React to the auto-pause setting being flipped mid-playback: enabling it
  // while external audio is active fades out immediately; disabling it while
  // auto-paused fades back in.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const state = useDesktopStore.getState();
    if (!state.isMusicPlaying) return;
    clearAudioDelay();
    if (autoPauseOnExternalAudio && externalActiveRef.current && !audio.paused && !autoPausedRef.current) {
      autoPausedRef.current = true;
      fadeOutThenPause(audio, AUTO_PAUSE_FADE_DURATION);
    } else if (!autoPauseOnExternalAudio && autoPausedRef.current) {
      autoPausedRef.current = false;
      fadeInAndPlay(audio, state.volume ?? 0.8, AUTO_PAUSE_FADE_DURATION, savedTimeRef.current);
    }
  }, [autoPauseOnExternalAudio]);

  const activeChannelsCount = soundChannels.filter((c) => c.enabled).length;

  return (
    <div className="fixed bottom-3 right-3 z-30 select-none">
      <audio
        ref={audioRef}
        src="./music1.mp3"
        loop
        onPlay={() => {
          if (audioSourceType === "lofi") setIsMusicPlaying(true);
        }}
        onPause={() => {
          if (audioSourceType === "lofi") {
            if (autoPauseArmedRef.current) {
              autoPauseArmedRef.current = false;
              return;
            }
            autoPausedRef.current = false;
            setIsMusicPlaying(false);
          }
        }}
      />

      {mediaPlayerOpen ? (
        <div className="w-84 max-h-[85vh] flex flex-col bg-card border border-border p-4 rounded-2xl shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {audioSourceType === "lofi" ? (
                <Music className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Waves className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold text-foreground">
                {audioSourceType === "lofi" ? "Lofi-Beats" : "Ambient Soundscape"}
              </span>
            </div>
            <button
              onClick={() => setMediaPlayerOpen(false)}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Source Selector Tabs */}
          <div className="flex bg-secondary p-1 rounded-xl border border-border text-xs font-medium">
            <button
              type="button"
              onClick={() => setAudioSourceType("lofi")}
              className={`flex-1 py-1 rounded-lg text-center transition-colors cursor-pointer ${
                audioSourceType === "lofi"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lo-Fi
            </button>
            <button
              type="button"
              onClick={() => setAudioSourceType("soundscape")}
              className={`flex-1 py-1 rounded-lg text-center transition-colors cursor-pointer ${
                audioSourceType === "soundscape"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ambient Mixer
            </button>
          </div>

          <div className="flex items-center justify-between bg-secondary p-3 rounded-xl border border-border shadow-inner">
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div 
                className={`w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0 ${
                  isMusicPlaying && audioSourceType === "lofi" ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '4s' }}
              >
                {audioSourceType === "lofi" ? (
                  <Disc className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Waves className={`w-4 h-4 ${isMusicPlaying ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {audioSourceType === "lofi"
                    ? "Lofi-Beats"
                    : activeChannelsCount > 0
                      ? `${activeChannelsCount} Active Channel${activeChannelsCount > 1 ? "s" : ""}`
                      : "Soundscape Mixer"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {audioSourceType === "lofi" ? "Local Audio Loop" : "Procedural Synthesis"}
                </p>
              </div>
            </div>
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
              title={isMusicPlaying ? "Pause Audio" : "Play Audio"}
            >
              {isMusicPlaying ? <Pause className="w-4 h-4 fill-primary-foreground" /> : <Play className="w-4 h-4 fill-primary-foreground ml-0.5" />}
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium px-1">
              <span>Master Volume</span>
              <span className="tabular-nums font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-2 px-1">
              {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 bg-muted rounded-lg accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Soundscape Mixer Controls */}
          {audioSourceType === "soundscape" && (
            <div className="pt-2 border-t border-border space-y-2.5 overflow-hidden flex flex-col">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
                  Presets
                </span>
                <div className="flex flex-wrap gap-1">
                  {SOUNDSCAPE_PRESETS.map((preset: SoundscapePreset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applySoundscapePreset(preset.channels)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
                  <span>Channels</span>
                  <span className="tabular-nums font-mono normal-case tracking-normal">
                    {activeChannelsCount} active
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5">
                  {soundChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className="p-1.5 rounded-lg bg-secondary/60 border border-border space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => toggleChannel(channel.id)}
                          className="flex items-center gap-1.5 text-foreground font-medium hover:text-primary transition-colors text-left cursor-pointer"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              channel.enabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                            }`}
                          />
                          <span className={!channel.enabled ? "text-muted-foreground" : ""}>
                            {channel.label}
                          </span>
                        </button>
                        <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                          {channel.enabled ? `${channel.volume}%` : "Off"}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={channel.enabled ? channel.volume : 0}
                        disabled={!channel.enabled}
                        onChange={(e) =>
                          setChannelVolume(channel.id, parseInt(e.target.value, 10))
                        }
                        className={`w-full h-1 bg-muted rounded-full appearance-none cursor-pointer accent-primary ${
                          !channel.enabled ? "opacity-30 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <button
          onClick={() => setMediaPlayerOpen(true)}
          className="p-3 rounded-2xl bg-card border border-border text-foreground hover:text-foreground shadow-xl transition-all flex items-center gap-2 hover:scale-105 cursor-pointer"
        >
          {audioSourceType === "lofi" ? (
            <Music className={`w-4 h-4 ${isMusicPlaying ? "text-foreground animate-pulse" : "text-muted-foreground"}`} />
          ) : (
            <Sliders className={`w-4 h-4 ${isMusicPlaying ? "text-foreground animate-pulse" : "text-muted-foreground"}`} />
          )}
          <span className="text-xs font-semibold">
            {audioSourceType === "lofi"
              ? "Lofi-Beats"
              : activeChannelsCount > 0
                ? `Ambient (${activeChannelsCount})`
                : "Ambient Mixer"}
          </span>
        </button>
      )}
    </div>
  );
};
