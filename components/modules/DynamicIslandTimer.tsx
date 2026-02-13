"use client";

import React, { useState, useEffect } from "react";
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
        pomodoroSettings,
        setTimerState,
        setTimerMode,
        addSession,
        setSessionStartTime,
    } = useAppStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const modeConfig: Record<string, { icon: string; label: string }> = {
        POMODORO: { icon: "🍅", label: "Pomodoro" },
        STOPWATCH: { icon: "⏱️", label: "Flow" },
    };
    const currentMode = modeConfig[timerMode] || modeConfig.POMODORO;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const progressValue =
        timerMode === "POMODORO"
            ? ((pomodoroSettings.work * 60 - timeLeft) /
                  (pomodoroSettings.work * 60)) *
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
        if (timerState !== "WORK") return;

        const interval = setInterval(() => {
            if (timerMode === "POMODORO") {
                setTimeLeft(Math.max(0, timeLeft - 1));
            } else {
                setTimeLeft(timeLeft + 1);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timerState, timerMode, timeLeft, setTimeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const switchMode = (mode: "POMODORO" | "STOPWATCH") => {
        setIsActive(false);
        setTimerMode(mode);
        setTimeLeft(mode === "POMODORO" ? pomodoroSettings.work * 60 : 0);
    };

    const completeSession = () => {
        setIsActive(false);
        const duration =
            timerMode === "POMODORO"
                ? Math.max(0, pomodoroSettings.work * 60 - timeLeft)
                : timeLeft;
        if (duration > 0) {
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: timerMode,
            });
        }
        setSessionStartTime(null);
        setTimeLeft(timerMode === "POMODORO" ? pomodoroSettings.work * 60 : 0);
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
                                        timerMode === "POMODORO"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        switchMode("POMODORO");
                                    }}
                                    className="rounded-none text-xs"
                                >
                                    🍅 Pomodoro
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

                            <div className="flex items-center justify-center gap-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        completeSession();
                                    }}
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
                                        "rounded-none px-4 text-xs",
                                        isActive ? "bg-white/10" : "",
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
