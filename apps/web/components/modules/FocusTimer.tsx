"use client";

import { useAppStore, PomodoroInterval, TimerMode } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Play,
    Pause,
    RotateCcw,
    CheckCircle2,
    Focus,
    Clock,
    Coffee,
    Timer as TimerIcon,
    Tag,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DistractionCounter } from "./DistractionCounter";

const DEFAULT_TAGS = ["work", "study", "code"] as const;

export function FocusTimer() {
    const {
        timeLeft,
        isActive,
        timerMode,
        timerState,
        pomodoroInterval,
        activeTag,
        setTimeLeft,
        setIsActive,
        setTimerMode,
        setTimerState,
        setPomodoroInterval,
        setActiveTag,
        setSessionStartTime,
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
            timerMode: s.timerMode,
            timerState: s.timerState,
            pomodoroInterval: s.pomodoroInterval ?? "25/5",
            activeTag: s.activeTag ?? "work",
            setTimeLeft: s.setTimeLeft,
            setIsActive: s.setIsActive,
            setTimerMode: s.setTimerMode,
            setTimerState: s.setTimerState,
            setPomodoroInterval: s.setPomodoroInterval,
            setActiveTag: s.setActiveTag,
            setSessionStartTime: s.setSessionStartTime,
            addSession: s.addSession,
            setDeepFocusMode: s.setDeepFocusMode,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
            soundEnabled: s.soundEnabled ?? true,
            autoStartBreak: s.autoStartBreak ?? true,
        }))
    );

    const [isCustomTagOpen, setIsCustomTagOpen] = useState(false);
    const [customTagInput, setCustomTagInput] = useState("");

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sessionStartTimeRef = useRef<number | null>(null);

    const isLongPomo = pomodoroInterval === "50/10";
    const pomoWorkSecs = isLongPomo ? 50 * 60 : 25 * 60;
    const pomoBreakSecs = isLongPomo ? 10 * 60 : 5 * 60;

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

    const handleSwitchMode = (mode: TimerMode) => {
        if (mode === timerMode) return;
        setIsActive(false);
        setTimerMode(mode);
        setTimerState("FLOW");
        if (mode === "POMODORO") {
            setTimeLeft(pomoWorkSecs);
        } else {
            setTimeLeft(0);
        }
    };

    const handleSelectPomoInterval = (interval: PomodoroInterval) => {
        setPomodoroInterval(interval);
        if (!isActive && timerState === "FLOW" && timerMode === "POMODORO") {
            const newWorkSecs = interval === "50/10" ? 50 * 60 : 25 * 60;
            setTimeLeft(newWorkSecs);
        }
    };

    const handleCompleteSession = React.useCallback(() => {
        setIsActive(false);
        playSound();

        if (timerMode === "POMODORO") {
            const isLong = pomodoroInterval === "50/10";
            const fullWorkSecs = isLong ? 50 * 60 : 25 * 60;
            const fullBreakSecs = isLong ? 10 * 60 : 5 * 60;

            if (timerState === "FLOW") {
                const elapsedSeconds = Math.max(1, fullWorkSecs - timeLeft);
                addSession({
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    duration: elapsedSeconds,
                    mode: "POMODORO",
                    tag: activeTag || "work",
                });
                fetch("/api/sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        duration: elapsedSeconds,
                        tag: activeTag || "work",
                    }),
                }).catch(() => {});

                setTimeLeft(fullBreakSecs);
                setTimerState("BREAK");
                setIsActive(autoStartBreak);
            } else {
                setTimeLeft(fullWorkSecs);
                setTimerState("FLOW");
            }
        } else {
            // STOPWATCH
            const duration = timeLeft;
            if (duration > 0) {
                addSession({
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    duration,
                    mode: "STOPWATCH",
                    tag: activeTag || "work",
                });
                fetch("/api/sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        duration,
                        tag: activeTag || "work",
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
        }

        setDeepFocusMode(false);
        sessionStartTimeRef.current = null;
    }, [
        timeLeft,
        timerMode,
        timerState,
        pomodoroInterval,
        activeTag,
        setTimeLeft,
        setIsActive,
        setTimerState,
        setDeepFocusMode,
        playSound,
        addSession,
        autoStartBreak,
    ]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimerState("FLOW");
        if (timerMode === "POMODORO") {
            setTimeLeft(pomoWorkSecs);
        } else {
            setTimeLeft(0);
        }
    };

    const handleAddCustomTag = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = customTagInput.trim().toLowerCase();
        if (trimmed) {
            setActiveTag(trimmed);
            setCustomTagInput("");
            setIsCustomTagOpen(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const getTagPillClass = (tag: string) => {
        const isSelected = activeTag === tag;
        if (!isSelected) {
            return "bg-surface-inset text-muted-foreground hover:text-foreground border-transparent";
        }
        if (tag === "work") {
            return "bg-amber-bg text-amber border-amber/40 shadow-sm";
        }
        if (tag === "study") {
            return "bg-blue-bg text-blue border-blue/40 shadow-sm";
        }
        if (tag === "code") {
            return "bg-emerald-bg text-emerald border-emerald/40 shadow-sm";
        }
        return "bg-primary text-primary-foreground border-primary shadow-sm";
    };

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh] relative">
            <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />

            {/* Mode & Interval Switchers */}
            <div className="flex flex-col items-center gap-3 mb-6 w-full">
                <div className="inline-flex p-1 bg-surface-inset rounded-full border border-border-subtle shadow-sm">
                    <button
                        type="button"
                        onClick={() => handleSwitchMode("STOPWATCH")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer active:scale-95",
                            timerMode === "STOPWATCH"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Stopwatch
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSwitchMode("POMODORO")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer active:scale-95",
                            timerMode === "POMODORO"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Pomodoro
                    </button>
                </div>

                {/* Pomodoro Interval Selection */}
                {timerMode === "POMODORO" && (
                    <div className="flex items-center gap-2">
                        {(["25/5", "50/10"] as const).map((interval) => (
                            <button
                                key={interval}
                                type="button"
                                onClick={() => handleSelectPomoInterval(interval)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[11px] font-mono font-medium transition-all duration-300 cursor-pointer active:scale-95 border",
                                    pomodoroInterval === interval
                                        ? "bg-card text-foreground border-border shadow-sm"
                                        : "bg-surface-inset text-muted-foreground border-transparent hover:text-foreground"
                                )}
                            >
                                {interval === "25/5" ? "25m / 5m" : "50m / 10m"}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center gap-4 mb-6 w-full">
                <div className="flex items-center justify-center gap-2 mt-1 mb-0.5">
                    {timerState === "BREAK" ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted-foreground shadow-sm">
                            <Coffee className="w-3 h-3 text-amber" />
                            <span className="text-[10px] font-bold">Break</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted-foreground shadow-sm">
                            {timerMode === "POMODORO" ? (
                                <TimerIcon className="w-3 h-3 text-emerald" />
                            ) : (
                                <Clock className="w-3 h-3" />
                            )}
                            <span className="text-[10px] font-bold">
                                {timerMode === "POMODORO" ? "Pomodoro" : "Flow"}
                            </span>
                        </div>
                    )}
                </div>

                <div className="text-[3.5rem] sm:text-[5rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow">
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Project Tags Selection */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-10 max-w-sm">
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground mr-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Tag
                </span>
                {DEFAULT_TAGS.map((tag) => (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => setActiveTag(tag)}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer active:scale-95",
                            getTagPillClass(tag)
                        )}
                    >
                        {tag}
                    </button>
                ))}
                {!DEFAULT_TAGS.includes(activeTag as any) && activeTag && (
                    <button
                        type="button"
                        onClick={() => setActiveTag(activeTag)}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer active:scale-95",
                            getTagPillClass(activeTag)
                        )}
                    >
                        {activeTag}
                    </button>
                )}
                {isCustomTagOpen ? (
                    <form onSubmit={handleAddCustomTag} className="inline-flex items-center gap-1">
                        <input
                            type="text"
                            value={customTagInput}
                            onChange={(e) => setCustomTagInput(e.target.value)}
                            placeholder="tag..."
                            autoFocus
                            className="w-20 px-2.5 py-1 text-xs rounded-full bg-surface-inset border border-border text-foreground focus:outline-none"
                            onBlur={() => {
                                if (!customTagInput.trim()) setIsCustomTagOpen(false);
                            }}
                        />
                    </form>
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsCustomTagOpen(true)}
                        className="p-1 rounded-full bg-surface-inset text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer active:scale-95"
                        title="Add custom tag"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                )}
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
                                ? "hover:bg-emerald-bg hover:text-emerald hover:border-emerald/40"
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
