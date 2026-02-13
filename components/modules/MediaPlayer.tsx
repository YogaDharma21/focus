"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Youtube,
    Link as LinkIcon,
    ChevronDown,
    Trash2,
    Volume2,
    VolumeX,
    Play,
    Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export function MediaPlayer() {
    const {
        youtubeUrl,
        youtubePlaylist,
        setMediaUrl,
        addToPlaylist,
        removeFromPlaylist,
        mediaPlayerOpen,
        setMediaPlayerOpen,
    } = useAppStore();
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [inputUrl, setInputUrl] = useState("");
    const [volume, setVolume] = useState(50);
    const [muted, setMuted] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [ytApiReady, setYtApiReady] = useState(false);
    const playerRef = useRef<any>(null);
    const initialized = useRef(false);
    const unmutedOnce = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const userPaused = useRef(false);

    const extractId = (url: string) => {
        return url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
    };

    const handleUpdateUrl = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputUrl) {
            addToPlaylist(inputUrl);
            setInputUrl("");
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (!window.YT) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag =
                    document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
                window.onYouTubeIframeAPIReady = () => setYtApiReady(true);
            } else {
                setYtApiReady(true);
            }
        }
    }, []);

    const [containerReady, setContainerReady] = useState(false);

    useEffect(() => {
        if (ytApiReady && !initialized.current) {
            const checkContainer = setInterval(() => {
                const container = document.getElementById(
                    "youtube-player-container",
                );
                if (container) {
                    clearInterval(checkContainer);
                    setContainerReady(true);
                }
            }, 100);
            return () => clearInterval(checkContainer);
        }
    }, [ytApiReady]);

    useEffect(() => {
        if (ytApiReady && youtubeUrl && containerReady) {
            const videoId = extractId(youtubeUrl);

            const container = document.getElementById(
                "youtube-player-container",
            );
            if (!container) return;

            if (!initialized.current) {
                initialized.current = true;
                playerRef.current = new window.YT.Player(
                    "youtube-player-container",
                    {
                        height: "100%",
                        width: "100%",
                        videoId: videoId,
                        playerVars: {
                            autoplay: 0,
                            controls: 1,
                            modestbranding: 1,
                            rel: 0,
                            playsinline: 1,
                            origin: window.location.origin,
                        },
                        events: {
                            onReady: () => {
                                setPlayerReady(true);
                                if (playerRef.current) {
                                    setMuted(false);
                                    setVolume(50);
                                    playerRef.current.setVolume(50);
                                    setIsPlaying(false);
                                }
                            },
                            onStateChange: (e: any) => {
                                const YTP = window.YT?.PlayerState;
                                if (typeof YTP !== "undefined") {
                                    if (e?.data === YTP.PLAYING)
                                        setIsPlaying(true);
                                    if (
                                        e?.data === YTP.PAUSED ||
                                        e?.data === YTP.ENDED
                                    )
                                        setIsPlaying(false);
                                }
                            },
                        },
                    },
                );
            } else if (playerRef.current && playerRef.current.loadVideoById) {
                unmutedOnce.current = false;
                playerRef.current.loadVideoById(videoId);
            }
        }
    }, [ytApiReady, youtubeUrl, containerReady]);

    const handleVolumeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newVolume = parseInt(e.target.value);
            setVolume(newVolume);
            if (playerRef.current && playerReady) {
                if (newVolume > 0 && muted) {
                    playerRef.current.unMute();
                    setMuted(false);
                }
                playerRef.current.setVolume(newVolume);
            }
        },
        [muted, playerReady],
    );

    const toggleMute = useCallback(() => {
        if (!playerRef.current || !playerReady) return;
        if (muted) {
            playerRef.current.unMute();
            const targetVolume = volume === 0 ? 50 : volume;
            playerRef.current.setVolume(targetVolume);
            if (volume === 0) setVolume(50);
            playerRef.current.playVideo();
            setMuted(false);
        } else {
            playerRef.current.mute();
            setMuted(true);
        }
    }, [muted, playerReady, volume]);

    return (
        <div
            className={cn(
                "fixed z-[100]",
                mediaPlayerOpen
                    ? "bottom-6 right-6 w-80"
                    : "opacity-0 invisible pointer-events-none w-0 h-0",
            )}
        >
            <div
                className={cn(
                    "bg-card/90 backdrop-blur-2xl border border-border/20 shadow-2xl overflow-hidden flex flex-col relative",
                    mediaPlayerOpen
                        ? "rounded-none p-4 gap-3"
                        : "rounded-none items-center justify-center w-full h-full",
                )}
            >
                {mediaPlayerOpen && (
                    <div className="flex items-center justify-between shrink-0 w-full">
                        <div className="flex items-center gap-2">
                            <Youtube className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium">
                                Focus Player
                            </span>
                        </div>
                        <button
                            onClick={() => setMediaPlayerOpen(false)}
                            className="w-8 h-8 rounded-none bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                )}

                {mediaPlayerOpen && (
                    <form
                        onSubmit={handleUpdateUrl}
                        className="flex gap-2 shrink-0 w-full"
                    >
                        <Input
                            placeholder="Paste YouTube URL..."
                            className="h-8 text-xs bg-black/20 rounded-none"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                        />
                        <Button
                            type="submit"
                            size="sm"
                            className="h-8 rounded-none px-3"
                        >
                            Play
                        </Button>
                    </form>
                )}

                <div
                    className={cn(
                        "overflow-hidden shrink-0",
                        mediaPlayerOpen
                            ? "aspect-video w-full relative opacity-100 visible"
                            : "fixed opacity-0 invisible pointer-events-none w-px h-px overflow-hidden border-0",
                    )}
                >
                    <div
                        id="youtube-player-container"
                        className="w-full h-full"
                    />
                </div>

                {!mediaPlayerOpen && null}

                {mediaPlayerOpen && (
                    <div className="w-full space-y-3">
                        <div className="flex items-center gap-2 px-1 shrink-0">
                            <button
                                onClick={toggleMute}
                                className="p-1.5 rounded-none hover:bg-white/10 transition-colors"
                            >
                                {muted ? (
                                    <VolumeX className="w-4 h-4" />
                                ) : (
                                    <Volume2 className="w-4 h-4" />
                                )}
                            </button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    if (!playerRef.current) return;
                                    if (isPlaying) {
                                        userPaused.current = true;
                                        playerRef.current.pauseVideo();
                                        setIsPlaying(false);
                                    } else {
                                        userPaused.current = false;
                                        playerRef.current.playVideo();
                                        setIsPlaying(true);
                                        if (muted) {
                                            playerRef.current.unMute();
                                            setMuted(false);
                                        }
                                        if (volume === 0) {
                                            setVolume(50);
                                            playerRef.current.setVolume(50);
                                        }
                                    }
                                }}
                                className="h-8 rounded-none px-3"
                            >
                                {isPlaying ? (
                                    <Pause className="w-4 h-4" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                            </Button>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="flex-1 h-1.5 bg-white/20 rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-none"
                            />
                            <span className="text-xs text-muted-foreground w-8 text-right">
                                {volume}%
                            </span>
                        </div>

                        <button
                            onClick={() => setShowPlaylist(!showPlaylist)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors shrink-0",
                                showPlaylist
                                    ? "bg-primary/20 text-primary"
                                    : "bg-white/5 hover:bg-white/10",
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" />
                                History ({youtubePlaylist.length})
                            </span>
                        </button>

                        {showPlaylist && (
                            <div className="space-y-2 overflow-y-auto max-h-32">
                                <div className="space-y-1">
                                    {youtubePlaylist.map((url, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2 rounded-none bg-white/5 group"
                                        >
                                            <span className="text-[10px] text-muted-foreground truncate flex-1">
                                                {extractId(url)}
                                            </span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() =>
                                                        setMediaUrl(
                                                            "YOUTUBE",
                                                            url,
                                                        )
                                                    }
                                                    className={cn(
                                                        "text-[10px] px-2 py-0.5 rounded",
                                                        youtubeUrl === url
                                                            ? "bg-primary text-primary-foreground"
                                                            : "hover:bg-white/20",
                                                    )}
                                                >
                                                    {youtubeUrl === url
                                                        ? "Current"
                                                        : "Play"}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        removeFromPlaylist(url)
                                                    }
                                                    className="text-muted-foreground hover:text-destructive p-1"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
