import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from './storage';

export type ViewType = 'FOCUS' | 'JOURNAL' | 'SETTINGS';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

export interface Session {
  id: string;
  date: string;
  duration: number;
  mode: 'STOPWATCH';
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
  sessionName: string;
  setSessionName: (name: string) => void;

  sessions: Session[];
  distractions: Distraction[];

  deepFocusMode: boolean;
  setDeepFocusMode: (mode: boolean) => void;

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
      sessionName: '',
      setSessionName: (name) => set({ sessionName: name }),

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
          sessions: [],
          distractions: [],
          sessionName: '',
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
    }
  )
);
