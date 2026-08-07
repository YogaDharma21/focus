import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewType = "FOCUS" | "TODO" | "JOURNAL" | "NOTES";
export type BackgroundType = "dark" | "gradient" | "mountain" | "library" | "cafe" | "anime-room";

interface AppState {
    currentView: ViewType;
    setView: (view: ViewType) => void;

    localUrl: string;
    localPlaylist: { id: string; title: string; artist: string; url: string }[];
    setMediaUrl: (url: string) => void;
    mediaPlayerOpen: boolean;
    setMediaPlayerOpen: (open: boolean) => void;

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

    moodNotes: MoodNote[];
    addMoodNote: (note: MoodNote) => void;
    deleteMoodNote: (id: string) => void;
    sessions: Session[];
    distractions: Distraction[];

    deepFocusMode: boolean;
    setDeepFocusMode: (mode: boolean) => void;

    background: BackgroundType;
    setBackground: (bg: BackgroundType) => void;

    addSession: (session: Session) => void;
    addDistraction: (category: string) => void;

    pomodoroSettings: { work: number; break: number; autoStartBreak: boolean };
    setPomodoroSettings: (
        settings: Partial<{
            work: number;
            break: number;
            autoStartBreak: boolean;
        }>,
    ) => void;

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
    description?: string;
    completed: boolean;
    category?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    tags?: string[];
    deadline?: string;
    dueDate?: string;
    subtasks?: { id: string; text: string; completed: boolean }[];
    notes?: string;
    estimatedPomodoros?: number;
    completedPomodoros?: number;
    recurring?: "none" | "daily" | "weekly" | "monthly";
    reminders?: string[];
    link?: string;
    groupId?: string;
    completedAt?: string;
}

export interface MoodNote {
    id: string;
    date: string;
    mood: string;
    text: string;
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
                    title: "Lo-Fi",
                    artist: "Focus Ambient Music",
                    url: "/music1.mp3",
                },
            ],

            setMediaUrl: (url) => set({ localUrl: url }),
            mediaPlayerOpen: false,
            setMediaPlayerOpen: (open) => set({ mediaPlayerOpen: open }),

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

            moodNotes: [],
            addMoodNote: (note) =>
                set((state) => ({ moodNotes: [...(state.moodNotes || []), note] })),
            deleteMoodNote: (id) =>
                set((state) => ({
                    moodNotes: (state.moodNotes || []).filter((n) => n.id !== id),
                })),
            sessions: [],
            distractions: [],

            deepFocusMode: false,
            setDeepFocusMode: (mode) => set({ deepFocusMode: mode }),

            background: "dark",
            setBackground: (bg) => set({ background: bg }),

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

            pomodoroSettings: { work: 25, break: 5, autoStartBreak: false },
            setPomodoroSettings: (updates) =>
                set((state) => ({
                    pomodoroSettings: { ...state.pomodoroSettings, ...updates },
                })),

            resetAllData: () => {
                useAppStore.persist.clearStorage();
                set({
                    currentView: "FOCUS",
                    localUrl: "/music1.mp3",
                    localPlaylist: [
                        {
                            id: "local-1",
                            title: "Lo-Fi",
                            artist: "Focus Ambient Music",
                            url: "/music1.mp3",
                        },
                    ],
                    mediaPlayerOpen: false,
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
                    moodNotes: [],
                    sessions: [],
                    distractions: [],
                    deepFocusMode: false,
                    background: "dark",
                    pomodoroSettings: { work: 25, break: 5, autoStartBreak: false },
                });
            },
        }),
        {
            name: "focus-app-storage-v2",
        },
    ),
);
