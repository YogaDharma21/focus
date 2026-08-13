import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';

export type ViewType = 'FOCUS' | 'TODO' | 'JOURNAL' | 'NOTES';
export type BackgroundType = 'dark' | 'gradient' | 'mountain' | 'library' | 'cafe' | 'anime-room';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

export interface Group {
  id: string;
  name: string;
  type: 'system' | 'custom';
}

export interface Session {
  id: string;
  date: string;
  duration: number;
  mode: 'POMODORO' | 'STOPWATCH';
}

export interface Distraction {
  id: string;
  timestamp: string;
  category: string;
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  deadline?: string;
  dueDate?: string;
  subtasks?: SubTask[];
  notes?: string;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
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

interface AppState {
  currentView: ViewType;
  setView: (view: ViewType) => void;

  mediaType: 'YOUTUBE' | 'SPOTIFY' | 'LOCAL';
  youtubeUrl: string;
  youtubePlaylist: string[];
  spotifyUrl: string;
  localUrl: string;
  localPlaylist: { id: string; title: string; artist: string; url: string }[];
  setMediaType: (type: 'YOUTUBE' | 'SPOTIFY' | 'LOCAL') => void;
  setMediaUrl: (type: 'YOUTUBE' | 'SPOTIFY' | 'LOCAL', url: string) => void;
  addToPlaylist: (url: string) => void;
  removeFromPlaylist: (url: string) => void;
  mediaPlayerOpen: boolean;
  setMediaPlayerOpen: (open: boolean) => void;
  isMusicPlaying: boolean;
  setIsMusicPlaying: (playing: boolean) => void;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;
  soundEffectVolume: number;
  setSoundEffectVolume: (volume: number) => void;
  soundEffectEnabled: boolean;
  setSoundEffectEnabled: (enabled: boolean) => void;

  timerMode: 'POMODORO' | 'STOPWATCH';
  timerState: 'WORK' | 'BREAK';
  previousMode: 'POMODORO' | 'STOPWATCH';
  timeLeft: number;
  isActive: boolean;
  sessionStartTime: string | null;
  setTimerMode: (mode: 'POMODORO' | 'STOPWATCH') => void;
  setTimerState: (state: 'WORK' | 'BREAK') => void;
  setPreviousMode: (mode: 'POMODORO' | 'STOPWATCH') => void;
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
  incrementTodoSession: (todoId: string) => void;
  groups: Group[];
  addGroup: (name: string) => void;
  deleteGroup: (id: string) => void;

  moodNotes: MoodNote[];
  addMoodNote: (note: MoodNote) => void;
  deleteMoodNote: (id: string) => void;
  setMoodForDate: (date: string, mood: string, text?: string) => void;
  cycleMoodForDate: (date: string) => void;
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
    settings: Partial<{ work: number; break: number; autoStartBreak: boolean }>
  ) => void;

  resetAllData: () => void;

  addSubtask: (todoId: string, text: string) => void;
  toggleSubtask: (todoId: string, subtaskId: string) => void;
  deleteSubtask: (todoId: string, subtaskId: string) => void;
  updateSubtask: (todoId: string, subtaskId: string, text: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'FOCUS',
      setView: (view) => set({ currentView: view }),

      mediaType: 'LOCAL',
      youtubeUrl: 'https://www.youtube.com/watch?v=DEWzT1geuPU',
      youtubePlaylist: ['https://www.youtube.com/watch?v=DEWzT1geuPU'],
      spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS',
      localUrl: 'music1.mp3',
      localPlaylist: [
        {
          id: 'local-1',
          title: 'Lofi-Beats',
          artist: '',
          url: 'music1.mp3',
        },
      ],

      setMediaType: (type) => set({ mediaType: type }),
      setMediaUrl: (type, url) =>
        set((state) => ({
          [type === 'YOUTUBE' ? 'youtubeUrl' : type === 'SPOTIFY' ? 'spotifyUrl' : 'localUrl']: url,
          ...(type === 'YOUTUBE' && !state.youtubePlaylist.includes(url)
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
          const newPlaylist = state.youtubePlaylist.filter((u) => u !== url);
          return {
            youtubePlaylist: newPlaylist,
            youtubeUrl: state.youtubeUrl === url ? newPlaylist[0] || '' : state.youtubeUrl,
          };
        }),
      mediaPlayerOpen: false,
      setMediaPlayerOpen: (open) => set({ mediaPlayerOpen: open }),
      isMusicPlaying: false,
      setIsMusicPlaying: (playing) => set({ isMusicPlaying: playing }),
      musicVolume: 0.8,
      setMusicVolume: (volume) => set({ musicVolume: volume }),
      soundEffectVolume: 0.8,
      setSoundEffectVolume: (volume) => set({ soundEffectVolume: volume }),
      soundEffectEnabled: true,
      setSoundEffectEnabled: (enabled) => set({ soundEffectEnabled: enabled }),

      timerMode: 'POMODORO',
      timerState: 'WORK',
      previousMode: 'POMODORO',
      timeLeft: 25 * 60,
      isActive: false,
      sessionStartTime: null,
      setTimerMode: (mode) => set({ timerMode: mode }),
      setTimerState: (state) => set({ timerState: state }),
      setPreviousMode: (mode) => set({ previousMode: mode }),
      setTimeLeft: (timeOrFn) =>
        set((state) => ({
          timeLeft: typeof timeOrFn === 'function' ? timeOrFn(state.timeLeft) : timeOrFn,
        })),
      setIsActive: (active) => set({ isActive: active }),
      setSessionStartTime: (time) => set({ sessionStartTime: time }),
      sessionName: '',
      setSessionName: (name) => set({ sessionName: name }),
      selectedTodoId: null,
      setSelectedTodoId: (id) => set({ selectedTodoId: id }),
      selectedSubtaskId: null,
      setSelectedSubtaskId: (id) => set({ selectedSubtaskId: id }),

      todos: [],
      addTodo: (todo) => set((state) => ({ todos: [...state.todos, todo] })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : undefined,
                  groupId: !t.completed ? 'finished' : 'current',
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
      incrementTodoSession: (todoId) =>
        set((state) => ({
          todos: state.todos.map((t) => {
            if (t.id !== todoId) return t;
            const currentCompleted = t.completedPomodoros || 0;
            const newCompleted = currentCompleted + 1;
            const est = t.estimatedPomodoros || 1;
            const isFinished = newCompleted >= est;
            return {
              ...t,
              completedPomodoros: newCompleted,
              completed: isFinished ? true : t.completed,
              completedAt: isFinished ? new Date().toISOString() : t.completedAt,
              groupId: isFinished ? 'finished' : t.groupId,
            };
          }),
        })),

      groups: [
        { id: 'current', name: 'Current Tasks', type: 'system' },
        { id: 'finished', name: 'Finished', type: 'system' },
      ],
      addGroup: (name) =>
        set((state) => ({
          groups: [...(state.groups || []), { id: generateId(), name, type: 'custom' }],
        })),
      deleteGroup: (id) =>
        set((state) => {
          const targetGroup = state.groups.find((g) => g.id === id);
          if (!targetGroup || targetGroup.type === 'system' || id === 'current' || id === 'finished') {
            return state;
          }
          return {
            groups: state.groups.filter((g) => g.id !== id),
            todos: state.todos.map((t) => (t.groupId === id ? { ...t, groupId: 'current' } : t)),
          };
        }),

      moodNotes: [],
      addMoodNote: (note) => set((state) => ({ moodNotes: [...(state.moodNotes || []), note] })),
      deleteMoodNote: (id) =>
        set((state) => ({
          moodNotes: (state.moodNotes || []).filter((n) => n.id !== id),
        })),
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
                  id: generateId(),
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
                  id: generateId(),
                  date: dateKey,
                  mood: nextMood,
                  text: "",
                },
              ],
            };
          }
        }),
      sessions: [],
      distractions: [],

      deepFocusMode: false,
      setDeepFocusMode: (mode) => set({ deepFocusMode: mode }),

      background: 'dark',
      setBackground: (bg) => set({ background: bg }),

      addSession: (session) =>
        set((state) => ({
          sessions: [...(state.sessions || []), session],
        })),

      addDistraction: (category) =>
        set((state) => ({
          distractions: [
            ...(state.distractions || []),
            {
              id: generateId(),
              timestamp: new Date().toISOString(),
              category,
            },
          ],
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
                      id: generateId(),
                      text,
                      completed: false,
                    },
                  ],
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
                  subtasks: t.subtasks?.map((s) =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                  ),
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

      pomodoroSettings: { work: 25, break: 5, autoStartBreak: false },
      setPomodoroSettings: (updates) =>
        set((state) => ({
          pomodoroSettings: { ...state.pomodoroSettings, ...updates },
        })),

      resetAllData: () =>
        set({
          todos: [],
          groups: [
            { id: 'current', name: 'Current Tasks', type: 'system' },
            { id: 'finished', name: 'Finished', type: 'system' },
          ],
          moodNotes: [],
          sessions: [],
          distractions: [],
          sessionName: '',
          selectedTodoId: null,
          selectedSubtaskId: null,
          timerMode: 'POMODORO',
          timerState: 'WORK',
          timeLeft: 25 * 60,
          isActive: false,
          pomodoroSettings: { work: 25, break: 5, autoStartBreak: false },
          background: 'dark',
        }),
    }),
    {
      name: 'focus-mobile-storage-v1',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
