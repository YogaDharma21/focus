import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";

export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (callback) => {
            const media = window.matchMedia(query);
            media.addEventListener("change", callback);
            return () => media.removeEventListener("change", callback);
        },
        () => window.matchMedia(query).matches,
        () => false
    );
}

export function useTimerEngine() {
    const {
        isActive,
        timerMode,
        timerState,
        timeLeft,
        setTimeLeft,
        setIsActive,
        setTimerState,
        addSession,
        setDeepFocusMode,
        soundEnabled,
        soundEffectVolume,
        soundEffectEnabled,
        setIsMusicPlaying,
        autoStartBreak,
        autoStartFlow,
        pomodoroInterval,
        activeTag,
    } = useAppStore(
        useShallow((s) => ({
            isActive: s.isActive,
            timerMode: s.timerMode,
            timerState: s.timerState,
            timeLeft: s.timeLeft,
            setTimeLeft: s.setTimeLeft,
            setIsActive: s.setIsActive,
            setTimerState: s.setTimerState,
            addSession: s.addSession,
            setDeepFocusMode: s.setDeepFocusMode,
            soundEnabled: s.soundEnabled ?? true,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
            setIsMusicPlaying: s.setIsMusicPlaying,
            autoStartBreak: s.autoStartBreak ?? true,
            autoStartFlow: s.autoStartFlow ?? true,
            pomodoroInterval: s.pomodoroInterval ?? "25/5",
            activeTag: s.activeTag ?? "work",
        }))
    );

    const prevTimerRef = useRef({ isActive, timerMode, timerState });

    const playSound = React.useCallback(() => {
        if (!soundEnabled || !soundEffectEnabled) return;
        try {
            const audio = new Audio("/soundeffect.mp3");
            audio.volume = (soundEffectVolume ?? 80) / 100;
            audio.play().catch(() => {});
        } catch {
            // ignore
        }
    }, [soundEnabled, soundEffectEnabled, soundEffectVolume]);

    useEffect(() => {
        const prev = prevTimerRef.current;
        const isRunningFlow = isActive && timerState === "FLOW";
        const wasRunningFlow = prev.isActive && prev.timerState === "FLOW";

        if (isRunningFlow && !wasRunningFlow) {
            setIsMusicPlaying(true);
        } else if (!isRunningFlow && wasRunningFlow) {
            setIsMusicPlaying(false);
        }

        prevTimerRef.current = { isActive, timerMode, timerState };
    }, [isActive, timerMode, timerState, setIsMusicPlaying]);

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (timerMode === "POMODORO") {
                    const next = prev - 1;
                    if (next <= 0) {
                        playSound();
                        const isLong = pomodoroInterval === "50/10";
                        const workSecs = isLong ? 50 * 60 : 25 * 60;
                        const breakSecs = isLong ? 10 * 60 : 5 * 60;

                        if (timerState === "FLOW") {
                            addSession({
                                id: crypto.randomUUID(),
                                date: new Date().toISOString(),
                                duration: workSecs,
                                mode: "POMODORO",
                                tag: activeTag || "work",
                            });
                            fetch("/api/sessions", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    duration: workSecs,
                                    tag: activeTag || "work",
                                }),
                            }).catch(() => {});

                            setTimerState("BREAK");
                            setIsActive(autoStartBreak);
                            return breakSecs;
                        } else {
                            setTimerState("FLOW");
                            if (autoStartFlow) {
                                setIsActive(true);
                                setDeepFocusMode(true);
                            } else {
                                setIsActive(false);
                            }
                            return workSecs;
                        }
                    }
                    return next;
                }

                // STOPWATCH mode
                if (timerState === "BREAK") {
                    const next = prev - 1;
                    if (next <= 0) {
                        playSound();
                        setTimerState("FLOW");
                        if (autoStartFlow) {
                            setDeepFocusMode(true);
                        } else {
                            setIsActive(false);
                        }
                        return 0;
                    }
                    return next;
                }
                return prev + 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [
        isActive,
        timerMode,
        timerState,
        pomodoroInterval,
        activeTag,
        autoStartBreak,
        autoStartFlow,
        playSound,
        setTimeLeft,
        setTimerState,
        setIsActive,
        setDeepFocusMode,
        addSession,
    ]);
}
