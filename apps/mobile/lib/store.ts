import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  description?: string;
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
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
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

  timerMode: 'POMODORO' | 'STOPWATCH';
  timerState: 'WORK' | 'BREAK';
  previousMode: 'POMODORO' | 'STOPWATCH';
  timeLeft: number;
  isActive: boolean;
  sessionStartTime: string | null;
  setTimerMode: (mode: 'POMODORO' | 'STOPWATCH') => void;
  setTimerState: (state: 'WORK' | 'BREAK') => void;
  setPreviousMode: (mode: 'POMODORO' | 'STOPWATCH') => void;
  setTimeLeft: (time: number) => void;
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
    settings: Partial<{ work: number; break: number; autoStartBreak: boolean }>
  ) => void;

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
      localUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      localPlaylist: [
        {
          id: 'local-1',
          title: 'Peaceful Piano',
          artist: 'Focus Lo-Fi',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        },
        {
          id: 'local-2',
          title: 'Ambient Waves',
          artist: 'Deep Focus',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        },
        {
          id: 'local-3',
          title: 'Coding Beats',
          artist: 'Dev Music',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
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

      timerMode: 'POMODORO',
      timerState: 'WORK',
      previousMode: 'POMODORO',
      timeLeft: 25 * 60,
      isActive: false,
      sessionStartTime: null,
      setTimerMode: (mode) => set({ timerMode: mode }),
      setTimerState: (state) => set({ timerState: state }),
      setPreviousMode: (mode) => set({ previousMode: mode }),
      setTimeLeft: (time) => set({ timeLeft: time }),
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

      groups: [
        { id: 'current', name: 'Current Tasks', type: 'system' },
        { id: 'finished', name: 'Finished', type: 'system' },
      ],
      addGroup: (name) =>
        set((state) => ({
          groups: [...(state.groups || []), { id: generateId(), name, type: 'custom' }],
        })),
      deleteGroup: (id) =>
        set((state) => ({
          groups: (state.groups || []).filter((g) => g.id !== id),
        })),

      moodNotes: [],
      addMoodNote: (note) => set((state) => ({ moodNotes: [...(state.moodNotes || []), note] })),
      deleteMoodNote: (id) =>
        set((state) => ({
          moodNotes: (state.moodNotes || []).filter((n) => n.id !== id),
        })),
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
    }),
    {
      name: 'focus-mobile-storage-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
