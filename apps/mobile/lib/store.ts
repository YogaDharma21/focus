import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';
import { DEFAULT_SHIELD_CONFIG, normalizeAppName, normalizeSite, type ShieldConfig } from './shield';

export type ViewType = 'FOCUS' | 'TASKS' | 'JOURNAL' | 'SHIELD' | 'SETTINGS';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SubtaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: TaskPriority;
  deadline?: string;
  estimatedMinutes?: number;
  subtasks?: SubtaskItem[];
  completedAt?: string;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

export interface Session {
  id: string;
  date: string;
  duration: number;
  mode: 'STOPWATCH';
  taskId?: string;
  taskName?: string;
}

export interface Distraction {
  id: string;
  timestamp: string;
  category: string;
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
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;
  soundEffectVolume: number;
  setSoundEffectVolume: (volume: number) => void;
  soundEffectEnabled: boolean;
  setSoundEffectEnabled: (enabled: boolean) => void;

  timerMode: 'STOPWATCH';
  timerState: 'FLOW' | 'BREAK';
  timeLeft: number;
  isActive: boolean;
  sessionStartTime: string | null;
  autoStartBreak: boolean;
  autoStartFlow: boolean;
  setTimerMode: (mode: 'STOPWATCH') => void;
  setTimerState: (state: 'FLOW' | 'BREAK') => void;
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

  shield: ShieldConfig;
  setShieldEnabled: (enabled: boolean) => void;
  setUrlBlocking: (enabled: boolean) => void;
  addBlockedSite: (site: string) => void;
  removeBlockedSite: (site: string) => void;
  addAllowedSite: (site: string) => void;
  removeAllowedSite: (site: string) => void;
  addBlockedApp: (app: string) => void;
  removeBlockedApp: (app: string) => void;

  addSession: (session: Session) => void;
  addDistraction: (category: string) => void;

  resetAllData: () => void;
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
      soundEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled, ...(enabled ? {} : { isMusicPlaying: false, mediaPlayerOpen: false }) }),
      musicEnabled: true,
      setMusicEnabled: (enabled) => set({ musicEnabled: enabled, ...(enabled ? {} : { isMusicPlaying: false, mediaPlayerOpen: false }) }),
      musicVolume: 0.8,
      setMusicVolume: (volume) => set({ musicVolume: volume }),
      soundEffectVolume: 0.8,
      setSoundEffectVolume: (volume) => set({ soundEffectVolume: volume }),
      soundEffectEnabled: true,
      setSoundEffectEnabled: (enabled) => set({ soundEffectEnabled: enabled }),

      timerMode: 'STOPWATCH',
      timerState: 'FLOW',
      timeLeft: 0,
      isActive: false,
      sessionStartTime: null,
      setTimerMode: (mode) => set({ timerMode: mode }),
      setTimerState: (state) => set({ timerState: state }),
      setTimeLeft: (timeOrFn) =>
        set((state) => ({
          timeLeft: typeof timeOrFn === 'function' ? timeOrFn(state.timeLeft) : timeOrFn,
        })),
      setIsActive: (active) => set({ isActive: active }),
      setSessionStartTime: (time) => set({ sessionStartTime: time }),
      autoStartBreak: true,
      setAutoStartBreak: (enabled) => set({ autoStartBreak: enabled }),
      autoStartFlow: true,
      setAutoStartFlow: (enabled) => set({ autoStartFlow: enabled }),

      tasks: [],
      selectedTaskId: null,
      addTask: ({ text, priority = 'medium', deadline, estimatedMinutes }) =>
        set((state) => ({
          tasks: [
            {
              id: generateId(),
              text: text.trim(),
              completed: false,
              priority,
              deadline: deadline || undefined,
              estimatedMinutes: estimatedMinutes && estimatedMinutes > 0 ? estimatedMinutes : undefined,
              subtasks: [],
            },
            ...(state.tasks || []),
          ],
        })),
      toggleTask: (id) =>
        set((state) => ({
          tasks: (state.tasks || []).map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: !task.completed,
                  completedAt: !task.completed ? new Date().toISOString() : undefined,
                }
              : task
          ),
        })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: (state.tasks || []).map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: (state.tasks || []).filter((task) => task.id !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        })),
      addSubtask: (taskId, text) =>
        set((state) => ({
          tasks: (state.tasks || []).map((task) => {
            if (task.id !== taskId) return task;
            const subtasks = [
              ...(task.subtasks || []),
              {
                id: generateId(),
                text: text.trim(),
                completed: false,
              },
            ];
            return { ...task, subtasks };
          }),
        })),
      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: (state.tasks || []).map((task) => {
            if (task.id !== taskId) return task;
            const subtasks = (task.subtasks || []).map((sub) =>
              sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
            );
            return { ...task, subtasks };
          }),
        })),
      deleteSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: (state.tasks || []).map((task) => {
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

      shield: { ...DEFAULT_SHIELD_CONFIG },
      setShieldEnabled: (enabled) =>
        set((state) => ({ shield: { ...state.shield, enabled } })),
      setUrlBlocking: (enabled) =>
        set((state) => ({ shield: { ...state.shield, urlBlocking: enabled } })),
      addBlockedSite: (site) =>
        set((state) => {
          const clean = normalizeSite(site);
          if (!clean || state.shield.blockedSites.includes(clean)) return state;
          return { shield: { ...state.shield, blockedSites: [...state.shield.blockedSites, clean] } };
        }),
      removeBlockedSite: (site) =>
        set((state) => ({
          shield: { ...state.shield, blockedSites: state.shield.blockedSites.filter((s) => s !== site) },
        })),
      addAllowedSite: (site) =>
        set((state) => {
          const clean = normalizeSite(site);
          if (!clean || state.shield.allowedSites.includes(clean)) return state;
          return { shield: { ...state.shield, allowedSites: [...state.shield.allowedSites, clean] } };
        }),
      removeAllowedSite: (site) =>
        set((state) => ({
          shield: { ...state.shield, allowedSites: state.shield.allowedSites.filter((s) => s !== site) },
        })),
      addBlockedApp: (app) =>
        set((state) => {
          const clean = normalizeAppName(app);
          if (!clean || state.shield.blockedApps.includes(clean)) return state;
          return { shield: { ...state.shield, blockedApps: [...state.shield.blockedApps, clean] } };
        }),
      removeBlockedApp: (app) =>
        set((state) => ({
          shield: { ...state.shield, blockedApps: state.shield.blockedApps.filter((a) => a !== app) },
        })),

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

      resetAllData: () =>
        set({
          tasks: [],
          selectedTaskId: null,
          sessions: [],
          distractions: [],
          timerMode: 'STOPWATCH',
          timerState: 'FLOW',
          timeLeft: 0,
          isActive: false,
          autoStartBreak: true,
          autoStartFlow: true,
          isMusicPlaying: false,
        }),
    }),
    {
      name: 'focus-mobile-storage-v1',
      storage: createJSONStorage(() => safeStorage),
      version: 2,
      migrate: (persisted: unknown, _version: number) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        const storedShield =
          state.shield && typeof state.shield === 'object'
            ? (state.shield as Record<string, unknown>)
            : {};
        // Field-merge so new shield options backfill onto existing installs.
        state.shield = { ...DEFAULT_SHIELD_CONFIG, ...storedShield };
        if (!Array.isArray(state.tasks)) {
          state.tasks = [];
        }
        if (state.selectedTaskId === undefined) {
          state.selectedTaskId = null;
        }
        return state as unknown as AppState;
      },
    }
  )
);
