"use client";

import { useAppStore } from "@/lib/store";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Play, Pause, RotateCcw, CheckCircle2, Settings2, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { DistractionCounter } from "./DistractionCounter";

export function FocusTimer() {
    const {
        timerMode,
        timerState,
        timeLeft,
        isActive,
        setTimerMode,
        setTimerState,
        setTimeLeft,
        setIsActive,
        setSessionStartTime,
        sessionName,
        setSessionName,
        focusedTodoId,
        setFocusedTodoId,
        focusedSubtaskId,
        setFocusedSubtaskId,
        todos,
        addSession,
        pomodoroSettings,
        setPomodoroSettings,
    } = useAppStore();

    const [settingsOpen, setSettingsOpen] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const sessionStartTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.5;
        }
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

        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }

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
                duration: duration,
                mode: timerMode,
                todoId: focusedTodoId,
            });
        }

        if (timerMode === "POMODORO" && timerState === "WORK") {
            setTimerState("BREAK");
            setTimeLeft(pomodoroSettings.break * 60);
            if (pomodoroSettings.autoStartBreak) {
                setIsActive(true);
            }
        } else if (timerMode === "POMODORO" && timerState === "BREAK") {
            setTimerState("WORK");
            setTimeLeft(pomodoroSettings.work * 60);
        } else if (timerMode === "STOPWATCH") {
            setTimeLeft(0);
        }
        sessionStartTimeRef.current = null;
    }, [
        addSession,
        timerMode,
        timerState,
        timeLeft,
        setTimeLeft,
        setIsActive,
        setTimerState,
        pomodoroSettings,
        focusedTodoId,
    ]);

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

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && (timerState === "WORK" || timerState === "BREAK")) {
            interval = setInterval(() => {
                if (timerMode === "POMODORO") {
                    setTimeLeft(timeLeft - 1);
                    if (timeLeft <= 1) {
                        setIsActive(false);
                        handleCompleteSession();
                    }
                } else if (timerMode === "STOPWATCH") {
                    setTimeLeft(timeLeft + 1);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [
        isActive,
        timerState,
        timeLeft,
        timerMode,
        setTimeLeft,
        setIsActive,
        handleCompleteSession,
    ]);

    const toggleTimer = () => setIsActive(!isActive);

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
            <audio ref={audioRef} src="/soundeffect.mp3" />

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
                            ? "bg-green-500 text-primary-foreground shadow-md"
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

            <div className="mb-3 flex justify-center md:absolute md:top-0 md:right-0 md:mb-0">
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Settings2 className="w-5 h-5" />
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
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col items-center gap-8 mb-12 w-full">
                <div className="text-[3.5rem] sm:text-[5rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground drop-shadow">
                    {formatTime(timeLeft)}
                </div>

                <div className="w-full max-w-sm flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 w-full">
                        <Select
                            value={focusedTodoId ? (focusedSubtaskId ? `${focusedTodoId}/${focusedSubtaskId}` : focusedTodoId) : ""}
                            onValueChange={(value) => {
                                if (value.includes("/")) {
                                    const [todoId, subtaskId] = value.split("/");
                                    const todo = todos.find((t) => t.id === todoId);
                                    const subtask = todo?.subtasks?.find((s) => s.id === subtaskId);
                                    if (todo && subtask) {
                                        setFocusedTodoId(todoId);
                                        setFocusedSubtaskId(subtaskId);
                                        setSessionName(subtask.text);
                                    }
                                } else {
                                    const todo = todos.find((t) => t.id === value);
                                    if (todo) {
                                        setFocusedTodoId(value);
                                        setFocusedSubtaskId(null);
                                        setSessionName(todo.text);
                                    }
                                }
                            }}
                        >
                            <SelectTrigger className="flex-1 bg-transparent border-none text-muted-foreground/70 focus-visible:ring-0 h-auto justify-center">
                                <SelectValue placeholder="Link a task (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {todos.filter((t) => !t.completed && t.groupId !== "finished" && t.groupId !== "completed").length === 0 && (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        No active tasks
                                    </div>
                                )}
                                {todos
                                    .filter((t) => !t.completed && t.groupId !== "finished" && t.groupId !== "completed")
                                    .map((todo) => (
                                        <React.Fragment key={todo.id}>
                                            <SelectItem value={todo.id}>
                                                {todo.text}
                                            </SelectItem>
                                            {todo.subtasks?.map((subtask) => (
                                                <SelectItem key={subtask.id} value={`${todo.id}/${subtask.id}`}>
                                                    <span className="pl-4 text-muted-foreground">↳ {subtask.text}</span>
                                                </SelectItem>
                                            ))}
                                        </React.Fragment>
                                    ))}
                            </SelectContent>
                        </Select>
                        {focusedTodoId && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                    setFocusedTodoId(null);
                                    setFocusedSubtaskId(null);
                                }}
                                title="Unlink task"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    <Input
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        placeholder="What are you focusing on?"
                        className="text-center bg-transparent border-none text-xl focus-visible:ring-0 placeholder:text-muted-foreground/70 text-foreground max-w-sm"
                    />
                </div>

                <div className="w-full max-w-xs">
                    <Progress value={progressValue} className="h-1.5" />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-[var(--radius)] border-2 hover:bg-white/5 hover:border-white/20 transition-all"
                    onClick={resetTimer}
                >
                    <RotateCcw className="w-5 h-5" />
                </Button>

                <DistractionCounter />

                <Button
                    size="icon"
                    className={cn(
                        "w-20 h-20 rounded-[var(--radius)] shadow-md hover:shadow active:scale-95 transition-all duration-300",
                        isActive
                            ? "bg-white text-black hover:bg-gray-200"
                            : "bg-primary text-primary-foreground",
                    )}
                    onClick={toggleTimer}
                >
                    {isActive ? (
                        <Pause className="w-8 h-8 fill-current" />
                    ) : (
                        <Play className="w-8 h-8 fill-current ml-1" />
                    )}
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "w-12 h-12 rounded-[var(--radius)] border-2 transition-all",
                        isActive
                            ? "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                            : "opacity-50 cursor-not-allowed",
                    )}
                    onClick={handleCompleteSession}
                    disabled={!isActive}
                    title="Complete Session"
                >
                    <CheckCircle2 className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
