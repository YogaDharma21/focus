"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { Play, Pause, CheckCircle2 } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function DynamicIslandTimer() {
    const {
        timerMode,
        timerState,
        timeLeft,
        isActive,
        sessionName,
        setIsActive,
        setTimeLeft,
        setTimerState,
        pomodoroSettings,
        setTimerMode,
        addSession,
        setSessionStartTime,
    } = useAppStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const modeConfig: Record<string, { icon: string; label: string }> = {
        POMODORO_WORK: { icon: "🍅", label: "Pomodoro" },
        POMODORO_BREAK: { icon: "☕", label: "Break" },
        STOPWATCH: { icon: "⏱️", label: "Flow" },
    };
    
    const getCurrentModeKey = () => {
        if (timerMode === "POMODORO") {
            return timerState === "WORK" ? "POMODORO_WORK" : "POMODORO_BREAK";
        }
        return "STOPWATCH";
    };
    const currentMode = modeConfig[getCurrentModeKey()];

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

    useEffect(() => {
        if (!isActive) return;
        if (timerState !== "WORK" && timerState !== "BREAK") return;

        const interval = setInterval(() => {
            if (timerMode === "POMODORO") {
                setTimeLeft(Math.max(0, timeLeft - 1));
                // Auto-complete when timer reaches 0
                if (timeLeft <= 1) {
                    setIsActive(false);
                    completeSession();
                }
            } else {
                setTimeLeft(timeLeft + 1);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timerState, timerMode, timeLeft, setTimeLeft, setIsActive]);

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
        if (audioRef.current) {
            audioRef.current.volume = 0.5;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }

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

        // If in WORK phase, switch to BREAK; if in BREAK, switch to WORK
        if (timerMode === "POMODORO") {
            if (timerState === "WORK") {
                setTimerState("BREAK");
                setTimeLeft(pomodoroSettings.break * 60);
                if (pomodoroSettings.autoStartBreak) {
                    setIsActive(true);
                }
            } else {
                setTimerState("WORK");
                setTimeLeft(pomodoroSettings.work * 60);
            }
        } else if (timerMode === "STOPWATCH") {
            setTimeLeft(0);
        }
        setSessionStartTime(null);
    };

    return (
        <div
            className={cn(
                "fixed z-50",
                isMobile
                    ? "top-20 left-1/2 -translate-x-1/2 w-[85%]"
                    : "top-20 left-1/2 -translate-x-1/2 w-full max-w-md",
            )}
        >
            <div
                className={cn(
                    "bg-sidebar/80 backdrop-blur-xl border border-sidebar-border shadow-2xl transition-all duration-300 cursor-pointer",
                    isExpanded ? "rounded-none" : "rounded-none",
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div
                    className={cn(
                        "transition-all duration-300",
                        isExpanded ? "p-4" : "py-3 px-4",
                    )}
                >
                    {!isExpanded ? (
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">
                                    {currentMode.icon}
                                </span>
                                <span className="text-sm font-medium">
                                    {currentMode.label}
                                </span>
                            </div>
                            <span className="text-lg font-bold tabular-nums">
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">
                                        {currentMode.icon}
                                    </span>
                                    <span className="font-medium">
                                        {currentMode.label}
                                    </span>
                                </div>
                                <span className="text-2xl font-bold tabular-nums">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={
                                        timerMode === "POMODORO" && timerState === "WORK"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        switchMode("POMODORO", "WORK");
                                    }}
                                    className="rounded-none text-xs"
                                >
                                    🍅 Pomodoro
                                </Button>
                                <Button
                                    variant={
                                        timerMode === "POMODORO" && timerState === "BREAK"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        switchMode("POMODORO", "BREAK");
                                    }}
                                    className="rounded-none text-xs"
                                >
                                    ☕ Break
                                </Button>
                                <Button
                                    variant={
                                        timerMode === "STOPWATCH"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        switchMode("STOPWATCH");
                                    }}
                                    className="rounded-none text-xs"
                                >
                                    ⏱️ Flow
                                </Button>
                            </div>

                            <Progress value={progressValue} className="h-1.5" />

                            {sessionName && (
                                <p className="text-sm text-muted-foreground truncate">
                                    {sessionName}
                                </p>
                            )}

                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        "text-xs px-2 py-0.5 rounded-none",
                                        timerState === "WORK"
                                            ? "bg-primary/20 text-primary"
                                            : "bg-green-500/20 text-green-500",
                                    )}
                                >
                                    {timerState === "WORK" ? "Work" : "Break"}
                                </span>
                                {isActive && (
                                    <span className="text-xs text-muted-foreground animate-pulse">
                                        ● Running
                                    </span>
                                )}
                            </div>

                            <audio ref={audioRef} src="/soundeffect.mp3" />

                            <div className="flex items-center justify-center gap-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        completeSession();
                                    }}
                                    disabled={timeLeft === 0}
                                    className="rounded-none text-xs"
                                    title="Complete Session"
                                >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Complete
                                </Button>

                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTimer();
                                    }}
                                    className={cn(
                                        "rounded-none px-4 text-xs font-medium",
                                        isActive 
                                            ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/50" 
                                            : "bg-primary hover:bg-primary/90"
                                    )}
                                >
                                    {isActive ? (
                                        <>
                                            <Pause className="w-3 h-3 mr-1" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3 h-3 mr-1" />
                                            Start
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
