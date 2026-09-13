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
        timeLeft,
        setTimeLeft,
        setIsActive,
        addSession,
        setDeepFocusMode,
        soundEffectVolume,
        soundEffectEnabled,
        setIsMusicPlaying,
    } = useAppStore(
        useShallow((s) => ({
            isActive: s.isActive,
            timerMode: s.timerMode,
            timeLeft: s.timeLeft,
            setTimeLeft: s.setTimeLeft,
            setIsActive: s.setIsActive,
            addSession: s.addSession,
            setDeepFocusMode: s.setDeepFocusMode,
            soundEffectVolume: s.soundEffectVolume,
            soundEffectEnabled: s.soundEffectEnabled,
            setIsMusicPlaying: s.setIsMusicPlaying,
        }))
    );

    const prevTimerRef = useRef({ isActive, timerMode });

    useEffect(() => {
        const prev = prevTimerRef.current;
        const isRunningFocus = isActive && timerMode === "STOPWATCH";
        const wasRunningFocus = prev.isActive && prev.timerMode === "STOPWATCH";

        if (isRunningFocus && !wasRunningFocus) {
            setIsMusicPlaying(true);
        } else if (!isRunningFocus && wasRunningFocus) {
            setIsMusicPlaying(false);
        }

        prevTimerRef.current = { isActive, timerMode };
    }, [isActive, timerMode, setIsMusicPlaying]);

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

        const duration = timeLeft;
        if (duration > 0) {
            addSession({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                duration,
                mode: "STOPWATCH",
            });

            const breakSeconds = Math.floor(duration / 5);
            if (breakSeconds > 0) {
                setTimeLeft(breakSeconds);
            } else {
                setTimeLeft(0);
            }
        }

        setDeepFocusMode(false);
    }, [
        timeLeft,
        setTimeLeft,
        setIsActive,
        setDeepFocusMode,
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
            setTimeLeft((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, setTimeLeft]);
}
