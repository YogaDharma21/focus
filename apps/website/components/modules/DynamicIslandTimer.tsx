"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { Play, Pause, CheckCircle2, Timer, Coffee, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DistractionCounter } from "./DistractionCounter";

export function DynamicIslandTimer() {
    const {
        timerMode,
        timerState,
        previousMode,
        timeLeft,
        isActive,
        sessionName,
        setIsActive,
        setTimeLeft,
        setTimerState,
        setTimerMode,
        setPreviousMode,
        pomodoroSettings,
        addSession,
        setSessionStartTime,
        setDeepFocusMode,
        todos,
        selectedTodoId,
        soundEffectVolume,
        soundEffectEnabled,
    } = useAppStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Close popover on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const playSound = React.useCallback(() => {
        if (!soundEffectEnabled) return;
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

    const getCurrentIcon = () => {
        if (timerMode === "POMODORO") {
            return timerState === "WORK" ? (
                <Timer className="w-4 h-4 text-zinc-200 shrink-0" />
            ) : (
                <Coffee className="w-4 h-4 text-zinc-200 shrink-0" />
            );
        }
        return <Clock className="w-4 h-4 text-zinc-200 shrink-0" />;
    };

    const getCurrentModeLabel = () => {
        if (timerMode === "POMODORO") {
            return timerState === "WORK" ? "Pomodoro" : "Break";
        }
        return "Flow";
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const progressValue =
        timerMode === "POMODORO"
            ? timerState === "WORK"
                ? ((pomodoroSettings.work * 60 - timeLeft) /
                      (pomodoroSettings.work * 60)) *
                  100
                : ((pomodoroSettings.break * 60 - timeLeft) /
                      (pomodoroSettings.break * 60)) *
                  100
            : 100;

    useEffect(() => {
        if (isActive) {
            setSessionStartTime(new Date().toISOString());
        } else {
            setSessionStartTime(null);
        }
    }, [isActive, setSessionStartTime]);

    const toggleTimer = () => setIsActive(!isActive);

    const switchMode = (mode: "POMODORO" | "STOPWATCH", state: "WORK" | "BREAK" = "WORK") => {
        setIsActive(false);
        setTimerMode(mode);
        setTimerState(state);
        if (mode === "POMODORO") {
            setTimeLeft(state === "WORK" ? pomodoroSettings.work * 60 : pomodoroSettings.break * 60);
        } else {
            setTimeLeft(0);
        }
    };

    const completeSession = () => {
        setIsActive(false);
        playSound();

        const duration =
            timerMode === "POMODORO"
                ? Math.max(0, (timerState === "WORK" ? pomodoroSettings.work * 60 : pomodoroSettings.break * 60) - timeLeft)
                : timeLeft;
        if (duration > 0) {
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: timerMode,
            });
        }

        if (timerMode === "POMODORO" && timerState === "WORK") {
            setPreviousMode("POMODORO");
            setTimerState("BREAK");
            setTimeLeft(pomodoroSettings.break * 60);
            if (pomodoroSettings.autoStartBreak) {
                setIsActive(true);
            }
        } else if (timerMode === "POMODORO" && timerState === "BREAK") {
            if (previousMode === "STOPWATCH") {
                setTimerMode("STOPWATCH");
                setTimerState("WORK");
                setTimeLeft(0);
            } else {
                setTimerMode("POMODORO");
                setTimerState("WORK");
                setTimeLeft(pomodoroSettings.work * 60);
            }
            if (pomodoroSettings.autoStartTimer) {
                setIsActive(true);
            }
        } else if (timerMode === "STOPWATCH" && duration > 0) {
            setPreviousMode("STOPWATCH");
            const breakSeconds = Math.floor(duration / 5);
            if (breakSeconds > 0) {
                setTimerMode("POMODORO");
                setTimerState("BREAK");
                setTimeLeft(breakSeconds);
                if (pomodoroSettings.autoStartBreak) {
                    setIsActive(true);
                }
            } else {
                setTimeLeft(0);
            }
        }
        setSessionStartTime(null);
        setDeepFocusMode(false);
    };

    const activeTask = todos.find((t) => t.id === selectedTodoId);

    return (
        <div ref={containerRef} className="relative inline-flex items-center">
            {/* 1. Compact Dark Pill matching uploaded reference image */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className={cn(
                    "flex items-center gap-2.5 px-3.5 py-1.5 rounded-full",
                    "bg-[#121214] border border-zinc-800 shadow-md",
                    "hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 active:scale-95 cursor-pointer text-xs select-none",
                )}
                title="Click to toggle timer controls"
            >
                {getCurrentIcon()}
                <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wider tabular-nums">
                    {formatTime(timeLeft)}
                </span>
                {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
            </button>

            {/* 2. Expanded Timer Controls Popover Card */}
            {isExpanded && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "absolute z-50 w-[330px] sm:w-[370px] bg-[#121214] border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200",
                        "top-full mt-2.5 left-1/2 -translate-x-1/2",
                    )}
                >
                    {/* Header Row */}
                    <div
                        onClick={() => setIsExpanded(false)}
                        className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to collapse widget"
                    >
                        <div className="flex items-center gap-2">
                            {getCurrentIcon()}
                            <span className="text-xs font-bold text-white tracking-tight">
                                {getCurrentModeLabel()}
                            </span>
                        </div>
                        <span className="text-xl font-extrabold font-mono text-white tracking-tight tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant={
                                timerMode === "POMODORO" && timerState === "WORK"
                                    ? "default"
                                    : "outline"
                            }
                            size="sm"
                            onClick={() => switchMode("POMODORO", "WORK")}
                            className="rounded-xl text-[11px] h-7 px-2.5 flex-1"
                        >
                            <Timer className="w-3 h-3 mr-1" />
                            Pomodoro
                        </Button>
                        <Button
                            variant={
                                timerMode === "POMODORO" && timerState === "BREAK"
                                    ? "default"
                                    : "outline"
                            }
                            size="sm"
                            onClick={() => switchMode("POMODORO", "BREAK")}
                            className="rounded-xl text-[11px] h-7 px-2.5 flex-1"
                        >
                            <Coffee className="w-3 h-3 mr-1" />
                            Break
                        </Button>
                        <Button
                            variant={timerMode === "STOPWATCH" ? "default" : "outline"}
                            size="sm"
                            onClick={() => switchMode("STOPWATCH")}
                            className="rounded-xl text-[11px] h-7 px-2.5 flex-1"
                        >
                            <Clock className="w-3 h-3 mr-1" />
                            Flow
                        </Button>
                    </div>

                    <Progress value={progressValue} className="h-1.5" />

                    {(activeTask || sessionName) && (
                        <p className="text-xs text-zinc-400 truncate">
                            {activeTask ? activeTask.text : sessionName}
                        </p>
                    )}

                    <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />

                    {/* Controls Footer - Centered tightly without awkward blank space */}
                    <div className="flex items-center justify-center gap-2.5 pt-1">
                        <button
                            onClick={completeSession}
                            disabled={timeLeft === 0}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#18181b] border border-zinc-800 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            title="Complete Session"
                        >
                            <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                            <span>Complete</span>
                        </button>

                        <DistractionCounter />

                        <button
                            onClick={toggleTimer}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer",
                                isActive
                                    ? "bg-amber-950/40 text-amber-400 border-2 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:bg-amber-900/50"
                                    : "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border border-zinc-200",
                            )}
                        >
                            {isActive ? (
                                <>
                                    <Pause className="w-3.5 h-3.5 fill-amber-400" />
                                    <span>Pause</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-zinc-950 ml-0.5" />
                                    <span>Start</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

