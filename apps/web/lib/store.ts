import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
    Session,
    Distraction,
    PlaylistItem,
    TimerState,
    ViewType,
    TaskItem,
    SubtaskItem,
    TaskPriority,
    BreakRatio,
    SoundChannelState,
    SoundChannelId,
} from "@focus/types";
import { DEFAULT_CHANNELS } from "@focus/utils";

export type {
    Session,
    Distraction,
    PlaylistItem,
    TimerState,
    ViewType,
    TaskItem,
    SubtaskItem,
    TaskPriority,
    BreakRatio,
    SoundChannelState,
    SoundChannelId,
};

interface AppState {
    currentView: ViewType;
    setView: (view: ViewType) => void;

    audioSourceType: "lofi" | "soundscape";
    setAudioSourceType: (type: "lofi" | "soundscape") => void;
    soundChannels: SoundChannelState[];
    setChannelVolume: (id: SoundChannelId, volume: number) => void;
    toggleChannel: (id: SoundChannelId) => void;
    applySoundscapePreset: (channels: Partial<Record<SoundChannelId, number>>) => void;

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
    breakRatio: BreakRatio;
    setTimerMode: (mode: "STOPWATCH") => void;
    setTimerState: (state: TimerState) => void;
    setTimeLeft: (time: number | ((prev: number) => number)) => void;
    setIsActive: (active: boolean) => void;
    setSessionStartTime: (time: string | null) => void;
    setAutoStartBreak: (enabled: boolean) => void;
    setAutoStartFlow: (enabled: boolean) => void;
    setBreakRatio: (ratio: BreakRatio) => void;

    tasks: TaskItem[];
    selectedTaskId: string | null;
    addTask: (task: { text: string; priority?: TaskPriority; deadline?: string }) => void;
    toggleTask: (id: string) => void;
    updateTask: (id: string, updates: Partial<TaskItem>) => void;
    deleteTask: (id: string) => void;
    addSubtask: (taskId: string, text: string) => void;
    toggleSubtask: (taskId: string, subtaskId: string) => void;
    deleteSubtask: (taskId: string, subtaskId: string) => void;
    setSelectedTaskId: (id: string | null) => void;

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

            audioSourceType: "lofi",
            setAudioSourceType: (type) => set({ audioSourceType: type }),
            soundChannels: DEFAULT_CHANNELS,
            setChannelVolume: (id, volume) =>
                set((state) => ({
                    soundChannels: state.soundChannels.map((ch) =>
                        ch.id === id ? { ...ch, volume } : ch
                    ),
                })),
            toggleChannel: (id) =>
                set((state) => ({
                    soundChannels: state.soundChannels.map((ch) =>
                        ch.id === id ? { ...ch, enabled: !ch.enabled } : ch
                    ),
                })),
            applySoundscapePreset: (presetChannels) =>
                set((state) => ({
                    soundChannels: state.soundChannels.map((ch) => {
                        const targetVol = presetChannels[ch.id];
                        if (targetVol !== undefined) {
                            return { ...ch, volume: targetVol, enabled: true };
                        }
                        return { ...ch, enabled: false };
                    }),
                })),

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
            breakRatio: "1/5",
            setBreakRatio: (ratio) => set({ breakRatio: ratio }),

            tasks: [],
            selectedTaskId: null,
            addTask: ({ text, priority = "medium", deadline }) =>
                set((state) => ({
                    tasks: [
                        {
                            id: crypto.randomUUID(),
                            text: text.trim(),
                            completed: false,
                            priority,
                            deadline: deadline || undefined,
                            subtasks: [],
                        },
                        ...state.tasks,
                    ],
                })),
            toggleTask: (id) =>
                set((state) => {
                    let shouldClearSelected = false;
                    const tasks = state.tasks.map((task) => {
                        if (task.id !== id) return task;
                        const nextCompleted = !task.completed;
                        if (nextCompleted && state.selectedTaskId === id) {
                            shouldClearSelected = true;
                        }
                        return {
                            ...task,
                            completed: nextCompleted,
                            completedAt: nextCompleted
                                ? (task.completedAt || new Date().toISOString())
                                : undefined,
                            subtasks: (task.subtasks || []).map((sub) => ({
                                ...sub,
                                completed: nextCompleted,
                            })),
                        };
                    });
                    return {
                        tasks,
                        selectedTaskId: shouldClearSelected ? null : state.selectedTaskId,
                    };
                }),
            updateTask: (id, updates) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, ...updates } : task,
                    ),
                    selectedTaskId:
                        updates.completed === true && state.selectedTaskId === id
                            ? null
                            : state.selectedTaskId,
                })),
            deleteTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.filter((task) => task.id !== id),
                    selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
                })),
            addSubtask: (taskId, text) =>
                set((state) => ({
                    tasks: state.tasks.map((task) => {
                        if (task.id !== taskId) return task;
                        const subtasks = [
                            ...(task.subtasks || []),
                            {
                                id: crypto.randomUUID(),
                                text: text.trim(),
                                completed: false,
                            },
                        ];
                        return {
                            ...task,
                            completed: false,
                            completedAt: undefined,
                            subtasks,
                        };
                    }),
                })),
            toggleSubtask: (taskId, subtaskId) =>
                set((state) => {
                    let shouldClearSelected = false;
                    const tasks = state.tasks.map((task) => {
                        if (task.id !== taskId) return task;
                        const subtasks = (task.subtasks || []).map((sub) =>
                            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub,
                        );
                        const allCompleted = subtasks.length > 0 && subtasks.every((sub) => sub.completed);
                        if (allCompleted && state.selectedTaskId === taskId) {
                            shouldClearSelected = true;
                        }
                        return {
                            ...task,
                            completed: allCompleted,
                            completedAt: allCompleted
                                ? (task.completed ? task.completedAt : new Date().toISOString())
                                : undefined,
                            subtasks,
                        };
                    });
                    return {
                        tasks,
                        selectedTaskId: shouldClearSelected ? null : state.selectedTaskId,
                    };
                }),
            deleteSubtask: (taskId, subtaskId) =>
                set((state) => {
                    let shouldClearSelected = false;
                    const tasks = state.tasks.map((task) => {
                        if (task.id !== taskId) return task;
                        const subtasks = (task.subtasks || []).filter((sub) => sub.id !== subtaskId);
                        if (subtasks.length === 0) {
                            return { ...task, subtasks };
                        }
                        const allCompleted = subtasks.every((sub) => sub.completed);
                        if (allCompleted && state.selectedTaskId === taskId) {
                            shouldClearSelected = true;
                        }
                        return {
                            ...task,
                            completed: allCompleted,
                            completedAt: allCompleted
                                ? (task.completed ? task.completedAt : new Date().toISOString())
                                : undefined,
                            subtasks,
                        };
                    });
                    return {
                        tasks,
                        selectedTaskId: shouldClearSelected ? null : state.selectedTaskId,
                    };
                }),
            setSelectedTaskId: (id) => set({ selectedTaskId: id }),

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
                    audioSourceType: "lofi",
                    soundChannels: DEFAULT_CHANNELS,
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
                    breakRatio: "1/5",
                    tasks: [],
                    selectedTaskId: null,
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
