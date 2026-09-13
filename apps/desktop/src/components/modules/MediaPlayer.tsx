import React, { useRef, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, BellRing, ChevronDown, Disc, Volume1 } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
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
    setVolume
  } = useDesktopStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn("Audio play failed", err);
        setIsMusicPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isMusicPlaying, setIsMusicPlaying]);

  const togglePlay = () => {
    setIsMusicPlaying(!isMusicPlaying);
  };

  return (
    <div className="fixed bottom-3 right-3 z-30 select-none">
      <audio
        ref={audioRef}
        src="./music1.mp3"
        loop
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
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
