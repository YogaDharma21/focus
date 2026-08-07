import React, { useEffect, useState } from "react";
import {
  Timer as TimerIcon,
  CheckSquare,
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
  Sun,
  Moon,
  Info,
  Github,
  BookOpen,
  X,
  MessageSquarePlus,
  Settings,
  AlertTriangle,
  FolderPlus,
  ArrowRight,
  ListTodo,
  Edit3,
  Paintbrush,
  Music,
  Volume2,
  ChevronUp,
  ChevronDown,
  Activity,
  Target,
  CheckCircle2 as TaskDone,
  Smile,
} from "lucide-react";
import { MoodTracker } from "./components/MoodTracker";
import { AppStateData, TodoItem, PriorityType, RecurringType, BackgroundTheme } from "../types";
import { getStoredState, saveStoredState, subscribeToStateChanges, DEFAULT_STATE } from "../lib/storage";
import "../index.css";

const MOOD_EMOJIS = [
  "😄 Happy",
  "😊 Calm",
  "😐 Normal",
  "😔 Sad",
  "😤 Frustrated",
  "😴 Exhausted",
  "🤯 Overwhelmed"
];

const DISTRACTION_CATEGORIES = [
  "Phone",
  "Social Media",
  "Bathroom",
  "Meeting",
  "Other"
];

const BACKGROUND_THEMES: { id: BackgroundTheme; name: string }[] = [
  { id: "default", name: "Solid Background" },
  { id: "gradient", name: "Minimal Gradient" },
  { id: "mountain", name: "Geometric Grid" },
  { id: "library", name: "Vertical Stripe Texture" },
  { id: "cafe", name: "Diagonal Crosshatch" },
  { id: "anime-room", name: "Dot Matrix Pattern" }
];

export function Popup() {
  const [state, setState] = useState<AppStateData | null>(null);
  const [activeTab, setActiveTab] = useState<"timer" | "tasks" | "shield" | "notes" | "stats">("timer");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDistractionPicker, setShowDistractionPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showFloatingTimerCard, setShowFloatingTimerCard] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TodoItem | null>(null);

  // Local inputs
  const [newTaskText, setNewTaskText] = useState("");
  const [activeGroupId, setActiveGroupId] = useState<string>("current");
  const [newGroupName, setNewGroupName] = useState("");
  const [showAddGroupInput, setShowAddGroupInput] = useState(false);
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newMoodText, setNewMoodText] = useState("");
  const [selectedMood, setSelectedMood] = useState(MOOD_EMOJIS[1]);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  // Settings inputs
  const [workMinsInput, setWorkMinsInput] = useState(25);
  const [breakMinsInput, setBreakMinsInput] = useState(5);
  const [autoStartBreakInput, setAutoStartBreakInput] = useState(false);

  // Music Player State & Controls
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);

  const isMusicPlaying = state?.isMusicPlaying ?? false;
  const musicVolume = state?.musicVolume ?? 0.8;

  const handleMusicVolumeChange = (v: number) => {
    updateState({ musicVolume: v });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_MUSIC_VOLUME", volume: v });
    }
  };

  const playSoundEffect = () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "PLAY_SOUND_EFFECT" });
    } else {
      try {
        const audio = new Audio("/soundeffect.mp3");
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
      document.body.className = initial.themeMode || "dark";
      setWorkMinsInput(initial.pomodoroSettings.work);
      setBreakMinsInput(initial.pomodoroSettings.break);
      setAutoStartBreakInput(initial.pomodoroSettings.autoStartBreak);
    });

    const unsubscribe = subscribeToStateChanges((updated) => {
      setState(updated);
      document.body.className = updated.themeMode || "dark";
    });

    return () => unsubscribe();
  }, []);

  // No local timer tick — the background service worker is the single source
  // of truth. Timer state updates arrive via subscribeToStateChanges above.

  if (!state) {
    return (
      <div className="w-[420px] h-[580px] bg-black text-white flex items-center justify-center font-mono text-xs">
        LOADING FOCUS...
      </div>
    );
  }

  const isDark = state.themeMode === "dark";

  const updateState = (updates: Partial<AppStateData>) => {
    saveStoredState(updates).then((nxt) => {
      setState(nxt);
      if (updates.themeMode) {
        document.body.className = updates.themeMode;
      }
    });
  };

  const toggleThemeMode = () => {
    const nextMode = isDark ? "light" : "dark";
    updateState({ themeMode: nextMode });
  };

  // Timer controls — write to storage directly, the background's
  // chrome.storage.onChanged listener reacts to start/stop the timer.
  const toggleTimer = () => {
    updateState({ isActive: !state.isActive });
  };

  const resetTimer = () => {
    let defaultTime = 0;
    if (state.timerState === "WORK") defaultTime = state.pomodoroSettings.work * 60;
    else if (state.timerState === "BREAK") defaultTime = state.pomodoroSettings.break * 60;
    else if (state.timerState === "FLOW") defaultTime = 0;

    updateState({ isActive: false, timeLeft: defaultTime });
  };

  const switchTimerModeAndState = (mode: "POMODORO" | "FLOW", timerState: "WORK" | "BREAK" | "FLOW") => {
    let nextTime = 0;
    if (timerState === "WORK") nextTime = state.pomodoroSettings.work * 60;
    else if (timerState === "BREAK") nextTime = state.pomodoroSettings.break * 60;
    else if (timerState === "FLOW") nextTime = 0;

    const prevMode = timerState === "FLOW" ? "FLOW" : (timerState === "WORK" ? "POMODORO" : state.previousMode);

    updateState({
      timerMode: mode,
      timerState,
      previousMode: prevMode,
      isActive: false,
      timeLeft: nextTime
    });
  };

  // Complete session: Flow break = elapsedFlowSeconds / 5
  const completeSession = () => {
    playSoundEffect();
    const isWorkOrFlow = state.timerState === "WORK" || state.timerState === "FLOW";

    if (isWorkOrFlow && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "RESTORE_BLOCKED_TABS" });
    }
    const durationLogged = state.timerState === "FLOW" ? state.timeLeft : (state.pomodoroSettings.work * 60 - state.timeLeft);
    const minsLogged = Math.max(1, Math.round(durationLogged / 60));

    const dayName = new Date().toLocaleDateString("en-US", { weekday: "short" });
    const updatedWeekly = { ...state.stats.weeklyMinutes };
    updatedWeekly[dayName] = (updatedWeekly[dayName] || 0) + (isWorkOrFlow ? minsLogged : 0);

    const newSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: durationLogged > 0 ? durationLogged : 1,
      mode: state.timerMode,
      sessionName: state.sessionName || "Focus Session",
      todoId: state.selectedTodoId || undefined
    };

    let updatedTodos = state.todos;
    if (state.selectedTodoId && isWorkOrFlow) {
      updatedTodos = state.todos.map(t => t.id === state.selectedTodoId ? {
        ...t,
        completedPomodoros: (t.completedPomodoros || 0) + 1
      } : t);
    }

    let nextState: "WORK" | "BREAK" | "FLOW" = "BREAK";
    let nextTime = 0;
    let prevMode = state.previousMode;

    if (isWorkOrFlow) {
      prevMode = state.timerState === "FLOW" ? "FLOW" : "POMODORO";
      nextState = "BREAK";
      nextTime = state.timerState === "FLOW"
        ? Math.max(1, Math.floor(state.timeLeft / 5))
        : state.pomodoroSettings.break * 60;
    } else {
      // Return to previous mode after break completes
      if (state.previousMode === "FLOW") {
        nextState = "FLOW";
        nextTime = 0;
      } else {
        nextState = "WORK";
        nextTime = state.pomodoroSettings.work * 60;
      }
    }

    updateState({
      isActive: isWorkOrFlow && state.pomodoroSettings.autoStartBreak,
      timerState: nextState,
      previousMode: prevMode,
      timeLeft: nextTime,
      todos: updatedTodos,
      sessions: [newSession, ...state.sessions],
      stats: {
        ...state.stats,
        todayMinutes: state.stats.todayMinutes + (isWorkOrFlow ? minsLogged : 0),
        weeklyMinutes: updatedWeekly
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
      distractions: [...state.distractions, entry]
    });
    setShowDistractionPicker(false);
  };

  // Reset All Extension Data to Factory Defaults
  const resetAllData = () => {
    if (window.confirm("Are you sure you want to reset all extension data to defaults? This will clear all tasks, sessions, mood notes, and stats.")) {
      saveStoredState(DEFAULT_STATE).then((fresh) => {
        setState(fresh);
        setShowSettingsModal(false);
      });
    }
  };

  // Save Settings
  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const work = Math.max(1, workMinsInput);
    const brk = Math.max(1, breakMinsInput);
    const newTimeLeft = state.timerState === "WORK" ? work * 60 : brk * 60;

    updateState({
      pomodoroSettings: {
        work,
        break: brk,
        autoStartBreak: autoStartBreakInput
      },
      timeLeft: state.isActive ? state.timeLeft : newTimeLeft
    });
    setShowSettingsModal(false);
  };

  // Goal input key handler (pressing Enter creates a task)
  const handleGoalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && state.sessionName.trim()) {
      e.preventDefault();
      const existing = state.todos.find(t => t.text.toLowerCase() === state.sessionName.trim().toLowerCase());
      if (existing) {
        updateState({ selectedTodoId: existing.id });
      } else {
        const newTodo: TodoItem = {
          id: crypto.randomUUID(),
          text: state.sessionName.trim(),
          completed: false,
          priority: "medium",
          groupId: "current",
          subtasks: []
        };
        updateState({
          todos: [newTodo, ...state.todos],
          selectedTodoId: newTodo.id
        });
      }
    }
  };

  // Task Handlers
  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const item: TodoItem = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
      priority: "medium",
      groupId: activeGroupId === "finished" ? "current" : activeGroupId,
      subtasks: []
    };
    updateState({ todos: [item, ...state.todos] });
    setNewTaskText("");
  };

  const toggleTodo = (id: string) => {
    const updated = state.todos.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
          groupId: nextCompleted ? "finished" : "current"
        };
      }
      return t;
    });
    const completedCount = updated.filter(t => t.completed).length;
    updateState({ todos: updated, stats: { ...state.stats, completedTasksCount: completedCount } });
  };

  const deleteTodo = (id: string) => {
    updateState({
      todos: state.todos.filter(t => t.id !== id),
      selectedTodoId: state.selectedTodoId === id ? null : state.selectedTodoId
    });
    if (selectedTaskDetail?.id === id) setSelectedTaskDetail(null);
  };

  const focusOnTask = (task: TodoItem) => {
    updateState({
      selectedTodoId: task.id,
      sessionName: task.text
    });
    setSelectedTaskDetail(null);
    setActiveTab("timer");
  };

  // Subtask Handlers
  const addSubtask = (todoId: string, text: string) => {
    if (!text.trim()) return;
    const updated = state.todos.map(t => {
      if (t.id === todoId) {
        const newSub = { id: crypto.randomUUID(), text: text.trim(), completed: false };
        return { ...t, subtasks: [...(t.subtasks || []), newSub] };
      }
      return t;
    });
    updateState({ todos: updated });
    if (selectedTaskDetail?.id === todoId) {
      setSelectedTaskDetail(updated.find(t => t.id === todoId) || null);
    }
  };

  const toggleSubtask = (todoId: string, subId: string) => {
    const updated = state.todos.map(t => {
      if (t.id === todoId) {
        const subs = (t.subtasks || []).map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
        return { ...t, subtasks: subs };
      }
      return t;
    });
    updateState({ todos: updated });
    if (selectedTaskDetail?.id === todoId) {
      setSelectedTaskDetail(updated.find(t => t.id === todoId) || null);
    }
  };

  // Group Handlers
  const addCustomGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup = {
      id: crypto.randomUUID(),
      name: newGroupName.trim(),
      type: "custom" as const
    };
    updateState({ groups: [...state.groups, newGroup] });
    setActiveGroupId(newGroup.id);
    setNewGroupName("");
    setShowAddGroupInput(false);
  };

  // Shield Handlers
  const addBlockedSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteUrl.trim()) return;
    let clean = newSiteUrl.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    if (!clean) return;
    if (state.shield.blockedSites.includes(clean)) return;

    updateState({
      shield: {
        ...state.shield,
        blockedSites: [...state.shield.blockedSites, clean]
      }
    });
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

  // Mood Notes Handlers
  const addMoodNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMoodText.trim()) return;
    const note = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      mood: selectedMood,
      text: newMoodText.trim()
    };
    updateState({ moodNotes: [note, ...state.moodNotes] });
    setNewMoodText("");
  };

  const deleteMoodNote = (id: string) => {
    updateState({ moodNotes: state.moodNotes.filter(n => n.id !== id) });
  };

  const setMoodForDate = (dateKey: string, mood: string, text?: string) => {
    const notes = state.moodNotes || [];
    const targetDate = dateKey.slice(0, 10);
    const existingIndex = notes.findIndex((n) => n.date.slice(0, 10) === targetDate);

    if (!mood) {
      if (existingIndex >= 0) {
        updateState({ moodNotes: notes.filter((_, idx) => idx !== existingIndex) });
      }
      return;
    }

    if (existingIndex >= 0) {
      const updated = [...notes];
      updated[existingIndex] = {
        ...updated[existingIndex],
        mood,
        text: text !== undefined ? text : updated[existingIndex].text,
      };
      updateState({ moodNotes: updated });
    } else {
      const newNote = {
        id: crypto.randomUUID(),
        date: dateKey,
        mood,
        text: text || "",
      };
      updateState({ moodNotes: [newNote, ...notes] });
    }
  };

  const cycleMoodForDate = (dateKey: string) => {
    const notes = state.moodNotes || [];
    const targetDate = dateKey.slice(0, 10);
    const existing = notes.find((n) => n.date.slice(0, 10) === targetDate);

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

    const cycle = ["amazing", "ok", "tired", "sad", "stressed"];
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

    setMoodForDate(dateKey, nextMood);
  };

  const openGithubLink = () => {
    const url = "https://github.com/YogaDharma21/focus";
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  // Selected Task Object
  const selectedTask = state.todos.find(t => t.id === state.selectedTodoId);

  // Time calculations
  const mins = Math.floor(state.timeLeft / 60);
  const secs = state.timeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const totalDuration = state.timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60;

  // Stats Calculations
  const finishedTasksTodayCount = state.todos.filter(t => t.completed).length;
  const pendingTasksCount = state.todos.filter(t => !t.completed).length;
  const taskDoneRatePercent = state.todos.length > 0 ? Math.round((finishedTasksTodayCount / state.todos.length) * 100) : 100;

  // Distraction Analysis Breakdown
  const distractionCounts: { [cat: string]: number } = {};
  state.distractions.forEach(d => {
    if (d.category === "Shield Blocked Tab") return;
    const cat = d.category || "Other";
    distractionCounts[cat] = (distractionCounts[cat] || 0) + 1;
  });

  // Vector Background Pattern Class computation
  const bgClass =
    state.background === "gradient"
      ? (isDark ? "bg-gradient-to-br from-black via-neutral-950 to-neutral-900" : "bg-gradient-to-br from-white via-neutral-100 to-neutral-200")
      : state.background === "mountain"
      ? (isDark ? "bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] bg-black" : "bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:16px_16px] bg-white")
      : state.background === "library"
      ? (isDark ? "bg-[linear-gradient(to_right,#171717_1px,transparent_1px)] [background-size:24px_100%] bg-black" : "bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px)] [background-size:24px_100%] bg-white")
      : state.background === "cafe"
      ? (isDark ? "bg-[repeating-linear-gradient(45deg,#171717,#171717_1px,transparent_0,transparent_16px)] bg-black" : "bg-[repeating-linear-gradient(45deg,#f5f5f5,#f5f5f5_1px,transparent_0,transparent_16px)] bg-white")
      : state.background === "anime-room"
      ? (isDark ? "bg-[radial-gradient(#404040_1px,transparent_1px)] [background-size:12px_12px] bg-black" : "bg-[radial-gradient(#a3a3a3_1px,transparent_1px)] [background-size:12px_12px] bg-white")
      : (isDark ? "bg-black" : "bg-white");

  return (
    <div className={`w-[420px] h-[580px] flex flex-col overflow-hidden select-none font-sans relative ${
      isDark ? "text-white" : "text-black"
    } ${bgClass}`}>
      {/* Top Header */}
      <header className={`px-4 py-3 border-b flex items-center justify-between z-10 ${
        isDark ? "bg-neutral-950/80 border-neutral-800" : "bg-neutral-100/80 border-neutral-200"
      } backdrop-blur-sm`}>
        <div className="flex items-center gap-2.5">
          <img src="/icons/icon32.png" className="w-7 h-7 rounded-lg object-contain border border-neutral-700 shadow-sm" alt="Focus Logo" />
          <div>
            <h1 className="text-sm font-extrabold tracking-wider uppercase font-heading">
              FOCUS
            </h1>
          </div>
        </div>

        {/* Floating Mini Timer Pill in Navbar Middle (Visible when outside Timer tab) */}
        {activeTab !== "timer" && (
          <button
            onClick={() => setShowFloatingTimerCard(!showFloatingTimerCard)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              showFloatingTimerCard
                ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                : isDark
                  ? "bg-neutral-900/90 border-neutral-800 text-white hover:bg-neutral-800"
                  : "bg-white border-neutral-300 text-black hover:bg-neutral-100"
            } ${state.isActive ? (isDark ? "border-emerald-500/60 ring-1 ring-emerald-500/40" : "border-emerald-600/60 ring-1 ring-emerald-600/40") : ""}`}
            title="Toggle Floating Timer Controls"
          >
            <span className="text-xs">
              {state.timerState === "WORK" ? "🍅" : state.timerState === "BREAK" ? "☕" : "⏱"}
            </span>
            <span className="font-extrabold font-mono text-[11px] tracking-tight">
              {timeFormatted}
            </span>
            {state.isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        )}

        {/* Action Controls: Theme Mode Toggle + Background Switcher (Paintbrush icon) + Info */}
        <div className="flex items-center gap-1.5">
          {/* Background Theme Selector Button with Paintbrush Icon */}
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              showThemePicker
                ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                : isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-white border-neutral-300 text-black hover:bg-neutral-100"
            }`}
            title="Change Background Theme"
          >
            <Paintbrush className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle Tooltip without word "monochrome" */}
          <button
            onClick={toggleThemeMode}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              isDark
                ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
                : "bg-white border-neutral-300 text-black hover:bg-neutral-100"
            }`}
            title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Info Button */}
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              showInfoModal
                ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                : isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-white border-neutral-300 text-black hover:bg-neutral-100"
            }`}
            title="Focus Extension Info"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Timer Card Overlay (Matching Provided Mockups) */}
      {activeTab !== "timer" && showFloatingTimerCard && (
        <div className={`absolute top-14 left-3 right-3 z-50 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? "bg-neutral-900/95 border-neutral-800 text-white shadow-black/80"
            : "bg-white/95 border-neutral-200 text-black shadow-neutral-400/50"
        }`}>
          {/* Header Row: Emoji + Mode Name & Live Timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">
                {state.timerState === "WORK" ? "🍅" : state.timerState === "BREAK" ? "☕" : "⏱"}
              </span>
              <span className="text-sm font-bold font-sans">
                {state.timerState === "WORK" ? "Pomodoro" : state.timerState === "BREAK" ? "Break" : "Flow"}
              </span>
            </div>
            <div className="text-xl font-black font-mono tracking-tight">
              {timeFormatted}
            </div>
          </div>

          {/* Mode Switcher Buttons Row */}
          <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl border mb-3 ${
            isDark ? "bg-neutral-950/80 border-neutral-800" : "bg-neutral-100 border-neutral-300"
          }`}>
            <button
              onClick={() => switchTimerModeAndState("POMODORO", "WORK")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                state.timerState === "WORK"
                  ? isDark ? "bg-white text-black shadow" : "bg-black text-white shadow"
                  : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              <span>🍅</span>
              <span>Pomodoro</span>
            </button>
            <button
              onClick={() => switchTimerModeAndState("POMODORO", "BREAK")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                state.timerState === "BREAK"
                  ? isDark ? "bg-white text-black shadow" : "bg-black text-white shadow"
                  : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              <span>☕</span>
              <span>Break</span>
            </button>
            <button
              onClick={() => switchTimerModeAndState("FLOW", "FLOW")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                state.timerState === "FLOW"
                  ? isDark ? "bg-white text-black shadow" : "bg-black text-white shadow"
                  : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              <span>⏱</span>
              <span>Flow</span>
            </button>
          </div>

          {/* Divider Line */}
          <div className={`border-t mb-2.5 ${isDark ? "border-neutral-800" : "border-neutral-200"}`} />

          {/* Tag & Group Badge Row */}
          <div className="flex items-center justify-between mb-3 px-0.5">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans border ${
              isDark ? "bg-neutral-800/80 border-neutral-700 text-neutral-200" : "bg-neutral-200/80 border-neutral-300 text-neutral-800"
            }`}>
              {selectedTask ? selectedTask.text : (state.sessionName || "Work")}
            </span>

            <button
              onClick={() => {
                setActiveTab("timer");
                setShowFloatingTimerCard(false);
              }}
              className="text-[10px] font-bold font-mono opacity-70 hover:opacity-100 flex items-center gap-1"
            >
              <span>Open Timer</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Control Action Buttons Row */}
          <div className="flex items-center gap-2">
            {/* Complete Session Button */}
            <button
              onClick={() => {
                completeSession();
                setShowFloatingTimerCard(false);
              }}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isDark
                  ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white"
                  : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-black"
              }`}
              title="Complete Session"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete</span>
            </button>

            {/* Log Distraction Button */}
            <button
              onClick={() => {
                setShowFloatingTimerCard(false);
                setShowDistractionPicker(true);
              }}
              className={`p-2 rounded-xl border transition-all ${
                isDark
                  ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300"
                  : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-700"
              }`}
              title="Log Distraction"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>

            {/* Start / Pause Button */}
            <button
              onClick={toggleTimer}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow ${
                isDark
                  ? "bg-white text-black border-white hover:bg-neutral-200"
                  : "bg-black text-white border-black hover:bg-neutral-800"
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

      {/* Background Theme Selector Picker Overlay */}
      {showThemePicker && (
        <div className={`absolute top-14 right-4 z-50 p-3 rounded-xl border shadow-2xl flex flex-col gap-1 text-xs font-mono animate-in fade-in duration-150 ${
          isDark ? "bg-neutral-950 border-neutral-700 text-white" : "bg-white border-neutral-300 text-black"
        }`}>
          <div className="text-[10px] font-bold uppercase opacity-60 px-2 py-1 border-b border-current">SELECT BACKGROUND PATTERN</div>
          {BACKGROUND_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                updateState({ background: theme.id });
                setShowThemePicker(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-left font-bold transition-all flex items-center justify-between ${
                state.background === theme.id
                  ? isDark ? "bg-white text-black" : "bg-black text-white"
                  : isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
              }`}
            >
              <span>{theme.name}</span>
              {state.background === theme.id && <span className="text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* Info Modal Overlay (Removed Manifest V3 text) */}
      {showInfoModal && (
        <div className={`absolute inset-0 z-50 p-5 flex flex-col justify-between backdrop-blur-md animate-in fade-in duration-200 ${
          isDark ? "bg-black/95 text-white" : "bg-white/95 text-black"
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-current">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider">ABOUT FOCUS EXTENSION</h2>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className={`p-1 rounded-lg border ${
                isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-neutral-100 border-neutral-300 text-black hover:bg-neutral-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="my-auto text-xs leading-relaxed p-4 rounded-xl border text-center font-medium opacity-90 border-current">
            Focus is a minimalist, monochrome extension designed for distraction-free deep work, pomodoro tracking, and site blocking.
          </div>

          <div className="space-y-2 pt-2 border-t border-current">
            <button
              onClick={openGithubLink}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                isDark ? "bg-white text-black border-white hover:bg-neutral-200" : "bg-black text-white border-black hover:bg-neutral-800"
              }`}
            >
              <Github className="w-4 h-4" />
              <span>View Source on GitHub Pages</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="text-[10px] font-mono text-center opacity-50">
              Focus Extension v1.2.0
            </div>
          </div>
        </div>
      )}

      {/* Distraction Picker Modal */}
      {showDistractionPicker && (
        <div className={`absolute inset-0 z-50 p-5 flex flex-col justify-between backdrop-blur-md animate-in fade-in duration-200 ${
          isDark ? "bg-black/95 text-white" : "bg-white/95 text-black"
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-current">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider">LOG DISTRACTION</h2>
            </div>
            <button
              onClick={() => setShowDistractionPicker(false)}
              className={`p-1 rounded-lg border ${
                isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-neutral-100 border-neutral-300 text-black hover:bg-neutral-200"
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
                  isDark
                    ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white"
                    : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-black"
                }`}
              >
                <span>{cat}</span>
                <Plus className="w-4 h-4 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timer Settings Modal */}
      {showSettingsModal && (
        <div className={`absolute inset-0 z-50 p-5 flex flex-col justify-between backdrop-blur-md animate-in fade-in duration-200 ${
          isDark ? "bg-black/95 text-white" : "bg-white/95 text-black"
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-current">
            <h2 className="text-sm font-bold font-sans">Timer Settings</h2>
            <button
              onClick={() => setShowSettingsModal(false)}
              className={`p-1 rounded-lg border ${
                isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-neutral-100 border-neutral-300 text-black hover:bg-neutral-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={saveSettings} className="space-y-3 my-auto">
            {/* Work Duration */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
            }`}>
              <span className="text-xs font-bold font-sans">Work Duration</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={workMinsInput}
                  onChange={(e) => setWorkMinsInput(parseInt(e.target.value) || 25)}
                  className={`w-14 px-2 py-1.5 rounded-lg border text-xs font-mono text-center focus:outline-none ${
                    isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-neutral-300 text-black"
                  }`}
                />
                <span className={`text-[10px] font-mono ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>min</span>
              </div>
            </div>

            {/* Break Duration */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
            }`}>
              <span className="text-xs font-bold font-sans">Break Duration</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={breakMinsInput}
                  onChange={(e) => setBreakMinsInput(parseInt(e.target.value) || 5)}
                  className={`w-14 px-2 py-1.5 rounded-lg border text-xs font-mono text-center focus:outline-none ${
                    isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-neutral-300 text-black"
                  }`}
                />
                <span className={`text-[10px] font-mono ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>min</span>
              </div>
            </div>

            {/* Auto-start Break Toggle */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
            }`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold font-sans">Auto-start Break</span>
                <span className={`text-[10px] font-mono ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                  Launch break timer immediately after work or flow
                </span>
              </div>
              <div
                onClick={() => setAutoStartBreakInput(!autoStartBreakInput)}
                className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors flex items-center ${
                  autoStartBreakInput
                    ? isDark ? "bg-white" : "bg-black"
                    : isDark ? "bg-neutral-700" : "bg-neutral-300"
                }`}
              >
                <div
                  className={`absolute w-5 h-5 rounded-full transition-all duration-200 ${
                    autoStartBreakInput
                      ? isDark ? "left-[22px] bg-black" : "left-[22px] bg-white"
                      : isDark ? "left-[2px] bg-neutral-400" : "left-[2px] bg-white"
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs border transition-all mt-4 ${
                isDark ? "bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700" : "bg-neutral-100 text-black border-neutral-300 hover:bg-neutral-200"
              }`}
            >
              Confirm Changes
            </button>

            <div className="pt-2">
              <button
                type="button"
                onClick={resetAllData}
                className="w-full py-2.5 rounded-xl font-mono font-bold text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
              >
                Reset All Extension Data
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Detail View Modal */}
      {selectedTaskDetail && (
        <div className={`absolute inset-0 z-50 p-4 flex flex-col justify-between backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 ${
          isDark ? "bg-black/95 text-white" : "bg-white/95 text-black"
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-current">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider">TASK DETAILS</h2>
            </div>
            <button
              onClick={() => setSelectedTaskDetail(null)}
              className={`p-1 rounded-lg border ${
                isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-neutral-100 border-neutral-300 text-black hover:bg-neutral-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 my-3 text-xs overflow-y-auto pr-1">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={selectedTaskDetail.text}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, text: val } : t);
                  updateState({ todos: updated });
                  setSelectedTaskDetail({ ...selectedTaskDetail, text: val });
                }}
                className={`flex-1 p-2 font-bold text-sm rounded-xl border focus:outline-none ${
                  isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                }`}
              />
            </div>

            <button
              onClick={() => focusOnTask(selectedTaskDetail)}
              className={`w-full py-2.5 rounded-xl font-extrabold text-xs border flex items-center justify-center gap-2 transition-all ${
                isDark ? "bg-white text-black border-white hover:bg-neutral-200" : "bg-black text-white border-black hover:bg-neutral-800"
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>FOCUS ON THIS TASK</span>
            </button>

            <div>
              <label className="text-[10px] font-mono uppercase font-bold block mb-1 opacity-70">Task Group</label>
              <select
                value={selectedTaskDetail.groupId || "current"}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, groupId: val } : t);
                  updateState({ todos: updated });
                  setSelectedTaskDetail({ ...selectedTaskDetail, groupId: val });
                }}
                className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                  isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                }`}
              >
                {state.groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase font-bold block mb-1 opacity-70">Priority</label>
                <select
                  value={selectedTaskDetail.priority || "medium"}
                  onChange={(e) => {
                    const val = e.target.value as PriorityType;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, priority: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, priority: val });
                  }}
                  className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold block mb-1 opacity-70">Recurring</label>
                <select
                  value={selectedTaskDetail.recurring || "none"}
                  onChange={(e) => {
                    const val = e.target.value as RecurringType;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, recurring: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, recurring: val });
                  }}
                  className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                  }`}
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase font-bold block mb-1 opacity-70">Estimated Sessions</label>
                <input
                  type="number"
                  min="1"
                  value={selectedTaskDetail.estimatedPomodoros || 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, estimatedPomodoros: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, estimatedPomodoros: val });
                  }}
                  className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold block mb-1 opacity-70">Completed Sessions</label>
                <input
                  type="number"
                  min="0"
                  value={selectedTaskDetail.completedPomodoros || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, completedPomodoros: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, completedPomodoros: val });
                  }}
                  className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase font-bold block mb-1 opacity-70">Deadline Date</label>
                <input
                  type="date"
                  value={selectedTaskDetail.dueDate || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, dueDate: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, dueDate: val });
                  }}
                  className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold block mb-1 opacity-70">Deadline Time</label>
                <input
                  type="time"
                  value={selectedTaskDetail.dueTime || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, dueTime: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, dueTime: val });
                  }}
                  className={`w-full p-2 rounded-xl border text-xs font-mono focus:outline-none ${
                    isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase font-bold block mb-1 opacity-70">Task Notes</label>
              <textarea
                rows={2}
                value={selectedTaskDetail.notes || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, notes: val } : t);
                  updateState({ todos: updated });
                  setSelectedTaskDetail({ ...selectedTaskDetail, notes: val });
                }}
                placeholder="Add additional task notes..."
                className={`w-full p-2 rounded-xl border text-xs focus:outline-none ${
                  isDark ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600" : "bg-neutral-100 border-neutral-300 text-black placeholder-neutral-400"
                }`}
              />
            </div>

            <div className="pt-2 border-t border-current">
              <label className="text-[10px] font-mono uppercase font-bold block mb-2 opacity-70">Subtasks Checklist</label>

              <form onSubmit={(e) => { e.preventDefault(); addSubtask(selectedTaskDetail.id, newSubtaskText); setNewSubtaskText(""); }} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  placeholder="Add subtask..."
                  className={`flex-1 p-2 rounded-xl border text-xs focus:outline-none ${
                    isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                  }`}
                />
                <button type="submit" className={`px-3 py-2 rounded-xl font-bold text-xs border ${
                  isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                }`}>
                  Add
                </button>
              </form>

              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {(selectedTaskDetail.subtasks || []).map(sub => (
                  <div key={sub.id} className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                    sub.completed ? "line-through opacity-50" : ""
                  }`}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleSubtask(selectedTaskDetail.id, sub.id)}>
                        {sub.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      </button>
                      <span>{sub.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-current">
            <button
              onClick={() => deleteTodo(selectedTaskDetail.id)}
              className="w-full py-2 rounded-xl border border-red-500 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
            >
              Delete Task
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className={`flex items-center justify-between px-3 py-1.5 border-b z-10 ${
        isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-neutral-50 border-neutral-200"
      }`}>
        {[
          { id: "timer", label: "Timer", icon: TimerIcon },
          { id: "tasks", label: "Tasks", icon: CheckSquare, badge: state.todos.filter(t => !t.completed).length },
          { id: "shield", label: "Shield", icon: Shield, activeIndicator: state.shield.enabled && state.isActive },
          { id: "notes", label: "Mood", icon: Smile, badge: state.moodNotes.length },
          { id: "stats", label: "Stats", icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all relative text-[10px] font-bold ${
                isActive
                  ? isDark
                    ? "bg-white text-black font-extrabold shadow-sm"
                    : "bg-black text-white font-extrabold shadow-sm"
                  : isDark
                    ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-200"
              }`}
            >
              <div className="relative">
                <Icon className="w-3.5 h-3.5" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2 text-[9px] font-mono font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    isDark ? "bg-neutral-800 text-white border border-neutral-600" : "bg-neutral-300 text-black border border-neutral-400"
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {tab.activeIndicator && (
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping ${
                    isDark ? "bg-white" : "bg-black"
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
          isDark ? "bg-neutral-900/90 border-neutral-800 text-white" : "bg-white/90 border-neutral-200 text-black"
        }`}>
          <div
            onClick={() => setIsMusicExpanded(!isMusicExpanded)}
            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
          >
            <Music className="w-4 h-4 text-current shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">Lo-Fi</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleMusicPlay}
              className={`w-7 h-7 rounded-lg flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-all ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
              title={isMusicPlaying ? "Pause" : "Play"}
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
            isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-black"
          }`}>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-current/10">
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

            <div
              onClick={toggleMusicPlay}
              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                isMusicPlaying
                  ? (isDark ? "bg-neutral-800 border-neutral-700" : "bg-neutral-100 border-neutral-300")
                  : (isDark ? "bg-neutral-950/50 border-neutral-800/50" : "bg-neutral-50 border-neutral-200")
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music className={`w-4 h-4 ${isMusicPlaying ? "text-primary animate-pulse" : "opacity-50"}`} />
                <div>
                  <div className="text-xs font-bold">Lo-Fi</div>
                </div>
              </div>

              {isMusicPlaying && (
                <div className="flex items-end gap-0.5 h-3">
                  <span className={`w-0.5 h-3 rounded-full animate-pulse ${isDark ? "bg-white" : "bg-black"}`} />
                  <span className={`w-0.5 h-2 rounded-full animate-pulse delay-75 ${isDark ? "bg-white" : "bg-black"}`} />
                  <span className={`w-0.5 h-3.5 rounded-full animate-pulse delay-150 ${isDark ? "bg-white" : "bg-black"}`} />
                </div>
              )}
            </div>

            {/* Volume Slider */}
            <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 opacity-60 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 rounded bg-neutral-700 accent-current cursor-pointer"
              />
              <span className="text-[10px] font-mono opacity-60 w-7 text-right">
                {Math.round(musicVolume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 z-10 relative">
        {/* TIMER TAB */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center justify-between h-full py-1">
            {/* 3-Way Mode Switcher (Pomodoro, Break, Flow - No Minutes in Toggle Labels!) */}
            <div className={`flex items-center p-1 rounded-xl border w-full max-w-[320px] ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-100 border-neutral-300"
            }`}>
              <button
                onClick={() => switchTimerModeAndState("POMODORO", "WORK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  state.timerState === "WORK"
                    ? isDark ? "bg-white text-black shadow-md" : "bg-black text-white shadow-md"
                    : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
              >
                Pomodoro
              </button>
              <button
                onClick={() => switchTimerModeAndState("POMODORO", "BREAK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  state.timerState === "BREAK"
                    ? isDark ? "bg-white text-black shadow-md" : "bg-black text-white shadow-md"
                    : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
              >
                Break
              </button>
              <button
                onClick={() => switchTimerModeAndState("FLOW", "FLOW")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  state.timerState === "FLOW"
                    ? isDark ? "bg-white text-black shadow-md" : "bg-black text-white shadow-md"
                    : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
              >
                Flow
              </button>
            </div>

            {/* Timer Display - Big Number */}
            <div className="flex flex-col items-center justify-center my-4 py-6">
              <span className="text-7xl font-black font-mono tracking-tighter leading-none">
                {timeFormatted}
              </span>
              <span className={`text-[10px] font-mono uppercase tracking-widest mt-3 px-3 py-1 rounded-lg border ${
                isDark
                  ? "bg-neutral-900 text-neutral-300 border-neutral-700"
                  : "bg-neutral-100 text-neutral-800 border-neutral-300"
              }`}>
                {state.isActive
                  ? (state.timerState === "FLOW" ? "STOPWATCH FLOW" : state.timerState === "WORK" ? "WORK IN PROGRESS" : "ON BREAK")
                  : "PAUSED"}
              </span>
            </div>

            {/* Goal Input */}
            <div className="w-full max-w-[280px] mb-2">
              <input
                type="text"
                value={state.sessionName}
                onChange={(e) => updateState({ sessionName: e.target.value })}
                onKeyDown={handleGoalKeyDown}
                placeholder="Session Goal (Press Enter to create task)..."
                className={`w-full px-3 py-1.5 rounded-xl text-xs text-center font-medium border focus:outline-none ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white"
                    : "bg-neutral-100 border-neutral-300 text-black placeholder-neutral-400 focus:border-black"
                }`}
              />
            </div>

            {/* Selected Task & Subtasks in Timer */}
            {selectedTask && (
              <div className={`w-full max-w-[320px] p-2.5 mb-2 rounded-xl border flex flex-col gap-1.5 ${
                isDark ? "bg-neutral-900/90 border-neutral-800" : "bg-neutral-100/90 border-neutral-300"
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold truncate text-[11px] font-mono">{selectedTask.text}</span>
                  <button onClick={() => updateState({ selectedTodoId: null })} className="text-[10px] opacity-60 hover:opacity-100">
                    Clear
                  </button>
                </div>

                {(selectedTask.subtasks || []).length > 0 && (
                   <div className="space-y-1 max-h-48 overflow-y-auto pt-1 border-t border-current text-[11px]">
                    {selectedTask.subtasks!.map(s => (
                      <div key={s.id} className="flex items-center gap-1.5">
                        <button onClick={() => toggleSubtask(selectedTask.id, s.id)}>
                          {s.completed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        </button>
                        <span className={s.completed ? "line-through opacity-50" : ""}>{s.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Control Buttons Grid */}
            <div className="flex items-center gap-2">
              {/* Log Distraction Button */}
              <button
                onClick={() => setShowDistractionPicker(true)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                    : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-700"
                }`}
                title="Log Distraction"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              {/* Reset Timer */}
              <button
                onClick={resetTimer}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                    : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-700"
                }`}
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                onClick={toggleTimer}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-lg active:scale-95 ${
                  isDark
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                {state.isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Complete Session Button */}
              <button
                onClick={completeSession}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                    : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-700"
                }`}
                title="Complete Session"
              >
                <CheckCircle className="w-4 h-4" />
              </button>

              {/* Timer Settings Button */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                    : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-700"
                }`}
                title="Timer Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="flex flex-col h-full gap-2.5">
            {/* Task Group Filter Tabs */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
              <div className="flex items-center gap-1 overflow-x-auto">
                {state.groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap ${
                      activeGroupId === group.id
                        ? isDark ? "bg-white text-black" : "bg-black text-white"
                        : isDark ? "bg-neutral-900 text-neutral-400 border border-neutral-800" : "bg-neutral-100 text-neutral-600 border border-neutral-300"
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddGroupInput(!showAddGroupInput)}
                className={`p-1 rounded-lg border text-xs font-mono font-bold flex-shrink-0 ${
                  isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                }`}
                title="Add Custom Group"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            {showAddGroupInput && (
              <form onSubmit={addCustomGroup} className="flex gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="New group name..."
                  className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-mono border focus:outline-none ${
                    isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                  }`}
                />
                <button type="submit" className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                  isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                }`}>
                  Create
                </button>
              </form>
            )}

            {/* Quick Add Task Form */}
            <form onSubmit={addTodo} className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add new task..."
                className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white"
                    : "bg-neutral-100 border-neutral-300 text-black placeholder-neutral-400 focus:border-black"
                }`}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-xl font-bold transition-all text-xs ${
                  isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                Add
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {state.todos.filter(t => (t.groupId || "current") === activeGroupId).length === 0 ? (
                <div className={`text-center py-12 text-xs font-mono ${isDark ? "text-neutral-600" : "text-neutral-400"}`}>
                  NO TASKS IN THIS GROUP. ADD ONE ABOVE.
                </div>
              ) : (
                state.todos
                  .filter(t => (t.groupId || "current") === activeGroupId)
                  .map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        todo.completed
                          ? isDark ? "bg-neutral-950 border-neutral-900 opacity-50 line-through text-neutral-500" : "bg-neutral-100 border-neutral-200 opacity-50 line-through text-neutral-400"
                          : isDark ? "bg-neutral-900 border-neutral-800 hover:border-neutral-700" : "bg-neutral-50 border-neutral-300 hover:border-neutral-400"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button onClick={() => toggleTodo(todo.id)} className="flex-shrink-0">
                          {todo.completed ? (
                            <CheckCircle2 className={`w-4 h-4 ${isDark ? "text-white" : "text-black"}`} />
                          ) : (
                            <Circle className={`w-4 h-4 ${isDark ? "text-neutral-500" : "text-neutral-400"}`} />
                          )}
                        </button>
                        <span
                          onClick={() => setSelectedTaskDetail(todo)}
                          className="text-xs font-medium truncate cursor-pointer hover:underline"
                        >
                          {todo.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => focusOnTask(todo)}
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 border ${
                            state.selectedTodoId === todo.id
                              ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                              : isDark ? "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700" : "bg-neutral-200 text-neutral-800 border-neutral-300 hover:bg-neutral-300"
                          }`}
                        >
                          <span>Focus</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>

                        <button onClick={() => setSelectedTaskDetail(todo)} className={`p-1 ${isDark ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-black"}`}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* SHIELD TAB */}
        {activeTab === "shield" && (
          <div className="flex flex-col gap-3 h-full">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              state.shield.enabled
                ? isDark ? "bg-neutral-900 border-white text-white" : "bg-neutral-100 border-black text-black"
                : isDark ? "bg-neutral-950 border-neutral-800 text-neutral-500" : "bg-neutral-50 border-neutral-200 text-neutral-400"
            }`}>
              <div className="flex items-center gap-2.5">
                {state.shield.enabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                <div>
                  <h3 className="text-xs font-bold font-mono">SITE BLOCKER SHIELD</h3>
                  <p className="text-[10px] opacity-70">
                    {state.shield.enabled ? "Active during Work & Flow sessions" : "Shield currently OFF"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => updateState({ shield: { ...state.shield, enabled: !state.shield.enabled } })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  state.shield.enabled
                    ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                    : isDark ? "bg-neutral-800 text-neutral-300 border-neutral-700" : "bg-neutral-200 text-neutral-700 border-neutral-300"
                }`}
              >
                {state.shield.enabled ? "ENABLED" : "ENABLE"}
              </button>
            </div>

            <form onSubmit={addBlockedSite} className="flex gap-2">
              <input
                type="text"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                placeholder="Block domain (e.g. twitter.com)..."
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white"
                    : "bg-neutral-100 border-neutral-300 text-black placeholder-neutral-400 focus:border-black"
                }`}
              />
              <button
                type="submit"
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isDark ? "bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700" : "bg-neutral-200 border-neutral-300 text-black hover:bg-neutral-300"
                }`}
              >
                Block
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                Blacklisted Domains ({state.shield.blockedSites.length})
              </div>
              {state.shield.blockedSites.map((site) => (
                <div
                  key={site}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    isDark ? "bg-neutral-900/60 border-neutral-800 text-neutral-300" : "bg-neutral-50 border-neutral-200 text-neutral-700"
                  }`}
                >
                  <span className="text-[11px]">{site}</span>
                  <button onClick={() => removeBlockedSite(site)} className={`p-1 ${isDark ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-black"}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOOD TRACKER TAB */}
        {activeTab === "notes" && (
          <MoodTracker
            moodNotes={state.moodNotes}
            onSetMoodForDate={setMoodForDate}
            onCycleMoodForDate={cycleMoodForDate}
            onDeleteMoodNote={deleteMoodNote}
            isDark={isDark}
          />
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
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
                  isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border flex items-center justify-center ${
                        isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-200 border-neutral-300 text-black"
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold font-sans">Day Progress</span>
                    </div>
                    <span className="text-xs font-extrabold font-mono">{dayPercent}%</span>
                  </div>

                  <div className={`w-full h-2 rounded-full overflow-hidden ${
                    isDark ? "bg-neutral-800" : "bg-neutral-200"
                  }`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDark ? "bg-white" : "bg-black"
                      }`}
                      style={{ width: `${dayPercent}%` }}
                    />
                  </div>

                  <div className="text-[10px] font-mono opacity-60">
                    {remH}h {remM}m remaining today
                  </div>
                </div>
              );
            })()}

            {/* Top 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-1.5 ${
                  isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-200 border-neutral-300 text-black"
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold font-mono">{state.stats.todayMinutes}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">MINUTES TODAY</span>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="w-8 h-8 rounded-lg border flex items-center justify-center mb-1.5 bg-emerald-900/50 border-emerald-700 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold font-mono">{finishedTasksTodayCount}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">TASKS TODAY</span>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="w-8 h-8 rounded-lg border flex items-center justify-center mb-1.5 bg-blue-900/50 border-blue-700 text-blue-400">
                  <ListTodo className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold font-mono">{pendingTasksCount}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">PENDING TASKS</span>
              </div>
            </div>

            {/* Longest Streak & Completion Rate */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="w-8 h-8 rounded-full bg-amber-900/50 border border-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-sans mb-1">Longest Streak</span>
                  <div className="text-[11px] font-mono">
                    <span className={isDark ? "text-neutral-400" : "text-neutral-600"}>Current</span>
                    <span className="font-bold ml-2">{state.stats.streakDays} Days</span>
                  </div>
                  <div className="text-[11px] font-mono">
                    <span className={isDark ? "text-neutral-400" : "text-neutral-600"}>Best</span>
                    <span className="font-bold ml-2">{state.stats.longestStreak} Days</span>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-sans mb-1">Completion Rate</span>
                  <span className="text-lg font-extrabold font-mono">{taskDoneRatePercent}%</span>
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <TaskDone className="w-3 h-3 text-emerald-400" />
                    <span className={isDark ? "text-neutral-400" : "text-neutral-600"}>Tasks Finished</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Focus Trend Chart */}
            <div className={`p-3 rounded-xl border ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider font-bold mb-3">FOCUS TREND</div>
              <div className="flex items-end justify-between gap-2 h-24 pt-2 border-b border-current">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                  const minsLogged = state.stats.weeklyMinutes[day] || 0;
                  const maxMins = 120;
                  const heightPercent = minsLogged > 0 ? Math.min(100, Math.max(10, Math.round((minsLogged / maxMins) * 100))) : 4;
                  return (
                    <div
                      key={day}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative cursor-pointer"
                    >
                      <div className={`absolute -top-7 px-2 py-1 rounded text-[9px] font-mono font-bold border pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-lg ${
                        isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                      }`}>
                        {day}: {minsLogged} mins
                      </div>

                      <span className="text-[8px] font-mono opacity-60">{minsLogged}m</span>
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          minsLogged > 0
                            ? isDark ? "bg-white group-hover:bg-neutral-300" : "bg-black group-hover:bg-neutral-700"
                            : isDark ? "bg-neutral-800" : "bg-neutral-200"
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
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-rose-900/50 border border-rose-700 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
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
                      <div className={`text-[11px] font-mono ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                        Most common: <span className="font-bold text-white">{mostCommon?.[0]}</span> ({mostCommonPercent}%)
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
                            isDark ? "bg-neutral-800" : "bg-neutral-200"
                          }`}>
                            <div
                              className="h-full rounded-full bg-fuchsia-500 transition-all duration-500"
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
      </div>
    </div>
  );
}
