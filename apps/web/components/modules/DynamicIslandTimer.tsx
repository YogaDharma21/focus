"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Play, Pause, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistractionCounter } from "./DistractionCounter";
import { playCompletionSound } from "@/lib/sound";

export function DynamicIslandTimer() {
    const {
        timeLeft,
        isActive,
        setIsActive,
        setTimeLeft,
        setTimerState,
        addSession,
        setSessionStartTime,
        setDeepFocusMode,
        soundEffectVolume,
        soundEffectEnabled,
        soundEnabled,
        autoStartBreak,
        tasks,
        selectedTaskId,
    } = useAppStore(
        useShallow((s) => ({
            timeLeft: s.timeLeft,
            isActive: s.isActive,
            setIsActive: s.setIsActive,
            setTimeLeft: s.setTimeLeft,
            setTimerState: s.setTimerState,
            addSession: s.addSession,
            setSessionStartTime: s.setSessionStartTime,
            setDeepFocusMode: s.setDeepFocusMode,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
            soundEnabled: s.soundEnabled ?? true,
            autoStartBreak: s.autoStartBreak ?? true,
            tasks: s.tasks,
            selectedTaskId: s.selectedTaskId,
        }))
    );
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close popover on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isExpanded]);

    const playSound = React.useCallback(() => {
        const breakSeconds = Math.floor(timeLeft / 5);
        const breakStr = breakSeconds > 0
            ? `${Math.floor(breakSeconds / 60)}m`
            : "a short";
        playCompletionSound({
            notification: {
                title: "Flow Session Complete!",
                body: `Focused for ${Math.floor(timeLeft / 60)}m. Earned ${breakStr} break!`,
            },
        });
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        if (isActive) {
            setSessionStartTime(new Date().toISOString());
        } else {
            setSessionStartTime(null);
        }
    }, [isActive, setSessionStartTime]);

    const toggleTimer = () => setIsActive(!isActive);

    const completeSession = () => {
        setIsActive(false);
        playSound();

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
    };

    return (
        <div ref={containerRef} className="relative inline-flex items-center">
            {/* 1. Compact Dark Pill */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-full",
                    "bg-card border border-border shadow-md",
                    "hover:bg-secondary/80 hover:border-border transition-all duration-200 active:scale-95 cursor-pointer text-xs select-none",
                )}
                title="Click to toggle timer controls"
            >
                <Clock className="w-4 h-4 text-foreground shrink-0" />
                <span className="font-mono font-bold text-xs sm:text-sm text-foreground tracking-wider tabular-nums">
                    {formatTime(timeLeft)}
                </span>
                {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                )}
            </button>

            {/* 2. Expanded Floating Timer Card Overlay matching Image 1 */}
            {isExpanded && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "absolute z-50 w-[330px] sm:w-[360px] bg-card border border-border rounded-2xl p-3.5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150",
                        "top-full mt-2.5 left-1/2 -translate-x-1/2",
                    )}
                >
                    {/* Top Row: Time */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 shrink-0">
                            <Clock className="w-4 h-4 text-foreground shrink-0" />
                            <span className="text-2xl font-black font-mono tracking-tight tabular-nums text-foreground">
                                {formatTime(timeLeft)}
                            </span>
                            {isActive && <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />}
                        </div>
                    </div>

                    {/* Control Action Buttons Row matching Image 1 */}
                    <div className="flex items-center gap-2">
                        {/* Complete Session Button */}
                        <button
                            disabled={!isActive}
                            onClick={() => {
                                if (!isActive) return;
                                completeSession();
                                setIsExpanded(false);
                            }}
                            className={cn(
                                "flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                                !isActive
                                    ? "bg-card border-border text-muted-foreground cursor-not-allowed opacity-50"
                                    : "bg-secondary border-border hover:bg-accent text-foreground cursor-pointer"
                            )}
                            title={isActive ? "Complete Session" : "Start timer to complete session"}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete</span>
                        </button>

                        {/* Log Distraction Button */}
                        <DistractionCounter className="w-9 h-9 sm:w-9 sm:h-9 rounded-xl border bg-secondary border-border hover:bg-accent text-muted-foreground p-0" />

                        {/* Start / Pause Button */}
                        <button
                            onClick={toggleTimer}
                            className="flex-1 py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow bg-primary text-primary-foreground border-primary hover:bg-primary/90 cursor-pointer"
                        >
                            {isActive ? (
                                <>
                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                    <span>Pause</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
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

