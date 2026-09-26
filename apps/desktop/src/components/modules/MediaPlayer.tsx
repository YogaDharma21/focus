import React, { useRef, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, BellRing, ChevronDown, Disc, Volume1 } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import { playTestCompletionSound } from '../../lib/sound';

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
    autoPauseOnExternalAudio
  } = useDesktopStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPausedRef = useRef(false);
  const autoPauseArmedRef = useRef(false);
  const externalActiveRef = useRef(false);
  const savedTimeRef = useRef(0);

  const clearFade = () => {
    if (fadeIntervalRef.current !== null) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  useEffect(() => () => clearFade(), []);

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

  const handleExternalAudio = (playing: boolean) => {
    externalActiveRef.current = playing;
    const audio = audioRef.current;
    if (!audio) return;
    const state = useDesktopStore.getState();
    if (!state.autoPauseOnExternalAudio) {
      if (!playing && autoPausedRef.current && state.isMusicPlaying) {
        autoPausedRef.current = false;
        fadeInAndPlay(audio, state.volume ?? 0.8, state.autoPauseFadeDuration ?? 2, savedTimeRef.current);
      }
      return;
    }
    const fadeDuration = state.autoPauseFadeDuration ?? 2;
    if (playing) {
      if (state.isMusicPlaying && !audio.paused && !autoPausedRef.current) {
        autoPausedRef.current = true;
        fadeOutThenPause(audio, fadeDuration);
      }
    } else if (autoPausedRef.current && state.isMusicPlaying) {
      autoPausedRef.current = false;
      fadeInAndPlay(audio, state.volume ?? 0.8, fadeDuration, savedTimeRef.current);
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
    if (!audioRef.current) return;
    const audio = audioRef.current;
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
      autoPausedRef.current = false;
      audio.pause();
    }
  }, [isMusicPlaying, setIsMusicPlaying]);

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
    if (autoPauseOnExternalAudio && externalActiveRef.current && !audio.paused && !autoPausedRef.current) {
      autoPausedRef.current = true;
      fadeOutThenPause(audio, state.autoPauseFadeDuration ?? 2);
    } else if (!autoPauseOnExternalAudio && autoPausedRef.current) {
      autoPausedRef.current = false;
      fadeInAndPlay(audio, state.volume ?? 0.8, state.autoPauseFadeDuration ?? 2, savedTimeRef.current);
    }
  }, [autoPauseOnExternalAudio]);

  return (
    <div className="fixed bottom-3 right-3 z-30 select-none">
      <audio
        ref={audioRef}
        src="./music1.mp3"
        loop
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => {
          if (autoPauseArmedRef.current) {
            autoPauseArmedRef.current = false;
            return;
          }
          autoPausedRef.current = false;
          setIsMusicPlaying(false);
        }}
      />

      {mediaPlayerOpen ? (
        <div className="w-80 bg-card border border-border p-4 rounded-2xl shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Lofi-Beats</span>
            </div>
            <button
              onClick={() => setMediaPlayerOpen(false)}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between bg-secondary p-3 rounded-xl border border-border shadow-inner">
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div 
                className={`w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0 ${
                  isMusicPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '4s' }}
              >
                <Disc className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">Lofi-Beats</p>
                <p className="text-[10px] text-muted-foreground truncate">Lofi-Beats</p>
              </div>
            </div>
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95 shrink-0"
              title={isMusicPlaying ? "Pause Music" : "Play Music"}
            >
              {isMusicPlaying ? <Pause className="w-4 h-4 fill-primary-foreground" /> : <Play className="w-4 h-4 fill-primary-foreground ml-0.5" />}
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium px-1">
              <span>Music Volume</span>
              <span>{Math.round(volume * 100)}%</span>
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

        </div>
      ) : (
        <button
          onClick={() => setMediaPlayerOpen(true)}
          className="p-3 rounded-2xl bg-card border border-border text-foreground hover:text-foreground shadow-xl transition-all flex items-center gap-2 hover:scale-105"
        >
          <Music className={`w-4 h-4 ${isMusicPlaying ? "text-emerald-400 animate-pulse" : "text-muted-foreground"}`} />
          <span className="text-xs font-semibold">Lofi-Beats</span>
        </button>
      )}
    </div>
  );
};
