"use client";

import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, CheckCircle2, Focus, Clock, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistractionCounter } from "./DistractionCounter";

export function FocusTimer() {
    const {
        timeLeft,
        isActive,
        timerState,
        setTimeLeft,
        setIsActive,
        setTimerState,
        setSessionStartTime,
        sessionName,
        setSessionName,
        addSession,
        setDeepFocusMode,
        soundEffectVolume,
        soundEffectEnabled,
        soundEnabled,
        autoStartBreak,
    } = useAppStore(
        useShallow((s) => ({
            timeLeft: s.timeLeft,
            isActive: s.isActive,
            timerState: s.timerState,
            setTimeLeft: s.setTimeLeft,
            setIsActive: s.setIsActive,
            setTimerState: s.setTimerState,
            setSessionStartTime: s.setSessionStartTime,
            sessionName: s.sessionName,
            setSessionName: s.setSessionName,
            addSession: s.addSession,
            setDeepFocusMode: s.setDeepFocusMode,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
            soundEnabled: s.soundEnabled ?? true,
            autoStartBreak: s.autoStartBreak ?? true,
        }))
    );

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const sessionStartTimeRef = useRef<number | null>(null);

    const playSound = React.useCallback(() => {
        if (!soundEnabled || !soundEffectEnabled) return;
        const vol = (soundEffectVolume ?? 80) / 100;
        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.volume = vol;
                audioRef.current.play().catch(() => {
                    const fallback = new Audio("/soundeffect.mp3");
                    fallback.volume = vol;
                    fallback.play().catch(() => {});
                });
            } else {
                const fallback = new Audio("/soundeffect.mp3");
                fallback.volume = vol;
                fallback.play().catch(() => {});
            }
        } catch {
            // Audio play might be blocked by browser policies
        }
    }, [soundEnabled, soundEffectEnabled, soundEffectVolume]);

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
            const now = Date.now();
            sessionStartTimeRef.current = now;
            setSessionStartTime(new Date(now).toISOString());
        } else if (!isActive) {
            sessionStartTimeRef.current = null;
            setSessionStartTime(null);
        }
    }, [isActive, setSessionStartTime]);

    const handleCompleteSession = React.useCallback(() => {
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
            fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    duration,
                }),
            }).catch(() => {});
        }

        const breakSeconds = Math.floor(duration / 5);
        if (breakSeconds > 0) {
            setTimeLeft(breakSeconds);
            setTimerState("BREAK");
            setIsActive(autoStartBreak);
        } else {
            setTimeLeft(0);
            setTimerState("FLOW");
        }

        setDeepFocusMode(false);

        setSessionStartTime(null);
    }, [
        timeLeft,
        setTimeLeft,
        setIsActive,
        setTimerState,
        setDeepFocusMode,
        playSound,
        addSession,
        setSessionStartTime,
        autoStartBreak,
    ]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(0);
        setTimerState("FLOW");
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh] relative">
            <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />

            <div className="flex flex-col items-center gap-4 mb-12 w-full">
                <div className="flex items-center justify-center gap-2 mt-1 mb-0.5">
                    {timerState === "BREAK" ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted-foreground shadow-sm">
                            <Coffee className="w-3 h-3" />
                            <span className="text-[10px] font-bold">Break</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted-foreground shadow-sm">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold">Flow</span>
                        </div>
                    )}
                </div>

                <div className="text-[3.5rem] sm:text-[5rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                    <div className="relative flex items-center w-full max-w-sm">
                        <input
                            type="text"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder="Session Goal..."
                            className={cn(
                                "w-full px-4 py-2.5 rounded-[var(--radius)] text-sm text-center font-medium border transition-colors focus:outline-none shadow-sm",
                                "bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-border/80",
                            )}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 items-center w-full max-w-[280px] sm:max-w-xs">
                <div className="flex items-center gap-2 sm:gap-3 justify-start">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-secondary hover:border-border/80 transition-all cursor-pointer"
                        onClick={resetTimer}
                        title="Reset Timer"
                    >
                        <RotateCcw className="size-4 sm:size-5" />
                    </Button>

                    <DistractionCounter />
                </div>

                <div className="flex items-center justify-center">
                    <Button
                        size="icon"
                        className={cn(
                            "w-14 h-14 sm:w-16 sm:h-16 rounded-[var(--radius)] shadow-md hover:shadow active:scale-95 transition-all duration-300 cursor-pointer",
                            isActive
                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                : "bg-primary text-primary-foreground",
                        )}
                        onClick={toggleTimer}
                    >
                        {isActive ? (
                            <Pause className="size-7 sm:size-8 fill-current" />
                        ) : (
                            <Play className="size-7 sm:size-8 fill-current ml-0.5 sm:ml-1" />
                        )}
                    </Button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 justify-end">
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 transition-all cursor-pointer",
                            isActive
                                ? "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                                : "opacity-50 cursor-not-allowed",
                        )}
                        onClick={handleCompleteSession}
                        disabled={!isActive}
                        title="Complete Session"
                    >
                        <CheckCircle2 className="size-4 sm:size-5" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-secondary hover:border-border/80 transition-all cursor-pointer"
                        onClick={() => setDeepFocusMode(true)}
                        title="Deep Focus Mode"
                    >
                        <Focus className="size-4 sm:size-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
