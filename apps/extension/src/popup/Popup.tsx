import React, { useEffect, useState, useRef } from "react";
import {
  Timer as TimerIcon,
  LayoutGrid,
  Calendar,
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
  CheckSquare,
  Square,
  Target,
  ListChecks,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Check,
  AlertCircle,
  Lock,
  Sliders,
  VolumeX,
} from "lucide-react";
import { DeepFocusOverlay } from "./components/DeepFocusOverlay";
import { AnnualHeatmap } from "./components/AnnualHeatmap";
import { AudioDrawer } from "./components/AudioDrawer";
import { Progress } from "../components/ui/progress";
import {
  AppStateData,
  ThemeMode,
  TaskItem,
  TaskPriority,
  BreakRatio,
  ShieldSchedule,
  SoundChannelId,
  SoundChannelState,
  SoundscapePreset,
} from "../types";
import { SOUNDSCAPE_PRESETS, DEFAULT_CHANNELS } from "../lib/soundscape";
import { getBreakDuration } from "@focus/utils";
import { TaskQuickAdd, TaskRow, TaskSelectPopover, type TaskQuickAddPayload } from "@focus/ui";
import {
  formatTaskDuration,
  getTaskActualMinutes,
  downloadFile,
  sessionsToCsv,
  sessionsToMarkdown,
} from "../lib/utils";
import {
  getStoredState,
  saveStoredState,
  subscribeToStateChanges,
  getCachedState,
  DEFAULT_STATE,
  getWeeklyMinutesFromSessions,
  getTodayMinutesFromSessions,
  calculateStreaksFromSessions,
  DAYS_OF_WEEK,
  getEffectiveTimeLeft,
  exportFullBackup,
  restoreFullBackup,
  isShieldEnforcing,
  isScheduleActive,
  isAnyScheduleActive,
} from "../lib/storage";
import "../index.css";

const DISTRACTION_CATEGORIES = [
  "Phone",
  "Social Media",
  "Bathroom",
  "Meeting",
  "Other"
];

function formatBreakDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) {
    return `${mins} minute${mins === 1 ? "" : "s"} ${secs} second${secs === 1 ? "" : "s"}`;
  }
  if (mins > 0) {
    return `${mins} minute${mins === 1 ? "" : "s"}`;
  }
  return `${secs} second${secs === 1 ? "" : "s"}`;
}

export function Popup() {
  const [state, setState] = useState<AppStateData | null>(getCachedState());
  const [activeTab, setActiveTab] = useState<"timer" | "tasks" | "shield" | "stats" | "settings">("timer");
  const [showDistractionPicker, setShowDistractionPicker] = useState(false);
  const [showFloatingTimerCard, setShowFloatingTimerCard] = useState(false);

  // Local inputs
  const [taskFilter, setTaskFilter] = useState<"all" | "active" | "completed">("all");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  // Deep Focus Mode: auto-activate when timer starts
  const prevIsActiveRef = useRef(state?.isActive ?? false);
  const isInitialLoadRef = useRef(true);

  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const prevTimerStateRef = useRef<string | null>(null);
  const prevTimerActiveRef = useRef<boolean | null>(null);
  const isTimerInitialMountRef = useRef(true);
  const isResetRef = useRef(false);

  // Local inputs
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [shieldListTab, setShieldListTab] = useState<"blocked" | "unblocked">("blocked");
  const [shieldSubTab, setShieldSubTab] = useState<"rules" | "schedules">("rules");
  const [newScheduleName, setNewScheduleName] = useState("");
  const [newScheduleStartTime, setNewScheduleStartTime] = useState("09:00");
  const [newScheduleEndTime, setNewScheduleEndTime] = useState("17:00");
  const [newScheduleDays, setNewScheduleDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  // Data Hub State
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Settings inputs

  // Music & Soundscape Drawer State
  const [isAudioDrawerOpen, setIsAudioDrawerOpen] = useState(false);

  const isMusicPlaying = state?.isMusicPlaying ?? false;
  const musicVolume = state?.musicVolume ?? 0.8;
  const soundEffectVolume = state?.soundEffectVolume ?? 0.8;
  const soundEnabled = state?.soundEnabled ?? true;
  const musicEnabled = state?.musicEnabled ?? true;
  const soundEffectEnabled = state?.soundEffectEnabled ?? true;
  const autoPauseOnExternalAudio = state?.autoPauseOnExternalAudio ?? false;

  // Ambient Soundscape Mixer State & Controls
  const isSoundscapePlaying = state?.isSoundscapePlaying ?? false;
  const soundscapeMasterVolume = state?.soundscapeMasterVolume ?? 60;
  const soundChannels: SoundChannelState[] = state?.soundChannels || DEFAULT_CHANNELS;
  const soundscapeActivePreset = state?.soundscapeActivePreset ?? null;
  const audioSourceType = state?.audioSourceType ?? "lofi";

  const activeChannelsCount = soundChannels.filter((ch) => ch.enabled).length;

  const handleAudioSourceTypeChange = (type: "lofi" | "soundscape") => {
    updateState({ audioSourceType: type });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_AUDIO_SOURCE_TYPE", sourceType: type });
    }
  };

  const toggleSoundscapePlay = () => {
    if (!soundEnabled) return;
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "TOGGLE_SOUNDSCAPE" });
    } else {
      updateState({ isSoundscapePlaying: !isSoundscapePlaying });
    }
  };

  const handleSoundscapeMasterVolumeChange = (v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    updateState({ soundscapeMasterVolume: clamped });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_SOUNDSCAPE_MASTER_VOLUME", volume: clamped });
    }
  };

  const handleSoundscapeChannelVolumeChange = (id: SoundChannelId, v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    const nextChannels = soundChannels.map((ch) => {
      if (ch.id === id) {
        return { ...ch, volume: clamped, enabled: clamped > 0 ? (ch.enabled || true) : ch.enabled };
      }
      return ch;
    });
    updateState({ soundChannels: nextChannels });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_SOUNDSCAPE_CHANNEL_VOLUME", id, volume: clamped });
    }
  };

  const toggleSoundscapeChannel = (id: SoundChannelId) => {
    const nextChannels = soundChannels.map((ch) => {
      if (ch.id === id) {
        return { ...ch, enabled: !ch.enabled };
      }
      return ch;
    });
    updateState({ soundChannels: nextChannels, soundscapeActivePreset: null });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "TOGGLE_SOUNDSCAPE_CHANNEL", id });
    }
  };

  const handleApplySoundscapePreset = (preset: SoundscapePreset) => {
    const nextChannels = soundChannels.map((ch) => {
      const targetVol = preset.channels[ch.id];
      if (targetVol !== undefined) {
        return { ...ch, volume: targetVol, enabled: targetVol > 0 };
      }
      return { ...ch, enabled: false };
    });
    updateState({ soundChannels: nextChannels, soundscapeActivePreset: preset.id });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        target: "background",
        action: "APPLY_SOUNDSCAPE_PRESET",
        presetId: preset.id,
        channels: preset.channels,
      });
    }
  };

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
    updateState({ soundEnabled: next, isMusicPlaying: false, isSoundscapePlaying: false });
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

    return () => {
      unsubscribe();
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
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

  // Local 1-second interval to update displayed timer when popup is open
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!state?.isActive) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      const isPomo = state.timerSettings?.timerMode === "pomodoro" || state.timerMode === "pomodoro";
      if (state.timerState === "BREAK" && getEffectiveTimeLeft(state) <= 0) {
        if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ target: "background", action: "CHECK_BREAK_END" }).catch(() => {});
        }
      } else if (isPomo && state.timerState === "FLOW" && getEffectiveTimeLeft(state) <= 0) {
        if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ target: "background", action: "CHECK_POMODORO_END" }).catch(() => {});
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.isActive, state?.timerState, state?.timerSettings?.timerMode, state?.timerMode]);

  useEffect(() => {
    if (!state) return;

    if (isTimerInitialMountRef.current) {
      isTimerInitialMountRef.current = false;
      prevTimerStateRef.current = state.timerState;
      prevTimerActiveRef.current = state.isActive;
      return;
    }

    if (isResetRef.current) {
      isResetRef.current = false;
      prevTimerStateRef.current = state.timerState;
      prevTimerActiveRef.current = state.isActive;
      return;
    }

    const prevTimerState = prevTimerStateRef.current;
    const prevIsActive = prevTimerActiveRef.current;
    let message = "";

    if (prevTimerState === "FLOW" && state.timerState === "BREAK") {
      const timeStr = formatBreakDuration(state.timeLeft);
      message = `Break started, ${timeStr} remaining.`;
    } else if (prevTimerState === "BREAK" && state.timerState === "FLOW") {
      message = state.isActive ? "Break finished. Focus session started." : "Break finished.";
    } else if (prevIsActive !== state.isActive) {
      if (state.isActive) {
        message = state.timerState === "BREAK" ? "Break resumed." : (state.timeLeft > 0 ? "Focus session resumed." : "Focus session started.");
      } else if (state.timeLeft > 0 || state.timerState === "BREAK") {
        message = "Timer paused.";
      }
    }

    if (message && liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }

    prevTimerStateRef.current = state.timerState;
    prevTimerActiveRef.current = state.isActive;
  }, [state?.timerState, state?.isActive, state?.timeLeft]);

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


  const isPomodoro =
    (state?.timerSettings?.timerMode === "pomodoro") || (state?.timerMode === "pomodoro");

  const handleTimerModeChange = (newMode: "flow" | "pomodoro") => {
    if (!state) return;
    const isNowPomo = newMode === "pomodoro";
    const workDuration = state.timerSettings?.pomodoro?.workDuration ?? 25;
    const breakDuration = state.timerSettings?.pomodoro?.breakDuration ?? 5;
    const newTimerSettings = {
      ...state.timerSettings,
      timerMode: newMode,
      pomodoro: {
        workDuration,
        breakDuration,
      },
    };

    if (!state.isActive) {
      const newTimeLeft = isNowPomo
        ? (state.timerState === "BREAK" ? breakDuration * 60 : workDuration * 60)
        : 0;
      updateState({
        timerMode: isNowPomo ? "pomodoro" : "FLOW",
        timerSettings: newTimerSettings,
        timeLeft: newTimeLeft,
        timerAnchorTimestamp: null,
        targetEndTime: null,
      });
    } else {
      updateState({
        timerMode: isNowPomo ? "pomodoro" : "FLOW",
        timerSettings: newTimerSettings,
      });
    }
  };

  const handlePomodoroWorkDurationChange = (minutes: number) => {
    if (!state) return;
    const currentPomodoro = state.timerSettings?.pomodoro ?? { workDuration: 25, breakDuration: 5 };
    const updatedPomodoro = { ...currentPomodoro, workDuration: minutes };
    const updatedSettings = { ...state.timerSettings, pomodoro: updatedPomodoro };
    const isPomo = (state.timerSettings?.timerMode === "pomodoro") || (state.timerMode === "pomodoro");
    if (!state.isActive && isPomo && state.timerState === "FLOW") {
      updateState({
        timerSettings: updatedSettings,
        timeLeft: minutes * 60,
      });
    } else {
      updateState({
        timerSettings: updatedSettings,
      });
    }
  };

  const handlePomodoroBreakDurationChange = (minutes: number) => {
    if (!state) return;
    const currentPomodoro = state.timerSettings?.pomodoro ?? { workDuration: 25, breakDuration: 5 };
    const updatedPomodoro = { ...currentPomodoro, breakDuration: minutes };
    const updatedSettings = { ...state.timerSettings, pomodoro: updatedPomodoro };
    const isPomo = (state.timerSettings?.timerMode === "pomodoro") || (state.timerMode === "pomodoro");
    if (!state.isActive && isPomo && state.timerState === "BREAK") {
      updateState({
        timerSettings: updatedSettings,
        timeLeft: minutes * 60,
      });
    } else {
      updateState({
        timerSettings: updatedSettings,
      });
    }
  };

  // Timer controls: write timestamp anchors to storage; background
  // handles one-shot alarm for break end and event-based wakeups.
  const toggleTimer = () => {
    const starting = !state.isActive;
    const currentTime = getEffectiveTimeLeft(state);
    const isPomo = (state.timerSettings?.timerMode === "pomodoro") || (state.timerMode === "pomodoro");

    if (starting) {
      if (state.timerState === "FLOW") {
        if (isPomo) {
          const workSecs = (state.timerSettings?.pomodoro?.workDuration ?? 25) * 60;
          const durationToRun = currentTime > 0 ? currentTime : workSecs;
          const targetEnd = Date.now() + (durationToRun * 1000);
          updateState({
            isActive: true,
            deepFocusMode: true,
            isMusicPlaying: soundEnabled && musicEnabled,
            timeLeft: durationToRun,
            targetEndTime: targetEnd,
            timerAnchorTimestamp: null,
          });
        } else {
          const anchor = Date.now() - (currentTime * 1000);
          updateState({
            isActive: true,
            deepFocusMode: true,
            isMusicPlaying: soundEnabled && musicEnabled,
            timerAnchorTimestamp: anchor,
            targetEndTime: null,
          });
        }
      } else {
        const breakSecs = isPomo
          ? (state.timerSettings?.pomodoro?.breakDuration ?? 5) * 60
          : (currentTime > 0 ? currentTime : 300);
        const durationToRun = currentTime > 0 ? currentTime : breakSecs;
        const targetEnd = Date.now() + (durationToRun * 1000);
        updateState({
          isActive: true,
          deepFocusMode: false,
          isMusicPlaying: false,
          targetEndTime: targetEnd,
          timerAnchorTimestamp: null,
        });
      }
    } else {
      updateState({
        isActive: false,
        deepFocusMode: false,
        isMusicPlaying: false,
        timeLeft: currentTime,
        timerAnchorTimestamp: null,
        targetEndTime: null,
      });
    }
  };

  const resetTimer = () => {
    isResetRef.current = true;
    const isPomo = (state.timerSettings?.timerMode === "pomodoro") || (state.timerMode === "pomodoro");
    const defaultTime = (isPomo && state.timerState === "FLOW")
      ? (state.timerSettings?.pomodoro?.workDuration ?? 25) * 60
      : (isPomo && state.timerState === "BREAK")
        ? (state.timerSettings?.pomodoro?.breakDuration ?? 5) * 60
        : 0;

    updateState({
      isActive: false,
      deepFocusMode: false,
      timeLeft: defaultTime,
      timerAnchorTimestamp: null,
      targetEndTime: null,
      isMusicPlaying: false,
    });
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "Timer reset.";
    }
  };

  const completeSession = () => {
    const isPomo = (state.timerSettings?.timerMode === "pomodoro") || (state.timerMode === "pomodoro");

    // If in BREAK mode, finishing session concludes the break immediately and returns to Flow / Pomodoro
    if (state.timerState === "BREAK") {
      playSoundEffect();
      const workSecs = isPomo ? (state.timerSettings?.pomodoro?.workDuration ?? 25) * 60 : 0;
      updateState({
        isActive: false,
        isMusicPlaying: false,
        deepFocusMode: false,
        timerMode: isPomo ? "pomodoro" : "FLOW",
        timerState: "FLOW",
        previousMode: "FLOW",
        timeLeft: workSecs,
        timerAnchorTimestamp: null,
        targetEndTime: null,
      });
      return;
    }

    playSoundEffect();

    if (state.isActive && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "RESTORE_BLOCKED_TABS" });
    }

    const currentRemaining = getEffectiveTimeLeft(state);
    const workSecs = (state.timerSettings?.pomodoro?.workDuration ?? 25) * 60;
    const durationLogged = isPomo
      ? Math.max(1, workSecs - currentRemaining)
      : (currentRemaining > 0 ? currentRemaining : 1);

    const focusedTask = (state.tasks || []).find((t) => t.id === state.selectedTaskId);
    const newSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: durationLogged,
      mode: isPomo ? "pomodoro" : state.timerMode,
      taskId: focusedTask?.id,
      taskName: focusedTask?.text,
    };

    const newSessionList = [newSession, ...state.sessions];
    const updatedWeekly = getWeeklyMinutesFromSessions(newSessionList);
    const updatedTodayMins = getTodayMinutesFromSessions(newSessionList);
    const streaks = calculateStreaksFromSessions(newSessionList);

    const ratio = state.timerSettings?.breakRatio ?? "1/5";
    const breakDuration = isPomo
      ? ((state.timerSettings?.pomodoro?.breakDuration ?? 5) * 60)
      : Math.max(1, getBreakDuration(durationLogged, ratio));

    const autoStartBreak = Boolean(state.timerSettings?.autoStartBreak);

    updateState({
      isActive: autoStartBreak,
      isMusicPlaying: false,
      deepFocusMode: false,
      timerMode: isPomo ? "pomodoro" : "FLOW",
      timerState: "BREAK",
      previousMode: "FLOW",
      timeLeft: breakDuration,
      timerAnchorTimestamp: null,
      targetEndTime: autoStartBreak ? Date.now() + (breakDuration * 1000) : null,
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
    const currentElapsed = getEffectiveTimeLeft(state);
    updateState({
      isActive: false,
      isMusicPlaying: false,
      timeLeft: currentElapsed,
      timerAnchorTimestamp: null,
      targetEndTime: null,
      distractions: [...state.distractions, entry]
    });
    setShowDistractionPicker(false);
  };

  // Data Hub Handlers
  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setStatusMessage({ text, type });
    feedbackTimeoutRef.current = setTimeout(() => {
      setStatusMessage(null);
      feedbackTimeoutRef.current = null;
    }, 3500);
  };

  const handleExportJson = async () => {
    try {
      const json = await exportFullBackup();
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadFile(json, `focus-extension-backup-${dateStr}.json`, "application/json");
      showFeedback("Backup exported successfully.");
    } catch (err) {
      console.error("Export JSON error:", err);
      showFeedback("Failed to export JSON backup.", "error");
    }
  };

  const handleExportCsv = () => {
    try {
      if (!state.sessions || state.sessions.length === 0) {
        showFeedback("No sessions to export.", "error");
        return;
      }
      const csv = sessionsToCsv(state.sessions);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadFile(csv, `focus-extension-sessions-${dateStr}.csv`, "text/csv;charset=utf-8");
      showFeedback("Sessions exported to CSV.");
    } catch (err) {
      console.error("Export CSV error:", err);
      showFeedback("Failed to export CSV.", "error");
    }
  };

  const handleExportMarkdown = () => {
    try {
      const md = sessionsToMarkdown(state.sessions || [], state.distractions || []);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadFile(md, `focus-extension-summary-${dateStr}.md`, "text/markdown;charset=utf-8");
      showFeedback("Summary exported to Markdown.");
    } catch (err) {
      console.error("Export Markdown error:", err);
      showFeedback("Failed to export Markdown summary.", "error");
    }
  };

  const processImportFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      showFeedback("Please select a valid .json backup file.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const result = await restoreFullBackup(content);
        if (!result.success || !result.state) {
          showFeedback(result.error || "Failed to restore backup.", "error");
          return;
        }
        setState(result.state);
        showFeedback("Data restored successfully.");
      } catch (err) {
        console.error("Import error:", err);
        showFeedback("Failed to restore backup file.", "error");
      }
    };
    reader.onerror = () => {
      showFeedback("Error reading file.", "error");
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImportFile(file);
    }
    e.target.value = "";
  };

  // Reset All Extension Data to Factory Defaults
  const resetAllData = () => {
    if (window.confirm("Are you sure you want to reset all extension data to defaults? This will clear all sessions and stats.")) {
      saveStoredState(DEFAULT_STATE).then((fresh) => {
        setState(fresh);
      });
    }
  };

  const isStrictLocked = Boolean(
    state?.isActive &&
    state?.timerState === "FLOW"
  );

  // Shield Handlers
  const addShieldSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStrictLocked || !state) return;
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
    if (isStrictLocked || !state) return;
    updateState({
      shield: {
        ...state.shield,
        blockedSites: state.shield.blockedSites.filter(s => s !== site)
      }
    });
  };

  const removeAllowedSite = (site: string) => {
    if (isStrictLocked || !state) return;
    updateState({
      shield: {
        ...state.shield,
        allowedSites: state.shield.allowedSites.filter(s => s !== site)
      }
    });
  };

  const handleToggleScheduleDay = (dayIndex: number) => {
    if (isStrictLocked) return;
    if (newScheduleDays.includes(dayIndex)) {
      setNewScheduleDays(newScheduleDays.filter((d) => d !== dayIndex));
    } else {
      setNewScheduleDays([...newScheduleDays, dayIndex].sort());
    }
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStrictLocked || !state) return;
    const name = newScheduleName.trim() || "Work Hours";
    if (!newScheduleStartTime || !newScheduleEndTime || newScheduleDays.length === 0) return;

    const newSchedule: ShieldSchedule = {
      id: crypto.randomUUID(),
      name,
      startTime: newScheduleStartTime,
      endTime: newScheduleEndTime,
      days: [...newScheduleDays],
      enabled: true,
    };

    updateState({
      shield: {
        ...state.shield,
        schedules: [...(state.shield.schedules || []), newSchedule],
      },
    });

    setNewScheduleName("");
    setIsAddingSchedule(false);
  };

  const handleToggleSchedule = (scheduleId: string) => {
    if (isStrictLocked || !state) return;
    const updated = (state.shield.schedules || []).map((s) => {
      if (s.id === scheduleId) {
        return { ...s, enabled: !s.enabled };
      }
      return s;
    });
    updateState({
      shield: {
        ...state.shield,
        schedules: updated,
      },
    });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (isStrictLocked || !state) return;
    const updated = (state.shield.schedules || []).filter((s) => s.id !== scheduleId);
    updateState({
      shield: {
        ...state.shield,
        schedules: updated,
      },
    });
  };

  // Task Handlers
  const handleAddTask = (payload: TaskQuickAddPayload) => {
    const trimmed = payload.text.trim();
    if (!trimmed) return;
    const newTask: TaskItem = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      priority: payload.priority,
      deadline: payload.deadline || undefined,
      estimatedMinutes:
        typeof payload.estimatedMinutes === "number" && payload.estimatedMinutes > 0
          ? payload.estimatedMinutes
          : undefined,
      subtasks: [],
    };
    updateState({
      tasks: [newTask, ...(state?.tasks || [])],
    });
  };

  const handleToggleTask = (id: string) => {
    const updated = (state.tasks || []).map((t) =>
      t.id === id
        ? {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : undefined,
          }
        : t
    );
    updateState({ tasks: updated });
  };

  const handleDeleteTask = (id: string) => {
    updateState({
      tasks: (state.tasks || []).filter((t) => t.id !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    });
  };

  const handleFocusTask = (task: TaskItem) => {
    updateState({ selectedTaskId: task.id });
    setActiveTab("timer");
  };

  const handleAddSubtask = (taskId: string) => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    const updated = (state.tasks || []).map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: [
          ...(t.subtasks || []),
          { id: crypto.randomUUID(), text: trimmed, completed: false },
        ],
      };
    });
    updateState({ tasks: updated });
    setNewSubtaskText("");
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = (state.tasks || []).map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: (t.subtasks || []).map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
      };
    });
    updateState({ tasks: updated });
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const updated = (state.tasks || []).map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId),
      };
    });
    updateState({ tasks: updated });
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
  const effectiveTimeLeft = getEffectiveTimeLeft(state);
  const mins = Math.floor(effectiveTimeLeft / 60);
  const secs = effectiveTimeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const totalDuration = 0;
  const progressValue = state.timerState === "FLOW" ? 100 : 0;

  // Stats Calculations
  const liveElapsed =
    state.isActive && state.timerState === "FLOW"
      ? isPomodoro
        ? Math.max(0, (state.timerSettings?.pomodoro?.workDuration ?? 25) * 60 - effectiveTimeLeft)
        : effectiveTimeLeft
      : 0;
  const dynamicWeeklyMinutes = getWeeklyMinutesFromSessions(state.sessions);
  const dynamicStreaks = calculateStreaksFromSessions(state.sessions);
  const maxWeeklyMins = Math.max(120, ...Object.values(dynamicWeeklyMinutes));

  const now = new Date();
  const todaySessions = (state.sessions || []).filter((s) => {
    if (!s || !s.date) return false;
    const sDate = new Date(s.date);
    return (
      sDate.getFullYear() === now.getFullYear() &&
      sDate.getMonth() === now.getMonth() &&
      sDate.getDate() === now.getDate()
    );
  });
  const todaySessionCount = todaySessions.length;
  const completedTodaySeconds = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalFocusSeconds = completedTodaySeconds + liveElapsed;
  const totalFocusMinutes = Math.floor(totalFocusSeconds / 60);
  const formattedFocusToday =
    totalFocusMinutes < 60
      ? `${totalFocusMinutes}m`
      : `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`;

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
          state={{ ...state, timeLeft: effectiveTimeLeft }}
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
      <header className={`px-4 py-3 flex items-center z-10 shrink-0 ${
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all duration-300 ease-out active:scale-95 cursor-pointer shadow-sm ${
                showFloatingTimerCard
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:bg-secondary"
              } ${state.isActive ? ("border-foreground/60 ring-1 ring-foreground/30") : ""}`}
              title="Toggle Floating Timer Controls"
            >
              <span className="flex items-center">
                {state.timerState === "BREAK" ? <Coffee className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              </span>
              <span className="font-extrabold font-mono text-[11px] tracking-tight tabular-nums">
                {timeFormatted}
              </span>
              {state.isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
              )}
            </button>
          </div>
        )}

        {/* Right: Audio Drawer Trigger & Settings */}
        <div className="flex-1 flex justify-end items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAudioDrawerOpen(!isAudioDrawerOpen)}
            className={`p-1.5 rounded-lg transition-all duration-300 ease-out active:scale-95 cursor-pointer flex items-center gap-1 relative ${
              isAudioDrawerOpen
                ? "bg-primary text-primary-foreground"
                : (isMusicPlaying || isSoundscapePlaying)
                  ? "text-emerald bg-emerald-bg hover:bg-emerald-bg/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title="Audio Player"
            aria-label="Audio Player"
          >
            <Volume2 className="w-4 h-4" />
            {(isMusicPlaying || isSoundscapePlaying) && (
              <span className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 h-2.5 rounded-full bg-emerald animate-pulse" />
                <span className="w-0.5 h-1.5 rounded-full bg-emerald animate-pulse delay-75" />
                <span className="w-0.5 h-3 rounded-full bg-emerald animate-pulse delay-150" />
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab(activeTab === "settings" ? "timer" : "settings")}
            className={`p-1.5 rounded-lg transition-all duration-300 ease-out active:scale-95 cursor-pointer ${
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

      {/* Audio Drawer Overlay */}
      <AudioDrawer
        isOpen={isAudioDrawerOpen}
        onClose={() => setIsAudioDrawerOpen(false)}
        audioSourceType={audioSourceType}
        onAudioSourceTypeChange={handleAudioSourceTypeChange}
        soundEnabled={soundEnabled}
        musicEnabled={musicEnabled}
        isMusicPlaying={isMusicPlaying}
        musicVolume={musicVolume}
        onToggleMusicPlay={toggleMusicPlay}
        onMusicVolumeChange={handleMusicVolumeChange}
        autoPauseOnExternalAudio={autoPauseOnExternalAudio}
        onToggleAutoPause={toggleAutoPauseOnExternalAudio}
        isSoundscapePlaying={isSoundscapePlaying}
        soundscapeMasterVolume={soundscapeMasterVolume}
        onToggleSoundscapePlay={toggleSoundscapePlay}
        onSoundscapeMasterVolumeChange={handleSoundscapeMasterVolumeChange}
        soundChannels={soundChannels}
        soundscapeActivePreset={soundscapeActivePreset}
        onToggleSoundscapeChannel={toggleSoundscapeChannel}
        onSoundscapeChannelVolumeChange={handleSoundscapeChannelVolumeChange}
        onApplySoundscapePreset={handleApplySoundscapePreset}
      />

      {/* Main Navigation Bar */}
      <nav className="flex items-center justify-center px-4 py-2 z-10 bg-background shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-card border border-border shadow-xl rounded-full w-full justify-around">
          {[
            { id: "timer", label: "Focus", icon: LayoutGrid },
            { id: "tasks", label: "Tasks", icon: CheckSquare },
            { id: "shield", label: "Shield", icon: Shield, activeIndicator: state.shield.enabled && state.isActive },
            { id: "stats", label: "Stats", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-full transition-all duration-300 ease-out active:scale-95 cursor-pointer relative text-[11px] font-bold py-1.5 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
                title={tab.label}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                  {tab.activeIndicator && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 z-10 relative">
        {/* TIMER TAB */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center justify-between min-h-full pb-1 pt-1 gap-2">
            <div
              ref={liveRegionRef}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            />

            {/* Timer Label */}
            <div className="flex items-center justify-center gap-1.5 mt-1 mb-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {state.timerState === "BREAK" ? (
                <>
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Break</span>
                </>
              ) : isPomodoro ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pomodoro</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Flow</span>
                </>
              )}
            </div>

            {/* Timer Display - Big Number */}
            <div className="flex flex-col items-center justify-center my-2 py-3">
              <span
                role="timer"
                aria-label={`${state.timerState === "BREAK" ? "Break time remaining" : "Flow time elapsed"}: ${timeFormatted}`}
                className="text-7xl font-black font-mono tracking-tighter leading-none tabular-nums"
              >
                {timeFormatted}
              </span>
            </div>

            {/* Focused Task Pill or Selector */}
            {(() => {
              const focused = (state.tasks || []).find((t) => t.id === state.selectedTaskId);
              if (focused) {
                return (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-foreground shadow-sm max-w-[280px] truncate animate-in fade-in duration-300">
                    <Target className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{focused.text}</span>
                    <button
                      onClick={() => updateState({ selectedTaskId: null })}
                      className="text-muted-foreground hover:text-foreground ml-1 p-0.5 rounded cursor-pointer transition-colors"
                      title="Clear focused task"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              }
              const activeTasks = (state.tasks || []).filter((t) => !t.completed);
              if (activeTasks.length > 0) {
                return (
                  <div className="flex items-center gap-1.5">
                    <TaskSelectPopover
                      tasks={activeTasks}
                      selectedTaskId={state.selectedTaskId}
                      onSelectTask={(taskId) => updateState({ selectedTaskId: taskId })}
                      placeholder="Link a task..."
                    />
                  </div>
                );
              }
              return null;
            })()}

            {/* Control Buttons Grid */}
            <div className="flex items-center gap-2">
              {/* Reset Timer */}
              <button
                onClick={resetTimer}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  "bg-card border-border hover:bg-secondary text-foreground"
                }`}
                title="Reset Timer"
                aria-label="Reset timer"
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
                aria-label={state.isActive ? "Log distraction" : "Start timer to log distraction"}
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                onClick={toggleTimer}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-lg active:scale-95 ${
                  "bg-primary text-primary-foreground hover:bg-accent"
                }`}
                title={state.isActive ? "Pause Timer" : "Start Timer"}
                aria-label={state.isActive ? "Pause timer" : "Start timer"}
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
                aria-label={state.timerState === "BREAK" ? "Finish break and return to flow" : (state.isActive ? "Complete session" : "Start timer to complete session")}
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
                aria-label="Deep focus mode"
              >
                <Focus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="flex flex-col gap-3 pb-2">
            {/* Metric KPI Row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 flex flex-col justify-between bg-card border border-border shadow-sm rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Active
                  </span>
                  <div className="p-1 bg-surface-inset rounded-lg text-muted-foreground">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-medium tabular-nums tracking-tight text-foreground my-0.5">
                  {(state.tasks || []).filter((t) => !t.completed).length}
                </div>
              </div>

              <div className="p-3 flex flex-col justify-between bg-card border border-border shadow-sm rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Done
                  </span>
                  <div className="p-1 bg-surface-inset rounded-lg text-muted-foreground">
                    <ListChecks className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-xl font-medium tabular-nums tracking-tight text-foreground my-0.5">
                  {(state.tasks || []).filter((t) => t.completed).length}
                </div>
              </div>
            </div>

            {/* Task Quick Add Bar */}
            <TaskQuickAdd
              onAdd={handleAddTask}
              placeholder="Add a new task..."
              compact
            />

            {/* Filter Tabs & Task List */}
            <div className="p-3 bg-card border border-border rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-surface-inset p-0.5 rounded-full">
                  {(["all", "active", "completed"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTaskFilter(tab)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize transition-all cursor-pointer ${
                        taskFilter === tab
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                  {(state.tasks || []).filter((t) => {
                    if (taskFilter === "active") return !t.completed;
                    if (taskFilter === "completed") return t.completed;
                    return true;
                  }).length} tasks
                </span>
              </div>

              {/* Task Items */}
              {(() => {
                const list = (state.tasks || []).filter((t) => {
                  if (taskFilter === "active") return !t.completed;
                  if (taskFilter === "completed") return t.completed;
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div className="py-6 flex flex-col items-center justify-center text-center text-muted-foreground text-xs gap-1">
                      <CheckSquare className="w-6 h-6 opacity-40 mb-1" />
                      <span className="text-[11px]">No tasks in this view</span>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                    {list.map((task) => {
                      const isFocused = state.selectedTaskId === task.id;
                      const isExpanded = expandedTaskId === task.id;
                      const subtasks = task.subtasks || [];
                      const actualMinutes = getTaskActualMinutes(state.sessions || [], task.id);

                      return (
                        <TaskRow
                          key={task.id}
                          task={task}
                          isFocused={isFocused}
                          actualMinutes={actualMinutes}
                          isExpanded={isExpanded}
                          onToggle={handleToggleTask}
                          onFocus={handleFocusTask}
                          onDelete={handleDeleteTask}
                          onToggleExpand={(taskId) =>
                            setExpandedTaskId(isExpanded ? null : taskId)
                          }
                          className="p-2.5 rounded-xl gap-1.5"
                        >
                          {/* Expanded Subtasks */}
                          <div className="flex flex-col gap-1.5 pl-4 pr-1 text-[11px]">
                            {subtasks.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between gap-1.5"
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleSubtask(task.id, sub.id)
                                    }
                                    className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                                    title={
                                      sub.completed
                                        ? "Mark incomplete"
                                        : "Mark complete"
                                    }
                                  >
                                    {sub.completed ? (
                                      <CheckSquare className="w-3 h-3 text-emerald" />
                                    ) : (
                                      <Square className="w-3 h-3" />
                                    )}
                                  </button>
                                  <span
                                    className={`truncate ${
                                      sub.completed
                                        ? "line-through text-muted-foreground"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {sub.text}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteSubtask(task.id, sub.id)
                                  }
                                  className="text-muted-foreground hover:text-crimson transition-colors p-0.5 shrink-0 cursor-pointer"
                                  title="Delete subtask"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <input
                                type="text"
                                placeholder="Add subtask..."
                                value={newSubtaskText}
                                onChange={(e) =>
                                  setNewSubtaskText(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSubtask(task.id);
                                  }
                                }}
                                className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddSubtask(task.id)}
                                disabled={!newSubtaskText.trim()}
                                className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </TaskRow>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* SHIELD TAB */}
        {activeTab === "shield" && (() => {
          const isEnforcing = isShieldEnforcing(state);
          const isScheduleActiveNow = isAnyScheduleActive(state.shield.schedules);

          return (
            <div className="flex flex-col gap-3">
              {/* Lock Alert Banner */}
              {isStrictLocked && (
                <div className="p-2.5 rounded-[12px] bg-amber-bg border border-amber/20 flex items-center gap-2.5 text-xs">
                  <div className="p-1 bg-amber-bg rounded-[8px] text-amber shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    Shield controls and rules are locked while focusing.
                  </span>
                </div>
              )}

              {/* Master Shield Card */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isEnforcing || state.shield.enabled
                  ? "bg-card border-border text-foreground"
                  : "bg-background border-border text-muted-foreground"
              }`}>
                <div className="flex items-center gap-2.5">
                  {isStrictLocked ? (
                    <Lock className="w-5 h-5 text-amber" />
                  ) : isEnforcing ? (
                    <ShieldCheck className="w-5 h-5 text-emerald" />
                  ) : state.shield.enabled ? (
                    <Shield className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold font-mono">SITE BLOCKER SHIELD</h3>
                    <p className="text-[10px] opacity-70">
                      {isEnforcing
                        ? (isScheduleActiveNow ? "Active (Scheduled Window)" : "Active during Flow session")
                        : state.shield.enabled
                          ? "Paused (Active during Flow or Schedules)"
                          : "Shield currently OFF"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isStrictLocked) return;
                    updateState({ shield: { ...state.shield, enabled: !state.shield.enabled } });
                  }}
                  disabled={isStrictLocked}
                  title={isStrictLocked ? "Locked while focusing" : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isStrictLocked
                      ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border"
                      : state.shield.enabled
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border"
                  }`}
                >
                  {isStrictLocked && <Lock className="w-3 h-3" />}
                  {state.shield.enabled ? "ENABLED" : "ENABLE"}
                </button>
              </div>

              {/* Sub-view Navigation (Rules vs Schedules) */}
              <div className="flex gap-1 p-1 rounded-xl bg-card border border-border">
                <button
                  onClick={() => setShieldSubTab("rules")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase transition-all ${
                    shieldSubTab === "rules"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Rules ({state.shield.blockedSites.length + state.shield.allowedSites.length})
                </button>
                <button
                  onClick={() => setShieldSubTab("schedules")}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase transition-all flex items-center justify-center gap-1.5 ${
                    shieldSubTab === "schedules"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Schedules ({(state.shield.schedules || []).length})
                </button>
              </div>

              {/* RULES SUB-TAB */}
              {shieldSubTab === "rules" && (
                <div className="flex flex-col gap-2.5">
                  <form onSubmit={addShieldSite} className="flex gap-2">
                    <input
                      type="text"
                      disabled={isStrictLocked}
                      value={newSiteUrl}
                      onChange={(e) => setNewSiteUrl(e.target.value)}
                      placeholder={
                        isStrictLocked
                          ? "Rule editing locked during focus session..."
                          : shieldListTab === "blocked"
                            ? "Block domain (e.g. twitter.com)..."
                            : "Allow domain (e.g. music.youtube.com)..."
                      }
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none ${
                        isStrictLocked
                          ? "opacity-60 cursor-not-allowed bg-muted/40 border-border text-muted-foreground"
                          : "bg-card border-border text-foreground placeholder-muted-foreground focus:border-foreground"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isStrictLocked}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                        isStrictLocked
                          ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border"
                          : "bg-secondary border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      {isStrictLocked && <Lock className="w-3 h-3" />}
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
                      <div className="max-h-48 overflow-y-auto overflow-x-hidden space-y-1.5 pr-1">
                        {state.shield.blockedSites.length === 0 && (
                          <p className="text-[10px] text-muted-foreground p-2">
                            No blocked domains configured.
                          </p>
                        )}
                        {state.shield.blockedSites.map((site) => (
                          <div
                            key={site}
                            className="px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-mono bg-card/60 border-border text-foreground"
                          >
                            <span className="text-[11px] truncate mr-2">{site}</span>
                            <button
                              onClick={() => removeBlockedSite(site)}
                              disabled={isStrictLocked}
                              title={isStrictLocked ? "Locked while focusing" : "Remove"}
                              className={`p-1 transition-opacity ${
                                isStrictLocked
                                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {isStrictLocked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {shieldListTab === "unblocked" && (
                      <div className="max-h-48 overflow-y-auto overflow-x-hidden space-y-1.5 pr-1">
                        {state.shield.allowedSites.length === 0 && (
                          <p className="text-[10px] text-muted-foreground p-2">
                            No unblocked domains yet.
                          </p>
                        )}
                        {state.shield.allowedSites.map((site) => (
                          <div
                            key={site}
                            className="px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-mono bg-card/60 border-border text-foreground"
                          >
                            <span className="text-[11px] truncate mr-2">{site}</span>
                            <button
                              onClick={() => removeAllowedSite(site)}
                              disabled={isStrictLocked}
                              title={isStrictLocked ? "Locked while focusing" : "Remove"}
                              className={`p-1 transition-opacity ${
                                isStrictLocked
                                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {isStrictLocked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SCHEDULES SUB-TAB */}
              {shieldSubTab === "schedules" && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                      Scheduled Windows ({(state.shield.schedules || []).length})
                    </span>
                    <button
                      type="button"
                      disabled={isStrictLocked}
                      onClick={() => setIsAddingSchedule(!isAddingSchedule)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                        isStrictLocked
                          ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border"
                          : isAddingSchedule
                            ? "bg-secondary text-foreground border-border"
                            : "bg-primary text-primary-foreground border-primary"
                      }`}
                    >
                      {isStrictLocked ? (
                        <Lock className="w-3 h-3" />
                      ) : isAddingSchedule ? (
                        <X className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      {isAddingSchedule ? "Cancel" : "Add Window"}
                    </button>
                  </div>

                  {/* Add Schedule Form */}
                  {isAddingSchedule && (
                    <form onSubmit={handleAddSchedule} className="p-3 rounded-xl border bg-card border-border flex flex-col gap-2.5">
                      <div>
                        <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Window Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Work Hours"
                          value={newScheduleName}
                          onChange={(e) => setNewScheduleName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border bg-background border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Start Time</label>
                          <input
                            type="time"
                            value={newScheduleStartTime}
                            onChange={(e) => setNewScheduleStartTime(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border bg-background border-border text-foreground focus:outline-none focus:border-foreground"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-muted-foreground mb-1 block">End Time</label>
                          <input
                            type="time"
                            value={newScheduleEndTime}
                            onChange={(e) => setNewScheduleEndTime(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border bg-background border-border text-foreground focus:outline-none focus:border-foreground"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Active Days</label>
                        <div className="flex gap-1">
                          {DAYS_OF_WEEK.map((dayName, idx) => {
                            const isSelected = newScheduleDays.includes(idx);
                            return (
                              <button
                                key={dayName}
                                type="button"
                                onClick={() => handleToggleScheduleDay(idx)}
                                className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                                }`}
                              >
                                {dayName}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={newScheduleDays.length === 0}
                        className="w-full py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground transition-all hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Save Schedule
                      </button>
                    </form>
                  )}

                  {/* Schedule List */}
                  <div className="max-h-52 overflow-y-auto overflow-x-hidden space-y-2 pr-1">
                    {(!state.shield.schedules || state.shield.schedules.length === 0) && !isAddingSchedule && (
                      <div className="p-4 rounded-xl border border-dashed border-border text-center text-muted-foreground">
                        <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                        <p className="text-xs font-medium">No scheduled windows</p>
                        <p className="text-[10px] opacity-70 mt-0.5">
                          Configure recurring hours to enforce website blocking automatically.
                        </p>
                      </div>
                    )}

                    {(state.shield.schedules || []).map((schedule) => {
                      const isActiveNow = isScheduleActive(schedule);
                      return (
                        <div
                          key={schedule.id}
                          className="p-2.5 rounded-xl border flex flex-col gap-2 bg-card/60 border-border"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono text-foreground">{schedule.name}</span>
                              {isActiveNow && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-bg text-emerald border border-emerald/20">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleSchedule(schedule.id)}
                                disabled={isStrictLocked}
                                title={isStrictLocked ? "Locked while focusing" : undefined}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all flex items-center gap-1 ${
                                  isStrictLocked
                                    ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border"
                                    : schedule.enabled
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-secondary text-secondary-foreground border-border"
                                }`}
                              >
                                {isStrictLocked && <Lock className="w-2.5 h-2.5" />}
                                {schedule.enabled ? "ON" : "OFF"}
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                disabled={isStrictLocked}
                                title={isStrictLocked ? "Locked while focusing" : "Delete"}
                                className={`p-1 transition-opacity ${
                                  isStrictLocked
                                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {isStrictLocked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="text-[11px] font-mono text-muted-foreground">
                            {schedule.startTime} - {schedule.endTime}
                          </div>

                          <div className="flex gap-1">
                            {DAYS_OF_WEEK.map((dayName, idx) => {
                              const isSelected = schedule.days.includes(idx);
                              return (
                                <span
                                  key={dayName}
                                  className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted/40 text-muted-foreground/40"
                                  }`}
                                >
                                  {dayName[0]}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className="flex flex-col gap-3">
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
                    <span className="text-xs font-extrabold font-mono tabular-nums">{dayPercent}%</span>
                  </div>

                  <Progress value={dayPercent} className="h-2 rounded-full" />

                  <div className="text-[10px] font-mono opacity-60 tabular-nums">
                    {remH}h {remM}m remaining today
                  </div>
                </div>
              );
            })()}

            {/* 2-Column KPI Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Focus Today Card */}
              <div className="p-3.5 flex flex-col justify-between bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[20px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    FOCUS TODAY
                  </span>
                  <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-[20px] font-medium tabular-nums tracking-[-0.03em] text-foreground my-1">
                  {formattedFocusToday}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {todaySessionCount} {todaySessionCount === 1 ? "session" : "sessions"}
                </span>
              </div>

              {/* Streak Card */}
              <div className="p-3.5 flex flex-col justify-between bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[20px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    STREAK
                  </span>
                  <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-[20px] font-medium tabular-nums tracking-[-0.03em] text-foreground my-1">
                  {dynamicStreaks.current} days
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Best: {dynamicStreaks.best} days
                </span>
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
                      <div className={`absolute -top-7 px-2 py-1 rounded text-[9px] font-mono font-bold border pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-lg tabular-nums ${
                        "bg-primary text-primary-foreground border-primary"
                      }`}>
                        {day}: {minsLogged} mins
                      </div>

                      <span className="text-[8px] font-mono opacity-60 tabular-nums">{minsLogged}m</span>
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

            {/* Annual 52-Week Focus Heatmap */}
            <AnnualHeatmap sessions={state.sessions} liveElapsed={liveElapsed} />

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
                        Most common: <span className="font-bold text-foreground">{mostCommon?.[0]}</span> <span className="tabular-nums">({mostCommonPercent}%)</span>
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
                            <span className="opacity-70 tabular-nums">{count} ({percent}%)</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                            "bg-secondary"
                          }`}>
                            <div
                              className="h-full rounded-full bg-crimson transition-all duration-500"
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
          <div className="flex flex-col gap-3 pb-2">
            {/* Timer Settings */}
            <div className={`p-4 rounded-[16px] border flex flex-col gap-3 ${
              "bg-card border-border"
            }`}>
              <div className="flex items-center gap-2">
                <TimerIcon className="w-[18px] h-[18px] text-foreground" />
                <span className="text-base font-bold text-foreground">Timer</span>
              </div>

              {/* Timer Mode Selection */}
              <div className="flex flex-col gap-2 rounded-xl px-4 py-3 bg-secondary border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Timer Mode</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                    {(state.timerSettings?.timerMode ?? "flow") === "pomodoro" ? "Pomodoro" : "Flow"}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {(["flow", "pomodoro"] as const).map((mode) => {
                    const isActive = (state.timerSettings?.timerMode ?? "flow") === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleTimerModeChange(mode)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer capitalize ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card text-muted-foreground border-transparent hover:text-foreground"
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Break Ratio (Flow Mode) */}
              <div className="flex flex-col gap-2 rounded-xl px-4 py-3 bg-secondary border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">Break Ratio</span>
                    <span className="text-[10px] text-muted-foreground">Flow mode break duration</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                    {(state.timerSettings?.breakRatio ?? "1/5") === "1/3"
                      ? "33% of flow"
                      : (state.timerSettings?.breakRatio ?? "1/5") === "1/4"
                        ? "25% of flow"
                        : "20% of flow"}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {(["1/5", "1/4", "1/3"] as const).map((ratio) => {
                    const isActive = (state.timerSettings?.breakRatio ?? "1/5") === ratio;
                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() =>
                          updateState({
                            timerSettings: {
                              ...state.timerSettings,
                              breakRatio: ratio,
                            },
                          })
                        }
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer tabular-nums ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card text-muted-foreground border-transparent hover:text-foreground"
                        }`}
                      >
                        {ratio}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pomodoro Intervals */}
              {(state.timerSettings?.timerMode ?? "flow") === "pomodoro" && (
                <div className="flex flex-col gap-3 rounded-xl px-4 py-3 bg-secondary border border-border">
                  <span className="text-xs font-bold text-foreground">Pomodoro Intervals</span>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground">Work Duration</span>
                      <span className="text-[10px] text-muted-foreground">Minutes per focus session</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={state.timerSettings?.pomodoro?.workDuration ?? 25}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 25));
                          handlePomodoroWorkDurationChange(val);
                        }}
                        className="w-14 px-2 py-1 bg-card border border-border rounded-lg text-xs font-mono text-center text-foreground focus:outline-none"
                      />
                      <span className="text-xs text-muted-foreground font-mono">min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground">Break Duration</span>
                      <span className="text-[10px] text-muted-foreground">Minutes per break</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={state.timerSettings?.pomodoro?.breakDuration ?? 5}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 5));
                          handlePomodoroBreakDurationChange(val);
                        }}
                        className="w-14 px-2 py-1 bg-card border border-border rounded-lg text-xs font-mono text-center text-foreground focus:outline-none"
                      />
                      <span className="text-xs text-muted-foreground font-mono">min</span>
                    </div>
                  </div>
                </div>
              )}

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
                      ...state.timerSettings,
                      autoStartBreak: !(state.timerSettings?.autoStartBreak ?? false),
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
                  <span className="text-xs font-bold text-foreground">
                    {(state.timerSettings?.timerMode ?? "flow") === "pomodoro" ? "Auto-start Pomodoro Timer" : "Auto-start Flow Timer"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Start next focus session when break ends</span>
                </div>
                <div
                  onClick={() => updateState({
                    timerSettings: {
                      ...state.timerSettings,
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
                      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out active:scale-95 cursor-pointer border ${
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

              {/* Ambient Soundscape Mixer Section */}
              <div className="flex flex-col gap-2.5 pt-1 border-t border-border/80">
                <div className="flex items-center justify-between">
                  <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Ambient Soundscape Mixer
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                    {activeChannelsCount} active
                  </span>
                </div>

                {/* Soundscape Play / Pause & Master Volume Control Card */}
                <div className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
                  soundEnabled
                    ? "bg-secondary border-border"
                    : "bg-card/30 border-border/50 opacity-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={soundEnabled ? toggleSoundscapePlay : undefined}
                        disabled={!soundEnabled}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          !soundEnabled
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : isSoundscapePlaying
                              ? "bg-primary text-primary-foreground shadow hover:scale-105 active:scale-95 cursor-pointer"
                              : "bg-card text-foreground border border-border hover:bg-muted active:scale-95 cursor-pointer"
                        }`}
                        title={isSoundscapePlaying ? "Pause Soundscape" : "Play Soundscape"}
                      >
                        {isSoundscapePlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          {isSoundscapePlaying ? "Soundscape Playing" : "Soundscape Stopped"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                          {activeChannelsCount > 0
                            ? `${activeChannelsCount} channel${activeChannelsCount === 1 ? "" : "s"} active`
                            : "Select a preset or enable channels"}
                        </span>
                      </div>
                    </div>

                    {isSoundscapePlaying && (
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 h-3 rounded-full bg-emerald animate-pulse" />
                        <span className="w-0.5 h-2 rounded-full bg-emerald animate-pulse delay-75" />
                        <span className="w-0.5 h-3.5 rounded-full bg-emerald animate-pulse delay-150" />
                      </div>
                    )}
                  </div>

                  {/* Master Volume Slider */}
                  <div className="space-y-1 pt-1.5 border-t border-border/60">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-muted-foreground uppercase tracking-wider">Master Volume</span>
                      <span className="font-mono tabular-nums text-foreground">{soundscapeMasterVolume}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={soundscapeMasterVolume}
                        onChange={(e) => handleSoundscapeMasterVolumeChange(parseInt(e.target.value, 10))}
                        disabled={!soundEnabled}
                        className="w-full h-1 rounded bg-muted accent-primary cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Selector */}
                <div className="space-y-1.5">
                  <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Presets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SOUNDSCAPE_PRESETS.map((preset) => {
                      const isActive = soundscapeActivePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplySoundscapePreset(preset)}
                          disabled={!soundEnabled}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                            !soundEnabled
                              ? "opacity-50 cursor-not-allowed bg-secondary/50 border-border"
                              : isActive
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-secondary text-foreground hover:bg-muted border-border hover:border-border/80"
                          }`}
                        >
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Channel Volume Sliders */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Channels
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                      {soundChannels.length} channels
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5">
                    {soundChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className={`p-2 rounded-xl border transition-all ${
                          channel.enabled
                            ? "bg-secondary border-border"
                            : "bg-secondary/40 border-border/50"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <button
                            type="button"
                            onClick={() => toggleSoundscapeChannel(channel.id)}
                            disabled={!soundEnabled}
                            className="flex items-center gap-2 text-foreground font-medium hover:text-primary transition-colors text-left cursor-pointer"
                          >
                            <span
                              className={`w-2 h-2 rounded-full transition-colors ${
                                channel.enabled ? "bg-emerald shadow-sm" : "bg-muted-foreground/30"
                              }`}
                            />
                            <span className={!channel.enabled ? "text-muted-foreground" : "font-semibold"}>
                              {channel.label}
                            </span>
                            <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-muted/60 text-muted-foreground">
                              {channel.category}
                            </span>
                          </button>
                          <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                            {channel.enabled ? `${channel.volume}%` : "Off"}
                          </span>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={channel.enabled ? channel.volume : 0}
                          disabled={!soundEnabled || !channel.enabled}
                          onChange={(e) =>
                            handleSoundscapeChannelVolumeChange(channel.id, parseInt(e.target.value, 10))
                          }
                          className={`w-full h-1 bg-muted rounded-full appearance-none cursor-pointer accent-primary ${
                            !channel.enabled ? "opacity-30 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
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
                        <span className="font-mono text-xs tabular-nums">{Math.round(soundEffectVolume * 100)}%</span>
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
                  className={`w-full py-2.5 rounded-xl font-bold text-xs border transition-all duration-300 ease-out flex items-center justify-center gap-2 ${
                    soundEnabled && soundEffectEnabled
                      ? "border-border bg-secondary text-foreground hover:bg-accent cursor-pointer active:scale-95"
                      : "border-border/50 bg-card/30 text-muted-foreground cursor-not-allowed opacity-50"
                  }`}
                >
                  <Volume1 className="w-4 h-4" />
                  Test Sound Effect
                </button>
              </div>
            </div>

            {/* Data Hub Section */}
            <div className={`p-4 rounded-[16px] border flex flex-col gap-3 ${
              "bg-card border-border"
            }`}>
              <div className="flex items-center gap-2">
                <Database className="w-[18px] h-[18px] text-foreground" />
                <span className="text-base font-bold text-foreground">Data Hub</span>
              </div>

              {/* Data Summary Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-secondary border border-border">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">Sessions</span>
                  <span className="text-sm font-bold font-mono text-foreground tabular-nums">{state.sessions?.length || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary border border-border">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">Minutes</span>
                  <span className="text-sm font-bold font-mono text-foreground tabular-nums">{Math.round((state.sessions || []).reduce((acc, s) => acc + (s.duration || 0), 0) / 60)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary border border-border">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">Distractions</span>
                  <span className="text-sm font-bold font-mono text-foreground tabular-nums">{state.distractions?.length || 0}</span>
                </div>
              </div>

              {/* Export Records */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.16em] px-0.5">
                  Export Records
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-surface border border-border text-foreground transition-all duration-300 ease-out active:scale-95 cursor-pointer shadow-sm"
                    title="Export full JSON backup"
                  >
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-surface border border-border text-foreground transition-all duration-300 ease-out active:scale-95 cursor-pointer shadow-sm"
                    title="Export session history to CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-surface border border-border text-foreground transition-all duration-300 ease-out active:scale-95 cursor-pointer shadow-sm"
                    title="Export summary to Markdown"
                  >
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Markdown</span>
                  </button>
                </div>
              </div>

              {/* Import Backup */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.16em] px-0.5">
                  Import Backup
                </span>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      processImportFile(file);
                    }
                  }}
                  className={`p-3.5 rounded-xl border border-dashed text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-primary bg-secondary/80 ring-2 ring-primary/20"
                      : "border-border bg-secondary/40 hover:bg-secondary/70"
                  }`}
                >
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">Import & Restore JSON</span>
                  <span className="text-[10px] text-muted-foreground">Drop backup file here or click to browse</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Status Message Alert */}
              {statusMessage && (
                <div
                  className={`px-3 py-2 rounded-xl text-xs border font-medium flex items-center gap-2 animate-in fade-in duration-200 ${
                    statusMessage.type === "success"
                      ? "bg-secondary text-foreground border-border"
                      : "bg-destructive/15 text-destructive border-destructive/30"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <Check className="w-3.5 h-3.5 text-foreground shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                  )}
                  <span className="flex-1">{statusMessage.text}</span>
                </div>
              )}

              {/* Reset All Data (Danger) */}
              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to reset all extension data to defaults? This will clear all sessions and stats.")) {
                      resetAllData();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs border border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25 transition-all duration-300 ease-out active:scale-95 cursor-pointer"
                >
                  Reset All Extension Data
                </button>
              </div>
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
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between border border-border bg-secondary hover:bg-secondary text-white transition-all duration-300 ease-out active:scale-95 cursor-pointer"
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
