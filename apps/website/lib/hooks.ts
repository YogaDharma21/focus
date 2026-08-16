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
        const state = useAppStore.getState();

        try {
            if (state.soundEffectEnabled ?? true) {
                const audio = new Audio("/soundeffect.mp3");
                audio.volume = (state.soundEffectVolume ?? 80) / 100;
                audio.play().catch(() => {});
            }
        } catch {
            // ignore
        }

        const duration =
            state.timerMode === "POMODORO"
                ? (state.timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60)
                : 0;

        if (duration > 0) {
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: state.timerMode,
            });
        }

        if (state.timerMode === "POMODORO" && state.timerState === "WORK") {
            setPreviousMode("POMODORO");
            setTimerState("BREAK");
            setTimeLeft(state.pomodoroSettings.break * 60);
            if (state.pomodoroSettings.autoStartBreak) {
                setIsActive(true);
            }
            setDeepFocusMode(false);
        } else if (state.timerMode === "POMODORO" && state.timerState === "BREAK") {
            if (state.previousMode === "STOPWATCH") {
                setTimerMode("STOPWATCH");
                setTimerState("WORK");
                setTimeLeft(0);
            } else {
                setTimerMode("POMODORO");
                setTimerState("WORK");
                setTimeLeft(state.pomodoroSettings.work * 60);
            }
            if (state.pomodoroSettings.autoStartTimer) {
                setIsActive(true);
                setDeepFocusMode(true);
            } else {
                setDeepFocusMode(false);
            }
        }
    }, [
        setTimeLeft,
        setIsActive,
        setTimerState,
        setTimerMode,
        setPreviousMode,
        setDeepFocusMode,
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
