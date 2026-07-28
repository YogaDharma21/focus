"use client";

import { useAppStore } from "@/lib/store";
import { Pause, Play, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useCallback } from "react";
import { DistractionCounter } from "./DistractionCounter";
import { SessionReportDialog, type SessionReportData } from "./SessionReportDialog";

export function DeepFocusOverlay() {
    const {
        timeLeft,
        isActive,
        sessionName,
        setIsActive,
        setDeepFocusMode,
        timerMode,
        timerState,
        previousMode,
        pomodoroSettings,
        setTimeLeft,
        setTimerState,
        setTimerMode,
        setPreviousMode,
        setSessionStartTime,
        addSession,
        todos,
        selectedTodoId,
        selectedSubtaskId,
    } = useAppStore();

    const [reportOpen, setReportOpen] = useState(false);
    const [completedDuration, setCompletedDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sessionStartTimeRef = useRef<number | null>(null);

    const playSound = useCallback(() => {
        try {
            const audio = new Audio("/soundeffect.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.volume = 0.5;
                    audioRef.current.play().catch(() => {});
                }
            });
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

    const handleCompleteSession = useCallback(() => {
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
        } else {
            setDeepFocusMode(false);
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
        sessionStartTimeRef.current = null;
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
    ]);

    const handleReportSubmit = (data: SessionReportData) => {
        addSession({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            duration: data.duration,
            mode: timerMode,
        });
        setReportOpen(false);
        setDeepFocusMode(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setDeepFocusMode(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setDeepFocusMode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const toggleTimer = () => setIsActive(!isActive);

    const exitFocusMode = () => setDeepFocusMode(false);

    return (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
            <audio ref={audioRef} src="/soundeffect.mp3" preload="auto" />
            
            <button
                onClick={exitFocusMode}
                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Exit focus mode"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center gap-6">
                <div
                    className={cn(
                        "text-[4rem] sm:text-[6rem] md:text-[8rem] font-bold leading-none tracking-tighter tabular-nums text-foreground select-none",
                        isActive && "animate-pulse",
                    )}
                >
                    {formatTime(timeLeft)}
                </div>

                {sessionName && (
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-lg sm:text-xl text-muted-foreground text-center max-w-md px-4 truncate">
                            {sessionName}
                        </div>
                        {selectedTodoId && selectedSubtaskId && (() => {
                            const todo = todos.find((t) => t.id === selectedTodoId);
                            const subtask = todo?.subtasks?.find((s) => s.id === selectedSubtaskId);
                            return subtask ? (
                                <div className="text-sm text-muted-foreground/60 text-center max-w-md px-4 truncate">
                                    {subtask.text}
                                </div>
                            ) : null;
                        })()}
                    </div>
                )}

                <div className="flex items-center gap-4 mt-8">
                    <DistractionCounter />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-14 h-14 rounded-[var(--radius)] border-2 hover:bg-white/5 hover:border-white/20 transition-all"
                        onClick={toggleTimer}
                    >
                        {isActive ? (
                            <Pause className="w-6 h-6" />
                        ) : (
                            <Play className="w-6 h-6 ml-1" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "w-14 h-14 rounded-[var(--radius)] border-2 transition-all",
                            isActive
                                ? "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                                : "opacity-50 cursor-not-allowed",
                        )}
                        onClick={handleCompleteSession}
                        disabled={!isActive}
                        title="Complete Session"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            <div className="absolute bottom-8 text-xs text-muted-foreground">
                Press <kbd className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-mono border border-border">Esc</kbd> to exit focus mode
            </div>

            <SessionReportDialog
                open={reportOpen}
                onOpenChange={(open) => {
                    setReportOpen(open);
                    if (!open) {
                        setDeepFocusMode(false);
                    }
                }}
                duration={completedDuration}
                tasks={[]}
                sessionName={sessionName}
                onSubmit={handleReportSubmit}
            />
        </div>
    );
}
