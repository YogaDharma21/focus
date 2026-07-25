"use client";

import { useAppStore } from "@/lib/store";
import { Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
    } = useAppStore();

    const [showHint, setShowHint] = useState(true);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setDeepFocusMode(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setDeepFocusMode]);

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

    const exitFocusMode = () => setDeepFocusMode(false);

    return (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
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
                    <div className="text-lg sm:text-xl text-muted-foreground text-center max-w-md px-4 truncate">
                        {sessionName}
                    </div>
                )}

                <div className="flex items-center gap-4 mt-8">
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
