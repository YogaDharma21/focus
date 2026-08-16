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
        previousMode,
        setTimeLeft,
        setIsActive,
        setTimerState,
        setTimerMode,
        setPreviousMode,
        pomodoroSettings,
        pomodoroCount,
        setPomodoroCount,
        addSession,
        setDeepFocusMode,
        soundEffectVolume,
        soundEffectEnabled,
    } = useAppStore(
        useShallow((s) => ({
            isActive: s.isActive,
            timerMode: s.timerMode,
            timerState: s.timerState,
            previousMode: s.previousMode,
            setTimeLeft: s.setTimeLeft,
            setIsActive: s.setIsActive,
            setTimerState: s.setTimerState,
            setTimerMode: s.setTimerMode,
            setPreviousMode: s.setPreviousMode,
            pomodoroSettings: s.pomodoroSettings,
            pomodoroCount: s.pomodoroCount,
            setPomodoroCount: s.setPomodoroCount,
            addSession: s.addSession,
            setDeepFocusMode: s.setDeepFocusMode,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
        }))
    );

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

        if (timerMode === "POMODORO" && timerState === "WORK") {
            const duration = pomodoroSettings.work * 60;
            if (duration > 0) {
                addSession({
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    duration,
                    mode: "POMODORO",
                });
            }

            const nextCount = (pomodoroCount || 0) + 1;
            setPomodoroCount(nextCount);
            const isLongBreak = nextCount % 4 === 0;
            const breakDuration = isLongBreak
                ? (pomodoroSettings.longBreak || 15) * 60
                : (pomodoroSettings.break || 5) * 60;

            setPreviousMode("POMODORO");
            setTimerState("BREAK");
            setTimeLeft(breakDuration);
            if (pomodoroSettings.autoStartBreak) {
                setIsActive(true);
            }
            setDeepFocusMode(false);
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
            if (pomodoroSettings.autoStartTimer) {
                setIsActive(true);
                setDeepFocusMode(true);
            } else {
                setDeepFocusMode(false);
            }
        }
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
        pomodoroCount,
        setPomodoroCount,
        addSession,
        soundEffectEnabled,
        soundEffectVolume,
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
