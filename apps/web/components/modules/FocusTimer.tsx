"use client";

import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, CheckCircle2, Focus, Clock, Coffee, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistractionCounter } from "./DistractionCounter";

function formatBreakDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) {
        return `${mins} minute${mins === 1 ? "" : "s"} ${secs} second${secs === 1 ? "" : "s"}`;
    }
    if (mins > 0) {
        return `${mins} minute${mins === 1 ? "" : "s"}`;
    }
    return `${secs} second${secs === 1 ? "" : "s"}`;
}

export function FocusTimer() {
    const {
        timeLeft,
        isActive,
        timerState,
        setTimeLeft,
        setIsActive,
        setTimerState,
        setSessionStartTime,
        addSession,
        setDeepFocusMode,
        soundEffectVolume,
        soundEffectEnabled,
        soundEnabled,
        autoStartBreak,
        tasks,
        selectedTaskId,
        setSelectedTaskId,
    } = useAppStore(
        useShallow((s) => ({
            timeLeft: s.timeLeft,
            isActive: s.isActive,
            timerState: s.timerState,
            setTimeLeft: s.setTimeLeft,
            setIsActive: s.setIsActive,
            setTimerState: s.setTimerState,
            setSessionStartTime: s.setSessionStartTime,
            addSession: s.addSession,
            setDeepFocusMode: s.setDeepFocusMode,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
            soundEnabled: s.soundEnabled ?? true,
            autoStartBreak: s.autoStartBreak ?? true,
            tasks: s.tasks,
            selectedTaskId: s.selectedTaskId,
            setSelectedTaskId: s.setSelectedTaskId,
        }))
    );

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sessionStartTimeRef = useRef<number | null>(null);
    const liveRegionRef = useRef<HTMLDivElement | null>(null);

    const prevTimerStateRef = useRef(timerState);
    const prevIsActiveRef = useRef(isActive);
    const isInitialMountRef = useRef(true);
    const isResetRef = useRef(false);

    useEffect(() => {
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            prevTimerStateRef.current = timerState;
            prevIsActiveRef.current = isActive;
            return;
        }

        if (isResetRef.current) {
            isResetRef.current = false;
            prevTimerStateRef.current = timerState;
            prevIsActiveRef.current = isActive;
            return;
        }

        const prevTimerState = prevTimerStateRef.current;
        const prevIsActive = prevIsActiveRef.current;
        let message = "";

        if (prevTimerState === "FLOW" && timerState === "BREAK") {
            const timeStr = formatBreakDuration(timeLeft);
            message = `Break started, ${timeStr} remaining.`;
        } else if (prevTimerState === "BREAK" && timerState === "FLOW") {
            message = isActive ? "Break finished. Flow session started." : "Break finished.";
        } else if (prevIsActive !== isActive) {
            if (isActive) {
                message = timerState === "BREAK" ? "Break resumed." : (timeLeft > 0 ? "Flow session resumed." : "Flow session started.");
            } else if (timeLeft > 0 || timerState === "BREAK") {
                message = "Timer paused.";
            }
        }

        if (message && liveRegionRef.current) {
            liveRegionRef.current.textContent = message;
        }

        prevTimerStateRef.current = timerState;
        prevIsActiveRef.current = isActive;
    }, [timerState, isActive, timeLeft]);

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
            const focusedTask = tasks.find((t) => t.id === selectedTaskId);
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: "STOPWATCH",
                taskId: focusedTask?.id,
                taskName: focusedTask?.text,
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
        isResetRef.current = true;
        setIsActive(false);
        setTimeLeft(0);
        setTimerState("FLOW");
        if (liveRegionRef.current) {
            liveRegionRef.current.textContent = "Timer reset.";
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh] relative">
            <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />

            <div
                ref={liveRegionRef}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />

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

                <div
                    aria-label={`${timerState === "BREAK" ? "Break time remaining" : "Flow time elapsed"}: ${formatTime(timeLeft)}`}
                    className="text-[3.5rem] sm:text-[5rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow"
                >
                    {formatTime(timeLeft)}
                </div>

                {/* Focused Task Pill or Selector */}
                {(() => {
                    const focused = tasks.find((t) => t.id === selectedTaskId);
                    if (focused) {
                        return (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-foreground shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] max-w-xs truncate animate-in fade-in duration-300">
                                <Target className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{focused.text}</span>
                                <button
                                    onClick={() => setSelectedTaskId(null)}
                                    className="text-muted-foreground hover:text-foreground ml-1 p-0.5 rounded cursor-pointer transition-colors"
                                    title="Clear focused task"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    }
                    const activeTasks = tasks.filter((t) => !t.completed);
                    if (activeTasks.length > 0) {
                        return (
                            <div className="flex items-center gap-1.5">
                                <select
                                    value={selectedTaskId || ""}
                                    onChange={(e) => setSelectedTaskId(e.target.value || null)}
                                    className="bg-card border border-border text-[11px] text-muted-foreground rounded-full px-3 py-1 focus:outline-none cursor-pointer max-w-[220px] truncate"
                                >
                                    <option value="" disabled>Link a task to focus...</option>
                                    {activeTasks.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.text}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    }
                    return null;
                })()}
            </div>

            <div className="grid grid-cols-3 items-center w-full max-w-[280px] sm:max-w-xs">
                <div className="flex items-center gap-2 sm:gap-3 justify-start">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-secondary hover:border-border/80 transition-all cursor-pointer"
                        onClick={resetTimer}
                        title="Reset Timer"
                        aria-label="Reset timer"
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
                        title={isActive ? "Pause Timer" : "Start Timer"}
                        aria-label={isActive ? "Pause timer" : "Start timer"}
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
                                ? "hover:bg-emerald-bg hover:text-emerald hover:border-emerald/40"
                                : "opacity-50 cursor-not-allowed",
                        )}
                        onClick={handleCompleteSession}
                        disabled={!isActive}
                        title="Complete Session"
                        aria-label="Complete session"
                    >
                        <CheckCircle2 className="size-4 sm:size-5" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-secondary hover:border-border/80 transition-all cursor-pointer"
                        onClick={() => setDeepFocusMode(true)}
                        title="Deep Focus Mode"
                        aria-label="Deep focus mode"
                    >
                        <Focus className="size-4 sm:size-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
