"use client";

import { useAppStore } from "@/lib/store";
import { Pause, Play, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { DistractionCounter } from "./DistractionCounter";

export function DeepFocusOverlay() {
    const {
        timeLeft,
        isActive,
        sessionName,
        setIsActive,
        setDeepFocusMode,
        timerMode,
        timerState,
        pomodoroSettings,
        setTimeLeft,
        setTimerState,
        setTimerMode,
        addSession,
        setSessionStartTime,
        sessionStartTime,
    } = useAppStore();

    const [showHint, setShowHint] = useState(true);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleUltimateAction();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        timeLeft,
        isActive,
        timerMode,
        timerState,
        sessionStartTime,
        pomodoroSettings,
    ]);

    useEffect(() => {
        setShowHint(true);
        const timeout = setTimeout(() => setShowHint(false), 3000);
        return () => clearTimeout(timeout);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const toggleTimer = () => setIsActive(!isActive);

    const handleUltimateAction = () => {
        setIsActive(false);

        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }

        const elapsedSeconds =
            timerMode === "POMODORO" && sessionStartTime
                ? Math.floor(
                      (Date.now() -
                          new Date(sessionStartTime).getTime()) /
                          1000,
                  )
                : 0;
        const duration =
            timerMode === "STOPWATCH"
                ? timeLeft
                : Math.min(
                      elapsedSeconds,
                      timerState === "WORK"
                          ? pomodoroSettings.work * 60
                          : 0,
                  );

        if (duration > 0) {
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: timerMode,
            });
        }

        if (timerMode === "STOPWATCH" && timeLeft > 0 && timerState === "WORK") {
            setTimerState("BREAK");
            setTimeLeft(Math.floor(timeLeft / 5));
        } else if (timerMode === "STOPWATCH" && timerState === "BREAK") {
            setTimerState("WORK");
            setTimeLeft(0);
        } else if (timerMode === "POMODORO" && timerState === "WORK") {
            setTimerState("BREAK");
            setTimeLeft(pomodoroSettings.break * 60);
        } else if (timerMode === "POMODORO" && timerState === "BREAK") {
            setTimerState("WORK");
            setTimeLeft(pomodoroSettings.work * 60);
        }

        setSessionStartTime(null);
        setDeepFocusMode(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
            <button
                onClick={handleUltimateAction}
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
                    <div className="text-lg sm:text-xl text-muted-foreground text-center max-w-md px-4 truncate">
                        {sessionName}
                    </div>
                )}

                <div className="flex items-center gap-4 mt-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-14 h-14 rounded-full border-2 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50 transition-all"
                        onClick={handleUltimateAction}
                        disabled={timeLeft === 0 && !isActive}
                        title="Complete Session"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                    </Button>

                    <DistractionCounter />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-14 h-14 rounded-full border-2 hover:bg-white/5 hover:border-white/20 transition-all"
                        onClick={toggleTimer}
                    >
                        {isActive ? (
                            <Pause className="w-6 h-6" />
                        ) : (
                            <Play className="w-6 h-6 ml-1" />
                        )}
                    </Button>
                </div>
            </div>

            <audio ref={audioRef} src="/soundeffect.mp3" />

            <div
                className={cn(
                    "absolute bottom-8 text-xs text-muted-foreground transition-opacity duration-500",
                    showHint ? "opacity-100" : "opacity-0",
                )}
            >
                Press <kbd className="px-2 py-1 bg-secondary/50 rounded text-[10px] font-mono border border-border">Esc</kbd> to exit focus mode
            </div>
        </div>
    );
}
