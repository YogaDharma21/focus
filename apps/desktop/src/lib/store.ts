import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_SHIELD_CONFIG,
  ShieldConfig,
  ShieldViolation,
  normalizeAppName,
  normalizeSite,
} from "./shield";

export type ViewType = "FOCUS" | "JOURNAL" | "SHIELD" | "SETTINGS";

export interface Session {
  id: string;
  date: string;
  duration: number;
  mode: "STOPWATCH";
}

export interface Distraction {
  id: string;
  timestamp: string;
  category: string;
  website?: string;
  app?: string;
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
  soundEffectVolume: number;
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
  autoPauseOnExternalAudio: boolean;
  autoPauseFadeDuration: number;
  setAutoPauseOnExternalAudio: (enabled: boolean) => void;
  setAutoPauseFadeDuration: (duration: number) => void;
  setSoundEffectEnabled: (enabled: boolean) => void;
  setSoundEffectVolume: (volume: number) => void;
  setVolume: (volume: number) => void;

  // Timer State
  timerMode: "STOPWATCH";
  timerState: "FLOW" | "BREAK";
  timeLeft: number;
  flowTimeElapsed: number;
  isActive: boolean;
  sessionStartTime: string | null;
  autoStartBreak: boolean;
  autoStartFlow: boolean;

  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  setFlowTimeElapsed: (time: number | ((prev: number) => number)) => void;
  setTimerState: (state: "FLOW" | "BREAK") => void;
  setIsActive: (active: boolean) => void;
  setSessionStartTime: (time: string | null) => void;
  setAutoStartBreak: (enabled: boolean) => void;
  setAutoStartFlow: (enabled: boolean) => void;

  // Sessions
  sessions: Session[];
  addSession: (session: Session) => void;
  distractions: Distraction[];
  addDistraction: (category: string) => void;

  // Visuals & Themes
  deepFocusMode: boolean;
  setDeepFocusMode: (mode: boolean) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;

  // Focus Shield (app + website blocking)
  shield: ShieldConfig;
  setShieldEnabled: (enabled: boolean) => void;
  addBlockedSite: (site: string) => void;
  removeBlockedSite: (site: string) => void;
  addAllowedSite: (site: string) => void;
  removeAllowedSite: (site: string) => void;
  addBlockedApp: (app: string) => void;
  removeBlockedApp: (app: string) => void;

  // Shield violations are ephemeral (never persisted)
  shieldViolations: ShieldViolation[];
  pushShieldViolation: (violation: ShieldViolation) => void;
  resolveShieldViolation: (kind: ShieldViolation["kind"], match: string) => void;
  dismissShieldViolations: () => void;
  addShieldDistraction: (category: string, detail?: { website?: string; app?: string }) => void;
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
      soundEffectVolume: 0.8,
      volume: 0.8,
      localPlaylist: [
        {
          id: "local-1",
          title: "Lofi-Beats",
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
      autoPauseOnExternalAudio: false,
      autoPauseFadeDuration: 2,
      setAutoPauseOnExternalAudio: (enabled) => set({ autoPauseOnExternalAudio: enabled }),
      setAutoPauseFadeDuration: (duration) => set({ autoPauseFadeDuration: duration }),
      setSoundEffectEnabled: (enabled) => set({ soundEffectEnabled: enabled }),
      setSoundEffectVolume: (volume) => set({ soundEffectVolume: volume }),
      setVolume: (volume) => set({ volume }),

      // Timer State
      timerMode: "STOPWATCH",
      timerState: "FLOW",
      timeLeft: 0,
      flowTimeElapsed: 0,
      isActive: false,
      sessionStartTime: null,

      setTimeLeft: (timeOrFn) =>
        set((state) => ({
          timeLeft: typeof timeOrFn === "function" ? timeOrFn(state.timeLeft) : timeOrFn,
        })),
      setFlowTimeElapsed: (timeOrFn) =>
        set((state) => ({
          flowTimeElapsed: typeof timeOrFn === "function" ? timeOrFn(state.flowTimeElapsed) : timeOrFn,
        })),
      setTimerState: (state) => set({ timerState: state }),
      setIsActive: (active) => set({ isActive: active }),
      setSessionStartTime: (time) => set({ sessionStartTime: time }),
      autoStartBreak: true,
      setAutoStartBreak: (enabled) => set({ autoStartBreak: enabled }),
      autoStartFlow: true,
      setAutoStartFlow: (enabled) => set({ autoStartFlow: enabled }),

      // Sessions
      sessions: [
        {
          id: "session-1",
          date: new Date().toISOString(),
          duration: 1500,
          mode: "STOPWATCH",
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
      theme: "dark" as "light" | "dark",
      setTheme: (t) => set({ theme: t }),

      // Focus Shield
      shield: { ...DEFAULT_SHIELD_CONFIG },
      setShieldEnabled: (enabled) =>
        set((state) => ({ shield: { ...state.shield, enabled } })),
      addBlockedSite: (site) => {
        const clean = normalizeSite(site);
        if (!clean) return;
        set((state) => {
          if (state.shield.blockedSites.includes(clean)) return state;
          return {
            shield: {
              ...state.shield,
              blockedSites: [...state.shield.blockedSites, clean],
            },
          };
        });
      },
      removeBlockedSite: (site) =>
        set((state) => ({
          shield: {
            ...state.shield,
            blockedSites: state.shield.blockedSites.filter((s) => s !== site),
          },
        })),
      addAllowedSite: (site) => {
        const clean = normalizeSite(site);
        if (!clean) return;
        set((state) => {
          if (state.shield.allowedSites.includes(clean)) return state;
          return {
            shield: {
              ...state.shield,
              allowedSites: [...state.shield.allowedSites, clean],
            },
          };
        });
      },
      removeAllowedSite: (site) =>
        set((state) => ({
          shield: {
            ...state.shield,
            allowedSites: state.shield.allowedSites.filter((s) => s !== site),
          },
        })),
      addBlockedApp: (app) => {
        const clean = normalizeAppName(app);
        if (!clean) return;
        set((state) => {
          if (state.shield.blockedApps.includes(clean)) return state;
          return {
            shield: {
              ...state.shield,
              blockedApps: [...state.shield.blockedApps, clean],
            },
          };
        });
      },
      removeBlockedApp: (app) =>
        set((state) => ({
          shield: {
            ...state.shield,
            blockedApps: state.shield.blockedApps.filter((a) => a !== app),
          },
        })),

      shieldViolations: [],
      pushShieldViolation: (violation) =>
        set((state) => {
          const last = state.shieldViolations[state.shieldViolations.length - 1];
          if (
            last &&
            last.kind === violation.kind &&
            last.match === violation.match &&
            Date.now() - new Date(last.timestamp).getTime() < 5000
          ) {
            return state;
          }
          return {
            shieldViolations: [...state.shieldViolations.slice(-9), violation],
          };
        }),
      dismissShieldViolations: () => set({ shieldViolations: [] }),
      resolveShieldViolation: (kind, match) =>
        set((state) => ({
          shieldViolations: state.shieldViolations.filter(
            (v) => !(v.kind === kind && v.match === match),
          ),
        })),
      addShieldDistraction: (category, detail) =>
        set((state) => ({
          distractions: [
            ...(state.distractions || []),
            {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              category,
              ...(detail?.website ? { website: detail.website } : {}),
              ...(detail?.app ? { app: detail.app } : {}),
            },
          ],
        })),
    }),
    {
      name: "focus-desktop-storage-v2",
      version: 1,
      migrate: (persistedState: unknown) => {
        const persisted = (persistedState ?? {}) as Record<string, unknown>;
        const storedShield = (persisted.shield ?? {}) as Partial<ShieldConfig>;
        return {
          ...(persisted as object),
          autoPauseOnExternalAudio: persisted.autoPauseOnExternalAudio ?? false,
          autoPauseFadeDuration:
            typeof persisted.autoPauseFadeDuration === "number"
              ? persisted.autoPauseFadeDuration
              : 2,
          shield: {
            ...DEFAULT_SHIELD_CONFIG,
            ...storedShield,
            blockedSites:
              storedShield.blockedSites ?? DEFAULT_SHIELD_CONFIG.blockedSites,
            allowedSites:
              storedShield.allowedSites ?? DEFAULT_SHIELD_CONFIG.allowedSites,
            blockedApps:
              storedShield.blockedApps ?? DEFAULT_SHIELD_CONFIG.blockedApps,
          },
        };
      },
      partialize: (state) => {
        const { shieldViolations: _omit, ...persisted } = state;
        return persisted;
      },
    }
  )
);
