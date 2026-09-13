"use client";

import { useAppStore, TodoItem } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, CheckCircle2, Focus, ChevronDown, ListTodo, FileText, Check, Square, CheckSquare2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DistractionCounter } from "./DistractionCounter";

export function FocusTimer() {
    const {
        timeLeft,
        isActive,
        setTimeLeft,
        setIsActive,
        setSessionStartTime,
        sessionName,
        setSessionName,
        addSession,
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
            timeLeft: s.timeLeft,
            isActive: s.isActive,
            setTimeLeft: s.setTimeLeft,
            setIsActive: s.setIsActive,
            setSessionStartTime: s.setSessionStartTime,
            sessionName: s.sessionName,
            setSessionName: s.setSessionName,
            addSession: s.addSession,
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
                    tasks: selectedTodo ? [selectedTodo.text] : [],
                }),
            }).catch(() => {});
        }

        const breakSeconds = Math.floor(duration / 5);
        if (breakSeconds > 0) {
            setTimeLeft(breakSeconds);
        } else {
            setTimeLeft(0);
        }

        setDeepFocusMode(false);

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
                toggleTodo(focusedTask.id);
            }
        }
        setSessionStartTime(null);
    }, [
        timeLeft,
        setTimeLeft,
        setIsActive,
        setDeepFocusMode,
        playSound,
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
        setTimeLeft(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const progressValue = 100;

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh] relative">
            <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />

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
                    <div className="w-full max-w-sm border border-border/40 rounded-[var(--radius)] bg-card overflow-hidden">
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
                    <div className="w-full max-w-sm border border-border/40 rounded-[var(--radius)] bg-card overflow-hidden p-3 text-xs space-y-1">
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

                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer"
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
