"use client";

import { useAppStore, TodoItem } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, CheckCircle2, Settings, ChevronDown, ListTodo, FileText, Check, Square, CheckSquare2, Timer, Coffee, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DistractionCounter } from "./DistractionCounter";

export function FocusTimer() {
    const {
        timerMode,
        timerState,
        previousMode,
        timeLeft,
        isActive,
        setTimerMode,
        setTimerState,
        setPreviousMode,
        setTimeLeft,
        setIsActive,
        setSessionStartTime,
        sessionName,
        setSessionName,
        addSession,
        pomodoroSettings,
        setPomodoroSettings,
        pomodoroCount,
        setPomodoroCount,
        resetPomodoroCount,
        todos,
        addTodo,
        updateTodo,
        toggleTodo,
        toggleSubtask,
        selectedTodoId,
        setSelectedTodoId,
        selectedSubtaskId,
        setSelectedSubtaskId,
        setDeepFocusMode,
        resetAllData,
        soundEffectVolume,
        soundEffectEnabled,
    } = useAppStore(
        useShallow((s) => ({
            timerMode: s.timerMode,
            timerState: s.timerState,
            previousMode: s.previousMode,
            timeLeft: s.timeLeft,
            isActive: s.isActive,
            setTimerMode: s.setTimerMode,
            setTimerState: s.setTimerState,
            setPreviousMode: s.setPreviousMode,
            setTimeLeft: s.setTimeLeft,
            setIsActive: s.setIsActive,
            setSessionStartTime: s.setSessionStartTime,
            sessionName: s.sessionName,
            setSessionName: s.setSessionName,
            addSession: s.addSession,
            pomodoroSettings: s.pomodoroSettings,
            setPomodoroSettings: s.setPomodoroSettings,
            pomodoroCount: s.pomodoroCount,
            setPomodoroCount: s.setPomodoroCount,
            resetPomodoroCount: s.resetPomodoroCount,
            todos: s.todos,
            addTodo: s.addTodo,
            updateTodo: s.updateTodo,
            toggleTodo: s.toggleTodo,
            toggleSubtask: s.toggleSubtask,
            selectedTodoId: s.selectedTodoId,
            setSelectedTodoId: s.setSelectedTodoId,
            selectedSubtaskId: s.selectedSubtaskId,
            setSelectedSubtaskId: s.setSelectedSubtaskId,
            setDeepFocusMode: s.setDeepFocusMode,
            resetAllData: s.resetAllData,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
        }))
    );

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);

    const uncompletedTodos = useMemo(
        () => todos.filter((t) => !t.completed),
        [todos],
    );

    const selectedTodo = useMemo(
        () => (selectedTodoId ? todos.find((t) => t.id === selectedTodoId) ?? null : null),
        [selectedTodoId, todos],
    );

    const selectedTodoSubtasks = useMemo(
        () => selectedTodo?.subtasks ?? [],
        [selectedTodo],
    );

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const sessionStartTimeRef = useRef<number | null>(null);

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
            // Audio play might be blocked by browser policies
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

        const duration =
            timerMode === "POMODORO"
                ? Math.min(elapsedSeconds, pomodoroSettings.work * 60)
                : timeLeft;

        if (duration > 0) {
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: timerMode,
            });
            fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    duration,
                    tasks: selectedTodo ? [selectedTodo.text] : [],
                }),
            }).catch(() => {});
        }

        if (timerMode === "POMODORO" && timerState === "WORK") {
            const nextCount = (pomodoroCount || 0) + 1;
            setPomodoroCount(nextCount);
            const isLongBreak = nextCount % 4 === 0;
            const breakDuration = isLongBreak
                ? (pomodoroSettings.longBreak || 15) * 60
                : (pomodoroSettings.break || 5) * 60;

            setPreviousMode("POMODORO");
            setTimerState("BREAK");
            setTimeLeft(breakDuration);
            if (pomodoroSettings.autoStartBreak) {
                setIsActive(true);
            }
            setDeepFocusMode(false);
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
                setDeepFocusMode(true);
            } else {
                setDeepFocusMode(false);
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
            setDeepFocusMode(false);
        }

        const focusedTask = selectedTodoId
            ? todos.find((t) => t.id === selectedTodoId && !t.completed)
            : sessionName
              ? todos.find((t) => t.text === sessionName && !t.completed)
              : null;
        if (focusedTask) {
            if (selectedSubtaskId) {
                const subtask = focusedTask.subtasks?.find(
                    (s) => s.id === selectedSubtaskId && !s.completed,
                );
                if (subtask) {
                    toggleSubtask(focusedTask.id, selectedSubtaskId);
                }
            } else {
                const newCompleted = (focusedTask.completedPomodoros || 0) + 1;
                updateTodo(focusedTask.id, {
                    completedPomodoros: newCompleted,
                });
                if (
                    focusedTask.estimatedPomodoros &&
                    newCompleted >= focusedTask.estimatedPomodoros
                ) {
                    toggleTodo(focusedTask.id);
                }
            }
        }
        setSessionStartTime(null);
    }, [
        timerMode,
        timerState,
        previousMode,
        timeLeft,
        setTimeLeft,
        setIsActive,
        setTimerState,
        setTimerMode,
        setPreviousMode,
        setDeepFocusMode,
        playSound,
        pomodoroSettings,
        pomodoroCount,
        setPomodoroCount,
        sessionName,
        selectedTodoId,
        selectedSubtaskId,
        todos,
        updateTodo,
        toggleTodo,
        toggleSubtask,
        addSession,
        selectedTodo,
        setSessionStartTime,
    ]);

    const prevSettingsRef = useRef({ work: pomodoroSettings.work, break: pomodoroSettings.break, longBreak: pomodoroSettings.longBreak });

    useEffect(() => {
        const prev = prevSettingsRef.current;
        if (pomodoroSettings.work !== prev.work || pomodoroSettings.break !== prev.break || pomodoroSettings.longBreak !== prev.longBreak) {
            prevSettingsRef.current = { work: pomodoroSettings.work, break: pomodoroSettings.break, longBreak: pomodoroSettings.longBreak };
            if (timerMode === "POMODORO" && timerState === "WORK") {
                setTimeLeft(pomodoroSettings.work * 60);
            } else if (timerMode === "POMODORO" && timerState === "BREAK") {
                const isLongBreak = (pomodoroCount || 0) % 4 === 0 && (pomodoroCount || 0) > 0;
                setTimeLeft(isLongBreak ? (pomodoroSettings.longBreak || 15) * 60 : pomodoroSettings.break * 60);
            }
        }
    }, [pomodoroSettings.work, pomodoroSettings.break, pomodoroSettings.longBreak, pomodoroCount, timerMode, timerState, setTimeLeft]);



    const toggleTimer = () => setIsActive(!isActive);

    const handleSelectTask = (todoId: string | null) => {
        setSelectedTodoId(todoId);
        setSelectedSubtaskId(null);
        if (todoId) {
            const task = todos.find((t) => t.id === todoId);
            if (task) setSessionName(task.text);
        }
        setTaskSelectorOpen(false);
    };

    const resetTimer = () => {
        setIsActive(false);
        if (timerMode === "POMODORO") {
            setTimerState("WORK");
            setTimeLeft(pomodoroSettings.work * 60);
        } else {
            setTimeLeft(0);
        }
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

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh] relative">
            <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />

            <div className="flex gap-2 mb-3 p-1 bg-secondary/30 rounded-[var(--radius)] backdrop-blur-md">
                <button
                    onClick={() => {
                        setPreviousMode("POMODORO");
                        setTimerMode("POMODORO");
                        setTimerState("WORK");
                        setIsActive(false);
                        setTimeLeft(pomodoroSettings.work * 60);
                    }}
                    className={cn(
                        "px-5 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5",
                        timerMode === "POMODORO" && timerState === "WORK"
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    <Timer className="w-3.5 h-3.5" />
                    <span>Pomodoro</span>
                </button>
                <button
                    onClick={() => {
                        setPreviousMode(timerMode === "STOPWATCH" ? "STOPWATCH" : "POMODORO");
                        setTimerMode("POMODORO");
                        setTimerState("BREAK");
                        setIsActive(false);
                        setTimeLeft(pomodoroSettings.break * 60);
                    }}
                    className={cn(
                        "px-5 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5",
                        timerMode === "POMODORO" && timerState === "BREAK"
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Break</span>
                </button>
                <button
                    onClick={() => {
                        setPreviousMode("STOPWATCH");
                        setTimerMode("STOPWATCH");
                        setTimerState("WORK");
                        setIsActive(false);
                        setTimeLeft(0);
                    }}
                    className={cn(
                        "px-5 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5",
                        timerMode === "STOPWATCH"
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Flow</span>
                </button>
            </div>

            {/* Pomodoro Cycle & Progress Indicator */}
            {timerMode === "POMODORO" && previousMode !== "STOPWATCH" && (
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-secondary/40 border border-border/50 text-xs font-mono text-foreground/80 shadow-sm mb-4 animate-in fade-in duration-150 group">
                    <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3].map((index) => {
                            const currentCycleStep = (pomodoroCount || 0) % 4;
                            const isCompleted = index < currentCycleStep;
                            const isCurrent = index === currentCycleStep && timerState === "WORK";
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        isCompleted
                                            ? "bg-primary shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                                            : isCurrent
                                            ? "bg-primary/70 ring-2 ring-primary/30 animate-pulse"
                                            : "bg-muted-foreground/30",
                                    )}
                                    title={`Pomodoro ${index + 1} of 4`}
                                />
                            );
                        })}
                    </div>
                    <span className="text-[11px] font-medium text-foreground/90">
                        {timerState === "BREAK"
                            ? (pomodoroCount || 0) % 4 === 0 && (pomodoroCount || 0) > 0
                                ? `Long Break (${pomodoroSettings.longBreak || 15}m)`
                                : `Short Break (${pomodoroSettings.break || 5}m)`
                            : `Pomodoro ${((pomodoroCount || 0) % 4) + 1} of 4`}
                    </span>
                    {(pomodoroCount || 0) % 4 !== 0 && (
                        <button
                            type="button"
                            onClick={resetPomodoroCount}
                            className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
                            title="Reset pomodoro count to 1 of 4"
                        >
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}

            <div className="flex flex-col items-center gap-4 mb-12 w-full">
                <div className="text-[3.5rem] sm:text-[5rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                    <Popover open={taskSelectorOpen} onOpenChange={setTaskSelectorOpen}>
                        <div className="relative w-full max-w-sm">
                            {selectedTodo ? (
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full px-4 py-2.5 rounded-[var(--radius)] border transition-all flex items-center justify-between gap-2 shadow-sm",
                                            "bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-white cursor-pointer group relative",
                                        )}
                                        title="Click to select another task or custom focus"
                                    >
                                        <div className="flex items-center justify-center gap-2 min-w-0 flex-1 mx-auto">
                                            <ListTodo className="w-4 h-4 text-white shrink-0" />
                                            <span className="font-semibold text-sm tracking-tight truncate max-w-[220px] text-white">
                                                {selectedTodo.text}
                                            </span>
                                            <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform duration-200 text-white shrink-0 group-hover:opacity-100" />
                                        </div>
                                    </button>
                                </PopoverTrigger>
                            ) : (
                                <div className="relative flex items-center w-full">
                                    <input
                                        type="text"
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && sessionName.trim()) {
                                                e.preventDefault();
                                                const existing = todos.find(
                                                    (t) => t.text.toLowerCase() === sessionName.trim().toLowerCase() && !t.completed,
                                                );
                                                if (existing) {
                                                    setSelectedTodoId(existing.id);
                                                    setSessionName(existing.text);
                                                } else {
                                                    const newId = crypto.randomUUID();
                                                    const item: TodoItem = {
                                                        id: newId,
                                                        text: sessionName.trim(),
                                                        completed: false,
                                                        groupId: "current",
                                                        completedPomodoros: 0,
                                                        estimatedPomodoros: 1,
                                                    };
                                                    addTodo(item);
                                                    setSelectedTodoId(newId);
                                                    setSessionName("");
                                                }
                                            }
                                        }}
                                        placeholder="Session Goal (Press Enter)..."
                                        className={cn(
                                            "w-full pl-9 pr-9 py-2.5 rounded-[var(--radius)] text-sm text-center font-medium border transition-colors focus:outline-none shadow-sm",
                                            "bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-neutral-700",
                                        )}
                                    />
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="absolute right-2.5 p-1 rounded-lg transition-colors hover:bg-neutral-800 text-neutral-400 hover:text-white"
                                            title="Select from your tasks"
                                        >
                                            <ListTodo className="w-4 h-4 text-white" />
                                        </button>
                                    </PopoverTrigger>
                                </div>
                            )}
                        </div>

                        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[280px] max-h-80 overflow-y-auto p-1.5 bg-neutral-900 border-neutral-800 text-white shadow-xl rounded-[var(--radius)]">
                            <div className="flex flex-col gap-0.5">
                                <button
                                    onClick={() => {
                                        setSessionName("");
                                        setSelectedTodoId(null);
                                        setSelectedSubtaskId(null);
                                        setTaskSelectorOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-3 py-2 text-xs font-medium rounded-xl text-left transition-all flex items-center justify-between",
                                        !selectedTodo && !sessionName
                                            ? "bg-white/10 text-white font-bold"
                                            : "text-neutral-300 hover:bg-neutral-800/80 hover:text-white",
                                    )}
                                >
                                    <span>Custom focus...</span>
                                    {!selectedTodo && !sessionName && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                                </button>
                                {uncompletedTodos.length > 0 && (
                                    <div className="h-px bg-neutral-800/80 my-1" />
                                )}
                                {uncompletedTodos.map((todo) => {
                                    const isSelected = selectedTodoId === todo.id;
                                    const completedSubs = todo.subtasks?.filter((s) => s.completed).length ?? 0;
                                    const totalSubs = todo.subtasks?.length ?? 0;
                                    return (
                                        <button
                                            key={todo.id}
                                            onClick={() => handleSelectTask(todo.id)}
                                            className={cn(
                                                "w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-all",
                                                isSelected
                                                    ? "bg-white/10 text-white font-bold"
                                                    : "hover:bg-neutral-800/80 text-neutral-300 hover:text-white",
                                            )}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                                <ListTodo className="w-3.5 h-3.5 shrink-0 text-white" />
                                                <span className="truncate">{todo.text}</span>
                                                {totalSubs > 0 && (
                                                    <span className="ml-auto text-[10px] font-mono text-neutral-400 shrink-0">
                                                        {completedSubs}/{totalSubs}
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                                        </button>
                                    );
                                })}
                                {uncompletedTodos.length === 0 && (
                                    <p className="text-xs text-neutral-500 text-center py-3">No pending tasks</p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {selectedTodo && selectedTodoSubtasks.length > 0 && (
                    <div className="w-full max-w-sm border border-border/40 rounded-[var(--radius)] bg-card/30 backdrop-blur-sm overflow-hidden">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/30 flex items-center gap-1.5">
                            <ListTodo className="w-3 h-3" />
                            Subtasks
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                            {selectedTodoSubtasks.map((subtask) => (
                                <button
                                    key={subtask.id}
                                    onClick={() => {
                                        if (selectedTodo) {
                                            toggleSubtask(selectedTodo.id, subtask.id);
                                        }
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors border-b border-border/20 last:border-b-0 cursor-pointer",
                                        subtask.completed
                                            ? "opacity-50"
                                            : "hover:bg-accent/50",
                                    )}
                                >
                                    {subtask.completed ? (
                                        <CheckSquare2 className="w-4 h-4 text-white shrink-0" />
                                    ) : (
                                        <Square className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                                    )}
                                    <span className={cn(subtask.completed && "line-through")}>
                                        {subtask.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedTodo && selectedTodo.notes && selectedTodo.notes.trim().length > 0 && (
                    <div className="w-full max-w-sm border border-border/40 rounded-[var(--radius)] bg-card/30 backdrop-blur-sm overflow-hidden p-3 text-xs space-y-1">
                        <div className="text-muted-foreground font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                            <FileText className="w-3 h-3 text-muted-foreground" /> Task Notes
                        </div>
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs">
                            {selectedTodo.notes}
                        </p>
                    </div>
                )}

                <div className="w-full max-w-xs">
                    <Progress value={progressValue} className="h-1.5" />
                </div>
            </div>

            <div className="grid grid-cols-3 items-center w-full max-w-[280px] sm:max-w-xs">
                <div className="flex items-center gap-2 sm:gap-3 justify-start">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer"
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
                                ? "bg-white text-black hover:bg-gray-200"
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

                    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer"
                                title="Timer Settings"
                            >
                                <Settings className="size-4 sm:size-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Timer Settings</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                                        <Label className="font-medium">
                                            Work Duration
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={pomodoroSettings.work}
                                                onChange={(e) =>
                                                    setPomodoroSettings({
                                                        work:
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 25,
                                                    })
                                                }
                                                className="w-16 h-8 text-center bg-background/50 border-none"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                min
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                                        <Label className="font-medium">
                                            Short Break Duration
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={pomodoroSettings.break}
                                                onChange={(e) =>
                                                    setPomodoroSettings({
                                                        break:
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 5,
                                                    })
                                                }
                                                className="w-16 h-8 text-center bg-background/50 border-none"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                min
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                                        <Label className="font-medium">
                                            Long Break Duration
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={pomodoroSettings.longBreak || 15}
                                                onChange={(e) =>
                                                    setPomodoroSettings({
                                                        longBreak:
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 15,
                                                    })
                                                }
                                                className="w-16 h-8 text-center bg-background/50 border-none"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                min
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-[var(--radius)] bg-primary/5 border border-primary/10 flex items-center justify-between shadow-inner">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">
                                            Auto-start Break
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground">
                                            Launch break timer immediately after
                                            work
                                        </p>
                                    </div>
                                    <Switch
                                        checked={pomodoroSettings.autoStartBreak}
                                        onCheckedChange={(checked: boolean) =>
                                            setPomodoroSettings({
                                                autoStartBreak: checked,
                                            })
                                        }
                                        className="scale-110"
                                    />
                                </div>

                                <div className="p-4 rounded-[var(--radius)] bg-primary/5 border border-primary/10 flex items-center justify-between shadow-inner">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-semibold">
                                            Auto-start Timer
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground">
                                            Launch focus timer immediately after break
                                        </p>
                                    </div>
                                    <Switch
                                        checked={pomodoroSettings.autoStartTimer}
                                        onCheckedChange={(checked: boolean) =>
                                            setPomodoroSettings({
                                                autoStartTimer: checked,
                                            })
                                        }
                                        className="scale-110"
                                    />
                                </div>

                                <div className="p-3 rounded-[var(--radius)] bg-secondary/20 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="font-medium text-xs">
                                            Pomodoro Cycle Count
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground">
                                            Currently Pomodoro {((pomodoroCount || 0) % 4) + 1} of 4
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={resetPomodoroCount}
                                        disabled={(pomodoroCount || 0) % 4 === 0 && (pomodoroCount || 0) === 0}
                                        className="text-xs h-8 px-2.5 cursor-pointer"
                                    >
                                        <RotateCcw className="w-3 h-3 mr-1.5" />
                                        Reset to 1 of 4
                                    </Button>
                                </div>

                                <Button
                                    className="w-full mt-4"
                                    onClick={() => setSettingsOpen(false)}
                                >
                                    Confirm Changes
                                </Button>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    "Are you sure you want to reset all data to defaults? This will clear all tasks, sessions, mood notes, and stats.",
                                                )
                                            ) {
                                                resetAllData();
                                                setSettingsOpen(false);
                                            }
                                        }}
                                        className="w-full py-2.5 rounded-md font-mono font-bold text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all bg-transparent cursor-pointer"
                                    >
                                        Reset All Data
                                    </button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
