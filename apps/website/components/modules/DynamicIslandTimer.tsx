"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Play, Pause, CheckCircle2, Clock, ChevronDown, ListTodo, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DistractionCounter } from "./DistractionCounter";

export function DynamicIslandTimer() {
    const {
        timeLeft,
        isActive,
        sessionName,
        setSessionName,
        setIsActive,
        setTimeLeft,
        setTimerState,
        addSession,
        setSessionStartTime,
        setDeepFocusMode,
        todos,
        selectedTodoId,
        setSelectedTodoId,
        soundEffectVolume,
        soundEffectEnabled,
        soundEnabled,
    } = useAppStore(
        useShallow((s) => ({
            timeLeft: s.timeLeft,
            isActive: s.isActive,
            sessionName: s.sessionName,
            setSessionName: s.setSessionName,
            setIsActive: s.setIsActive,
            setTimeLeft: s.setTimeLeft,
            setTimerState: s.setTimerState,
            addSession: s.addSession,
            setSessionStartTime: s.setSessionStartTime,
            setDeepFocusMode: s.setDeepFocusMode,
            todos: s.todos,
            selectedTodoId: s.selectedTodoId,
            setSelectedTodoId: s.setSelectedTodoId,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
            soundEnabled: s.soundEnabled ?? true,
        }))
    );
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTaskDropdown, setShowTaskDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Close popover on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
                setShowTaskDropdown(false);
            }
        };
        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isExpanded]);

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
            // ignore
        }
    }, [soundEnabled, soundEffectEnabled, soundEffectVolume]);

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
            setTimerState("BREAK");
            setIsActive(true);
        } else {
            setTimeLeft(0);
            setTimerState("FLOW");
        }

        setDeepFocusMode(false);
        setSessionStartTime(null);
    };

    const activeTask = todos.find((t) => t.id === selectedTodoId);

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
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                    <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />

                    {/* Top Row: Time + Task Selector */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 shrink-0">
                            <Clock className="w-4 h-4 text-foreground shrink-0" />
                            <span className="text-2xl font-black font-mono tracking-tight tabular-nums text-foreground">
                                {formatTime(timeLeft)}
                            </span>
                            {isActive && <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold font-sans border bg-secondary border-border text-secondary-foreground hover:bg-accent transition-colors flex items-center gap-1.5 max-w-[180px] sm:max-w-[200px] truncate cursor-pointer"
                            title="Select or switch focus task"
                        >
                            {activeTask ? (
                                <>
                                    <span className="truncate">{activeTask.text}</span>
                                    <ChevronDown className={cn("w-3 h-3 shrink-0 opacity-70 transition-transform", showTaskDropdown && "rotate-180")} />
                                </>
                            ) : sessionName ? (
                                <>
                                    <span className="truncate">{sessionName}</span>
                                    <ChevronDown className={cn("w-3 h-3 shrink-0 opacity-70 transition-transform", showTaskDropdown && "rotate-180")} />
                                </>
                            ) : (
                                <>
                                    <ListTodo className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                    <span className="opacity-80 truncate">Select task</span>
                                    <ChevronDown className={cn("w-3 h-3 shrink-0 opacity-70 transition-transform", showTaskDropdown && "rotate-180")} />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Task Selector Dropdown Card */}
                    {showTaskDropdown && (
                        <div className="p-2.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-150 space-y-1">
                            <div className="flex items-center justify-between px-1.5 py-0.5">
                                <span className="text-[10px] font-mono font-bold uppercase opacity-60">Focus Task</span>
                                <button
                                    type="button"
                                    onClick={() => setShowTaskDropdown(false)}
                                    className="text-[10px] font-mono opacity-50 hover:opacity-100 p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedTodoId(null);
                                    setSessionName("");
                                    setShowTaskDropdown(false);
                                }}
                                className={cn(
                                    "w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer",
                                    !selectedTodoId && !sessionName
                                        ? "bg-primary/10 text-foreground font-bold"
                                        : "hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <ListTodo className="w-3.5 h-3.5 shrink-0" />
                                    <span>Custom Focus</span>
                                </div>
                                {!selectedTodoId && !sessionName && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>

                            {todos.filter((t) => !t.completed).length > 0 && (
                                <div className="px-1.5 pt-1 text-[10px] font-mono font-bold uppercase opacity-50 text-muted-foreground">
                                    My Tasks
                                </div>
                            )}

                            <div className="max-h-36 overflow-y-auto space-y-0.5">
                                {todos.filter((t) => !t.completed).map((task) => (
                                    <button
                                        key={task.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTodoId(task.id);
                                            setSessionName(task.text);
                                            setShowTaskDropdown(false);
                                        }}
                                        className={cn(
                                            "w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer",
                                            selectedTodoId === task.id
                                                ? "bg-primary/10 text-foreground font-bold"
                                                : "hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                            <ListTodo className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{task.text}</span>
                                        </div>
                                        {selectedTodoId === task.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Control Action Buttons Row matching Image 1 */}
                    <div className="flex items-center gap-2">
                        {/* Complete Session Button */}
                        <button
                            disabled={!isActive}
                            onClick={() => {
                                if (!isActive) return;
                                completeSession();
                                setIsExpanded(false);
                                setShowTaskDropdown(false);
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

