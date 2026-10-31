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
        }))
    );

    const prevTimerRef = useRef({ isActive, timerMode, timerState });

    useEffect(() => {
        const prev = prevTimerRef.current;
        const isRunningFlow = isActive && timerMode === "STOPWATCH" && timerState === "FLOW";
        const wasRunningFlow = prev.isActive && prev.timerMode === "STOPWATCH" && prev.timerState === "FLOW";

        if (isRunningFlow && !wasRunningFlow) {
            setIsMusicPlaying(true);
        } else if (!isRunningFlow && wasRunningFlow) {
            setIsMusicPlaying(false);
        }

        prevTimerRef.current = { isActive, timerMode, timerState };
    }, [isActive, timerMode, timerState, setIsMusicPlaying]);

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
                setTimerState("BREAK");
                setIsActive(autoStartBreak);
            } else {
                setTimeLeft(0);
            }
        }

        setDeepFocusMode(false);
    }, [
        timeLeft,
        setTimeLeft,
        setIsActive,
        setTimerState,
        setDeepFocusMode,
        addSession,
        soundEffectEnabled,
        soundEffectVolume,
        autoStartBreak,
    ]);

    const autoCompleteRef = useRef(handleAutoCompleteSession);
    useEffect(() => {
        autoCompleteRef.current = handleAutoCompleteSession;
    }, [handleAutoCompleteSession]);

    const lastTickRef = useRef<number>(0);

    useEffect(() => {
        if (!isActive) return;

        lastTickRef.current = Date.now();

        const tick = () => {
            const now = Date.now();
            if (now < lastTickRef.current) {
                lastTickRef.current = now;
                return;
            }

            const delta = Math.floor((now - lastTickRef.current) / 1000);
            if (delta <= 0) return;

            lastTickRef.current += delta * 1000;

            setTimeLeft((prev) => {
                if (timerState === "BREAK") {
                    const next = prev - delta;
                    if (next <= 0) {
                        try {
                            if ((soundEnabled ?? true) && (soundEffectEnabled ?? true)) {
                                const audio = new Audio("/soundeffect.mp3");
                                audio.volume = (soundEffectVolume ?? 80) / 100;
                                audio.play().catch(() => {});
                            }
                        } catch {
                            // ignore
                        }
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
                return prev + delta;
            });
        };

        const interval = setInterval(tick, 1000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                tick();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", tick);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", tick);
        };
    }, [
        isActive,
        setTimeLeft,
        timerState,
        setTimerState,
        setIsActive,
        setDeepFocusMode,
        autoStartFlow,
        soundEnabled,
        soundEffectEnabled,
        soundEffectVolume,
    ]);
}
