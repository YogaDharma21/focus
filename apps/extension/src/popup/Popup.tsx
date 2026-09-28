import React, { useEffect, useState, useRef } from "react";
import {
  Timer as TimerIcon,
  Shield,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Plus,
  Trash2,
  ExternalLink,
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  ShieldAlert,
  ShieldCheck,
  Info,
  Github,
  BookOpen,
  X,
  MessageSquarePlus,
  Settings as SettingsIcon,
  AlertTriangle,
  ArrowRight,
  Paintbrush,
  Music,
  Volume2,
  Volume1,
  BellRing,
  ChevronUp,
  ChevronDown,
  Activity,
  Coffee,
  TrendingUp,
  Focus,
  Database,
} from "lucide-react";
import { DeepFocusOverlay } from "./components/DeepFocusOverlay";
import { Progress } from "../components/ui/progress";
import { AppStateData, ThemeMode } from "../types";
import { getStoredState, saveStoredState, subscribeToStateChanges, getCachedState, DEFAULT_STATE, getWeeklyMinutesFromSessions, getTodayMinutesFromSessions, calculateStreaksFromSessions, DAYS_OF_WEEK } from "../lib/storage";
import "../index.css";

const DISTRACTION_CATEGORIES = [
  "Phone",
  "Social Media",
  "Bathroom",
  "Meeting",
  "Other"
];

export function Popup() {
  const [state, setState] = useState<AppStateData | null>(getCachedState());
  const [activeTab, setActiveTab] = useState<"timer" | "shield" | "stats" | "settings">("timer");
  const [showDistractionPicker, setShowDistractionPicker] = useState(false);
  const [showFloatingTimerCard, setShowFloatingTimerCard] = useState(false);

  // Deep Focus Mode: auto-activate when timer starts
  const prevIsActiveRef = useRef(state?.isActive ?? false);
  const isInitialLoadRef = useRef(true);

  // Local inputs
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [shieldListTab, setShieldListTab] = useState<"blocked" | "unblocked">("blocked");

  // Settings inputs

  // Music Player State & Controls
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);

  const isMusicPlaying = state?.isMusicPlaying ?? false;
  const musicVolume = state?.musicVolume ?? 0.8;
  const soundEffectVolume = state?.soundEffectVolume ?? 0.8;
  const soundEnabled = state?.soundEnabled ?? true;
  const musicEnabled = state?.musicEnabled ?? true;
  const soundEffectEnabled = state?.soundEffectEnabled ?? true;
  const autoPauseOnExternalAudio = state?.autoPauseOnExternalAudio ?? false;

  const handleMusicVolumeChange = (v: number) => {
    updateState({ musicVolume: v });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_MUSIC_VOLUME", volume: v });
    }
  };

  const handleSoundEffectVolumeChange = (v: number) => {
    updateState({ soundEffectVolume: v });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_SOUND_EFFECT_VOLUME", volume: v });
    }
  };

  const handleSoundEffectToggle = (enabled: boolean) => {
    updateState({ soundEffectEnabled: enabled });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_SOUND_EFFECT_ENABLED", enabled });
    }
  };

  const toggleSoundEffectEnabled = () => {
    const next = !soundEffectEnabled;
    updateState({ soundEffectEnabled: next });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_SOUND_EFFECT_ENABLED", enabled: next });
    }
  };

  const toggleSoundEnabled = () => {
    const next = !soundEnabled;
    updateState({ soundEnabled: next, isMusicPlaying: false });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_SOUND_ENABLED", enabled: next });
    }
  };

  const toggleMusicEnabled = () => {
    const next = !musicEnabled;
    updateState({ musicEnabled: next, isMusicPlaying: false });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_MUSIC_ENABLED", enabled: next });
    }
  };

  const toggleAutoPauseOnExternalAudio = () => {
    const next = !autoPauseOnExternalAudio;
    updateState({ autoPauseOnExternalAudio: next });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_AUTO_PAUSE_ON_EXTERNAL_AUDIO", enabled: next });
    }
  };

  const playSoundEffect = (overrideVolume?: number) => {
    if (!soundEnabled || !soundEffectEnabled) return;
    const vol = typeof overrideVolume === "number" ? overrideVolume : soundEffectVolume;
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "PLAY_SOUND_EFFECT", volume: vol });
    } else {
      try {
        const audio = new Audio("/soundeffect.mp3");
        audio.volume = Math.max(0, Math.min(1, vol));
        audio.play().catch(() => {});
      } catch (err) {}
    }
  };

  const playTestSoundEffect = (overrideVolume?: number) => {
    if (!soundEnabled || !soundEffectEnabled) return;
    const vol = typeof overrideVolume === "number" ? overrideVolume : soundEffectVolume;
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "PLAY_SOUND_EFFECT", volume: vol });
    } else {
      try {
        const audio = new Audio("/soundeffect.mp3");
        audio.volume = Math.max(0, Math.min(1, vol));
        audio.play().catch(() => {});
      } catch (err) {}
    }
  };

  const toggleMusicPlay = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "TOGGLE_MUSIC" });
    } else {
      updateState({ isMusicPlaying: !isMusicPlaying });
    }
  };

  useEffect(() => {
    getStoredState().then((initial) => {
      setState(initial);
      const mode = initial.themeMode || "dark";
      document.documentElement.classList.toggle("dark", mode === "dark");
      document.documentElement.classList.toggle("light", mode === "light");
      document.body.classList.toggle("dark", mode === "dark");
      document.body.classList.toggle("light", mode === "light");
    });

    const unsubscribe = subscribeToStateChanges((updated) => {
      setState(updated);
      const mode = updated.themeMode || "dark";
      document.documentElement.classList.toggle("dark", mode === "dark");
      document.documentElement.classList.toggle("light", mode === "light");
      document.body.classList.toggle("dark", mode === "dark");
      document.body.classList.toggle("light", mode === "light");
    });

    return () => unsubscribe();
  }, []);

  // Auto-activate deep focus when timer starts, auto-exit when timer stops/finishes
  useEffect(() => {
    if (!state) return;
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevIsActiveRef.current = state.isActive;
      return;
    }
    if (state.isActive && !prevIsActiveRef.current && !state.deepFocusMode && state.timerState === "FLOW") {
      updateState({ deepFocusMode: true });
    } else if (!state.isActive && prevIsActiveRef.current && state.deepFocusMode) {
      updateState({ deepFocusMode: false });
    }
    prevIsActiveRef.current = state.isActive;
  }, [state?.isActive]);

  useEffect(() => {
    if (!state) return;
    const mode = state.themeMode || "dark";
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.classList.toggle("light", mode === "light");
    document.body.classList.toggle("dark", mode === "dark");
    document.body.classList.toggle("light", mode === "light");
  }, [state?.themeMode]);

  // No local timer tick — the background service worker is the single source
  // of truth. Timer state updates arrive via subscribeToStateChanges above.

  if (!state) {
    return (
      <div className="w-[420px] h-[580px] bg-background text-foreground flex items-center justify-center font-mono text-xs">
        LOADING FOCUS...
      </div>
    );
  }


  const updateState = (updates: Partial<AppStateData>) => {
    setState((prev) => (prev ? { ...prev, ...updates } : null));
    saveStoredState(updates).then((nxt) => {
      setState(nxt);
    });
  };


  // Timer controls — write to storage directly, the background's
  // chrome.storage.onChanged listener reacts to start/stop the timer.
  const toggleTimer = () => {
    const starting = !state.isActive;
    if (starting && state.timerState === "FLOW") {
      updateState({ isActive: true, deepFocusMode: true, isMusicPlaying: soundEnabled && musicEnabled });
    } else {
      updateState({ isActive: starting, deepFocusMode: false, isMusicPlaying: false });
    }
  };

  const resetTimer = () => {
    updateState({ isActive: false, deepFocusMode: false, timeLeft: 0, isMusicPlaying: false });
  };

  const completeSession = () => {
    // If in BREAK mode, finishing session concludes the break immediately and returns to Flow
    if (state.timerState === "BREAK") {
      playSoundEffect();
      updateState({
        isActive: false,
        isMusicPlaying: false,
        deepFocusMode: false,
        timerMode: "FLOW",
        timerState: "FLOW",
        previousMode: "FLOW",
        timeLeft: 0,
      });
      return;
    }

    playSoundEffect();

    if (state.isActive && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "RESTORE_BLOCKED_TABS" });
    }

    const durationLogged = state.timeLeft > 0 ? state.timeLeft : 1;

    const newSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: durationLogged,
      mode: state.timerMode
    };

    const newSessionList = [newSession, ...state.sessions];
    const updatedWeekly = getWeeklyMinutesFromSessions(newSessionList);
    const updatedTodayMins = getTodayMinutesFromSessions(newSessionList);
    const streaks = calculateStreaksFromSessions(newSessionList);

    const breakDuration = Math.max(1, Math.floor(state.timeLeft / 5));

    const autoStartBreak = Boolean(state.timerSettings?.autoStartBreak);

    updateState({
      isActive: autoStartBreak,
      isMusicPlaying: false,
      deepFocusMode: false,
      timerMode: "FLOW",
      timerState: "BREAK",
      previousMode: "FLOW",
      timeLeft: breakDuration,
      sessions: newSessionList,
      stats: {
        ...state.stats,
        todayMinutes: updatedTodayMins,
        weeklyMinutes: updatedWeekly,
        streakDays: streaks.current,
        longestStreak: streaks.best
      }
    });
  };

  // Log Distraction automatically pauses the timer!
  const selectDistractionCategory = (category: string) => {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category
    };
    updateState({
      isActive: false,
      isMusicPlaying: false,
      distractions: [...state.distractions, entry]
    });
    setShowDistractionPicker(false);
  };

  // Reset All Extension Data to Factory Defaults
  const resetAllData = () => {
    if (window.confirm("Are you sure you want to reset all extension data to defaults? This will clear all sessions and stats.")) {
      saveStoredState(DEFAULT_STATE).then((fresh) => {
        setState(fresh);
      });
    }
  };

  // Shield Handlers
  const addShieldSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteUrl.trim()) return;
    let clean = newSiteUrl.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    if (!clean) return;

    if (shieldListTab === "blocked") {
      if (state.shield.blockedSites.includes(clean)) return;
      updateState({
        shield: {
          ...state.shield,
          blockedSites: [...state.shield.blockedSites, clean]
        }
      });
    } else {
      if (state.shield.allowedSites.includes(clean)) return;
      updateState({
        shield: {
          ...state.shield,
          allowedSites: [...state.shield.allowedSites, clean]
        }
      });
    }
    setNewSiteUrl("");
  };

  const removeBlockedSite = (site: string) => {
    updateState({
      shield: {
        ...state.shield,
        blockedSites: state.shield.blockedSites.filter(s => s !== site)
      }
    });
  };

  const removeAllowedSite = (site: string) => {
    updateState({
      shield: {
        ...state.shield,
        allowedSites: state.shield.allowedSites.filter(s => s !== site)
      }
    });
  };

  const openGithubLink = () => {
    const url = "https://github.com/YogaDharma21/focus";
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  // Time calculations
  const mins = Math.floor(state.timeLeft / 60);
  const secs = state.timeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const totalDuration = 0;
  const progressValue = state.timerState === "FLOW" ? 100 : 0;

  // Stats Calculations
  const dynamicWeeklyMinutes = getWeeklyMinutesFromSessions(state.sessions);
  const dynamicTodayMinutes = getTodayMinutesFromSessions(state.sessions);
  const dynamicStreaks = calculateStreaksFromSessions(state.sessions);
  const maxWeeklyMins = Math.max(120, ...Object.values(dynamicWeeklyMinutes));

  // Distraction Analysis Breakdown
  const distractionCounts: { [cat: string]: number } = {};
  state.distractions.forEach(d => {
    if (d.category === "Shield Blocked Tab") return;
    const cat = d.category || "Other";
    distractionCounts[cat] = (distractionCounts[cat] || 0) + 1;
  });

  // Instant Deep Focus View when in Deep Focus Mode
  if (state.deepFocusMode) {
    return (
      <div className="w-[420px] h-[580px] bg-background text-foreground relative flex flex-col overflow-hidden select-none font-sans">
        <DeepFocusOverlay
          state={state}
          onToggleTimer={toggleTimer}
          onCompleteSession={() => {
            completeSession();
            updateState({ deepFocusMode: false });
          }}
          onSelectDistraction={(category) => {
            selectDistractionCategory(category);
            updateState({ deepFocusMode: false });
          }}
          onToggleMusic={toggleMusicPlay}
          onSetMusicVolume={handleMusicVolumeChange}
          onExit={() => updateState({ deepFocusMode: false })}
        />
      </div>
    );
  }

  return (
    <div className={`w-[420px] h-[580px] flex flex-col overflow-hidden select-none font-sans relative ${
      "text-foreground"
    }`}>
      {/* Top Header */}
      <header className={`px-4 py-3 flex items-center z-10 ${
        "bg-background/95 border-b border-border"
      }`}>
        {/* Left: Logo */}
        <div className="flex-1 flex items-center gap-2.5">
          <img src="/icons/icon32.png" className="w-7 h-7 rounded-lg object-contain border border-border shadow-sm" alt="Focus Logo" />
          <div>
            <h1 className="text-sm font-extrabold tracking-wider uppercase font-heading">
              FOCUS
            </h1>
          </div>
        </div>

        {/* Center: Timer Pill (Visible when outside Timer tab) */}
        {activeTab !== "timer" && (
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => {
                setShowFloatingTimerCard(!showFloatingTimerCard);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                showFloatingTimerCard
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:bg-secondary"
              } ${state.isActive ? ("border-foreground/60 ring-1 ring-foreground/30") : ""}`}
              title="Toggle Floating Timer Controls"
            >
              <span className="flex items-center">
                {state.timerState === "BREAK" ? <Coffee className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              </span>
              <span className="font-extrabold font-mono text-[11px] tracking-tight">
                {timeFormatted}
              </span>
              {state.isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
              )}
            </button>
          </div>
        )}

        {/* Right: Settings */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setActiveTab("settings")}
            className={`p-1.5 rounded-lg transition-all ${
              activeTab === "settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Timer Card Overlay */}
      {activeTab !== "timer" && showFloatingTimerCard && (
        <div className={`absolute top-14 left-3 right-3 z-40 p-3.5 rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
          "bg-card border-border text-foreground shadow-background/80"
        }`}>
          {/* Top Row: Time */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center">
                {state.timerState === "BREAK" ? <Coffee className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </span>
              <span className="text-2xl font-black font-mono tracking-tight tabular-nums">
                {timeFormatted}
              </span>
              {state.isActive && <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />}
            </div>
          </div>

          {/* Control Action Buttons Row */}
          <div className="flex items-center gap-2">
            {/* Complete Session Button */}
            <button
              disabled={state.timerState === "BREAK" ? false : !state.isActive}
              onClick={() => {
                if (state.timerState !== "BREAK" && !state.isActive) return;
                completeSession();
                setShowFloatingTimerCard(false);
              }}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                state.timerState !== "BREAK" && !state.isActive
                  ? "bg-card border-border text-muted-foreground cursor-not-allowed opacity-50"
                  : "bg-secondary border-border hover:bg-accent text-foreground cursor-pointer"
              }`}
              title={state.timerState === "BREAK" ? "Finish Break & Return to Flow" : (state.isActive ? "Complete Session" : "Start timer to complete session")}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{state.timerState === "BREAK" ? "Finish Break" : "Complete"}</span>
            </button>

            {/* Log Distraction Button */}
            <button
              disabled={!state.isActive}
              onClick={() => {
                if (!state.isActive) return;
                setShowFloatingTimerCard(false);
                setShowDistractionPicker(true);
              }}
              className={`p-2 rounded-xl border transition-all ${
                !state.isActive
                  ? "bg-card border-border text-muted-foreground cursor-not-allowed opacity-50"
                  : "bg-secondary border-border hover:bg-accent text-muted-foreground"
              }`}
              title={state.isActive ? "Log Distraction" : "Start timer to log distraction"}
            >
              <AlertTriangle className="w-4 h-4" />
            </button>

            {/* Start / Pause Button */}
            <button
              onClick={toggleTimer}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow ${
                "bg-primary text-primary-foreground border-primary hover:bg-accent"
              }`}
            >
              {state.isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Start</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Distraction Picker Modal */}
      {showDistractionPicker && (
        <div className={`absolute inset-0 z-50 p-5 flex flex-col justify-between animate-in fade-in duration-200 ${
          "bg-background/95 text-foreground"
        }`}>
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider">LOG DISTRACTION</h2>
            </div>
            <button
              onClick={() => setShowDistractionPicker(false)}
              className={`p-1 rounded-lg border ${
                "bg-card border-border text-foreground hover:bg-secondary"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 my-auto">
            <p className="text-xs font-mono text-center mb-3 opacity-80">Select what distracted you (Timer paused):</p>
            {DISTRACTION_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => selectDistractionCategory(cat)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-mono border transition-all text-left flex items-center justify-between ${
                  "bg-card border-border hover:bg-secondary text-foreground"
                }`}
              >
                <span>{cat}</span>
                <Plus className="w-4 h-4 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className={`flex items-center gap-1 px-3 py-2 z-10 ${
        "bg-card/60"
      }`}>
        {[
          { id: "timer", label: "Timer", icon: TimerIcon },
          { id: "shield", label: "Shield", icon: Shield, activeIndicator: state.shield.enabled && state.isActive },
          { id: "stats", label: "Stats", icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl transition-colors relative text-[11px] font-bold px-3 py-1.5 min-h-[30px] ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {tab.activeIndicator && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping ${
                    "bg-foreground"
                  }`} />
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Floating Music Player Bar */}
      <div className="px-3 pt-2 z-20">
        <div className={`flex items-center justify-between p-2 px-3 rounded-2xl border shadow-md transition-all ${
          soundEnabled && musicEnabled
            ? "bg-card border-border text-foreground"
            : "bg-card/50 border-border/50 text-muted-foreground"
        }`}>
          <div
            onClick={() => setIsMusicExpanded(!isMusicExpanded)}
            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
          >
            <Music className="w-4 h-4 text-current shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">Lofi-Beats</div>
              {!soundEnabled && <div className="text-[9px] text-muted-foreground">Sound disabled</div>}
              {soundEnabled && !musicEnabled && <div className="text-[9px] text-muted-foreground">Music disabled</div>}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleMusicPlay}
              disabled={!soundEnabled || !musicEnabled}
              className={`w-7 h-7 rounded-lg flex items-center justify-center shadow transition-all ${
                soundEnabled && musicEnabled
                  ? "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`}
              title={!soundEnabled ? "Sound is disabled" : !musicEnabled ? "Music is disabled" : isMusicPlaying ? "Pause" : "Play"}
            >
              {isMusicPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setIsMusicExpanded(!isMusicExpanded)}
              className="p-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              {isMusicExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Music Player Drawer */}
        {isMusicExpanded && (
          <div className={`mt-1.5 p-3 rounded-xl border shadow-xl transition-all ${
            soundEnabled && musicEnabled
              ? "bg-card border-border text-foreground"
              : "bg-card/50 border-border/50 text-muted-foreground"
          }`}>
            <div className="flex items-center justify-between mb-2 pb-1.5">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Volume2 className="w-4 h-4" />
                <span>Sound Player</span>
              </div>
              <button
                onClick={() => setIsMusicExpanded(false)}
                className="opacity-70 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {!soundEnabled && (
              <div className="mb-2 p-2 rounded-lg bg-secondary/50 border border-border/50 text-center">
                <span className="text-[10px] text-muted-foreground font-medium">Sound is disabled. Enable it in Settings.</span>
              </div>
            )}

            {soundEnabled && !musicEnabled && (
              <div className="mb-2 p-2 rounded-lg bg-secondary/50 border border-border/50 text-center">
                <span className="text-[10px] text-muted-foreground font-medium">Music is disabled. Enable it in Settings.</span>
              </div>
            )}

            <div
              onClick={soundEnabled && musicEnabled ? toggleMusicPlay : undefined}
              className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                !soundEnabled || !musicEnabled
                  ? "bg-background/30 border-border/30 opacity-50 cursor-not-allowed"
                  : isMusicPlaying
                    ? "bg-secondary border-border cursor-pointer"
                    : "bg-background/50 border-border/50 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music className={`w-4 h-4 ${soundEnabled && musicEnabled && isMusicPlaying ? "text-primary animate-pulse" : "opacity-50"}`} />
                <div>
                  <div className="text-xs font-bold">Lofi-Beats</div>
                </div>
              </div>

              {isMusicPlaying && (
                <div className="flex items-end gap-0.5 h-3">
                  <span className={`w-0.5 h-3 rounded-full animate-pulse ${"bg-foreground"}`} />
                  <span className={`w-0.5 h-2 rounded-full animate-pulse delay-75 ${"bg-foreground"}`} />
                  <span className={`w-0.5 h-3.5 rounded-full animate-pulse delay-150 ${"bg-foreground"}`} />
                </div>
              )}
            </div>

            {/* Music Volume Slider */}
            <div className={`mt-2 pt-2 border-t border-border space-y-1 ${!soundEnabled || !musicEnabled ? "opacity-40" : ""}`}>
              <div className="flex items-center justify-between text-[10px] opacity-60">
                <span>Music Volume</span>
                <span className="font-mono">{Math.round(musicVolume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 opacity-60 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={musicVolume}
                  onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                  disabled={!soundEnabled}
                  className="w-full h-1 rounded bg-secondary accent-current cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 z-10 relative">
        {/* TIMER TAB */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center justify-between min-h-full overflow-y-auto stable-scrollbar pb-1 pt-1 gap-2">
            {/* Timer Label */}
            <div className="flex items-center justify-center gap-2 mt-1 mb-0.5">
              {state.timerState === "BREAK" ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted-foreground shadow-sm">
                  <Coffee className="w-3 h-3" />
                  <span className="text-[10px] font-bold">Break</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted-foreground shadow-sm">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-bold">Flow</span>
                </div>
              )}
            </div>

            {/* Timer Display - Big Number */}
            <div className="flex flex-col items-center justify-center my-2 py-3">
              <span className="text-7xl font-black font-mono tracking-tighter leading-none">
                {timeFormatted}
              </span>
            </div>

            {/* Control Buttons Grid */}
            <div className="flex items-center gap-2">
              {/* Reset Timer */}
              <button
                onClick={resetTimer}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  "bg-card border-border hover:bg-secondary text-foreground"
                }`}
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Log Distraction Button */}
              <button
                disabled={!state.isActive}
                onClick={() => {
                  if (!state.isActive) return;
                  setShowDistractionPicker(true);
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  !state.isActive
                    ? "bg-card border-border text-muted-foreground cursor-not-allowed opacity-50"
                    : "bg-card border-border hover:bg-secondary text-foreground"
                }`}
                title={state.isActive ? "Log Distraction" : "Start timer to log distraction"}
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                onClick={toggleTimer}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-lg active:scale-95 ${
                  "bg-primary text-primary-foreground hover:bg-accent"
                }`}
              >
                {state.isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Complete Session Button */}
              <button
                disabled={state.timerState === "BREAK" ? false : !state.isActive}
                onClick={() => {
                  if (state.timerState !== "BREAK" && !state.isActive) return;
                  completeSession();
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  state.timerState !== "BREAK" && !state.isActive
                    ? "bg-card border-border text-muted-foreground cursor-not-allowed opacity-50"
                    : "bg-card border-border hover:bg-secondary text-foreground cursor-pointer"
                }`}
                title={state.timerState === "BREAK" ? "Finish Break & Return to Flow" : (state.isActive ? "Complete Session" : "Start timer to complete session")}
              >
                <CheckCircle className="w-4 h-4" />
              </button>

              {/* Deep Focus Mode Button */}
              <button
                onClick={() => updateState({ deepFocusMode: !state.deepFocusMode })}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  state.deepFocusMode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:bg-secondary text-foreground"
                }`}
                title="Deep Focus Mode"
              >
                <Focus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SHIELD TAB */}
        {activeTab === "shield" && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto stable-scrollbar">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              state.shield.enabled
                ? "bg-card border-border text-foreground"
                : "bg-background border-border text-muted-foreground"
            }`}>
              <div className="flex items-center gap-2.5">
                {state.shield.enabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                <div>
                  <h3 className="text-xs font-bold font-mono">SITE BLOCKER SHIELD</h3>
                  <p className="text-[10px] opacity-70">
                    {state.shield.enabled
                      ? (state.isActive && state.timerState === "FLOW"
                          ? "Active during Flow sessions"
                          : "Paused (Active during Flow sessions)")
                      : "Shield currently OFF"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => updateState({ shield: { ...state.shield, enabled: !state.shield.enabled } })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  state.shield.enabled
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border"
                }`}
              >
                {state.shield.enabled ? "ENABLED" : "ENABLE"}
              </button>
            </div>

            <form onSubmit={addShieldSite} className="flex gap-2">
              <input
                type="text"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                placeholder={shieldListTab === "blocked" ? "Block domain (e.g. twitter.com)..." : "Allow domain (e.g. music.youtube.com)..."}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none ${
                  "bg-card border-border text-foreground placeholder-muted-foreground focus:border-foreground"
                }`}
              />
              <button
                type="submit"
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  "bg-secondary border-border text-foreground hover:bg-accent"
                }`}
              >
                {shieldListTab === "blocked" ? "Block" : "Allow"}
              </button>
            </form>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex gap-1 p-1 rounded-xl bg-card border border-border mb-2">
                <button
                  onClick={() => setShieldListTab("blocked")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase transition-all ${
                    shieldListTab === "blocked"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Blocked ({state.shield.blockedSites.length})
                </button>
                <button
                  onClick={() => setShieldListTab("unblocked")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase transition-all ${
                    shieldListTab === "unblocked"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Unblocked ({state.shield.allowedSites.length})
                </button>
              </div>

              {shieldListTab === "blocked" && (
                <div className="flex-1 overflow-y-auto stable-scrollbar space-y-1.5 pr-1">
                  {state.shield.blockedSites.map((site) => (
                    <div
                      key={site}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-mono ${
                        "bg-card/60 border-border text-foreground"
                      }`}
                    >
                      <span className="text-[11px]">{site}</span>
                      <button onClick={() => removeBlockedSite(site)} className={`p-1 ${"text-muted-foreground hover:text-foreground"}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {shieldListTab === "unblocked" && (
                <div className="flex-1 overflow-y-auto stable-scrollbar space-y-1.5 pr-1">
                  {state.shield.allowedSites.length === 0 && (
                    <p className="text-[10px] text-muted-foreground mb-1">
                      No unblocked domains yet.
                    </p>
                  )}
                  {state.shield.allowedSites.map((site) => (
                    <div
                      key={site}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-mono ${
                        "bg-card/60 border-border text-foreground"
                      }`}
                    >
                      <span className="text-[11px]">{site}</span>
                      <button onClick={() => removeAllowedSite(site)} className={`p-1 ${"text-muted-foreground hover:text-foreground"}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto stable-scrollbar">
            {/* Day Progress Card (First Card in Stats) */}
            {(() => {
              const now = new Date();
              const secsPassed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
              const dayPercent = Math.min(100, Math.max(0, Math.round((secsPassed / 86400) * 100)));
              const remSecs = 86400 - secsPassed;
              const remH = Math.floor(remSecs / 3600);
              const remM = Math.floor((remSecs % 3600) / 60);

              return (
                <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
                  "bg-card border-border"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border flex items-center justify-center ${
                        "bg-secondary border-border text-foreground"
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold font-sans">Day Progress</span>
                    </div>
                    <span className="text-xs font-extrabold font-mono">{dayPercent}%</span>
                  </div>

                  <Progress value={dayPercent} className="h-2 rounded-full" />

                  <div className="text-[10px] font-mono opacity-60">
                    {remH}h {remM}m remaining today
                  </div>
                </div>
              );
            })()}

            {/* Top Metric Card */}
            <div className="grid grid-cols-1 gap-2">
              <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
                "bg-card border-border"
              }`}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-1.5 ${
                  "bg-secondary border-border text-foreground"
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold font-mono">{dynamicTodayMinutes}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">MINUTES TODAY</span>
              </div>
            </div>

            {/* Longest Streak */}
            <div className="grid grid-cols-1 gap-2">
              <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                "bg-card border-border"
              }`}>
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border text-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Flame className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-sans mb-1">Longest Streak</span>
                  <div className="text-[11px] font-mono">
                    <span className={"text-muted-foreground"}>Current</span>
                    <span className="font-bold ml-2">{dynamicStreaks.current} Days</span>
                  </div>
                  <div className="text-[11px] font-mono">
                    <span className={"text-muted-foreground"}>Best</span>
                    <span className="font-bold ml-2">{dynamicStreaks.best} Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Focus Trend Chart */}
            <div className={`p-3 rounded-xl border ${
              "bg-card border-border"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-secondary border border-border text-foreground flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-foreground" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Focus Trend</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-24 pt-2">
                {DAYS_OF_WEEK.map((day) => {
                  const minsLogged = dynamicWeeklyMinutes[day] || 0;
                  const heightPercent = minsLogged > 0 ? Math.min(100, Math.max(10, Math.round((minsLogged / maxWeeklyMins) * 100))) : 4;
                  return (
                    <div
                      key={day}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative cursor-pointer"
                    >
                      <div className={`absolute -top-7 px-2 py-1 rounded text-[9px] font-mono font-bold border pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-lg ${
                        "bg-primary text-primary-foreground border-primary"
                      }`}>
                        {day}: {minsLogged} mins
                      </div>

                      <span className="text-[8px] font-mono opacity-60">{minsLogged}m</span>
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          minsLogged > 0
                            ? "bg-foreground group-hover:bg-foreground/70"
                            : "bg-secondary"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[9px] font-mono font-bold">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distraction Analysis Section */}
            <div className={`p-3 rounded-xl border ${
              "bg-card border-border"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-secondary border border-border text-foreground flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-foreground" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Distraction Analysis</span>
              </div>
              {Object.keys(distractionCounts).length === 0 ? (
                <div className="text-xs font-mono opacity-50 py-1">No distractions logged yet.</div>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const totalDistractions = Object.values(distractionCounts).reduce((a, b) => a + b, 0);
                    const mostCommon = Object.entries(distractionCounts).sort((a, b) => b[1] - a[1])[0];
                    const mostCommonPercent = mostCommon ? Math.round((mostCommon[1] / totalDistractions) * 100) : 0;
                    return (
                      <div className={`text-[11px] font-mono ${"text-muted-foreground"}`}>
                        Most common: <span className="font-bold text-foreground">{mostCommon?.[0]}</span> ({mostCommonPercent}%)
                      </div>
                    );
                  })()}
                  {Object.entries(distractionCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const totalDistractions = Object.values(distractionCounts).reduce((a, b) => a + b, 0);
                      const percent = totalDistractions > 0 ? Math.round((count / totalDistractions) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold">{cat}</span>
                            <span className="opacity-70">{count} ({percent}%)</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                            "bg-secondary"
                          }`}>
                            <div
                              className="h-full rounded-full bg-rose-500 transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto stable-scrollbar">
            {/* Timer Settings */}
            <div className={`p-4 rounded-[16px] border flex flex-col gap-3 ${
              "bg-card border-border"
            }`}>
              <div className="flex items-center gap-2">
                <TimerIcon className="w-[18px] h-[18px] text-foreground" />
                <span className="text-base font-bold text-foreground">Timer</span>
              </div>

              <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                "bg-secondary border-border"
              }`}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Auto-start Break</span>
                  <span className="text-[10px] text-muted-foreground">Start break countdown automatically</span>
                </div>
                <div
                  onClick={() => updateState({
                    timerSettings: {
                      autoStartBreak: !(state.timerSettings?.autoStartBreak ?? false),
                      autoStartTimer: state.timerSettings?.autoStartTimer ?? false,
                    }
                  })}
                  className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors flex items-center ${
                    state.timerSettings?.autoStartBreak ? "bg-primary" : "bg-[#3f3f46]"
                  }`}
                >
                  <div
                    className={`absolute w-5 h-5 rounded-full transition-all duration-200 ${
                      state.timerSettings?.autoStartBreak ? "left-[22px] bg-background" : "left-[2px] bg-[#9ca3af]"
                    }`}
                  />
                </div>
              </div>

              <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                "bg-secondary border-border"
              }`}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Auto-start Flow Timer</span>
                  <span className="text-[10px] text-muted-foreground">Start next flow session when break ends</span>
                </div>
                <div
                  onClick={() => updateState({
                    timerSettings: {
                      autoStartBreak: state.timerSettings?.autoStartBreak ?? false,
                      autoStartTimer: !(state.timerSettings?.autoStartTimer ?? false),
                    }
                  })}
                  className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors flex items-center ${
                    state.timerSettings?.autoStartTimer ? "bg-primary" : "bg-[#3f3f46]"
                  }`}
                >
                  <div
                    className={`absolute w-5 h-5 rounded-full transition-all duration-200 ${
                      state.timerSettings?.autoStartTimer ? "left-[22px] bg-background" : "left-[2px] bg-[#9ca3af]"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div className={`p-4 rounded-[16px] border flex flex-col gap-3 ${
              "bg-card border-border"
            }`}>
              <div className="flex items-center gap-2">
                <Paintbrush className="w-[18px] h-[18px] text-foreground" />
                <span className="text-base font-bold text-foreground">Appearance</span>
              </div>
              <div className="flex items-center gap-2">
                {(["light", "dark"] as ThemeMode[]).map((mode) => {
                  const isActive = (state.themeMode || "dark") === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => updateState({ themeMode: mode })}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {mode === "light" ? "Light" : "Dark"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound Section */}
            <div className={`p-4 rounded-[16px] border flex flex-col gap-3 ${
              "bg-card border-border"
            }`}>
              <div className="flex items-center gap-2">
                <Volume2 className="w-[18px] h-[18px] text-foreground" />
                <span className="text-base font-bold text-foreground">Sound</span>
              </div>

              <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                "bg-secondary border-border"
              }`}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Sound</span>
                  <span className="text-[10px] text-muted-foreground">Enable or disable all sound</span>
                </div>
                <div
                  onClick={toggleSoundEnabled}
                  className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors flex items-center ${
                    soundEnabled ? "bg-primary" : "bg-[#3f3f46]"
                  }`}
                >
                  <div
                    className={`absolute w-5 h-5 rounded-full transition-all duration-200 ${
soundEnabled ? "left-[22px] bg-background" : "left-[2px] bg-[#9ca3af]"
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Music</span>

                <div className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${
                  soundEnabled
                    ? "bg-secondary border-border"
                    : "bg-card/30 border-border/50 opacity-50"
                }`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">Music</span>
                    <span className="text-[10px] text-muted-foreground">Enable or disable background music</span>
                  </div>
                  <div
                    onClick={soundEnabled ? toggleMusicEnabled : undefined}
                    className={`relative w-11 h-6 rounded-full transition-colors flex items-center ${
                      musicEnabled && soundEnabled ? "bg-primary cursor-pointer" : "bg-[#3f3f46]"
                    } ${!soundEnabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div
                      className={`absolute w-5 h-5 rounded-full transition-all duration-200 ${
                        musicEnabled && soundEnabled ? "left-[22px] bg-background" : "left-[2px] bg-[#9ca3af]"
                      }`}
                    />
                  </div>
                </div>

                {soundEnabled && musicEnabled && (
                  <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-secondary border-border">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">Auto-Pause on Audio</span>
                      <span className="text-[10px] text-muted-foreground">Pause music when other tabs play audio</span>
                    </div>
                    <div
                      onClick={toggleAutoPauseOnExternalAudio}
                      className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors flex items-center shrink-0 ${
                        autoPauseOnExternalAudio ? "bg-primary" : "bg-[#3f3f46]"
                      }`}
                    >
                      <div
                        className={`absolute w-5 h-5 rounded-full transition-all duration-200 ${
                          autoPauseOnExternalAudio ? "left-[22px] bg-background" : "left-[2px] bg-[#9ca3af]"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-border/80">
                <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sound Effects</span>

                <div className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${
                  soundEnabled
                    ? "bg-secondary border-border"
                    : "bg-card/30 border-border/50 opacity-50"
                }`}>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">Sound Effects</span>
                    <span className="text-[10px] text-muted-foreground">Enable or disable timer sound effects</span>
                  </div>
                  <div
                    onClick={soundEnabled ? toggleSoundEffectEnabled : undefined}
                    className={`relative w-11 h-6 rounded-full transition-colors flex items-center ${
                      soundEffectEnabled && soundEnabled ? "bg-primary cursor-pointer" : "bg-[#3f3f46]"
                    } ${!soundEnabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div
                      className={`absolute w-5 h-5 rounded-full transition-all duration-200 ${
                        soundEffectEnabled && soundEnabled ? "left-[22px] bg-background" : "left-[2px] bg-[#9ca3af]"
                      }`}
                    />
                  </div>
                </div>

                {soundEnabled && soundEffectEnabled && (
                  <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-secondary border-border">
                    <div className="flex flex-col w-full gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Sound Effects Volume</span>
                        <span className="font-mono text-xs">{Math.round(soundEffectVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={soundEffectVolume}
                        onChange={(e) => handleSoundEffectVolumeChange(parseFloat(e.target.value))}
                        className="w-full h-1 rounded bg-secondary accent-current cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => playTestSoundEffect()}
                  disabled={!soundEnabled || !soundEffectEnabled}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 ${
                    soundEnabled && soundEffectEnabled
                      ? "border-border bg-secondary text-foreground hover:bg-accent cursor-pointer"
                      : "border-border/50 bg-card/30 text-muted-foreground cursor-not-allowed opacity-50"
                  }`}
                >
                  <Volume1 className="w-4 h-4" />
                  Test Sound Effect
                </button>
              </div>
            </div>

            {/* Data Section */}
            <div className={`p-4 rounded-[16px] border flex flex-col gap-3 ${
              "bg-card border-border"
            }`}>
              <div className="flex items-center gap-2">
                <Database className="w-[18px] h-[18px] text-red-500" />
                <span className="text-base font-bold text-red-500">Data</span>
              </div>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to reset all extension data to defaults? This will clear all sessions and stats.")) {
                    resetAllData();
                  }
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs border border-red-500 bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                Reset All Extension Data
              </button>
            </div>

            {/* About Section */}
            <div className={`p-4 rounded-[16px] border flex flex-col gap-3 ${
              "bg-card border-border"
            }`}>
              <div className="flex items-center gap-2">
                <Info className="w-[18px] h-[18px] text-foreground" />
                <span className="text-base font-bold text-foreground">About</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-secondary border border-border rounded-xl px-4 py-3">
                  <span className="font-medium text-white">Version</span>
                  <span className="font-mono text-muted-foreground">v0.0.1</span>
                </div>

                <div className="bg-secondary border border-border rounded-xl p-3.5 text-muted-foreground leading-relaxed">
                  Focus is a minimalist, monochrome productivity extension designed for distraction-free deep work and site blocking.
                </div>

                <button
                  onClick={openGithubLink}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between border border-border bg-secondary hover:bg-secondary text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    <span>GitHub Repository</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            
            {/* Bottom Padding */}
            <div className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
