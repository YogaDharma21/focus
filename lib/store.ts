import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewType = "FOCUS" | "TODO" | "JOURNAL";

interface AppState {
    currentView: ViewType;
    setView: (view: ViewType) => void;
    // Placeholder for timer/media state later

    // Media State
    mediaType: "YOUTUBE" | "SPOTIFY";
    youtubeUrl: string;
    youtubePlaylist: string[];
    spotifyUrl: string;
    setMediaType: (type: "YOUTUBE" | "SPOTIFY") => void;
    setMediaUrl: (type: "YOUTUBE" | "SPOTIFY", url: string) => void;
    addToPlaylist: (url: string) => void;
    removeFromPlaylist: (url: string) => void;

    // Timer State
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

    // Todo State
    todos: TodoItem[];
    addTodo: (todo: TodoItem) => void;
    toggleTodo: (id: string) => void;
    updateTodo: (id: string, updates: Partial<TodoItem>) => void; // V2
    deleteTodo: (id: string) => void;
    // V2 Groups
    groups: Group[];
    addGroup: (name: string) => void;
    deleteGroup: (id: string) => void;

    // Journal & Stats State
    notes: string; // V2: Renamed from journalEntry
    sessions: Session[];

    setNotes: (text: string) => void;
    addSession: (session: Session) => void;

    // Global Settings (V2)
    pomodoroSettings: { work: number; break: number; autoStartBreak: boolean };
    setPomodoroSettings: (
        settings: Partial<{
            work: number;
            break: number;
            autoStartBreak: boolean;
        }>,
    ) => void;

    // Subtasks logic (V2)
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
    date: string; // ISO string
    duration: number; // seconds
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
    groupId?: string; // V2
    deadline?: string; // V2
    completedAt?: string; // V2
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            currentView: "FOCUS", // Default per requirements
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
                    // If updating youtubeUrl, also ensure it's in the playlist if not already
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
                    // Set as current if it's the first or user just added it
                    youtubeUrl: url,
                })),
            removeFromPlaylist: (url) =>
                set((state) => {
                    const newPlaylist = state.youtubePlaylist.filter(
                        (u) => u !== url,
                    );
                    return {
                        youtubePlaylist: newPlaylist,
                        // If we removed the current URL, pick another one or default
                        youtubeUrl:
                            state.youtubeUrl === url
                                ? newPlaylist[0] ||
                                  "https://www.youtube.com/watch?v=DEWzT1geuPU"
                                : state.youtubeUrl,
                    };
                }),

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

            // V2 Groups - Current Tasks and Finished by default
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

            // Default settings
            pomodoroSettings: { work: 25, break: 5, autoStartBreak: false },
            setPomodoroSettings: (updates) =>
                set((state) => ({
                    pomodoroSettings: { ...state.pomodoroSettings, ...updates },
                })),
        }),
        {
            name: "focus-app-storage-v2", // Bump version to reset state if needed, or keep same
        },
    ),
);
