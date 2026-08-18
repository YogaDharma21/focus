"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
    Music,
    ChevronDown,
    Volume2,
    Volume1,
    VolumeX,
    BellRing,
    Play,
    Pause,
    Disc,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MediaPlayer() {
    const {
        localUrl,
        mediaPlayerOpen,
        setMediaPlayerOpen,
        isMusicPlaying,
        setIsMusicPlaying,
        musicVolume,
        setMusicVolume,
        isMusicMuted,
        setIsMusicMuted,
        soundEffectVolume,
        setSoundEffectVolume,
        soundEffectEnabled,
        setSoundEffectEnabled,
    } = useAppStore(
        useShallow((s) => ({
            localUrl: s.localUrl,
            mediaPlayerOpen: s.mediaPlayerOpen,
            setMediaPlayerOpen: s.setMediaPlayerOpen,
            isMusicPlaying: s.isMusicPlaying,
            setIsMusicPlaying: s.setIsMusicPlaying,
            musicVolume: s.musicVolume,
            setMusicVolume: s.setMusicVolume,
            isMusicMuted: s.isMusicMuted,
            setIsMusicMuted: s.setIsMusicMuted,
            soundEffectVolume: s.soundEffectVolume,
            setSoundEffectVolume: s.setSoundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
            setSoundEffectEnabled: s.setSoundEffectEnabled,
        }))
    );

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Synchronize volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMusicMuted ? 0 : musicVolume / 100;
        }
    }, [musicVolume, isMusicMuted]);

    // Synchronize play state from store
    useEffect(() => {
        if (!audioRef.current) return;
        if (isMusicPlaying) {
            audioRef.current.play().catch((err) => {
                console.log("Audio play error:", err);
                setIsMusicPlaying(false);
            });
        } else {
            audioRef.current.pause();
        }
    }, [isMusicPlaying, setIsMusicPlaying]);

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
        setIsMusicPlaying(!isMusicPlaying);
    }, [isMusicPlaying, setIsMusicPlaying]);

    const toggleMute = () => {
        setIsMusicMuted(!isMusicMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setMusicVolume(val);
        if (val > 0 && isMusicMuted) {
            setIsMusicMuted(false);
        }
    };

    const handleSFXVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setSoundEffectVolume(val);
    };

    const playTestSoundEffect = () => {
        try {
            const audio = new Audio("/soundeffect.mp3");
            audio.volume = (soundEffectVolume ?? 80) / 100;
            audio.play().catch(() => {});
        } catch {
            // ignore
        }
    };

    return (
        <div ref={containerRef} className="relative inline-block text-left select-none">
            {/* Audio Element */}
            <audio
                ref={audioRef}
                src={localUrl || "/music1.mp3"}
                loop
                onPlay={() => setIsMusicPlaying(true)}
                onPause={() => setIsMusicPlaying(false)}
            />

            {/* Collapsed Pill (Top Floating Button) */}
            <button
                onClick={() => setMediaPlayerOpen(!mediaPlayerOpen)}
                className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl transition-all duration-300 shadow-md border group",
                    mediaPlayerOpen
                        ? "bg-[#18181b] border-white/20 text-white shadow-xl ring-1 ring-white/10"
                        : "bg-[#141416]/90 hover:bg-[#1c1c1f] border-white/10 text-white/90 hover:text-white"
                )}
                aria-label="Toggle ambient music player"
            >
                <Music className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isMusicPlaying && "text-primary animate-pulse")} />
                <span className="font-semibold text-xs sm:text-sm tracking-wide">
                    Lofi-Beats
                </span>
                {isMusicPlaying && (
                    <span className="flex items-center gap-0.5 h-3 ml-0.5">
                        <span className="w-0.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-0.5 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-0.5 h-2 bg-primary rounded-full animate-bounce" />
                    </span>
                )}
            </button>

            {/* Expanded Floating Card Popup */}
            {mediaPlayerOpen && (
                <div className="fixed right-4 sm:absolute sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-2rem)] max-w-[320px] sm:w-80 bg-[#121214]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Music className="w-4 h-4 text-white/90" />
                            <span className="text-sm font-semibold tracking-wide">
                                Lofi-Beats
                            </span>
                        </div>
                        <button
                            onClick={() => setMediaPlayerOpen(false)}
                            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                            title="Collapse"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Main Inner Player Card */}
                    <div className="bg-[#09090b] border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                                "w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 transition-transform duration-500",
                                isMusicPlaying && "rotate-45"
                            )}>
                                <Disc className={cn("w-5 h-5 text-white/80", isMusicPlaying && "text-primary animate-spin [animation-duration:6s]")} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">
                                    Lofi-Beats
                                </h4>
                                <p className="text-xs text-white/50 truncate">
                                    Lofi-Beats
                                </p>
                            </div>
                        </div>

                        {/* Large Circular Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-white hover:bg-white/90 text-black active:scale-95 transition-all duration-200 flex items-center justify-center shrink-0 shadow-lg"
                            aria-label={isMusicPlaying ? "Pause music" : "Play music"}
                        >
                            {isMusicPlaying ? (
                                <Pause className="w-5 h-5 fill-current text-black" />
                            ) : (
                                <Play className="w-5 h-5 fill-current text-black ml-0.5" />
                            )}
                        </button>
                    </div>

                    {/* Music Volume Control */}
                    <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-white/60 font-medium px-0.5">
                            <span>Music Volume</span>
                            <span>{isMusicMuted ? "Muted" : `${musicVolume}%`}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleMute}
                                className="text-white/70 hover:text-white transition-colors p-1"
                                aria-label={isMusicMuted ? "Unmute" : "Mute"}
                            >
                                {isMusicMuted || musicVolume === 0 ? (
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
                                    value={isMusicMuted ? 0 : musicVolume}
                                    onChange={handleVolumeChange}
                                    className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
