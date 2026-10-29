import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, Distraction, PlaylistItem, TimerState, ViewType, AudioMode, NoiseColorType, StreamStation } from "@focus/types";

export type { Session, Distraction, PlaylistItem, TimerState, ViewType, AudioMode, NoiseColorType, StreamStation };

export const DEFAULT_STATIONS: StreamStation[] = [
    {
        id: "station-lofi-beats",
        name: "Lofi Focus",
        url: "/music1.mp3",
        genre: "Chillhop",
    },
    {
        id: "station-somafm-groovesalad",
        name: "SomaFM Groove Salad",
        url: "https://ice1.somafm.com/groovesalad-128-mp3",
        genre: "Ambient Downtempo",
    },
    {
        id: "station-somafm-dronezone",
        name: "SomaFM Drone Zone",
        url: "https://ice1.somafm.com/dronezone-128-mp3",
        genre: "Deep Atmosphere",
    },
    {
        id: "station-somafm-defcon",
        name: "SomaFM DEF CON",
        url: "https://ice1.somafm.com/defcon-128-mp3",
        genre: "Electronic Chill",
    },
];

interface AppState {
    currentView: ViewType;
    setView: (view: ViewType) => void;

    audioMode: AudioMode;
    setAudioMode: (mode: AudioMode) => void;
    noiseColor: NoiseColorType;
    setNoiseColor: (color: NoiseColorType) => void;

    stations: StreamStation[];
    activeStationId: string;
    setActiveStationId: (id: string) => void;
    addCustomStation: (name: string, url: string) => void;
    removeCustomStation: (id: string) => void;

    localUrl: string;
    localPlaylist: PlaylistItem[];
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
    timerState: TimerState;
    timeLeft: number;
    isActive: boolean;
    sessionStartTime: string | null;
    autoStartBreak: boolean;
    autoStartFlow: boolean;
    setTimerMode: (mode: "STOPWATCH") => void;
    setTimerState: (state: TimerState) => void;
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

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            currentView: "FOCUS",
            setView: (view) => set({ currentView: view }),

            audioMode: "stream",
            setAudioMode: (mode) => set({ audioMode: mode }),
            noiseColor: "brown",
            setNoiseColor: (color) => set({ noiseColor: color }),

            stations: DEFAULT_STATIONS,
            activeStationId: "station-lofi-beats",
            setActiveStationId: (id) =>
                set((state) => {
                    const st = state.stations.find((s) => s.id === id);
                    return {
                        activeStationId: id,
                        localUrl: st?.url || state.localUrl,
                    };
                }),
            addCustomStation: (name, url) =>
                set((state) => {
                    const newStation: StreamStation = {
                        id: `custom-${Date.now()}`,
                        name: name.trim(),
                        url: url.trim(),
                        genre: "Custom Stream",
                        isCustom: true,
                    };
                    return {
                        stations: [...state.stations, newStation],
                        activeStationId: newStation.id,
                        localUrl: newStation.url,
                    };
                }),
            removeCustomStation: (id) =>
                set((state) => {
                    const nextStations = state.stations.filter((s) => s.id !== id);
                    const nextActiveId =
                        state.activeStationId === id
                            ? nextStations[0]?.id || "station-lofi-beats"
                            : state.activeStationId;
                    const nextUrl =
                        nextStations.find((s) => s.id === nextActiveId)?.url || "/music1.mp3";
                    return {
                        stations: nextStations.length ? nextStations : DEFAULT_STATIONS,
                        activeStationId: nextActiveId,
                        localUrl: nextUrl,
                    };
                }),

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
                    audioMode: "stream",
                    noiseColor: "brown",
                    stations: DEFAULT_STATIONS,
                    activeStationId: "station-lofi-beats",
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
