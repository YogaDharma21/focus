import React, { useRef, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, Youtube, Radio, BellRing, ChevronUp, ChevronDown } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';

export const MediaPlayer: React.FC = () => {
  const {
    mediaType,
    setMediaType,
    localPlaylist,
    localUrl,
    setMediaUrl,
    youtubeUrl,
    spotifyUrl,
    mediaPlayerOpen,
    setMediaPlayerOpen,
    soundEffectEnabled,
    setSoundEffectEnabled,
    volume,
    setVolume
  } = useDesktopStore();

  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.warn(err));
    }
  };

  return (
    <div className="fixed bottom-3 right-3 z-30 select-none">
      {/* Hidden HTML audio element for local lo-fi track */}
      <audio
        ref={audioRef}
        src={localUrl}
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {mediaPlayerOpen ? (
        <div className="w-80 glass-panel p-3.5 rounded-2xl border border-white/10 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-200">Ambient Music Player</span>
            </div>
            <button
              onClick={() => setMediaPlayerOpen(false)}
              className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Media Type Tabs */}
          <div className="flex bg-zinc-900/80 p-0.5 rounded-xl border border-white/10 text-[10px] font-semibold">
            <button
              onClick={() => setMediaType("LOCAL")}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mediaType === "LOCAL" ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Lo-Fi Radio
            </button>
            <button
              onClick={() => setMediaType("YOUTUBE")}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mediaType === "YOUTUBE" ? "bg-rose-500/20 text-rose-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              YouTube
            </button>
            <button
              onClick={() => setMediaType("SPOTIFY")}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                mediaType === "SPOTIFY" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Spotify
            </button>
          </div>

          {/* Player Contents */}
          {mediaType === "LOCAL" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-zinc-900/60 p-2 rounded-xl border border-white/5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-200 truncate">Chill Ambient Stream</p>
                  <p className="text-[10px] text-zinc-500">Focus Radio</p>
                </div>
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-cyan-500 text-zinc-950 hover:bg-cyan-400 transition-colors shadow-md shadow-cyan-500/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />}
                </button>
              </div>

              {/* Volume Slider & Bell Sound Toggle */}
              <div className="flex items-center justify-between gap-3 px-1 pt-1">
                <div className="flex items-center gap-2 flex-1">
                  {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg accent-cyan-400 cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => setSoundEffectEnabled(!soundEffectEnabled)}
                  title={soundEffectEnabled ? "Completion Chime Enabled" : "Completion Chime Muted"}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    soundEffectEnabled ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  <BellRing className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {mediaType === "YOUTUBE" && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Paste YouTube Video URL..."
                value={youtubeUrl}
                onChange={(e) => setMediaUrl("YOUTUBE", e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
              />
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/5">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeUrl.split('v=')[1]?.split('&')[0] || 'DEWzT1geuPU'}`}
                  className="w-full h-full"
                  allow="autoplay"
                />
              </div>
            </div>
          )}

          {mediaType === "SPOTIFY" && (
            <div className="space-y-2">
              <iframe
                src="https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS"
                width="100%"
                height="152"
                frameBorder="0"
                allow="encrypted-media"
                className="rounded-xl"
              />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setMediaPlayerOpen(true)}
          className="p-3 rounded-2xl glass-panel border border-white/10 text-cyan-400 hover:text-white shadow-xl transition-all flex items-center gap-2 hover:scale-105"
        >
          <Music className="w-5 h-5" />
          <span className="text-xs font-semibold">Music</span>
        </button>
      )}
    </div>
  );
};
