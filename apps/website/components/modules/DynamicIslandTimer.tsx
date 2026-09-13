"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Play, Pause, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { DistractionCounter } from "./DistractionCounter";

export function DynamicIslandTimer() {
    const {
        timeLeft,
        isActive,
        sessionName,
        setIsActive,
        setTimeLeft,
        addSession,
        setSessionStartTime,
        setDeepFocusMode,
        todos,
        selectedTodoId,
        soundEffectVolume,
        soundEffectEnabled,
    } = useAppStore(
        useShallow((s) => ({
            timeLeft: s.timeLeft,
            isActive: s.isActive,
            sessionName: s.sessionName,
            setIsActive: s.setIsActive,
            setTimeLeft: s.setTimeLeft,
            addSession: s.addSession,
            setSessionStartTime: s.setSessionStartTime,
            setDeepFocusMode: s.setDeepFocusMode,
            todos: s.todos,
            selectedTodoId: s.selectedTodoId,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
        }))
    );
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
        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isExpanded]);

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

    const getModeIcon = () => {
        return <Clock className="w-4 h-4 text-foreground shrink-0" />;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const progressValue = 100;

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
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: "STOPWATCH",
            });
        }

        const breakSeconds = Math.floor(duration / 5);
        if (breakSeconds > 0) {
            setTimeLeft(breakSeconds);
        } else {
            setTimeLeft(0);
        }

        setDeepFocusMode(false);
        setSessionStartTime(null);
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
                    "bg-card border border-border shadow-md",
                    "hover:bg-secondary/80 hover:border-border transition-all duration-200 active:scale-95 cursor-pointer text-xs select-none",
                )}
                title="Click to toggle timer controls"
            >
                {getModeIcon()}
                <span className="font-mono font-bold text-xs sm:text-sm text-foreground tracking-wider tabular-nums">
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
                        "absolute z-50 w-[330px] sm:w-[370px] bg-card border border-border rounded-2xl p-4 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200",
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
                            {getModeIcon()}
                        </div>
                        <span className="text-xl font-extrabold font-mono text-foreground tracking-tight tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <Progress value={progressValue} className="h-1.5" />

                    {(activeTask || sessionName) && (
                        <p className="text-xs text-muted-foreground truncate">
                            {activeTask ? activeTask.text : sessionName}
                        </p>
                    )}

                    <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />

                    {/* Controls Footer - Centered tightly without awkward blank space */}
                    <div className="flex items-center justify-center gap-2.5 pt-1">
                        <button
                            onClick={completeSession}
                            disabled={timeLeft === 0}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground hover:bg-secondary/80 hover:border-border transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            title="Complete Session"
                        >
                            <CheckCircle2 className="w-4 h-4 text-foreground" />
                            <span>Complete</span>
                        </button>

                        <DistractionCounter />

                        <button
                            onClick={toggleTimer}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer",
                                isActive
                                    ? "bg-amber-950/40 text-amber-400 border-2 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:bg-amber-900/50"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary",
                            )}
                        >
                            {isActive ? (
                                <>
                                    <Pause className="w-3.5 h-3.5 fill-amber-400" />
                                    <span>Pause</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-primary-foreground ml-0.5" />
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

