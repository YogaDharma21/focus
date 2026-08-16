import React, { useEffect, useState, useRef } from "react";
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
  Square,
  CheckSquare2,
  ShieldAlert,
  ShieldCheck,
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
  Volume1,
  BellRing,
  ChevronUp,
  ChevronDown,
  Activity,
  Target,
  CheckCircle2 as TaskDone,
  Calendar,
  ListChecks,
  Smile,
  Sparkles,
  ListFilter,
  FileText,
  Coffee,
  Check,
  TrendingUp,
  Focus,
} from "lucide-react";
import { format } from "date-fns";
import { MoodTracker } from "./components/MoodTracker";
import { BackgroundDisplay } from "./components/BackgroundDisplay";
import { DeepFocusOverlay } from "./components/DeepFocusOverlay";
import { Progress } from "../components/ui/progress";
import { AppStateData, TodoItem, PriorityType, BackgroundTheme } from "../types";
import { getStoredState, saveStoredState, subscribeToStateChanges, getCachedState, DEFAULT_STATE, getWeeklyMinutesFromSessions, getTodayMinutesFromSessions, calculateStreaksFromSessions, DAYS_OF_WEEK } from "../lib/storage";
import "../index.css";

function formatTaskDueDate(dueDate?: string, dueTime?: string): string {
  if (!dueDate) return "";
  try {
    let dateObj: Date;
    if (dueDate.includes("T")) {
      dateObj = new Date(dueDate);
    } else if (dueTime) {
      dateObj = new Date(`${dueDate}T${dueTime}`);
    } else {
      dateObj = new Date(`${dueDate}T00:00:00`);
    }

    if (isNaN(dateObj.getTime())) return dueDate;

    if (dueTime || (dueDate.includes("T") && (dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0))) {
      return format(dateObj, "MMM d, HH:mm");
    }
    return format(dateObj, "MMM d");
  } catch {
    return dueDate;
  }
}

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
  { id: "dark", name: "Dark" },
  { id: "gradient", name: "Gradient" },
  { id: "mountain", name: "Mountain" },
  { id: "library", name: "Library" },
  { id: "cafe", name: "Cafe" },
  { id: "anime-room", name: "Anime Room" }
];

export function Popup() {
  const [state, setState] = useState<AppStateData | null>(getCachedState());
  const [activeTab, setActiveTab] = useState<"timer" | "tasks" | "shield" | "notes" | "stats">("timer");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDistractionPicker, setShowDistractionPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showFloatingTimerCard, setShowFloatingTimerCard] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TodoItem | null>(null);

  // Deep Focus Mode: auto-activate when timer starts
  const prevIsActiveRef = useRef(state?.isActive ?? false);

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
  const [longBreakMinsInput, setLongBreakMinsInput] = useState(15);
  const [autoStartBreakInput, setAutoStartBreakInput] = useState(false);

  // Music Player State & Controls
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);

  const isMusicPlaying = state?.isMusicPlaying ?? false;
  const musicVolume = state?.musicVolume ?? 0.8;
  const soundEffectVolume = state?.soundEffectVolume ?? 0.8;
  const soundEffectEnabled = state?.soundEffectEnabled ?? true;

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

  const toggleSoundEffectEnabled = () => {
    const next = !soundEffectEnabled;
    updateState({ soundEffectEnabled: next });
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "SET_SOUND_EFFECT_ENABLED", enabled: next });
    }
  };

  const playSoundEffect = (overrideVolume?: number) => {
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
    const vol = typeof overrideVolume === "number" ? overrideVolume : soundEffectVolume;
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ target: "background", action: "PLAY_SOUND_EFFECT", volume: vol, force: true });
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
      document.body.className = "dark";
      setWorkMinsInput(initial.pomodoroSettings.work);
      setBreakMinsInput(initial.pomodoroSettings.break);
      setLongBreakMinsInput(initial.pomodoroSettings.longBreak || 15);
      setAutoStartBreakInput(initial.pomodoroSettings.autoStartBreak);
    });

    const unsubscribe = subscribeToStateChanges((updated) => {
      setState(updated);
      document.body.className = "dark";
    });

    return () => unsubscribe();
  }, []);

  // Auto-activate deep focus when timer starts (Pomodoro or Flow), auto-exit when timer stops/finishes
  useEffect(() => {
    if (!state) return;
    const isWorkOrFlow = state.timerState === "WORK" || state.timerState === "FLOW";
    if (state.isActive && !prevIsActiveRef.current && !state.deepFocusMode && isWorkOrFlow) {
      updateState({ deepFocusMode: true });
    } else if (!state.isActive && prevIsActiveRef.current && state.deepFocusMode) {
      updateState({ deepFocusMode: false });
    }
    prevIsActiveRef.current = state.isActive;
  }, [state?.isActive]);

  // No local timer tick — the background service worker is the single source
  // of truth. Timer state updates arrive via subscribeToStateChanges above.

  if (!state) {
    return (
      <div className="w-[420px] h-[580px] bg-black text-white flex items-center justify-center font-mono text-xs">
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
    const isWorkOrFlow = state.timerState === "WORK" || state.timerState === "FLOW";
    if (starting && isWorkOrFlow) {
      updateState({ isActive: true, deepFocusMode: true });
    } else {
      updateState({ isActive: starting, deepFocusMode: false });
    }
  };

  const resetTimer = () => {
    let defaultTime = 0;
    if (state.timerState === "WORK") defaultTime = state.pomodoroSettings.work * 60;
    else if (state.timerState === "BREAK") defaultTime = state.pomodoroSettings.break * 60;
    else if (state.timerState === "FLOW") defaultTime = 0;

    updateState({ isActive: false, deepFocusMode: false, timeLeft: defaultTime });
  };

  const switchTimerModeAndState = (mode: "POMODORO" | "FLOW", timerState: "WORK" | "BREAK" | "FLOW") => {
    let nextTime = 0;
    if (timerState === "WORK") nextTime = state.pomodoroSettings.work * 60;
    else if (timerState === "BREAK") {
      const isLongBreak = (state.pomodoroCount || 0) % 4 === 0 && (state.pomodoroCount || 0) > 0;
      nextTime = isLongBreak ? (state.pomodoroSettings.longBreak || 15) * 60 : state.pomodoroSettings.break * 60;
    }
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

    const newSession = isWorkOrFlow ? {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: durationLogged > 0 ? durationLogged : 1,
      mode: state.timerMode,
      sessionName: state.sessionName || "Focus Session",
      todoId: state.selectedTodoId || undefined
    } : null;

    const newSessionList = newSession ? [newSession, ...state.sessions] : state.sessions;
    const updatedWeekly = getWeeklyMinutesFromSessions(newSessionList);
    const updatedTodayMins = getTodayMinutesFromSessions(newSessionList);
    const streaks = calculateStreaksFromSessions(newSessionList);

    let updatedTodos = state.todos;
    if (state.selectedTodoId && isWorkOrFlow) {
      updatedTodos = state.todos.map(t => {
        if (t.id === state.selectedTodoId) {
          const newCompleted = (t.completedPomodoros || 0) + 1;
          const est = t.estimatedPomodoros || 1;
          const isFinished = newCompleted >= est;
          return {
            ...t,
            completedPomodoros: newCompleted,
            completed: t.completed || isFinished,
            completedAt: (t.completed || isFinished) ? (t.completedAt || new Date().toISOString()) : undefined,
            groupId: (t.completed || isFinished) ? "finished" : t.groupId
          };
        }
        return t;
      });
    }

    const completedTasksCount = updatedTodos.filter(t => t.completed).length;

    let nextState: "WORK" | "BREAK" | "FLOW" = "BREAK";
    let nextTime = 0;
    let prevMode = state.previousMode;
    let nextPomodoroCount = state.pomodoroCount || 0;

    if (isWorkOrFlow) {
      prevMode = state.timerState === "FLOW" ? "FLOW" : "POMODORO";
      nextState = "BREAK";
      if (state.timerState === "FLOW") {
        nextTime = Math.max(1, Math.floor(state.timeLeft / 5));
      } else {
        nextPomodoroCount = (state.pomodoroCount || 0) + 1;
        const isLongBreak = nextPomodoroCount % 4 === 0;
        nextTime = isLongBreak
          ? (state.pomodoroSettings.longBreak || 15) * 60
          : (state.pomodoroSettings.break || 5) * 60;
      }
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
      deepFocusMode: false,
      timerState: nextState,
      previousMode: prevMode,
      timeLeft: nextTime,
      pomodoroCount: nextPomodoroCount,
      todos: updatedTodos,
      sessions: newSessionList,
      stats: {
        ...state.stats,
        todayMinutes: updatedTodayMins,
        weeklyMinutes: updatedWeekly,
        streakDays: streaks.current,
        longestStreak: streaks.best,
        completedTasksCount
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
    const longBrk = Math.max(1, longBreakMinsInput);
    const isLongBreak = (state.pomodoroCount || 0) % 4 === 0 && (state.pomodoroCount || 0) > 0;
    const newTimeLeft = state.timerState === "WORK" ? work * 60 : (isLongBreak ? longBrk * 60 : brk * 60);

    updateState({
      pomodoroSettings: {
        work,
        break: brk,
        longBreak: longBrk,
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
      selectedTodoId: state.selectedTodoId === id ? null : state.selectedTodoId,
      ...(state.selectedTodoId === id ? { sessionName: "" } : {})
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
  const progressValue =
    state.timerState === "FLOW"
      ? 100
      : state.timerState === "WORK"
      ? state.pomodoroSettings.work > 0
        ? Math.min(100, Math.max(0, ((state.pomodoroSettings.work * 60 - state.timeLeft) / (state.pomodoroSettings.work * 60)) * 100))
        : 100
      : state.pomodoroSettings.break > 0
      ? Math.min(100, Math.max(0, ((state.pomodoroSettings.break * 60 - state.timeLeft) / (state.pomodoroSettings.break * 60)) * 100))
      : 100;

  // Stats Calculations
  const finishedTasksTodayCount = state.todos.filter(t => t.completed).length;
  const pendingTasksCount = state.todos.filter(t => !t.completed).length;
  const taskDoneRatePercent = state.todos.length > 0 ? Math.round((finishedTasksTodayCount / state.todos.length) * 100) : 100;
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
      <div className="w-[420px] h-[580px] bg-black text-white relative flex flex-col overflow-hidden select-none font-sans">
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
      "text-white"
    }`}>
      <BackgroundDisplay theme={state.background} />
      {/* Top Header */}
      <header className={`px-4 py-3 flex items-center justify-between z-10 ${
        "bg-neutral-950/80"
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
                ? "bg-white text-black border-white"
                : "bg-neutral-900/90 border-neutral-800 text-white hover:bg-neutral-800"
            } ${state.isActive ? ("border-emerald-500/60 ring-1 ring-emerald-500/40") : ""}`}
            title="Toggle Floating Timer Controls"
          >
            <span className="flex items-center">
              {state.timerState === "WORK" ? <TimerIcon className="w-3 h-3" /> : state.timerState === "BREAK" ? <Coffee className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            </span>
            <span className="font-extrabold font-mono text-[11px] tracking-tight">
              {timeFormatted}
            </span>
            {state.isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        )}

        {/* Action Controls: Deep Focus + Background Switcher (Paintbrush icon) + Info */}
        <div className="flex items-center gap-1.5">
          {/* Deep Focus Mode Toggle Button */}
          <button
            onClick={() => updateState({ deepFocusMode: !state.deepFocusMode })}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              state.deepFocusMode
                ? "bg-white text-black border-white"
                : "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
            }`}
            title="Toggle Deep Focus Mode"
          >
            <Focus className="w-4 h-4" />
          </button>

          {/* Background Theme Selector Button with Paintbrush Icon */}
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              showThemePicker
                ? "bg-white text-black border-white"
                : "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
            }`}
            title="Change Background Theme"
          >
            <Paintbrush className="w-4 h-4" />
          </button>

          {/* Info Button */}
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              showInfoModal
                ? "bg-white text-black border-white"
                : "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
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
          "bg-neutral-900/95 border-neutral-800 text-white shadow-black/80"
        }`}>
          {/* Header Row: Emoji + Mode Name & Live Timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center">
                {state.timerState === "WORK" ? <TimerIcon className="w-4 h-4" /> : state.timerState === "BREAK" ? <Coffee className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
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
            "bg-neutral-950/80 border-neutral-800"
          }`}>
            <button
              onClick={() => switchTimerModeAndState("POMODORO", "WORK")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                state.timerState === "WORK"
                  ? "bg-white text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <TimerIcon className="w-3 h-3" />
              <span>Pomodoro</span>
            </button>
            <button
              onClick={() => switchTimerModeAndState("POMODORO", "BREAK")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                state.timerState === "BREAK"
                  ? "bg-white text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Coffee className="w-3 h-3" />
              <span>Break</span>
            </button>
            <button
              onClick={() => switchTimerModeAndState("FLOW", "FLOW")}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                state.timerState === "FLOW"
                  ? "bg-white text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Flow</span>
            </button>
          </div>


          {/* Tag & Group Badge Row */}
          <div className="flex items-center justify-between mb-3 px-0.5">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans border ${
              "bg-neutral-800/80 border-neutral-700 text-neutral-200"
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
              disabled={!state.isActive}
              onClick={() => {
                if (!state.isActive) return;
                completeSession();
                setShowFloatingTimerCard(false);
              }}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                !state.isActive
                  ? "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                  : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white"
              }`}
              title={state.isActive ? "Complete Session" : "Start timer to complete session"}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete</span>
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
                  ? "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                  : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300"
              }`}
              title={state.isActive ? "Log Distraction" : "Start timer to log distraction"}
            >
              <AlertTriangle className="w-4 h-4" />
            </button>

            {/* Start / Pause Button */}
            <button
              onClick={toggleTimer}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow ${
                "bg-white text-black border-white hover:bg-neutral-200"
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
          "bg-neutral-950/90 border-neutral-700 text-white"
        } backdrop-blur-md`}>
          <div className="text-[10px] font-bold uppercase opacity-60 px-2 py-1">SELECT BACKGROUND THEME</div>
          {BACKGROUND_THEMES.map((theme) => {
            const isSelected = state.background === theme.id || (theme.id === "dark" && state.background === "default");
            return (
              <button
                key={theme.id}
                onClick={() => {
                  updateState({ background: theme.id });
                  setShowThemePicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-left font-bold transition-all flex items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-white text-black"
                    : "hover:bg-neutral-800"
                }`}
              >
                <span>{theme.name}</span>
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Info Modal Overlay (Removed Manifest V3 text) */}
      {showInfoModal && (
        <div className={`absolute inset-0 z-50 p-5 flex flex-col justify-between backdrop-blur-md animate-in fade-in duration-200 ${
          "bg-black/95 text-white"
        }`}>
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider">ABOUT FOCUS EXTENSION</h2>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className={`p-1 rounded-lg border ${
                "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className={`my-auto text-xs leading-relaxed p-4 rounded-xl border text-center font-medium opacity-90 ${"border-neutral-800"}`}>
            Focus is a minimalist, monochrome extension designed for distraction-free deep work, pomodoro tracking, and site blocking.
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={openGithubLink}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                "bg-white text-black border-white hover:bg-neutral-200"
              }`}
            >
              <Github className="w-4 h-4" />
              <span>View Source on GitHub Pages</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="text-[10px] font-mono text-center opacity-50">
              Focus Extension v0.0.1
            </div>
          </div>
        </div>
      )}

      {/* Distraction Picker Modal */}
      {showDistractionPicker && (
        <div className={`absolute inset-0 z-50 p-5 flex flex-col justify-between backdrop-blur-md animate-in fade-in duration-200 ${
          "bg-black/95 text-white"
        }`}>
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider">LOG DISTRACTION</h2>
            </div>
            <button
              onClick={() => setShowDistractionPicker(false)}
              className={`p-1 rounded-lg border ${
                "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
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
                  "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white"
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
          "bg-black/95 text-white"
        }`}>
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-sm font-bold font-sans">Timer Settings</h2>
            <button
              onClick={() => setShowSettingsModal(false)}
              className={`p-1 rounded-lg border ${
                "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={saveSettings} className="space-y-3 my-auto">
            {/* Work Duration */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              "bg-neutral-900 border-neutral-800"
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
                    "bg-neutral-800 border-neutral-700 text-white [color-scheme:dark]"
                  }`}
                />
                <span className={`text-[10px] font-mono ${"text-neutral-500"}`}>min</span>
              </div>
            </div>

            {/* Short Break Duration */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              "bg-neutral-900 border-neutral-800"
            }`}>
              <span className="text-xs font-bold font-sans">Short Break Duration</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={breakMinsInput}
                  onChange={(e) => setBreakMinsInput(parseInt(e.target.value) || 5)}
                  className={`w-14 px-2 py-1.5 rounded-lg border text-xs font-mono text-center focus:outline-none ${
                    "bg-neutral-800 border-neutral-700 text-white [color-scheme:dark]"
                  }`}
                />
                <span className={`text-[10px] font-mono ${"text-neutral-500"}`}>min</span>
              </div>
            </div>

            {/* Long Break Duration */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              "bg-neutral-900 border-neutral-800"
            }`}>
              <span className="text-xs font-bold font-sans">Long Break Duration</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreakMinsInput}
                  onChange={(e) => setLongBreakMinsInput(parseInt(e.target.value) || 15)}
                  className={`w-14 px-2 py-1.5 rounded-lg border text-xs font-mono text-center focus:outline-none ${
                    "bg-neutral-800 border-neutral-700 text-white [color-scheme:dark]"
                  }`}
                />
                <span className={`text-[10px] font-mono ${"text-neutral-500"}`}>min</span>
              </div>
            </div>

            {/* Auto-start Break Toggle */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              "bg-neutral-900 border-neutral-800"
            }`}>
              <div className="flex flex-col">
                <span className="text-xs font-bold font-sans">Auto-start Break</span>
                <span className={`text-[10px] font-mono ${"text-neutral-500"}`}>
                  Launch break timer immediately after work or flow
                </span>
              </div>
              <div
                onClick={() => setAutoStartBreakInput(!autoStartBreakInput)}
                className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors flex items-center ${
                  autoStartBreakInput
                    ? "bg-white"
                    : "bg-neutral-700"
                }`}
              >
                <div
                  className={`absolute w-5 h-5 rounded-full transition-all duration-200 ${
                    autoStartBreakInput
                      ? "left-[22px] bg-black"
                      : "left-[2px] bg-neutral-400"
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs border transition-all mt-4 ${
                "bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700"
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
          "bg-[#0b0b0b] text-white"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-[11px] font-bold font-mono uppercase tracking-wider text-neutral-400">TASK DETAILS</h2>
            <button
              onClick={() => setSelectedTaskDetail(null)}
              className={`p-1 rounded-lg transition-colors ${
                "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 my-2 text-xs overflow-y-auto pr-1 flex-1">
            {/* Task Title */}
            <div>
              <input
                type="text"
                value={selectedTaskDetail.text}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, text: val } : t);
                  updateState({ todos: updated });
                  setSelectedTaskDetail({ ...selectedTaskDetail, text: val });
                }}
                className={`w-full bg-transparent text-xl font-extrabold focus:outline-none focus:border-b pb-0.5 ${
                  "text-white focus:border-neutral-700"
                }`}
              />
            </div>

            {/* Priority & Group Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Priority */}
              <div className={`p-3 rounded-2xl border ${
                "bg-neutral-900/60 border-neutral-800/80"
              }`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">PRIORITY</span>
                </div>
                <select
                  value={selectedTaskDetail.priority || "medium"}
                  onChange={(e) => {
                    const val = e.target.value as PriorityType;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, priority: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, priority: val });
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer ${
                    "bg-neutral-800/80 border-neutral-700/50 text-white"
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Group */}
              <div className={`p-3 rounded-2xl border ${
                "bg-neutral-900/60 border-neutral-800/80"
              }`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <ListFilter className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">GROUP</span>
                </div>
                <select
                  value={selectedTaskDetail.groupId || "current"}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, groupId: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, groupId: val });
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer ${
                    "bg-neutral-800/80 border-neutral-700/50 text-white"
                  }`}
                >
                  {state.groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Focus Sessions Card */}
            <div className={`p-3.5 rounded-2xl border ${
              "bg-neutral-900/60 border-neutral-800/80"
            }`}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">FOCUS SESSIONS</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 font-medium block mb-1">Estimated</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedTaskDetail.estimatedPomodoros || 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const updated = state.todos.map(t => {
                        if (t.id === selectedTaskDetail.id) {
                          const comp = t.completedPomodoros || 0;
                          const isFinished = comp >= val;
                          return {
                            ...t,
                            estimatedPomodoros: val,
                            completed: t.completed || isFinished,
                            completedAt: (t.completed || isFinished) ? (t.completedAt || new Date().toISOString()) : undefined,
                            groupId: (t.completed || isFinished) ? "finished" : t.groupId
                          };
                        }
                        return t;
                      });
                      const completedCount = updated.filter(t => t.completed).length;
                      updateState({ todos: updated, stats: { ...state.stats, completedTasksCount: completedCount } });
                      const nextSelected = updated.find(t => t.id === selectedTaskDetail.id);
                      if (nextSelected) setSelectedTaskDetail(nextSelected);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-sm font-bold focus:outline-none ${
                      "bg-neutral-800/80 border-neutral-700/50 text-white [color-scheme:dark]"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-medium block mb-1">Completed</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedTaskDetail.completedPomodoros || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const updated = state.todos.map(t => {
                        if (t.id === selectedTaskDetail.id) {
                          const est = t.estimatedPomodoros || 1;
                          const isFinished = val >= est;
                          return {
                            ...t,
                            completedPomodoros: val,
                            completed: t.completed || isFinished,
                            completedAt: (t.completed || isFinished) ? (t.completedAt || new Date().toISOString()) : undefined,
                            groupId: (t.completed || isFinished) ? "finished" : t.groupId
                          };
                        }
                        return t;
                      });
                      const completedCount = updated.filter(t => t.completed).length;
                      updateState({ todos: updated, stats: { ...state.stats, completedTasksCount: completedCount } });
                      const nextSelected = updated.find(t => t.id === selectedTaskDetail.id);
                      if (nextSelected) setSelectedTaskDetail(nextSelected);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-sm font-bold focus:outline-none ${
                      "bg-neutral-800/80 border-neutral-700/50 text-white [color-scheme:dark]"
                    }`}
                  />
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              {(() => {
                const est = selectedTaskDetail.estimatedPomodoros || 1;
                const comp = selectedTaskDetail.completedPomodoros || 0;
                const pct = Math.min(100, Math.round((comp / Math.max(1, est)) * 100));
                return (
                  <div className="mt-3">
                    <div className={`w-full h-2 rounded-full overflow-hidden ${"bg-neutral-800"}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${"bg-white"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono font-medium text-neutral-400 text-right mt-1">
                      {pct}% Completed
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Deadline Card */}
            <div className={`p-3.5 rounded-2xl border ${
              "bg-neutral-900/60 border-neutral-800/80"
            }`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">DEADLINE</span>
                </div>
                {(selectedTaskDetail.dueDate || selectedTaskDetail.dueTime) && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, dueDate: '', dueTime: '' } : t);
                      updateState({ todos: updated });
                      setSelectedTaskDetail({ ...selectedTaskDetail, dueDate: '', dueTime: '' });
                    }}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={selectedTaskDetail.dueDate || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, dueDate: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, dueDate: val });
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                    "bg-neutral-800/80 border-neutral-700/50 text-white [color-scheme:dark]"
                  }`}
                />
                <input
                  type="time"
                  value={selectedTaskDetail.dueTime || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, dueTime: val } : t);
                    updateState({ todos: updated });
                    setSelectedTaskDetail({ ...selectedTaskDetail, dueTime: val });
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                    "bg-neutral-800/80 border-neutral-700/50 text-white [color-scheme:dark]"
                  }`}
                />
              </div>
            </div>

            {/* Notes Card */}
            <div className={`p-3.5 rounded-2xl border ${
              "bg-neutral-900/60 border-neutral-800/80"
            }`}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">NOTES</span>
              </div>
              <textarea
                rows={3}
                value={selectedTaskDetail.notes || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = state.todos.map(t => t.id === selectedTaskDetail.id ? { ...t, notes: val } : t);
                  updateState({ todos: updated });
                  setSelectedTaskDetail({ ...selectedTaskDetail, notes: val });
                }}
                placeholder="Add notes or details for this task..."
                className={`w-full p-3 rounded-xl border text-xs focus:outline-none resize-none min-h-[75px] ${
                  "bg-neutral-800/80 border-neutral-700/50 text-white placeholder-neutral-500"
                }`}
              />
            </div>

            {/* Subtasks Card */}
            <div className={`p-3.5 rounded-2xl border ${
              "bg-neutral-900/60 border-neutral-800/80"
            }`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-neutral-400">SUBTASKS</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  "bg-neutral-800/80 border-neutral-700/50 text-neutral-400"
                }`}>
                  {(selectedTaskDetail.subtasks || []).filter(s => s.completed).length}/{(selectedTaskDetail.subtasks || []).length}
                </span>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (newSubtaskText.trim()) { addSubtask(selectedTaskDetail.id, newSubtaskText); setNewSubtaskText(""); } }} className="mb-2">
                <input
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  placeholder="Add a subtask..."
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    "bg-neutral-800/80 border-neutral-700/50 text-white placeholder-neutral-500"
                  }`}
                />
              </form>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {(selectedTaskDetail.subtasks || []).map(sub => (
                  <div key={sub.id} className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                    "bg-neutral-800/40 border-neutral-700/40"
                  }`}>
                    <div className="flex items-center gap-2 flex-1">
                      <button type="button" onClick={() => toggleSubtask(selectedTaskDetail.id, sub.id)}>
                        {sub.completed ? <CheckSquare2 className="w-3.5 h-3.5 text-white" /> : <Square className="w-3.5 h-3.5 text-neutral-500" />}
                      </button>
                      <span className={sub.completed ? "line-through text-neutral-500" : ("text-white")}>{sub.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action Bar: Focus on this task button & Delete Task */}
          <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-neutral-800/60">
            <button
              onClick={() => focusOnTask(selectedTaskDetail)}
              className={`py-2 px-3 rounded-xl font-extrabold text-xs border flex items-center justify-center gap-2 transition-all ${
                "bg-white text-black border-white hover:bg-neutral-200"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>FOCUS ON THIS TASK</span>
            </button>

            <button
              onClick={() => deleteTodo(selectedTaskDetail.id)}
              className="text-red-400 hover:text-red-300 font-medium text-xs flex items-center gap-1.5 transition-colors py-1.5 px-2.5 rounded-xl hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Task</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className={`flex items-center justify-between px-3 py-1.5 z-10 ${
        "bg-neutral-900/60"
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
                  ? "bg-white text-black font-extrabold shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <div className="relative">
                <Icon className="w-3.5 h-3.5" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2 text-[9px] font-mono font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    "bg-neutral-800 text-white border border-neutral-600"
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {tab.activeIndicator && (
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping ${
                    "bg-white"
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
          "bg-neutral-900/90 border-neutral-800 text-white"
        }`}>
          <div
            onClick={() => setIsMusicExpanded(!isMusicExpanded)}
            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
          >
            <Music className="w-4 h-4 text-current shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">Lofi-Beats</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleMusicPlay}
              className={`w-7 h-7 rounded-lg flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-all ${
                "bg-white text-black"
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
            "bg-neutral-900 border-neutral-800 text-white"
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

            <div
              onClick={toggleMusicPlay}
              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                isMusicPlaying
                  ? ("bg-neutral-800 border-neutral-700")
                  : ("bg-neutral-950/50 border-neutral-800/50")
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music className={`w-4 h-4 ${isMusicPlaying ? "text-primary animate-pulse" : "opacity-50"}`} />
                <div>
                  <div className="text-xs font-bold">Lofi-Beats</div>
                </div>
              </div>

              {isMusicPlaying && (
                <div className="flex items-end gap-0.5 h-3">
                  <span className={`w-0.5 h-3 rounded-full animate-pulse ${"bg-white"}`} />
                  <span className={`w-0.5 h-2 rounded-full animate-pulse delay-75 ${"bg-white"}`} />
                  <span className={`w-0.5 h-3.5 rounded-full animate-pulse delay-150 ${"bg-white"}`} />
                </div>
              )}
            </div>

            {/* Music Volume Slider */}
            <div className="mt-2 pt-2 border-t border-neutral-800 space-y-1">
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
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 rounded bg-neutral-700 accent-current cursor-pointer"
                />
              </div>
            </div>

            {/* Sound Effect (SFX) Volume Slider & Test */}
            <div className="mt-2 pt-2 border-t border-neutral-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] opacity-60">
                <span className="flex items-center gap-1">
                  <BellRing className="w-3 h-3" />
                  Sound Effect (SFX)
                </span>
                <span className="font-mono">{Math.round(soundEffectVolume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSoundEffectEnabled}
                  title={soundEffectEnabled ? "SFX Enabled" : "SFX Muted"}
                  className={`p-1 rounded text-xs transition-colors shrink-0 ${
                    soundEffectEnabled ? "bg-neutral-800 text-white border border-neutral-700" : "bg-neutral-950 text-neutral-500 border border-neutral-850"
                  }`}
                >
                  <BellRing className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundEffectVolume}
                  onChange={(e) => handleSoundEffectVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 rounded bg-neutral-700 accent-current cursor-pointer"
                />
                <button
                  onClick={() => playTestSoundEffect()}
                  title="Test Sound Effect"
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded text-[10px] font-semibold transition-all shrink-0 active:scale-95 flex items-center gap-1"
                >
                  <Volume1 className="w-3 h-3 text-neutral-300" />
                  Test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 z-10 relative">
        {/* TIMER TAB */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center justify-between min-h-full pb-1 pt-1 gap-2">
            {/* 3-Way Mode Switcher (Pomodoro, Break, Flow - No Minutes in Toggle Labels!) */}
            <div className={`flex items-center p-1 rounded-lg border w-full max-w-[320px] ${
              "bg-neutral-900 border-neutral-800"
            }`}>
              <button
                onClick={() => switchTimerModeAndState("POMODORO", "WORK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  state.timerState === "WORK"
                    ? "bg-white text-black shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <TimerIcon className="w-3.5 h-3.5" />
                <span>Pomodoro</span>
              </button>
              <button
                onClick={() => switchTimerModeAndState("POMODORO", "BREAK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  state.timerState === "BREAK"
                    ? "bg-white text-black shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Break</span>
              </button>
              <button
                onClick={() => switchTimerModeAndState("FLOW", "FLOW")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  state.timerState === "FLOW"
                    ? "bg-white text-black shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Flow</span>
              </button>
            </div>

            {/* Pomodoro Cycle & Progress Indicator */}
            {state.timerMode === "POMODORO" && (
              <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 shadow-sm mt-1 mb-0.5">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((index) => {
                    const currentCycleStep = (state.pomodoroCount || 0) % 4;
                    const isCompleted = index < currentCycleStep;
                    const isCurrent = index === currentCycleStep && state.timerState === "WORK";
                    return (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          isCompleted
                            ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                            : isCurrent
                            ? "bg-white/80 ring-2 ring-white/30 animate-pulse"
                            : "bg-neutral-700"
                        }`}
                        title={`Pomodoro ${index + 1} of 4`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] font-bold text-neutral-300">
                  {state.timerState === "BREAK"
                    ? ((state.pomodoroCount || 0) % 4 === 0 && (state.pomodoroCount || 0) > 0
                        ? `Long Break (${state.pomodoroSettings.longBreak || 15}m)`
                        : `Short Break (${state.pomodoroSettings.break || 5}m)`)
                    : `Pomodoro ${((state.pomodoroCount || 0) % 4) + 1} of 4`}
                </span>
              </div>
            )}

            {/* Timer Display - Big Number */}
            <div className="flex flex-col items-center justify-center my-2 py-3">
              <span className="text-7xl font-black font-mono tracking-tighter leading-none">
                {timeFormatted}
              </span>
            </div>

            {/* Focus Session Goal / Task Selector */}
            <div className="w-full max-w-[280px] mb-2 relative">
              {/* Task Selector Dropdown Menu (Pops UPWARDS so Timer Controls below remain visible!) */}
              {showTaskDropdown && (
                <div className={`absolute bottom-full left-0 right-0 mb-1.5 z-50 p-2 rounded-lg border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 ${
                  "bg-neutral-900/95 border-neutral-800 text-white"
                }`}>
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] font-mono font-bold uppercase opacity-60">FOCUS TOPIC</span>
                    <button
                      type="button"
                      onClick={() => setShowTaskDropdown(false)}
                      className="text-[10px] font-mono opacity-50 hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Custom Focus Option */}
                  <button
                    type="button"
                    onClick={() => {
                      updateState({ selectedTodoId: null, sessionName: "" });
                      setShowTaskDropdown(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-all ${
                      !selectedTask
                        ? "bg-white/10 text-white font-bold"
                        : "hover:bg-neutral-800/80 text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 className={`w-3.5 h-3.5 shrink-0 ${"text-white"}`} />
                      <div className="flex flex-col">
                        <span className="leading-tight">Custom Focus</span>
                        <span className={`text-[10px] font-mono ${"text-neutral-400"}`}>
                          Type custom goal
                        </span>
                      </div>
                    </div>
                    {!selectedTask && <Check className="w-3.5 h-3.5" />}
                  </button>


                  {/* Task List Header */}
                  <div className="px-2 pt-1 text-[10px] font-mono font-bold uppercase opacity-50">
                    MY TASKS
                  </div>

                  {/* Tasks List */}
                  <div className="max-h-36 overflow-y-auto space-y-0.5">
                    {state.todos.filter(t => !t.completed).length === 0 ? (
                      <div className="px-3 py-2 text-[11px] font-mono opacity-50 italic text-center">
                        No pending tasks
                      </div>
                    ) : (
                      state.todos.filter(t => !t.completed).map((task) => {
                        const hasDueDate = Boolean(task.dueDate);
                        const hasPomodoros = Boolean((task.estimatedPomodoros && task.estimatedPomodoros > 0) || (task.completedPomodoros && task.completedPomodoros > 0));
                        const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);
                        const hasMetadata = hasDueDate || hasPomodoros || hasSubtasks;

                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => {
                              updateState({ selectedTodoId: task.id, sessionName: task.text });
                              setShowTaskDropdown(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-all ${
                              selectedTask?.id === task.id
                                ? "bg-white/10 text-white font-bold"
                                : "hover:bg-neutral-800/80 text-neutral-300"
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1 pr-2">
                              <ListTodo className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${"text-white"}`} />
                              <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                <span className="truncate">{task.text}</span>
                                {hasMetadata && (
                                  <div className="flex items-center gap-2.5 text-[10px] font-mono text-neutral-400 flex-wrap">
                                    {hasDueDate && (
                                      <div className="flex items-center gap-1 text-orange-500 font-medium">
                                        <Calendar className="w-3 h-3" />
                                        <span>{formatTaskDueDate(task.dueDate, task.dueTime)}</span>
                                      </div>
                                    )}
                                    {hasPomodoros && (
                                      <div className="flex items-center gap-1 text-neutral-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{task.completedPomodoros || 0}/{task.estimatedPomodoros || 1}</span>
                                      </div>
                                    )}
                                    {hasSubtasks && (
                                      <div className="flex items-center gap-1 text-neutral-400">
                                        <ListChecks className="w-3 h-3" />
                                        <span>{task.subtasks!.filter(s => s.completed).length}/{task.subtasks!.length}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {selectedTask?.id === task.id && (
                              <Check className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {selectedTask ? (
                /* Task Selected (Locked Typing Mode - Matches Reference Image) */
                <button
                  type="button"
                  onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                  className={`w-full px-4 py-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 shadow-sm ${
                    "bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-white"
                  }`}
                  title="Click to select another task or custom focus"
                >
                  <div className="flex items-center justify-center gap-2 max-w-full">
                    <ListTodo className={`w-4 h-4 shrink-0 ${"text-white"}`} />
                    <span className="font-semibold text-sm tracking-tight truncate max-w-[200px]">
                      {selectedTask.text}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${"text-white"}`} />
                </button>
              ) : (
                /* Custom Focus Mode (Editable Input Mode) */
                <div className="w-full flex items-center rounded-lg border bg-neutral-900 border-neutral-800 focus-within:border-white px-2 py-1 transition-colors">
                  <input
                    type="text"
                    value={state.sessionName}
                    onChange={(e) => updateState({ sessionName: e.target.value })}
                    onKeyDown={handleGoalKeyDown}
                    placeholder="Session Goal (Press Enter)..."
                    className="flex-1 min-w-0 bg-transparent text-xs text-center font-medium text-white placeholder-neutral-500 focus:outline-none pl-6 pr-1 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                    className="shrink-0 p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Select from your tasks"
                  >
                    <ListTodo className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Subtasks Section for Selected Task */}
            {selectedTask && (selectedTask.subtasks || []).length > 0 && (
              <div className={`w-full max-w-[280px] p-2.5 mb-2 rounded-lg border flex flex-col gap-1.5 ${
                "bg-neutral-900/90 border-neutral-800"
              }`}>
                <div className="flex items-center justify-between text-[11px] font-mono font-bold opacity-70">
                  <span>SUBTASKS</span>
                  <span>
                    {(selectedTask.subtasks || []).filter(s => s.completed).length} / {(selectedTask.subtasks || []).length}
                  </span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pt-1 text-[11px]">
                  {selectedTask.subtasks!.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5">
                      <button onClick={() => toggleSubtask(selectedTask.id, s.id)}>
                        {s.completed ? <CheckSquare2 className="w-3 h-3 text-white" /> : <Square className="w-3 h-3 opacity-60" />}
                      </button>
                      <span className={s.completed ? "line-through opacity-50" : ""}>{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Task Notes Section for Selected Task */}
            {selectedTask && selectedTask.notes && selectedTask.notes.trim().length > 0 && (
              <div className={`w-full max-w-[280px] p-2.5 mb-2 rounded-lg border flex flex-col gap-1 ${
                "bg-neutral-900/90 border-neutral-800"
              }`}>
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold opacity-70">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span>TASK NOTES</span>
                </div>
                <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {selectedTask.notes}
                </p>
              </div>
            )}

            {/* Control Buttons Grid */}
            <div className="flex items-center gap-2">
              {/* Reset Timer */}
              <button
                onClick={resetTimer}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
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
                    ? "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                    : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                }`}
                title={state.isActive ? "Log Distraction" : "Start timer to log distraction"}
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                onClick={toggleTimer}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all shadow-lg active:scale-95 ${
                  "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                {state.isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              {/* Complete Session Button */}
              <button
                disabled={!state.isActive}
                onClick={() => {
                  if (!state.isActive) return;
                  completeSession();
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  !state.isActive
                    ? "bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed opacity-50"
                    : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                }`}
                title={state.isActive ? "Complete Session" : "Start timer to complete session"}
              >
                <CheckCircle className="w-4 h-4" />
              </button>

              {/* Timer Settings Button */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
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
                        ? "bg-white text-black"
                        : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddGroupInput(!showAddGroupInput)}
                className={`p-1 rounded-lg border text-xs font-mono font-bold flex-shrink-0 ${
                  "bg-neutral-900 border-neutral-800 text-white"
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
                    "bg-neutral-900 border-neutral-800 text-white"
                  }`}
                />
                <button type="submit" className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                  "bg-white text-black border-white"
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
                  "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white"
                }`}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-xl font-bold transition-all text-xs ${
                  "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                Add
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {state.todos.filter(t => (t.groupId || "current") === activeGroupId).length === 0 ? (
                <div className={`text-center py-12 text-xs font-mono ${"text-neutral-600"}`}>
                  NO TASKS IN THIS GROUP. ADD ONE ABOVE.
                </div>
              ) : (
                state.todos
                  .filter(t => (t.groupId || "current") === activeGroupId)
                  .map((todo) => {
                    const hasDueDate = Boolean(todo.dueDate);
                    const hasPomodoros = Boolean((todo.estimatedPomodoros && todo.estimatedPomodoros > 0) || (todo.completedPomodoros && todo.completedPomodoros > 0));
                    const hasSubtasks = Boolean(todo.subtasks && todo.subtasks.length > 0);
                    const hasMetadata = hasDueDate || hasPomodoros || hasSubtasks;

                    const isSelected = state.selectedTodoId === todo.id || selectedTaskDetail?.id === todo.id;
                    return (
                      <div
                        key={todo.id}
                        onClick={() => updateState({ selectedTodoId: todo.id, sessionName: todo.text })}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-neutral-800 border-neutral-700 text-white font-medium"
                            : todo.completed
                            ? "bg-neutral-950/40 border-neutral-900 opacity-50 text-neutral-500"
                            : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-200"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <button onClick={(e) => { e.stopPropagation(); toggleTodo(todo.id); }} className="flex-shrink-0 mt-0.5">
                            {todo.completed ? (
                              <CheckSquare2 className="w-4 h-4 text-white shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-500 hover:text-neutral-400 shrink-0" />
                            )}
                          </button>
                          
                          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                            <span
                              onClick={() => setSelectedTaskDetail(todo)}
                              className={`text-xs font-bold truncate cursor-pointer hover:underline ${
                                todo.completed ? "line-through opacity-70" : "text-white"
                              }`}
                            >
                              {todo.text}
                            </span>

                            {hasMetadata && (
                              <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-400 flex-wrap">
                                {hasDueDate && (
                                  <div className="flex items-center gap-1 text-orange-500 font-medium">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatTaskDueDate(todo.dueDate, todo.dueTime)}</span>
                                  </div>
                                )}
                                {hasPomodoros && (
                                  <div className="flex items-center gap-1 text-neutral-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{todo.completedPomodoros || 0}/{todo.estimatedPomodoros || 1}</span>
                                  </div>
                                )}
                                {hasSubtasks && (
                                  <div className="flex items-center gap-1 text-neutral-400">
                                    <ListChecks className="w-3 h-3" />
                                    <span>{todo.subtasks!.filter(s => s.completed).length}/{todo.subtasks!.length}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              focusOnTask(todo);
                            }}
                            className="p-1 text-neutral-400 hover:text-white transition-colors rounded-md hover:bg-neutral-800"
                            title="Focus on this task"
                          >
                            <Target className="w-3.5 h-3.5" />
                          </button>

                          <button onClick={() => setSelectedTaskDetail(todo)} className={`p-1 ${"text-neutral-500 hover:text-white"}`}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* SHIELD TAB */}
        {activeTab === "shield" && (
          <div className="flex flex-col gap-3 h-full">
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              state.shield.enabled
                ? "bg-neutral-900 border-neutral-800 text-white"
                : "bg-neutral-950 border-neutral-800 text-neutral-500"
            }`}>
              <div className="flex items-center gap-2.5">
                {state.shield.enabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                <div>
                  <h3 className="text-xs font-bold font-mono">SITE BLOCKER SHIELD</h3>
                  <p className="text-[10px] opacity-70">
                    {state.shield.enabled
                      ? (state.isActive && (state.timerState === "WORK" || state.timerState === "FLOW")
                          ? "Active during Work & Flow sessions"
                          : "Paused (Active during Work & Flow sessions)")
                      : "Shield currently OFF"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => updateState({ shield: { ...state.shield, enabled: !state.shield.enabled } })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  state.shield.enabled
                    ? "bg-white text-black border-white"
                    : "bg-neutral-800 text-neutral-300 border-neutral-700"
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
                  "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white"
                }`}
              />
              <button
                type="submit"
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  "bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                }`}
              >
                Block
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${"text-neutral-500"}`}>
                Blacklisted Domains ({state.shield.blockedSites.length})
              </div>
              {state.shield.blockedSites.map((site) => (
                <div
                  key={site}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    "bg-neutral-900/60 border-neutral-800 text-neutral-300"
                  }`}
                >
                  <span className="text-[11px]">{site}</span>
                  <button onClick={() => removeBlockedSite(site)} className={`p-1 ${"text-neutral-500 hover:text-white"}`}>
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
                  "bg-neutral-900 border-neutral-800"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border flex items-center justify-center ${
                        "bg-neutral-800 border-neutral-700 text-white"
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

            {/* Top 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
                "bg-neutral-900 border-neutral-800"
              }`}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-1.5 ${
                  "bg-neutral-800 border-neutral-700 text-white"
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold font-mono">{dynamicTodayMinutes}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">MINUTES TODAY</span>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
                "bg-neutral-900 border-neutral-800"
              }`}>
                <div className="w-8 h-8 rounded-lg border flex items-center justify-center mb-1.5 bg-neutral-800 border-neutral-700 text-white">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold font-mono">{finishedTasksTodayCount}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">TASKS TODAY</span>
              </div>

              <div className={`p-3 rounded-xl border flex flex-col items-center text-center ${
                "bg-neutral-900 border-neutral-800"
              }`}>
                <div className="w-8 h-8 rounded-lg border flex items-center justify-center mb-1.5 bg-neutral-800 border-neutral-700 text-white">
                  <ListTodo className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold font-mono">{pendingTasksCount}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">PENDING TASKS</span>
              </div>
            </div>

            {/* Longest Streak & Completion Rate */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                "bg-neutral-900 border-neutral-800"
              }`}>
                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-sans mb-1">Longest Streak</span>
                  <div className="text-[11px] font-mono">
                    <span className={"text-neutral-400"}>Current</span>
                    <span className="font-bold ml-2">{dynamicStreaks.current} Days</span>
                  </div>
                  <div className="text-[11px] font-mono">
                    <span className={"text-neutral-400"}>Best</span>
                    <span className="font-bold ml-2">{dynamicStreaks.best} Days</span>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                "bg-neutral-900 border-neutral-800"
              }`}>
                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-sans mb-1">Completion Rate</span>
                  <span className="text-lg font-extrabold font-mono">{taskDoneRatePercent}%</span>
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <TaskDone className="w-3 h-3 text-neutral-400" />
                    <span className={"text-neutral-400"}>Tasks Finished</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Focus Trend Chart */}
            <div className={`p-3 rounded-xl border ${
              "bg-neutral-900 border-neutral-800"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
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
                        "bg-white text-black border-white"
                      }`}>
                        {day}: {minsLogged} mins
                      </div>

                      <span className="text-[8px] font-mono opacity-60">{minsLogged}m</span>
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          minsLogged > 0
                            ? "bg-white group-hover:bg-neutral-300"
                            : "bg-neutral-800"
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
              "bg-neutral-900 border-neutral-800"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-white" />
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
                      <div className={`text-[11px] font-mono ${"text-neutral-400"}`}>
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
                            "bg-neutral-800"
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
      </div>
    </div>
  );
}
