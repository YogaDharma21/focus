"use client";

import { useAppStore, TodoItem } from "@/lib/store";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, CheckCircle2, Settings2, ChevronDown, ListTodo } from "lucide-react";
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
import { SessionReportDialog, type SessionReportData } from "./SessionReportDialog";

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
    } = useAppStore();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [completedDuration, setCompletedDuration] = useState(0);

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
        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.volume = 0.5;
                audioRef.current.play().catch(() => {
                    const fallback = new Audio("/soundeffect.mp3");
                    fallback.volume = 0.5;
                    fallback.play().catch(() => {});
                });
            } else {
                const fallback = new Audio("/soundeffect.mp3");
                fallback.volume = 0.5;
                fallback.play().catch(() => {});
            }
        } catch {
            // ignore
        }
    }, []);

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
            setCompletedDuration(duration);
            setReportOpen(true);
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
        } else if (timerMode === "STOPWATCH" && duration > 0) {
            setPreviousMode("STOPWATCH");
            const breakSeconds = Math.floor(duration / 5);
            if (breakSeconds > 0) {
                setTimerMode("POMODORO");
                setTimerState("BREAK");
                setTimeLeft(breakSeconds);
            } else {
                setTimeLeft(0);
            }
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
        sessionStartTimeRef.current = null;
        setDeepFocusMode(false);
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
        sessionName,
        selectedTodoId,
        selectedSubtaskId,
        todos,
        updateTodo,
        toggleTodo,
        toggleSubtask,
    ]);

    const handleReportSubmit = (data: SessionReportData) => {
        addSession({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            duration: data.duration,
            mode: timerMode,
        });
        setReportOpen(false);
    };

    const prevSettingsRef = useRef({ work: pomodoroSettings.work, break: pomodoroSettings.break });

    useEffect(() => {
        const prev = prevSettingsRef.current;
        if (pomodoroSettings.work !== prev.work || pomodoroSettings.break !== prev.break) {
            prevSettingsRef.current = { work: pomodoroSettings.work, break: pomodoroSettings.break };
            if (timerMode === "POMODORO" && timerState === "WORK") {
                setTimeLeft(pomodoroSettings.work * 60);
            } else if (timerMode === "POMODORO" && timerState === "BREAK") {
                setTimeLeft(pomodoroSettings.break * 60);
            }
        }
    }, [pomodoroSettings.work, pomodoroSettings.break, timerMode, timerState, setTimeLeft]);



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
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-700 relative">
            <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />

            <div className="flex gap-2 mb-3 p-1 bg-secondary/30 rounded-[var(--radius)] backdrop-blur-md">
                <button
                    onClick={() => {
                        setTimerMode("POMODORO");
                        setTimerState("WORK");
                        setIsActive(false);
                        setTimeLeft(pomodoroSettings.work * 60);
                    }}
                    className={cn(
                        "px-6 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-300",
                        timerMode === "POMODORO" && timerState === "WORK"
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    Pomodoro
                </button>
                <button
                    onClick={() => {
                        setTimerMode("POMODORO");
                        setTimerState("BREAK");
                        setIsActive(false);
                        setTimeLeft(pomodoroSettings.break * 60);
                    }}
                    className={cn(
                        "px-6 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-300",
                        timerMode === "POMODORO" && timerState === "BREAK"
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    Break
                </button>
                <button
                    onClick={() => {
                        setTimerMode("STOPWATCH");
                        setIsActive(false);
                        setTimeLeft(0);
                    }}
                    className={cn(
                        "px-6 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-300",
                        timerMode === "STOPWATCH"
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    Flow
                </button>
            </div>

            <div className="flex flex-col items-center gap-4 mb-12 w-full">
                <div className="text-[3.5rem] sm:text-[5rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex flex-col items-center gap-2 w-full max-w-sm">
                    <Popover open={taskSelectorOpen} onOpenChange={setTaskSelectorOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className={cn(
                                    "w-full text-center bg-transparent text-xl placeholder:text-muted-foreground/70 text-foreground transition-all",
                                    "border border-dashed border-border/60 hover:border-border rounded-[var(--radius)] px-4 py-2",
                                    selectedTodo && "border-solid border-primary/40 bg-primary/5",
                                )}
                            >
                                {selectedTodo ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <ListTodo className="w-4 h-4 text-primary shrink-0" />
                                        <span className="truncate">{selectedTodo.text}</span>
                                    </span>
                                ) : sessionName ? (
                                    <span className="truncate">{sessionName}</span>
                                ) : (
                                    <span className="text-muted-foreground/70">What are you focusing on?</span>
                                )}
                                <ChevronDown className="w-4 h-4 inline-block ml-1 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-80 overflow-y-auto p-1">
                            <div className="flex flex-col">
                                <button
                                    onClick={() => {
                                        setSessionName("");
                                        setSelectedTodoId(null);
                                        setSelectedSubtaskId(null);
                                        setTaskSelectorOpen(false);
                                    }}
                                    className={cn(
                                        "text-left px-3 py-2 text-sm rounded-sm transition-colors",
                                        !selectedTodo && !sessionName
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                    )}
                                >
                                    Custom focus...
                                </button>
                                {uncompletedTodos.length > 0 && (
                                    <div className="h-px bg-border my-1" />
                                )}
                                {uncompletedTodos.map((todo) => (
                                    <button
                                        key={todo.id}
                                        onClick={() => handleSelectTask(todo.id)}
                                        className={cn(
                                            "text-left px-3 py-2 text-sm rounded-sm transition-colors flex items-center gap-2",
                                            selectedTodoId === todo.id
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "hover:bg-accent hover:text-accent-foreground",
                                        )}
                                    >
                                        <ListTodo className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                                        <span className="truncate">{todo.text}</span>
                                        {todo.subtasks && todo.subtasks.length > 0 && (
                                            <span className="ml-auto text-xs text-muted-foreground shrink-0">
                                                {todo.subtasks.filter((s) => s.completed).length}/{todo.subtasks.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                                {uncompletedTodos.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-3">No tasks available</p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {!selectedTodo && (
                        <Input
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && sessionName.trim()) {
                                    e.preventDefault();
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
                            }}
                            placeholder="Or type a custom focus..."
                            className="text-center bg-transparent border-none text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50 text-foreground max-w-sm"
                        />
                    )}
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
                                        if (selectedSubtaskId === subtask.id) {
                                            setSelectedSubtaskId(null);
                                        } else {
                                            setSelectedSubtaskId(subtask.id);
                                        }
                                    }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors border-b border-border/20 last:border-b-0",
                                        subtask.completed
                                            ? "opacity-50"
                                            : selectedSubtaskId === subtask.id
                                              ? "bg-primary/10 text-primary"
                                              : "hover:bg-accent/50",
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                                            subtask.completed
                                                ? "bg-primary border-primary"
                                                : selectedSubtaskId === subtask.id
                                                  ? "border-primary bg-primary/20"
                                                  : "border-border",
                                        )}
                                    >
                                        {subtask.completed && (
                                            <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                                        )}
                                    </div>
                                    <span className={cn(subtask.completed && "line-through")}>
                                        {subtask.text}
                                    </span>
                                </button>
                            ))}
                        </div>
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
                        className="w-10 h-10 rounded-[var(--radius)] border-2 hover:bg-white/5 hover:border-white/20 transition-all"
                        onClick={resetTimer}
                    >
                        <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>

                    <DistractionCounter />
                </div>

                <div className="flex items-center justify-center">
                    <Button
                        size="icon"
                        className={cn(
                            "w-16 h-16 sm:w-20 sm:h-20 rounded-[var(--radius)] shadow-md hover:shadow active:scale-95 transition-all duration-300",
                            isActive
                                ? "bg-white text-black hover:bg-gray-200"
                                : "bg-primary text-primary-foreground",
                        )}
                        onClick={toggleTimer}
                    >
                        {isActive ? (
                            <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
                        ) : (
                            <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-0.5 sm:ml-1" />
                        )}
                    </Button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 justify-end">
                    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-white/5 hover:border-white/20 transition-all"
                                title="Timer Settings"
                            >
                                <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
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
                                            Break Duration
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
                                        className="w-full py-2.5 rounded-full font-mono font-bold text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all bg-transparent cursor-pointer"
                                    >
                                        Reset All Extension Data
                                    </button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 transition-all",
                            isActive
                                ? "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                                : "opacity-50 cursor-not-allowed",
                        )}
                        onClick={handleCompleteSession}
                        disabled={!isActive}
                        title="Complete Session"
                    >
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                </div>
            </div>

            <SessionReportDialog
                open={reportOpen}
                onOpenChange={setReportOpen}
                duration={completedDuration}
                tasks={[]}
                sessionName={sessionName}
                onSubmit={handleReportSubmit}
            />
        </div>
    );
}
