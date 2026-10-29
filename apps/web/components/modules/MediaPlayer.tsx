"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
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
    Waves,
    Radio,
    Plus,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { noiseEngine, type NoiseColor } from "@/lib/audio/noise";
import type { AudioMode, NoiseColorType } from "@focus/types";

export function MediaPlayer() {
    const {
        audioMode,
        setAudioMode,
        noiseColor,
        setNoiseColor,
        stations,
        activeStationId,
        setActiveStationId,
        addCustomStation,
        removeCustomStation,
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
            audioMode: s.audioMode || "stream",
            setAudioMode: s.setAudioMode,
            noiseColor: s.noiseColor || "brown",
            setNoiseColor: s.setNoiseColor,
            stations: s.stations || [],
            activeStationId: s.activeStationId || "station-lofi-beats",
            setActiveStationId: s.setActiveStationId,
            addCustomStation: s.addCustomStation,
            removeCustomStation: s.removeCustomStation,
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
    const [isAddingStation, setIsAddingStation] = useState(false);
    const [customName, setCustomName] = useState("");
    const [customUrl, setCustomUrl] = useState("");
    const [streamError, setStreamError] = useState(false);

    const activeStation =
        stations.find((s) => s.id === activeStationId) || stations[0];
    const streamSrc = activeStation?.url || localUrl || "/music1.mp3";

    const currentTitle =
        audioMode === "noise"
            ? `${noiseColor.charAt(0).toUpperCase() + noiseColor.slice(1)} Noise`
            : activeStation?.name || "Lofi Focus";

    // Synchronize volume to both audio element and Web Audio noise engine
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMusicMuted ? 0 : musicVolume / 100;
        }
        noiseEngine.setVolume(musicVolume, isMusicMuted);
    }, [musicVolume, isMusicMuted]);

    // Handle play / pause synchronization across modes
    useEffect(() => {
        if (!soundEnabled || !musicEnabled) {
            if (audioRef.current) audioRef.current.pause();
            noiseEngine.stop();
            return;
        }

        if (isMusicPlaying) {
            if (audioMode === "noise") {
                if (audioRef.current) audioRef.current.pause();
                noiseEngine.play(noiseColor as NoiseColor);
            } else {
                noiseEngine.stop();
                if (audioRef.current) {
                    audioRef.current.play().catch((err) => {
                        console.log("Audio stream playback failed:", err);
                        setStreamError(true);
                        setIsMusicPlaying(false);
                    });
                }
            }
        } else {
            if (audioRef.current) audioRef.current.pause();
            noiseEngine.stop();
        }
    }, [isMusicPlaying, audioMode, noiseColor, soundEnabled, musicEnabled, setIsMusicPlaying]);

    // Cleanup noise engine on unmount
    useEffect(() => {
        return () => {
            noiseEngine.stop();
        };
    }, []);

    // Handle outside clicks to close popup
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
        setStreamError(false);
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

    const handleSelectMode = (mode: AudioMode) => {
        setStreamError(false);
        setAudioMode(mode);
        if (isMusicPlaying) {
            if (mode === "noise") {
                if (audioRef.current) audioRef.current.pause();
                noiseEngine.play(noiseColor as NoiseColor);
            } else {
                noiseEngine.stop();
                if (audioRef.current) {
                    audioRef.current.play().catch(() => {
                        setStreamError(true);
                        setIsMusicPlaying(false);
                    });
                }
            }
        }
    };

    const handleSelectNoise = (color: NoiseColorType) => {
        setNoiseColor(color);
        if (audioMode === "noise" && isMusicPlaying) {
            noiseEngine.play(color as NoiseColor);
        }
    };

    const handleSelectStation = (id: string) => {
        setStreamError(false);
        setActiveStationId(id);
        if (audioMode === "stream" && isMusicPlaying) {
            const st = stations.find((s) => s.id === id);
            if (audioRef.current && st) {
                audioRef.current.src = st.url;
                audioRef.current.play().catch(() => {
                    setStreamError(true);
                    setIsMusicPlaying(false);
                });
            }
        }
    };

    const handleAddStationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customName.trim() || !customUrl.trim()) return;
        addCustomStation(customName, customUrl);
        setCustomName("");
        setCustomUrl("");
        setIsAddingStation(false);
        setStreamError(false);
        if (audioMode === "stream" && isMusicPlaying && audioRef.current) {
            audioRef.current.src = customUrl.trim();
            audioRef.current.play().catch(() => {
                setStreamError(true);
                setIsMusicPlaying(false);
            });
        }
    };

    return (
        <div ref={containerRef} className="relative inline-block text-left select-none">
            {/* Audio Stream Element */}
            <audio
                ref={audioRef}
                src={streamSrc}
                loop
                preload="none"
                onPlay={() => {
                    setStreamError(false);
                    if (audioMode === "stream") setIsMusicPlaying(true);
                }}
                onPause={() => {
                    if (audioMode === "stream" && isMusicPlaying) {
                        setIsMusicPlaying(false);
                    }
                }}
                onError={() => {
                    if (audioMode === "stream") {
                        setStreamError(true);
                        setIsMusicPlaying(false);
                    }
                }}
            />

            {/* Collapsed Pill Button */}
            <button
                onClick={() => setMediaPlayerOpen(!mediaPlayerOpen)}
                className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl transition-all duration-300 shadow-md border group cursor-pointer",
                    mediaPlayerOpen
                        ? "bg-card border-border text-foreground shadow-xl ring-1 ring-border"
                        : "bg-card/90 hover:bg-accent border-border text-muted-foreground hover:text-foreground"
                )}
                aria-label="Toggle audio player"
            >
                {audioMode === "noise" ? (
                    <Waves className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isMusicPlaying && "text-primary animate-pulse")} />
                ) : (
                    <Music className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isMusicPlaying && "text-primary animate-pulse")} />
                )}
                <span className="font-semibold text-xs sm:text-sm tracking-wide max-w-[130px] truncate">
                    {currentTitle}
                </span>
                {isMusicPlaying && (
                    <span className="flex items-center gap-0.5 h-3 ml-0.5">
                        <span className="w-0.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-0.5 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-0.5 h-2 bg-primary rounded-full animate-bounce" />
                    </span>
                )}
            </button>

            {/* Expanded Card Popup */}
            {mediaPlayerOpen && (
                <div className="fixed right-4 sm:absolute sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-2rem)] max-w-[340px] sm:w-[340px] bg-card border border-border shadow-2xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-foreground">
                            {audioMode === "noise" ? (
                                <Waves className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <Radio className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-sm font-semibold tracking-wide truncate max-w-[200px]">
                                {currentTitle}
                            </span>
                        </div>
                        <button
                            onClick={() => setMediaPlayerOpen(false)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                            title="Collapse"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Mode Segmented Controls */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-surface-inset rounded-xl border border-border/40">
                        <button
                            type="button"
                            onClick={() => handleSelectMode("stream")}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer",
                                audioMode === "stream"
                                    ? "bg-card text-foreground shadow-sm border border-border/60"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Radio className="w-3.5 h-3.5" />
                            Streams
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSelectMode("noise")}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer",
                                audioMode === "noise"
                                    ? "bg-card text-foreground shadow-sm border border-border/60"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Waves className="w-3.5 h-3.5" />
                            Noise
                        </button>
                    </div>

                    {/* Main Inner Player Card */}
                    <div className="bg-secondary border border-border rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                                "w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 transition-transform duration-500",
                                isMusicPlaying && "rotate-45"
                            )}>
                                {audioMode === "noise" ? (
                                    <Waves className={cn("w-5 h-5 text-muted-foreground", isMusicPlaying && "text-primary animate-pulse")} />
                                ) : (
                                    <Disc className={cn("w-5 h-5 text-muted-foreground", isMusicPlaying && "text-primary animate-spin [animation-duration:6s]")} />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-foreground truncate">
                                    {currentTitle}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                    {streamError
                                        ? "Stream unavailable"
                                        : !soundEnabled
                                        ? "Sound disabled in Settings"
                                        : !musicEnabled
                                        ? "Audio disabled in Settings"
                                        : audioMode === "noise"
                                        ? "Web Audio Synthesizer"
                                        : activeStation?.genre || "Live Stream"}
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
                            title={!soundEnabled ? "Sound disabled in Settings" : !musicEnabled ? "Audio disabled in Settings" : isMusicPlaying ? "Pause audio" : "Play audio"}
                            aria-label={isMusicPlaying ? "Pause audio" : "Play audio"}
                        >
                            {isMusicPlaying ? (
                                <Pause className="w-5 h-5 fill-current text-primary-foreground" />
                            ) : (
                                <Play className="w-5 h-5 fill-current text-primary-foreground ml-0.5" />
                            )}
                        </button>
                    </div>

                    {/* Mode Content: Noise Generator Selector */}
                    {audioMode === "noise" && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                                Noise Color
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                                {(
                                    [
                                        { id: "brown", label: "Brown", desc: "Deep" },
                                        { id: "pink", label: "Pink", desc: "Balanced" },
                                        { id: "white", label: "White", desc: "Crisp" },
                                    ] as const
                                ).map((item) => {
                                    const isSelected = noiseColor === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleSelectNoise(item.id)}
                                            className={cn(
                                                "p-2 rounded-xl text-left border transition-all cursor-pointer",
                                                isSelected
                                                    ? "bg-surface-inset border-primary/50 text-foreground shadow-sm"
                                                    : "bg-secondary/40 border-border/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            )}
                                        >
                                            <div className="text-xs font-semibold">{item.label}</div>
                                            <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Mode Content: Stream Station Selector & External Playlist */}
                    {audioMode === "stream" && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Radio Feeds & Playlists
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingStation(!isAddingStation)}
                                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" />
                                    {isAddingStation ? "Cancel" : "Add Stream"}
                                </button>
                            </div>

                            {/* Add Custom Stream Form */}
                            {isAddingStation && (
                                <form onSubmit={handleAddStationSubmit} className="p-2.5 bg-surface-inset border border-border/60 rounded-xl space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Station Name (e.g. Chillhop Radio)"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                    <input
                                        type="url"
                                        placeholder="Stream URL (e.g. https://...)"
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                        className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
                                    >
                                        Save Stream
                                    </button>
                                </form>
                            )}

                            {/* Stations List */}
                            <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
                                {stations.map((st) => {
                                    const isSelected = activeStation?.id === st.id;
                                    return (
                                        <div
                                            key={st.id}
                                            className={cn(
                                                "w-full flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs transition-all",
                                                isSelected
                                                    ? "bg-surface-inset border-primary/50 text-foreground"
                                                    : "bg-secondary/30 border-border/30 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleSelectStation(st.id)}
                                                className="flex-1 text-left min-w-0 pr-2 cursor-pointer"
                                            >
                                                <div className="font-medium truncate">{st.name}</div>
                                                {st.genre && (
                                                    <div className="text-[10px] text-muted-foreground truncate">
                                                        {st.genre}
                                                    </div>
                                                )}
                                            </button>
                                            {st.isCustom && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeCustomStation(st.id)}
                                                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-card transition-colors cursor-pointer"
                                                    title="Remove station"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Master Volume Control */}
                    <div className="space-y-1 pt-1 border-t border-border/40">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-0.5">
                            <span>Volume</span>
                            <span className="tabular-nums font-mono">{isMusicMuted ? "Muted" : `${musicVolume}%`}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleMute}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
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
