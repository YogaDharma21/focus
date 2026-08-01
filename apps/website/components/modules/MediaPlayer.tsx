"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import {
    Music,
    ChevronDown,
    Volume2,
    VolumeX,
    Play,
    Pause,
    Disc,
    Bell,
    ListMusic,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AMBIENT_TRACKS = [
    {
        id: "local-1",
        title: "Lo-Fi",
        artist: "Focus Ambient Music",
        url: "/music1.mp3",
    },
    {
        id: "ambient-rain",
        title: "Rain & Nature",
        artist: "Deep Focus Sounds",
        url: "/music1.mp3",
    },
    {
        id: "ambient-deep",
        title: "Deep Waves",
        artist: "Calm Atmosphere",
        url: "/music1.mp3",
    },
];

export function MediaPlayer() {
    const {
        localUrl,
        setMediaUrl,
        mediaPlayerOpen,
        setMediaPlayerOpen,
    } = useAppStore();

    const [isPlaying, setIsPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(60);
    const [showTrackList, setShowTrackList] = useState(false);
    const [bellActive, setBellActive] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const bellAudioRef = useRef<HTMLAudioElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const currentTrack = AMBIENT_TRACKS.find((t) => t.url === localUrl) || AMBIENT_TRACKS[0];

    // Synchronize volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = muted ? 0 : volume / 100;
        }
    }, [volume, muted]);

    // Handle outside clicks to close expanded popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setMediaPlayerOpen(false);
            }
        };

        if (mediaPlayerOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [mediaPlayerOpen, setMediaPlayerOpen]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch((err) => {
                console.log("Audio play error:", err);
            });
        }
    }, [isPlaying]);

    const toggleMute = () => {
        setMuted(!muted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setVolume(val);
        if (val > 0 && muted) {
            setMuted(false);
        }
    };

    const selectTrack = (url: string) => {
        setMediaUrl(url);
        setShowTrackList(false);
        if (audioRef.current) {
            audioRef.current.src = url;
            if (isPlaying) {
                audioRef.current.play().catch(() => {});
            }
        }
    };

    const triggerBell = () => {
        setBellActive(true);
        if (bellAudioRef.current) {
            bellAudioRef.current.currentTime = 0;
            bellAudioRef.current.play().catch(() => {});
        }
        setTimeout(() => setBellActive(false), 800);
    };

    return (
        <div ref={containerRef} className="relative inline-block text-left select-none">
            {/* Audio Elements */}
            <audio
                ref={audioRef}
                src={currentTrack.url}
                loop
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            <audio ref={bellAudioRef} src="/soundeffect.mp3" preload="auto" />

            {/* Collapsed Pill (Top Floating Button) */}
            <button
                onClick={() => setMediaPlayerOpen(!mediaPlayerOpen)}
                className={cn(
                    "flex items-center gap-2.5 px-4 py-2 rounded-2xl transition-all duration-300 shadow-md border group",
                    mediaPlayerOpen
                        ? "bg-[#18181b] border-white/20 text-white shadow-xl ring-1 ring-white/10"
                        : "bg-[#141416]/90 hover:bg-[#1c1c1f] border-white/10 text-white/90 hover:text-white"
                )}
                aria-label="Toggle ambient music player"
            >
                <Music className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isPlaying && "text-primary animate-pulse")} />
                <span className="font-semibold text-sm tracking-wide">
                    {currentTrack.title}
                </span>
                {isPlaying && (
                    <span className="flex items-center gap-0.5 h-3 ml-0.5">
                        <span className="w-1 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-3.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-2 bg-primary rounded-full animate-bounce" />
                    </span>
                )}
            </button>

            {/* Expanded Floating Card Popup */}
            {mediaPlayerOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#121214]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Music className="w-4 h-4 text-white/90" />
                            <span className="text-sm font-semibold tracking-wide">
                                Ambient Music
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowTrackList(!showTrackList)}
                                className={cn(
                                    "p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors",
                                    showTrackList && "bg-white/15 text-white"
                                )}
                                title="Change Track"
                            >
                                <ListMusic className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setMediaPlayerOpen(false)}
                                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                title="Collapse"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Track Selection Drawer */}
                    {showTrackList && (
                        <div className="bg-[#0a0a0c] border border-white/10 rounded-xl p-2 space-y-1 animate-in fade-in duration-150">
                            {AMBIENT_TRACKS.map((track) => (
                                <button
                                    key={track.id}
                                    onClick={() => selectTrack(track.url)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                                        track.url === currentTrack.url
                                            ? "bg-white/15 text-white"
                                            : "text-white/70 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <span>{track.title}</span>
                                    {track.url === currentTrack.url && (
                                        <Check className="w-3.5 h-3.5 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Inner Player Card */}
                    <div className="bg-[#09090b] border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                                "w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 transition-transform duration-500",
                                isPlaying && "rotate-45"
                            )}>
                                <Disc className={cn("w-6 h-6 text-white/80", isPlaying && "text-primary animate-spin [animation-duration:6s]")} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">
                                    {currentTrack.title}
                                </h4>
                                <p className="text-xs text-white/50 truncate">
                                    {currentTrack.artist}
                                </p>
                            </div>
                        </div>

                        {/* Large Circular Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            className="w-11 h-11 rounded-full bg-white hover:bg-white/90 text-black active:scale-95 transition-all duration-200 flex items-center justify-center shrink-0 shadow-lg"
                            aria-label={isPlaying ? "Pause music" : "Play music"}
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 fill-current text-black" />
                            ) : (
                                <Play className="w-5 h-5 fill-current text-black ml-0.5" />
                            )}
                        </button>
                    </div>

                    {/* Bottom Controls Row: Volume & Sound Effect Bell */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={toggleMute}
                            className="text-white/70 hover:text-white transition-colors"
                            aria-label={muted ? "Unmute" : "Mute"}
                        >
                            {muted || volume === 0 ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>

                        <div className="flex-1 flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={muted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                            />
                        </div>

                        <button
                            onClick={triggerBell}
                            className={cn(
                                "w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90",
                                bellActive && "bg-white/20 text-white scale-110"
                            )}
                            title="Play Ambient Chime"
                        >
                            <Bell className={cn("w-4 h-4", bellActive && "animate-bounce")} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
