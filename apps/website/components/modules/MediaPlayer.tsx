"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
    Music,
    ChevronDown,
    Volume2,
    VolumeX,
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
        soundEnabled,
        musicEnabled,
        isMusicMuted,
        setIsMusicMuted,
    } = useAppStore(
        useShallow((s) => ({
            localUrl: s.localUrl,
            mediaPlayerOpen: s.mediaPlayerOpen,
            setMediaPlayerOpen: s.setMediaPlayerOpen,
            isMusicPlaying: s.isMusicPlaying,
            setIsMusicPlaying: s.setIsMusicPlaying,
            musicVolume: s.musicVolume,
            setMusicVolume: s.setMusicVolume,
            soundEnabled: s.soundEnabled ?? true,
            musicEnabled: s.musicEnabled ?? true,
            isMusicMuted: s.isMusicMuted,
            setIsMusicMuted: s.setIsMusicMuted,
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
        if (!soundEnabled || !musicEnabled) return;
        setIsMusicPlaying(!isMusicPlaying);
    }, [isMusicPlaying, setIsMusicPlaying, soundEnabled, musicEnabled]);

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
                        ? "bg-card border-border text-foreground shadow-xl ring-1 ring-border"
                        : "bg-card/90 hover:bg-accent border-border text-muted-foreground hover:text-foreground"
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
                <div className="fixed right-4 sm:absolute sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-2rem)] max-w-[320px] sm:w-80 bg-popover border border-border shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-foreground">
                            <Music className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold tracking-wide">
                                Lofi-Beats
                            </span>
                        </div>
                        <button
                            onClick={() => setMediaPlayerOpen(false)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Collapse"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Main Inner Player Card */}
                    <div className="bg-secondary border border-border rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                                "w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 transition-transform duration-500",
                                isMusicPlaying && "rotate-45"
                            )}>
                                <Disc className={cn("w-5 h-5 text-muted-foreground", isMusicPlaying && "text-primary animate-spin [animation-duration:6s]")} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-foreground truncate">
                                    Lofi-Beats
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                    {!soundEnabled
                                        ? "Sound disabled in Settings"
                                        : !musicEnabled
                                          ? "Music disabled in Settings"
                                          : "Lofi-Beats"}
                                </p>
                            </div>
                        </div>

                        {/* Large Circular Play/Pause Button */}
                        <button
                            onClick={togglePlay}
                            disabled={!soundEnabled || !musicEnabled}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all duration-200",
                                !soundEnabled || !musicEnabled
                                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                    : "bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 cursor-pointer"
                            )}
                            title={!soundEnabled ? "Sound is disabled in Settings" : !musicEnabled ? "Music is disabled in Settings" : isMusicPlaying ? "Pause music" : "Play music"}
                            aria-label={isMusicPlaying ? "Pause music" : "Play music"}
                        >
                            {isMusicPlaying ? (
                                <Pause className="w-5 h-5 fill-current text-primary-foreground" />
                            ) : (
                                <Play className="w-5 h-5 fill-current text-primary-foreground ml-0.5" />
                            )}
                        </button>
                    </div>

                    {/* Music Volume Control */}
                    <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-0.5">
                            <span>Music Volume</span>
                            <span>{isMusicMuted ? "Muted" : `${musicVolume}%`}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleMute}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1"
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
                                    step="1"
                                    value={isMusicMuted ? 0 : musicVolume}
                                    onChange={handleVolumeChange}
                                    className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
