import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewType = "FOCUS" | "TODO" | "JOURNAL" | "NOTES";
export type BackgroundType = "dark" | "gradient" | "mountain" | "library" | "cafe" | "anime-room";

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
  taskTitle?: string;
}

export interface Distraction {
  id: string;
  timestamp: string;
  category: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
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
  subtasks?: Subtask[];
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

export interface DesktopState {
  // Navigation & View
  currentView: ViewType;
  setView: (view: ViewType) => void;
  isAlwaysOnTop: boolean;
  setAlwaysOnTop: (onTop: boolean) => void;

  // Media Player & Audio
  mediaType: "YOUTUBE" | "SPOTIFY" | "LOCAL";
  youtubeUrl: string;
  youtubePlaylist: string[];
  spotifyUrl: string;
  localUrl: string;
  soundEffectEnabled: boolean;
  volume: number;
  localPlaylist: { id: string; title: string; artist: string; url: string }[];
  setMediaType: (type: "YOUTUBE" | "SPOTIFY" | "LOCAL") => void;
  setMediaUrl: (type: "YOUTUBE" | "SPOTIFY" | "LOCAL", url: string) => void;
  addToPlaylist: (url: string) => void;
  removeFromPlaylist: (url: string) => void;
  mediaPlayerOpen: boolean;
  setMediaPlayerOpen: (open: boolean) => void;
  isMusicPlaying: boolean;
  setIsMusicPlaying: (playing: boolean) => void;
  setSoundEffectEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;

  // Timer State
  timerMode: "POMODORO" | "STOPWATCH";
  timerState: "WORK" | "BREAK";
  previousMode: "POMODORO" | "STOPWATCH";
  timeLeft: number;
  flowTimeElapsed: number;
  isActive: boolean;
  sessionStartTime: string | null;
  sessionName: string;
  selectedTodoId: string | null;
  selectedSubtaskId: string | null;

  setTimerMode: (mode: "POMODORO" | "STOPWATCH") => void;
  setTimerState: (state: "WORK" | "BREAK") => void;
  setPreviousMode: (mode: "POMODORO" | "STOPWATCH") => void;
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  setFlowTimeElapsed: (time: number | ((prev: number) => number)) => void;
  setIsActive: (active: boolean) => void;
  setSessionStartTime: (time: string | null) => void;
  setSessionName: (name: string) => void;
  setSelectedTodoId: (id: string | null) => void;
  setSelectedSubtaskId: (id: string | null) => void;

  // Settings
  pomodoroSettings: { work: number; break: number; autoStartBreak: boolean };
  setPomodoroSettings: (settings: Partial<{ work: number; break: number; autoStartBreak: boolean }>) => void;

  // Tasks & Groups
  todos: TodoItem[];
  addTodo: (todo: TodoItem) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  groups: Group[];
  addGroup: (name: string) => void;
  deleteGroup: (id: string) => void;

  // Subtasks
  addSubtask: (todoId: string, text: string) => void;
  toggleSubtask: (todoId: string, subtaskId: string) => void;
  deleteSubtask: (todoId: string, subtaskId: string) => void;
  updateSubtask: (todoId: string, subtaskId: string, text: string) => void;

  // Mood Notes & Sessions
  moodNotes: MoodNote[];
  addMoodNote: (note: MoodNote) => void;
  deleteMoodNote: (id: string) => void;
  setMoodForDate: (date: string, mood: string, text?: string) => void;
  cycleMoodForDate: (date: string) => void;
  sessions: Session[];
  addSession: (session: Session) => void;
  distractions: Distraction[];
  addDistraction: (category: string) => void;

  // Visuals & Themes
  deepFocusMode: boolean;
  setDeepFocusMode: (mode: boolean) => void;
  background: BackgroundType;
  setBackground: (bg: BackgroundType) => void;
}

export const useDesktopStore = create<DesktopState>()(
  persist(
    (set) => ({
      // Navigation
      currentView: "FOCUS",
      setView: (view) => set({ currentView: view }),
      isAlwaysOnTop: false,
      setAlwaysOnTop: (onTop) => set({ isAlwaysOnTop: onTop }),

      // Media
      mediaType: "LOCAL",
      youtubeUrl: "https://www.youtube.com/watch?v=DEWzT1geuPU",
      youtubePlaylist: ["https://www.youtube.com/watch?v=DEWzT1geuPU"],
      spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS",
      localUrl: "https://assets.mixkit.co/music/preview/mixkit-chill-bro-494.mp3",
      soundEffectEnabled: true,
      volume: 0.8,
      localPlaylist: [
        {
          id: "local-1",
          title: "Chill Lo-Fi Beat",
          artist: "Focus Studio",
          url: "https://assets.mixkit.co/music/preview/mixkit-chill-bro-494.mp3",
        },
        {
          id: "local-2",
          title: "Deep Ambient Study",
          artist: "Focus Studio",
          url: "https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3",
        }
      ],
      setMediaType: (type) => set({ mediaType: type }),
      setMediaUrl: (type, url) =>
        set((state) => ({
          [type === "YOUTUBE" ? "youtubeUrl" : type === "SPOTIFY" ? "spotifyUrl" : "localUrl"]: url,
          ...(type === "YOUTUBE" && !state.youtubePlaylist.includes(url)
            ? { youtubePlaylist: [...state.youtubePlaylist, url] }
            : {}),
        })),
      addToPlaylist: (url) =>
        set((state) => ({
          youtubePlaylist: state.youtubePlaylist.includes(url) ? state.youtubePlaylist : [...state.youtubePlaylist, url],
          youtubeUrl: url,
        })),
      removeFromPlaylist: (url) =>
        set((state) => {
          const newPlaylist = state.youtubePlaylist.filter((u) => u !== url);
          return {
            youtubePlaylist: newPlaylist,
            youtubeUrl: state.youtubeUrl === url ? newPlaylist[0] || "https://www.youtube.com/watch?v=DEWzT1geuPU" : state.youtubeUrl,
          };
        }),
      mediaPlayerOpen: true,
      setMediaPlayerOpen: (open) => set({ mediaPlayerOpen: open }),
      isMusicPlaying: false,
      setIsMusicPlaying: (playing) => set({ isMusicPlaying: playing }),
      setSoundEffectEnabled: (enabled) => set({ soundEffectEnabled: enabled }),
      setVolume: (volume) => set({ volume }),

      // Timer State
      timerMode: "POMODORO",
      timerState: "WORK",
      previousMode: "POMODORO",
      timeLeft: 25 * 60,
      flowTimeElapsed: 0,
      isActive: false,
      sessionStartTime: null,
      sessionName: "",
      selectedTodoId: null,
      selectedSubtaskId: null,

      setTimerMode: (mode) => set({ timerMode: mode }),
      setTimerState: (state) => set({ timerState: state }),
      setPreviousMode: (mode) => set({ previousMode: mode }),
      setTimeLeft: (timeOrFn) =>
        set((state) => ({
          timeLeft: typeof timeOrFn === "function" ? timeOrFn(state.timeLeft) : timeOrFn,
        })),
      setFlowTimeElapsed: (timeOrFn) =>
        set((state) => ({
          flowTimeElapsed: typeof timeOrFn === "function" ? timeOrFn(state.flowTimeElapsed) : timeOrFn,
        })),
      setIsActive: (active) => set({ isActive: active }),
      setSessionStartTime: (time) => set({ sessionStartTime: time }),
      setSessionName: (name) => set({ sessionName: name }),
      setSelectedTodoId: (id) => set({ selectedTodoId: id }),
      setSelectedSubtaskId: (id) => set({ selectedSubtaskId: id }),

      // Settings
      pomodoroSettings: { work: 25, break: 5, autoStartBreak: false },
      setPomodoroSettings: (updates) =>
        set((state) => ({
          pomodoroSettings: { ...state.pomodoroSettings, ...updates },
        })),

      // Todos & Groups
      todos: [
        {
          id: "demo-task-1",
          text: "Set up Focus Desktop environment",
          description: "Initialize Electron and React desktop application.",
          completed: true,
          priority: "high",
          category: "Development",
          groupId: "finished",
          completedAt: new Date().toISOString(),
          estimatedPomodoros: 2,
          completedPomodoros: 2
        },
        {
          id: "demo-task-2",
          text: "Deep Focus Session",
          description: "Complete 1 focus cycle using Focus Desktop.",
          completed: false,
          priority: "urgent",
          category: "Productivity",
          groupId: "current",
          estimatedPomodoros: 4,
          completedPomodoros: 0,
          subtasks: [
            { id: "sub-1", text: "Configure focus timer", completed: true },
            { id: "sub-2", text: "Start ambient music stream", completed: false }
          ]
        }
      ],
      addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : undefined,
                  groupId: !t.completed ? "finished" : "current",
                }
              : t
          ),
        })),
      updateTodo: (id, updates) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
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
          groups: [...(state.groups || []), { id: crypto.randomUUID(), name, type: "custom" }],
        })),
      deleteGroup: (id) =>
        set((state) => ({
          groups: (state.groups || []).filter((g) => g.id !== id),
        })),

      // Subtasks
      addSubtask: (todoId, text) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: [...(t.subtasks || []), { id: crypto.randomUUID(), text, completed: false }],
                }
              : t
          ),
        })),
      toggleSubtask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: t.subtasks?.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)),
                }
              : t
          ),
        })),
      deleteSubtask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: t.subtasks?.filter((s) => s.id !== subtaskId),
                }
              : t
          ),
        })),
      updateSubtask: (todoId, subtaskId, text) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: t.subtasks?.map((s) => (s.id === subtaskId ? { ...s, text } : s)),
                }
              : t
          ),
        })),

      // Mood Notes & Sessions
      moodNotes: [],
      addMoodNote: (note) => set((state) => ({ moodNotes: [...(state.moodNotes || []), note] })),
      deleteMoodNote: (id) => set((state) => ({ moodNotes: (state.moodNotes || []).filter((n) => n.id !== id) })),
      setMoodForDate: (dateKey, mood, text) =>
        set((state) => {
          const notes = state.moodNotes || [];
          const normalizedTarget = dateKey.slice(0, 10);
          const existingIndex = notes.findIndex(
            (n) => n.date.slice(0, 10) === normalizedTarget,
          );

          if (!mood) {
            if (existingIndex >= 0) {
              return { moodNotes: notes.filter((_, idx) => idx !== existingIndex) };
            }
            return { moodNotes: notes };
          }

          if (existingIndex >= 0) {
            const updated = [...notes];
            updated[existingIndex] = {
              ...updated[existingIndex],
              mood,
              text: text !== undefined ? text : updated[existingIndex].text,
            };
            return { moodNotes: updated };
          } else {
            return {
              moodNotes: [
                ...notes,
                {
                  id: crypto.randomUUID(),
                  date: dateKey,
                  mood,
                  text: text || "",
                },
              ],
            };
          }
        }),
      cycleMoodForDate: (dateKey) =>
        set((state) => {
          const notes = state.moodNotes || [];
          const normalizedTarget = dateKey.slice(0, 10);
          const existing = notes.find((n) => n.date.slice(0, 10) === normalizedTarget);

          const currentMoodRaw = existing?.mood;
          let currentMood = "";
          if (currentMoodRaw) {
            if (currentMoodRaw === "amazing" || currentMoodRaw === "😊" || currentMoodRaw === "🤩" || currentMoodRaw === "Happy" || currentMoodRaw === "Excited") currentMood = "amazing";
            else if (currentMoodRaw === "ok" || currentMoodRaw === "🙂" || currentMoodRaw === "😐" || currentMoodRaw === "Okay") currentMood = "ok";
            else if (currentMoodRaw === "tired" || currentMoodRaw === "😴" || currentMoodRaw === "Tired") currentMood = "tired";
            else if (currentMoodRaw === "sad" || currentMoodRaw === "😔" || currentMoodRaw === "Sad") currentMood = "sad";
            else if (currentMoodRaw === "stressed" || currentMoodRaw === "😤" || currentMoodRaw === "Stressed") currentMood = "stressed";
            else currentMood = currentMoodRaw;
          }

          const cycle: string[] = ["amazing", "ok", "tired", "sad", "stressed"];
          let nextMood = "";

          if (!currentMood) {
            nextMood = "amazing";
          } else {
            const idx = cycle.indexOf(currentMood);
            if (idx === -1 || idx === cycle.length - 1) {
              nextMood = "";
            } else {
              nextMood = cycle[idx + 1];
            }
          }

          const existingIndex = notes.findIndex(
            (n) => n.date.slice(0, 10) === normalizedTarget,
          );

          if (!nextMood) {
            if (existingIndex >= 0) {
              return { moodNotes: notes.filter((_, idx) => idx !== existingIndex) };
            }
            return { moodNotes: notes };
          }

          if (existingIndex >= 0) {
            const updated = [...notes];
            updated[existingIndex] = {
              ...updated[existingIndex],
              mood: nextMood,
            };
            return { moodNotes: updated };
          } else {
            return {
              moodNotes: [
                ...notes,
                {
                  id: crypto.randomUUID(),
                  date: dateKey,
                  mood: nextMood,
                  text: "",
                },
              ],
            };
          }
        }),

      sessions: [
        {
          id: "session-1",
          date: new Date().toISOString(),
          duration: 1500,
          mode: "POMODORO",
          taskTitle: "Set up Focus Desktop environment"
        }
      ],
      addSession: (session) => set((state) => ({ sessions: [...(state.sessions || []), session] })),

      distractions: [],
      addDistraction: (category) =>
        set((state) => ({
          distractions: [
            ...(state.distractions || []),
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              category,
            },
          ],
        })),

      // Visuals
      deepFocusMode: false,
      setDeepFocusMode: (mode) => set({ deepFocusMode: mode }),
      background: "dark",
      setBackground: (bg) => set({ background: bg }),
    }),
    {
      name: "focus-desktop-storage-v1",
    }
  )
);
