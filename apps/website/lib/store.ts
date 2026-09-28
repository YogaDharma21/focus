import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewType = "FOCUS" | "JOURNAL" | "SETTINGS";

interface AppState {
    currentView: ViewType;
    setView: (view: ViewType) => void;

    localUrl: string;
    localPlaylist: { id: string; title: string; artist: string; url: string }[];
    setMediaUrl: (url: string) => void;
    mediaPlayerOpen: boolean;
    setMediaPlayerOpen: (open: boolean) => void;
    isMusicPlaying: boolean;
    setIsMusicPlaying: (playing: boolean) => void;
    musicVolume: number;
    setMusicVolume: (volume: number) => void;
    musicEnabled: boolean;
    setMusicEnabled: (enabled: boolean) => void;
    isMusicMuted: boolean;
    setIsMusicMuted: (muted: boolean) => void;
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    soundEffectVolume: number;
    setSoundEffectVolume: (volume: number) => void;
    soundEffectEnabled: boolean;
    setSoundEffectEnabled: (enabled: boolean) => void;

    timerMode: "STOPWATCH";
    timerState: "FLOW" | "BREAK";
    timeLeft: number;
    isActive: boolean;
    sessionStartTime: string | null;
    autoStartBreak: boolean;
    autoStartFlow: boolean;
    setTimerMode: (mode: "STOPWATCH") => void;
    setTimerState: (state: "FLOW" | "BREAK") => void;
    setTimeLeft: (time: number | ((prev: number) => number)) => void;
    setIsActive: (active: boolean) => void;
    setSessionStartTime: (time: string | null) => void;
    setAutoStartBreak: (enabled: boolean) => void;
    setAutoStartFlow: (enabled: boolean) => void;

    sessions: Session[];
    distractions: Distraction[];

    deepFocusMode: boolean;
    setDeepFocusMode: (mode: boolean) => void;
    theme: "light" | "dark";
    setTheme: (theme: "light" | "dark") => void;

    addSession: (session: Session) => void;
    addDistraction: (category: string) => void;

    resetAllData: () => void;
}

export interface Session {
    id: string;
    date: string;
    duration: number;
    mode: "STOPWATCH";
}

export interface Distraction {
    id: string;
    timestamp: string;
    category: string;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            currentView: "FOCUS",
            setView: (view) => set({ currentView: view }),

            localUrl: "/music1.mp3",
            localPlaylist: [
                {
                    id: "local-1",
                    title: "Lofi-Beats",
                    artist: "Lofi-Beats",
                    url: "/music1.mp3",
                },
            ],

            setMediaUrl: (url) => set({ localUrl: url }),
            mediaPlayerOpen: false,
            setMediaPlayerOpen: (open) => set({ mediaPlayerOpen: open }),
            isMusicPlaying: false,
            setIsMusicPlaying: (playing) => set({ isMusicPlaying: playing }),
            musicVolume: 60,
            setMusicVolume: (volume) => set({ musicVolume: volume }),
            musicEnabled: true,
            setMusicEnabled: (enabled) => set({ musicEnabled: enabled, ...(enabled ? {} : { isMusicPlaying: false }) }),
            isMusicMuted: false,
            setIsMusicMuted: (muted) => set({ isMusicMuted: muted }),
            soundEnabled: true,
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled, ...(enabled ? {} : { isMusicPlaying: false }) }),
            soundEffectVolume: 80,
            setSoundEffectVolume: (volume) => set({ soundEffectVolume: volume }),
            soundEffectEnabled: true,
            setSoundEffectEnabled: (enabled) => set({ soundEffectEnabled: enabled }),

            timerMode: "STOPWATCH",
            timerState: "FLOW",
            timeLeft: 0,
            isActive: false,
            sessionStartTime: null,
            setTimerMode: (mode) => set({ timerMode: mode }),
            setTimerState: (state) => set({ timerState: state }),
            setTimeLeft: (timeOrFn) =>
                set((state) => ({
                    timeLeft: typeof timeOrFn === "function" ? timeOrFn(state.timeLeft) : timeOrFn,
                })),
            setIsActive: (active) => set({ isActive: active }),
            setSessionStartTime: (time) => set({ sessionStartTime: time }),
            autoStartBreak: true,
            setAutoStartBreak: (enabled) => set({ autoStartBreak: enabled }),
            autoStartFlow: true,
            setAutoStartFlow: (enabled) => set({ autoStartFlow: enabled }),

            sessions: [],
            distractions: [],

            deepFocusMode: false,
            setDeepFocusMode: (mode) => set({ deepFocusMode: mode }),
            theme: "dark" as "light" | "dark",
            setTheme: (theme) => set({ theme }),

            addSession: (session) =>
                set((state) => ({
                    sessions: [...(state.sessions || []), session],
                })),

            addDistraction: (category) =>
                set((state) => ({
                    distractions: [...(state.distractions || []), {
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        category,
                    }],
                })),

            resetAllData: () => {
                useAppStore.persist.clearStorage();
                set({
                    currentView: "FOCUS",
                    localUrl: "/music1.mp3",
                    localPlaylist: [
                        {
                            id: "local-1",
                            title: "Lofi-Beats",
                            artist: "Lofi-Beats",
                            url: "/music1.mp3",
                        },
                    ],
                    mediaPlayerOpen: false,
                    isMusicPlaying: false,
                    timerMode: "STOPWATCH",
                    timerState: "FLOW",
                    timeLeft: 0,
                    isActive: false,
                    sessionStartTime: null,
                    autoStartBreak: true,
                    autoStartFlow: true,
                    sessions: [],
                    distractions: [],
                    deepFocusMode: false,
                    theme: "dark" as "light" | "dark",
                });
            },
        }),
        {
            name: "focus-app-storage-v2",
        },
    ),
);
