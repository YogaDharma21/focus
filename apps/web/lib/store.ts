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
} from "@focus/types";

export type {
    Session,
    Distraction,
    PlaylistItem,
    TimerState,
    ViewType,
    TaskItem,
    SubtaskItem,
    TaskPriority,
};

interface AppState {
    currentView: ViewType;
    setView: (view: ViewType) => void;

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

    tasks: TaskItem[];
    selectedTaskId: string | null;
    addTask: (task: { text: string; priority?: TaskPriority; deadline?: string; estimatedMinutes?: number }) => void;
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

            tasks: [],
            selectedTaskId: null,
            addTask: ({ text, priority = "medium", deadline, estimatedMinutes }) =>
                set((state) => ({
                    tasks: [
                        {
                            id: crypto.randomUUID(),
                            text: text.trim(),
                            completed: false,
                            priority,
                            deadline: deadline || undefined,
                            estimatedMinutes: estimatedMinutes && estimatedMinutes > 0 ? estimatedMinutes : undefined,
                            subtasks: [],
                        },
                        ...state.tasks,
                    ],
                })),
            toggleTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id
                            ? {
                                  ...task,
                                  completed: !task.completed,
                                  completedAt: !task.completed ? new Date().toISOString() : undefined,
                              }
                            : task,
                    ),
                })),
            updateTask: (id, updates) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, ...updates } : task,
                    ),
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
                        return { ...task, subtasks };
                    }),
                })),
            toggleSubtask: (taskId, subtaskId) =>
                set((state) => ({
                    tasks: state.tasks.map((task) => {
                        if (task.id !== taskId) return task;
                        const subtasks = (task.subtasks || []).map((sub) =>
                            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub,
                        );
                        return { ...task, subtasks };
                    }),
                })),
            deleteSubtask: (taskId, subtaskId) =>
                set((state) => ({
                    tasks: state.tasks.map((task) => {
                        if (task.id !== taskId) return task;
                        return {
                            ...task,
                            subtasks: (task.subtasks || []).filter((sub) => sub.id !== subtaskId),
                        };
                    }),
                })),
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
