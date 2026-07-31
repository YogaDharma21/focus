import React, { useRef, useEffect, useState } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, BellRing, ChevronDown, Radio } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';

const PRESET_STREAMS = [
  { id: 'lofi', name: 'Chill Lo-Fi Beats', description: 'Lo-Fi Chill Radio Stream', url: 'https://stream.zeno.fm/f3vkgy14208uv' },
  { id: 'piano', name: 'Piano & Study', description: 'Relaxing Instrumental Piano', url: 'https://stream.zeno.fm/2v280u14208uv' },
  { id: 'nature', name: 'Rain & Deep Ambient', description: 'Calming Nature Soundscape', url: 'https://stream.zeno.fm/0r0xa792kwzuv' }
];

export const MediaPlayer: React.FC = () => {
  const {
    localUrl,
    setMediaUrl,
    mediaPlayerOpen,
    setMediaPlayerOpen,
    soundEffectEnabled,
    setSoundEffectEnabled,
    volume,
    setVolume
  } = useDesktopStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStream, setSelectedStream] = useState(PRESET_STREAMS[0]);
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

  const handleSelectStream = (stream: typeof PRESET_STREAMS[0]) => {
    setSelectedStream(stream);
    setMediaUrl("LOCAL", stream.url);
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.warn(err));
        }
      }, 100);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 z-30 select-none">
      <audio
        ref={audioRef}
        src={localUrl || selectedStream.url}
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {mediaPlayerOpen ? (
        <div className="w-80 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-zinc-300" />
              <span className="text-xs font-semibold text-zinc-200">Ambient Music Player</span>
            </div>
            <button
              onClick={() => setMediaPlayerOpen(false)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Currently Playing Card */}
          <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800 shadow-inner">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs font-semibold text-zinc-100 truncate">{selectedStream.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{selectedStream.description}</p>
            </div>
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all shadow-md active:scale-95 shrink-0"
              title={isPlaying ? "Pause Music" : "Play Music"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />}
            </button>
          </div>

          {/* Preset Audio Streams */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block px-1">Audio Channels</span>
            <div className="space-y-1">
              {PRESET_STREAMS.map((stream) => (
                <button
                  key={stream.id}
                  onClick={() => handleSelectStream(stream)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors border ${
                    selectedStream.id === stream.id
                      ? "bg-zinc-800 border-zinc-700 text-zinc-100 font-medium"
                      : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Radio className={`w-3.5 h-3.5 ${selectedStream.id === stream.id ? "text-zinc-100" : "text-zinc-500"}`} />
                    <span className="truncate">{stream.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Volume & Completion Chime Controls */}
          <div className="flex items-center justify-between gap-3 px-1 pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-2 flex-1">
              {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-zinc-400" />}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg accent-zinc-100 cursor-pointer"
              />
            </div>

            <button
              onClick={() => setSoundEffectEnabled(!soundEffectEnabled)}
              title={soundEffectEnabled ? "Completion Chime Enabled" : "Completion Chime Muted"}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                soundEffectEnabled ? "bg-zinc-800 text-zinc-100 border border-zinc-700" : "bg-zinc-950 text-zinc-500 border border-zinc-800"
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setMediaPlayerOpen(true)}
          className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white shadow-xl transition-all flex items-center gap-2 hover:scale-105"
        >
          <Music className="w-5 h-5 text-zinc-300" />
          <span className="text-xs font-semibold">Music</span>
        </button>
      )}
    </div>
  );
};
