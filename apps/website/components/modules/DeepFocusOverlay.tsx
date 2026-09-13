"use client";

import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Pause, Play, X, CheckCircle2, Music, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useCallback } from "react";
import { DistractionCounter } from "./DistractionCounter";

export function DeepFocusOverlay() {
    const {
        timeLeft,
        isActive,
        sessionName,
        setIsActive,
        setDeepFocusMode,
        setTimeLeft,
        addSession,
        todos,
        selectedTodoId,
        selectedSubtaskId,
        isMusicPlaying,
        setIsMusicPlaying,
        musicVolume,
        setMusicVolume,
        isMusicMuted,
        setIsMusicMuted,
        soundEffectVolume,
        soundEffectEnabled,
    } = useAppStore(
        useShallow((s) => ({
            timeLeft: s.timeLeft,
            isActive: s.isActive,
            sessionName: s.sessionName,
            setIsActive: s.setIsActive,
            setDeepFocusMode: s.setDeepFocusMode,
            setTimeLeft: s.setTimeLeft,
            addSession: s.addSession,
            todos: s.todos,
            selectedTodoId: s.selectedTodoId,
            selectedSubtaskId: s.selectedSubtaskId,
            isMusicPlaying: s.isMusicPlaying,
            setIsMusicPlaying: s.setIsMusicPlaying,
            musicVolume: s.musicVolume,
            setMusicVolume: s.setMusicVolume,
            isMusicMuted: s.isMusicMuted,
            setIsMusicMuted: s.setIsMusicMuted,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
        }))
    );

    const [showMusicMenu, setShowMusicMenu] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sessionStartTimeRef = useRef<number | null>(null);

    const playSound = useCallback(() => {
        if (!soundEffectEnabled) return;
        const vol = (soundEffectVolume ?? 80) / 100;
        try {
            const audio = new Audio("/soundeffect.mp3");
            audio.volume = vol;
            audio.play().catch(() => {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.volume = vol;
                    audioRef.current.play().catch(() => {});
                }
            });
        } catch {
            // ignore
        }
    }, [soundEffectEnabled, soundEffectVolume]);

    useEffect(() => {
        const unlockAudio = () => {
            if (audioRef.current) {
                audioRef.current.load();
            }
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
        };
        window.addEventListener("click", unlockAudio);
        window.addEventListener("keydown", unlockAudio);
        return () => {
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("keydown", unlockAudio);
        };
    }, []);

    useEffect(() => {
        if (isActive && !sessionStartTimeRef.current) {
            sessionStartTimeRef.current = Date.now();
        } else if (!isActive) {
            sessionStartTimeRef.current = null;
        }
    }, [isActive]);

    const handleCompleteSession = useCallback(() => {
        setIsActive(false);

        playSound();

        let elapsedSeconds = 0;
        if (sessionStartTimeRef.current) {
            elapsedSeconds = Math.floor(
                (Date.now() - sessionStartTimeRef.current) / 1000,
            );
        }

        const duration = timeLeft;

        if (duration > 0) {
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: "STOPWATCH",
            });
            const selectedTodo = todos.find((t) => t.id === selectedTodoId);
            fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    duration,
                    tasks: selectedTodo ? [selectedTodo.text] : [],
                }),
            }).catch(() => {});
        }

        const breakSeconds = Math.floor(duration / 5);
        if (breakSeconds > 0) {
            setTimeLeft(breakSeconds);
        } else {
            setTimeLeft(0);
        }

        setDeepFocusMode(false);
        sessionStartTimeRef.current = null;
    }, [
        timeLeft,
        setTimeLeft,
        setIsActive,
        setDeepFocusMode,
        playSound,
        addSession,
        selectedTodoId,
        todos,
    ]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setDeepFocusMode(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setDeepFocusMode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const toggleTimer = () => setIsActive(!isActive);

    const exitFocusMode = () => setDeepFocusMode(false);

    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center animate-in fade-in duration-300 select-none">
            <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />
            
            {/* Top Left Lofi-Beats Music Control */}
            <div className="absolute top-6 left-6 z-50">
                <button
                    onClick={() => setShowMusicMenu(!showMusicMenu)}
                    className={cn(
                        "h-10 px-3.5 rounded-full border transition-all flex items-center gap-2 shadow-sm",
                        isMusicPlaying
                            ? "bg-secondary/50 border-border text-foreground ring-1 ring-border shadow-md"
                            : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                    title={isMusicPlaying ? "Lofi-Beats: Playing" : "Lofi-Beats: Paused"}
                >
                    <Music className={cn("w-4 h-4", isMusicPlaying && "text-foreground")} />
                    <span className="text-xs font-semibold tracking-wide">Lofi-Beats</span>
                    {isMusicPlaying && (
                        <span className="flex items-center gap-0.5 h-3 ml-0.5">
                            <span className="w-0.5 h-2.5 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-0.5 h-3 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-0.5 h-2 bg-foreground rounded-full animate-bounce" />
                        </span>
                    )}
                </button>

                {showMusicMenu && (
                    <div className="absolute top-full left-0 mt-2.5 w-64 bg-card border border-border rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-foreground">
                                <Music className="w-4 h-4 text-foreground" />
                                <span className="text-xs font-semibold tracking-wide">
                                    Lofi-Beats
                                </span>
                            </div>
                            <button
                                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                                    isMusicPlaying
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow"
                                        : "bg-secondary/50 text-foreground hover:bg-secondary"
                                )}
                            >
                                {isMusicPlaying ? (
                                    <>
                                        <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3.5 h-3.5 fill-current" /> Play
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center gap-2.5 pt-1 border-t border-border">
                            <button
                                onClick={() => setIsMusicMuted(!isMusicMuted)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                aria-label={isMusicMuted ? "Unmute" : "Mute"}
                            >
                                {isMusicMuted || musicVolume === 0 ? (
                                    <VolumeX className="w-4 h-4" />
                                ) : (
                                    <Volume2 className="w-4 h-4" />
                                )}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={isMusicMuted ? 0 : musicVolume}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setMusicVolume(val);
                                    if (val > 0 && isMusicMuted) {
                                        setIsMusicMuted(false);
                                    }
                                }}
                                className="w-full h-1.5 bg-secondary/50 rounded-full appearance-none cursor-pointer accent-foreground [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                            />
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={exitFocusMode}
                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Exit focus mode"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center gap-4">
                <div className="text-[4rem] sm:text-[6rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground select-none">
                    {formatTime(timeLeft)}
                </div>

                {(() => {
                    const selectedTodo = todos.find((t) => t.id === selectedTodoId);
                    const displayTitle = selectedTodo ? selectedTodo.text : sessionName;
                    if (!displayTitle) return null;
                    return (
                        <div className="flex flex-col items-center gap-1">
                            <div className="text-lg sm:text-xl font-semibold text-muted-foreground text-center max-w-md px-4 truncate">
                                {displayTitle}
                            </div>
                            {selectedTodoId && selectedSubtaskId && (() => {
                                const subtask = selectedTodo?.subtasks?.find((s) => s.id === selectedSubtaskId);
                                return subtask ? (
                                    <div className="text-sm text-muted-foreground/60 text-center max-w-md px-4 truncate">
                                        {subtask.text}
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    );
                })()}

                <div className="flex items-center gap-4 mt-8">
                    <DistractionCounter />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-14 h-14 rounded-[var(--radius)] border-2 hover:bg-secondary/50 hover:border-border transition-all"
                        onClick={toggleTimer}
                    >
                        {isActive ? (
                            <Pause className="size-7" />
                        ) : (
                            <Play className="size-7 ml-0.5" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "w-14 h-14 rounded-[var(--radius)] border-2 transition-all",
                            isActive
                                ? "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                                : "opacity-50 cursor-not-allowed",
                        )}
                        onClick={handleCompleteSession}
                        disabled={!isActive}
                        title="Complete Session"
                    >
                        <CheckCircle2 className="size-7" />
                    </Button>
                </div>
            </div>

            <div className="absolute bottom-8 text-xs text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-mono border border-border">Esc</kbd> to exit focus mode
            </div>
        </div>
    );
}
