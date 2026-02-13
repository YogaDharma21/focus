import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewType = "FOCUS" | "TODO" | "JOURNAL";

interface AppState {
    currentView: ViewType;
    setView: (view: ViewType) => void;

    mediaType: "YOUTUBE" | "SPOTIFY";
    youtubeUrl: string;
    youtubePlaylist: string[];
    spotifyUrl: string;
    setMediaType: (type: "YOUTUBE" | "SPOTIFY") => void;
    setMediaUrl: (type: "YOUTUBE" | "SPOTIFY", url: string) => void;
    addToPlaylist: (url: string) => void;
    removeFromPlaylist: (url: string) => void;
    mediaPlayerOpen: boolean;
    setMediaPlayerOpen: (open: boolean) => void;

    timerMode: "POMODORO" | "STOPWATCH";
    timerState: "WORK" | "BREAK";
    timeLeft: number;
    isActive: boolean;
    sessionStartTime: string | null;
    setTimerMode: (mode: "POMODORO" | "STOPWATCH") => void;
    setTimerState: (state: "WORK" | "BREAK") => void;
    setTimeLeft: (time: number) => void;
    setIsActive: (active: boolean) => void;
    setSessionStartTime: (time: string | null) => void;
    sessionName: string;
    setSessionName: (name: string) => void;

    todos: TodoItem[];
    addTodo: (todo: TodoItem) => void;
    toggleTodo: (id: string) => void;
    updateTodo: (id: string, updates: Partial<TodoItem>) => void;
    deleteTodo: (id: string) => void;
    groups: Group[];
    addGroup: (name: string) => void;
    deleteGroup: (id: string) => void;

    notes: string;
    sessions: Session[];

    setNotes: (text: string) => void;
    addSession: (session: Session) => void;

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

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    category?: string;
    dueDate?: string;
    subtasks?: { id: string; text: string; completed: boolean }[];
    link?: string;
    groupId?: string;
    deadline?: string;
    completedAt?: string;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            currentView: "FOCUS",
            setView: (view) => set({ currentView: view }),

            mediaType: "YOUTUBE",
            youtubeUrl: "https://www.youtube.com/watch?v=DEWzT1geuPU",
            youtubePlaylist: ["https://www.youtube.com/watch?v=DEWzT1geuPU"],
            spotifyUrl:
                "https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS?si=5rvssghNSWKXYYRCYbb5Xg",

            setMediaType: (type) => set({ mediaType: type }),
            setMediaUrl: (type, url) =>
                set((state) => ({
                    [type === "YOUTUBE" ? "youtubeUrl" : "spotifyUrl"]: url,
                    ...(type === "YOUTUBE" &&
                    !state.youtubePlaylist.includes(url)
                        ? { youtubePlaylist: [...state.youtubePlaylist, url] }
                        : {}),
                })),
            addToPlaylist: (url) =>
                set((state) => ({
                    youtubePlaylist: state.youtubePlaylist.includes(url)
                        ? state.youtubePlaylist
                        : [...state.youtubePlaylist, url],
                    youtubeUrl: url,
                })),
            removeFromPlaylist: (url) =>
                set((state) => {
                    const newPlaylist = state.youtubePlaylist.filter(
                        (u) => u !== url,
                    );
                    return {
                        youtubePlaylist: newPlaylist,
                        youtubeUrl:
                            state.youtubeUrl === url
                                ? newPlaylist[0] ||
                                  "https://www.youtube.com/watch?v=DEWzT1geuPU"
                                : state.youtubeUrl,
                    };
                }),
            mediaPlayerOpen: true,
            setMediaPlayerOpen: (open) => set({ mediaPlayerOpen: open }),

            timerMode: "POMODORO",
            timerState: "WORK",
            timeLeft: 25 * 60,
            isActive: false,
            sessionStartTime: null,
            setTimerMode: (mode) => set({ timerMode: mode }),
            setTimerState: (state) => set({ timerState: state }),
            setTimeLeft: (time) => set({ timeLeft: time }),
            setIsActive: (active) => set({ isActive: active }),
            setSessionStartTime: (time) => set({ sessionStartTime: time }),
            sessionName: "",
            setSessionName: (name) => set({ sessionName: name }),

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

            notes: "",
            sessions: [],

            setNotes: (text) => set({ notes: text }),

            addSession: (session) =>
                set((state) => ({
                    sessions: [...(state.sessions || []), session],
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

            pomodoroSettings: { work: 25, break: 5, autoStartBreak: false },
            setPomodoroSettings: (updates) =>
                set((state) => ({
                    pomodoroSettings: { ...state.pomodoroSettings, ...updates },
                })),
        }),
        {
            name: "focus-app-storage-v2",
        },
    ),
);
