import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewType = "FOCUS" | "TODO" | "JOURNAL" | "SETTINGS";

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
    isMusicMuted: boolean;
    setIsMusicMuted: (muted: boolean) => void;
    soundEffectVolume: number;
    setSoundEffectVolume: (volume: number) => void;
    soundEffectEnabled: boolean;
    setSoundEffectEnabled: (enabled: boolean) => void;

    timerMode: "POMODORO" | "STOPWATCH";
    timerState: "WORK" | "BREAK";
    previousMode: "POMODORO" | "STOPWATCH";
    timeLeft: number;
    isActive: boolean;
    sessionStartTime: string | null;
    setTimerMode: (mode: "POMODORO" | "STOPWATCH") => void;
    setTimerState: (state: "WORK" | "BREAK") => void;
    setPreviousMode: (mode: "POMODORO" | "STOPWATCH") => void;
    setTimeLeft: (time: number | ((prev: number) => number)) => void;
    setIsActive: (active: boolean) => void;
    setSessionStartTime: (time: string | null) => void;
    sessionName: string;
    setSessionName: (name: string) => void;
    selectedTodoId: string | null;
    setSelectedTodoId: (id: string | null) => void;
    selectedSubtaskId: string | null;
    setSelectedSubtaskId: (id: string | null) => void;

    todos: TodoItem[];
    addTodo: (todo: TodoItem) => void;
    toggleTodo: (id: string) => void;
    updateTodo: (id: string, updates: Partial<TodoItem>) => void;
    deleteTodo: (id: string) => void;
    groups: Group[];
    addGroup: (name: string) => void;
    deleteGroup: (id: string) => void;

    sessions: Session[];
    distractions: Distraction[];

    deepFocusMode: boolean;
    setDeepFocusMode: (mode: boolean) => void;
    theme: "light" | "dark";
    setTheme: (theme: "light" | "dark") => void;

    addSession: (session: Session) => void;
    addDistraction: (category: string) => void;

    pomodoroSettings: {
        work: number;
        break: number;
        longBreak: number;
        autoStartBreak: boolean;
        autoStartTimer: boolean;
    };
    setPomodoroSettings: (
        settings: Partial<{
            work: number;
            break: number;
            longBreak: number;
            autoStartBreak: boolean;
            autoStartTimer: boolean;
        }>,
    ) => void;
    pomodoroCount: number;
    setPomodoroCount: (count: number | ((prev: number) => number)) => void;
    resetPomodoroCount: () => void;

    addSubtask: (todoId: string, text: string) => void;
    toggleSubtask: (todoId: string, subtaskId: string) => void;
    deleteSubtask: (todoId: string, subtaskId: string) => void;
    updateSubtask: (todoId: string, subtaskId: string, text: string) => void;

    resetAllData: () => void;
}

export interface Group {
    id: string;
    name: string;
    type: "system" | "custom";
}

export interface Session {
    id: string;
    date: string;
    duration: number;
    mode: "POMODORO" | "STOPWATCH";
}

export interface Distraction {
    id: string;
    timestamp: string;
    category: string;
}

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    category?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    deadline?: string;
    dueDate?: string;
    subtasks?: { id: string; text: string; completed: boolean }[];
    estimatedPomodoros?: number;
    completedPomodoros?: number;
    link?: string;
    groupId?: string;
    completedAt?: string;
    notes?: string;
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
            isMusicMuted: false,
            setIsMusicMuted: (muted) => set({ isMusicMuted: muted }),
            soundEffectVolume: 80,
            setSoundEffectVolume: (volume) => set({ soundEffectVolume: volume }),
            soundEffectEnabled: true,
            setSoundEffectEnabled: (enabled) => set({ soundEffectEnabled: enabled }),

            timerMode: "POMODORO",
            timerState: "WORK",
            previousMode: "POMODORO",
            timeLeft: 25 * 60,
            isActive: false,
            sessionStartTime: null,
            setTimerMode: (mode) => set({ timerMode: mode }),
            setTimerState: (state) => set({ timerState: state }),
            setPreviousMode: (mode) => set({ previousMode: mode }),
            setTimeLeft: (timeOrFn) =>
                set((state) => ({
                    timeLeft: typeof timeOrFn === "function" ? timeOrFn(state.timeLeft) : timeOrFn,
                })),
            setIsActive: (active) => set({ isActive: active }),
            setSessionStartTime: (time) => set({ sessionStartTime: time }),
            sessionName: "",
            setSessionName: (name) => set({ sessionName: name }),
            selectedTodoId: null,
            setSelectedTodoId: (id) => set({ selectedTodoId: id }),
            selectedSubtaskId: null,
            setSelectedSubtaskId: (id) => set({ selectedSubtaskId: id }),

            todos: [],
            addTodo: (todo) =>
                set((state) => ({ todos: [...state.todos, todo] })),
            toggleTodo: (id) =>
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id
                            ? {
                                  ...t,
                                  completed: !t.completed,
                                  completedAt: !t.completed
                                      ? new Date().toISOString()
                                      : undefined,
                                  groupId: !t.completed
                                      ? "finished"
                                      : "current",
                              }
                            : t,
                    ),
                })),
            updateTodo: (id, updates) =>
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === id ? { ...t, ...updates } : t,
                    ),
                })),
            deleteTodo: (id) =>
                set((state) => ({
                    todos: state.todos.filter((t) => t.id !== id),
                })),

            groups: [
                { id: "current", name: "Current Tasks", type: "system" },
                { id: "finished", name: "Finished", type: "system" },
            ],
            addGroup: (name) =>
                set((state) => ({
                    groups: [
                        ...(state.groups || []),
                        { id: crypto.randomUUID(), name, type: "custom" },
                    ],
                })),
            deleteGroup: (id) =>
                set((state) => ({
                    groups: (state.groups || []).filter((g) => g.id !== id),
                })),

            sessions: [],
            distractions: [],

            deepFocusMode: false,
            setDeepFocusMode: (mode) => set({ deepFocusMode: mode }),

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

            addSubtask: (todoId, text) =>
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === todoId
                            ? {
                                  ...t,
                                  subtasks: [
                                      ...(t.subtasks || []),
                                      {
                                          id: crypto.randomUUID(),
                                          text,
                                          completed: false,
                                      },
                                  ],
                              }
                            : t,
                    ),
                })),
            toggleSubtask: (todoId, subtaskId) =>
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === todoId
                            ? {
                                  ...t,
                                  subtasks: t.subtasks?.map((s) =>
                                      s.id === subtaskId
                                          ? { ...s, completed: !s.completed }
                                          : s,
                                  ),
                              }
                            : t,
                    ),
                })),
            deleteSubtask: (todoId, subtaskId) =>
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === todoId
                            ? {
                                  ...t,
                                  subtasks: t.subtasks?.filter(
                                      (s) => s.id !== subtaskId,
                                  ),
                              }
                            : t,
                    ),
                })),
            updateSubtask: (todoId, subtaskId, text) =>
                set((state) => ({
                    todos: state.todos.map((t) =>
                        t.id === todoId
                            ? {
                                  ...t,
                                  subtasks: t.subtasks?.map((s) =>
                                      s.id === subtaskId
                                          ? { ...s, text }
                                          : s
                                  ),
                              }
                            : t,
                    ),
                })),

            pomodoroSettings: { work: 25, break: 5, longBreak: 15, autoStartBreak: false, autoStartTimer: false },
            setPomodoroSettings: (updates) =>
                set((state) => ({
                    pomodoroSettings: { ...state.pomodoroSettings, ...updates },
                })),
            pomodoroCount: 0,
            setPomodoroCount: (countOrFn) =>
                set((state) => ({
                    pomodoroCount: typeof countOrFn === "function" ? countOrFn(state.pomodoroCount || 0) : countOrFn,
                })),
            resetPomodoroCount: () => set({ pomodoroCount: 0 }),

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
                    timerMode: "POMODORO",
                    timerState: "WORK",
                    previousMode: "POMODORO",
                    timeLeft: 25 * 60,
                    isActive: false,
                    sessionStartTime: null,
                    sessionName: "",
                    selectedTodoId: null,
                    selectedSubtaskId: null,
                    todos: [],
                    groups: [
                        { id: "current", name: "Current Tasks", type: "system" },
                        { id: "finished", name: "Finished", type: "system" },
                    ],
                    sessions: [],
                    distractions: [],
                    deepFocusMode: false,
                    pomodoroSettings: { work: 25, break: 5, longBreak: 15, autoStartBreak: false, autoStartTimer: false },
                    pomodoroCount: 0,
                });
            },
        }),
        {
            name: "focus-app-storage-v2",
        },
    ),
);
