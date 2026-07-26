"use client";

import { useAppStore } from "@/lib/store";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, CheckCircle2, Settings2 } from "lucide-react";
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
import { SessionReportDialog, type SessionReportData } from "./SessionReportDialog";

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
        addSession,
        pomodoroSettings,
        setPomodoroSettings,
    } = useAppStore();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [completedDuration, setCompletedDuration] = useState(0);

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
            setCompletedDuration(duration);
            setReportOpen(true);
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
        timerMode,
        timerState,
        timeLeft,
        setTimeLeft,
        setIsActive,
        setTimerState,
        pomodoroSettings,
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

                <Input
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="What are you focusing on?"
                    className="text-center bg-transparent border-none text-xl focus-visible:ring-0 placeholder:text-muted-foreground/70 text-foreground max-w-sm"
                />

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
