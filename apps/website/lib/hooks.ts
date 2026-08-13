import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);

        return () => media.removeEventListener("change", listener);
    }, [matches, query]);

    return matches;
}

export function useTimerEngine() {
    const {
        isActive,
        timerMode,
        timerState,
        previousMode,
        setTimeLeft,
        setIsActive,
        setTimerState,
        setTimerMode,
        setPreviousMode,
        pomodoroSettings,
        addSession,
        setDeepFocusMode,
        soundEffectVolume,
        soundEffectEnabled,
    } = useAppStore();

    const handleAutoCompleteSession = React.useCallback(() => {
        setIsActive(false);

        try {
            if (soundEffectEnabled ?? true) {
                const audio = new Audio("/soundeffect.mp3");
                audio.volume = (soundEffectVolume ?? 80) / 100;
                audio.play().catch(() => {});
            }
        } catch {
            // ignore
        }

        const duration =
            timerMode === "POMODORO"
                ? (timerState === "WORK" ? pomodoroSettings.work * 60 : pomodoroSettings.break * 60)
                : 0;

        if (duration > 0) {
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: timerMode,
            });
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
        }
        setDeepFocusMode(false);
    }, [
        timerMode,
        timerState,
        previousMode,
        setTimeLeft,
        setIsActive,
        setTimerState,
        setTimerMode,
        setPreviousMode,
        setDeepFocusMode,
        pomodoroSettings,
        addSession,
    ]);

    const autoCompleteRef = useRef(handleAutoCompleteSession);
    useEffect(() => {
        autoCompleteRef.current = handleAutoCompleteSession;
    }, [handleAutoCompleteSession]);

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            const { timerMode: currentMode } = useAppStore.getState();
            if (currentMode === "POMODORO") {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        autoCompleteRef.current();
                        return 0;
                    }
                    return Math.max(0, prev - 1);
                });
            } else if (currentMode === "STOPWATCH") {
                setTimeLeft((prev) => prev + 1);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, setTimeLeft]);
}
