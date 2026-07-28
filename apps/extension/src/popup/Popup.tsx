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
  Layers
} from "lucide-react";
import { AppStateData, TodoItem, PriorityType, RecurringType, BackgroundTheme } from "../types";
import { getStoredState, saveStoredState, subscribeToStateChanges } from "../lib/storage";
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
  "📱 Phone",
  "🌐 Social Media",
  "🚪 Bathroom",
  "💬 Meeting",
  "❓ Other"
];

const BACKGROUND_THEMES: { id: BackgroundTheme; name: string }[] = [
  { id: "default", name: "Solid Monochrome" },
  { id: "gradient", name: "Minimal Gradient" },
  { id: "mountain", name: "Geometric Outline" },
  { id: "library", name: "Vertical Stripes" },
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

  // Real-time timer tick update
  useEffect(() => {
    if (!state || !state.isActive) return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev || !prev.isActive) return prev;
        if (prev.timerState === "FLOW") {
          return { ...prev, timeLeft: prev.timeLeft + 1 };
        } else {
          return { ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) };
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state?.isActive, state?.timerState]);

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

  // Timer controls
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

  // Complete session: Flow break = elapsedFlowSeconds / 5 (e.g., 5s flow -> 1s break, 10s flow -> 2s break)
  const completeSession = () => {
    const isWorkOrFlow = state.timerState === "WORK" || state.timerState === "FLOW";
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
      // Flow break = flow_seconds / 5 (Exact math: 5s -> 1s break, 10s -> 2s break)
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
      isActive: false,
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
      isActive: false, // PAUSE TIMER ON DISTRACTION LOG
      distractions: [...state.distractions, entry]
    });
    setShowDistractionPicker(false);
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
  const progressPercent = state.timerState === "FLOW" ? 100 : (totalDuration > 0 ? Math.min(100, Math.max(0, ((totalDuration - state.timeLeft) / totalDuration) * 100)) : 0);

  // Stats Calculations
  const finishedTasksTodayCount = state.todos.filter(t => t.completed).length;
  const pendingTasksCount = state.todos.filter(t => !t.completed).length;
  const taskDoneRatePercent = state.todos.length > 0 ? Math.round((finishedTasksTodayCount / state.todos.length) * 100) : 100;

  // Distraction Analysis Breakdown
  const distractionCounts: { [cat: string]: number } = {};
  state.distractions.forEach(d => {
    const cat = d.category || "Other";
    distractionCounts[cat] = (distractionCounts[cat] || 0) + 1;
  });

  // Vector Background Pattern Class computation (0 bitmap images!)
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
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs font-mono ${
            isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
          }`}>
            F
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider uppercase font-heading">
              FOCUS
            </h1>
          </div>
        </div>

        {/* Action Controls: Theme Mode Toggle + Background Theme Switcher + Info Button */}
        <div className="flex items-center gap-1.5">
          {/* Background Theme Selector Button */}
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              showThemePicker
                ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                : isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-white border-neutral-300 text-black hover:bg-neutral-100"
            }`}
            title="Choose Background Theme"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleThemeMode}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              isDark
                ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
                : "bg-white border-neutral-300 text-black hover:bg-neutral-100"
            }`}
            title={`Switch to ${isDark ? "Light Monochrome" : "Dark Monochrome"} Mode`}
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

      {/* Info Modal Overlay (1 short description) */}
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
              Focus Extension v1.0.0 • Manifest V3
            </div>
          </div>
        </div>
      )}

      {/* Distraction Picker Modal (Selecting pauses timer!) */}
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
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider">TIMER SETTINGS</h2>
            </div>
            <button
              onClick={() => setShowSettingsModal(false)}
              className={`p-1 rounded-lg border ${
                isDark ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800" : "bg-neutral-100 border-neutral-300 text-black hover:bg-neutral-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={saveSettings} className="space-y-4 my-auto">
            <div>
              <label className="text-xs font-mono font-bold block mb-1">Work Duration (Minutes)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={workMinsInput}
                onChange={(e) => setWorkMinsInput(parseInt(e.target.value) || 25)}
                className={`w-full p-2.5 rounded-xl border text-sm font-mono focus:outline-none ${
                  isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-mono font-bold block mb-1">Break Duration (Minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={breakMinsInput}
                onChange={(e) => setBreakMinsInput(parseInt(e.target.value) || 5)}
                className={`w-full p-2.5 rounded-xl border text-sm font-mono focus:outline-none ${
                  isDark ? "bg-neutral-900 border-neutral-800 text-white" : "bg-neutral-100 border-neutral-300 text-black"
                }`}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoBreak"
                checked={autoStartBreakInput}
                onChange={(e) => setAutoStartBreakInput(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="autoBreak" className="text-xs font-mono cursor-pointer">
                Auto-start break when session finishes
              </label>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs border transition-all mt-4 ${
                isDark ? "bg-white text-black border-white hover:bg-neutral-200" : "bg-black text-white border-black hover:bg-neutral-800"
              }`}
            >
              Save Settings
            </button>
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
          { id: "notes", label: "Mood Notes", icon: BookOpen, badge: state.moodNotes.length },
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

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 z-10 relative">
        {/* TIMER TAB */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center justify-between h-full py-1">
            {/* 3-Way Mode Switcher (Work, Break, Flow without emoji) */}
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
                Work ({state.pomodoroSettings.work}m)
              </button>
              <button
                onClick={() => switchTimerModeAndState("POMODORO", "BREAK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  state.timerState === "BREAK"
                    ? isDark ? "bg-white text-black shadow-md" : "bg-black text-white shadow-md"
                    : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
              >
                Break ({state.pomodoroSettings.break}m)
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

            {/* Circular Timer Ring */}
            <div className="relative w-40 h-40 my-2 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className={isDark ? "stroke-neutral-800" : "stroke-neutral-200"}
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className={`transition-all duration-1000 ease-linear ${
                    isDark ? "stroke-white" : "stroke-black"
                  }`}
                  strokeWidth="8"
                  strokeDasharray={427}
                  strokeDashoffset={427 - (427 * progressPercent) / 100}
                  strokeLinecap="square"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black font-mono tracking-tighter">
                  {timeFormatted}
                </span>
                <span className={`text-[9px] font-mono uppercase tracking-widest mt-1 px-2 py-0.5 rounded border ${
                  isDark
                    ? "bg-neutral-900 text-neutral-300 border-neutral-700"
                    : "bg-neutral-100 text-neutral-800 border-neutral-300"
                }`}>
                  {state.isActive
                    ? (state.timerState === "FLOW" ? "STOPWATCH FLOW" : state.timerState === "WORK" ? "WORK IN PROGRESS" : "ON BREAK")
                    : "PAUSED"}
                </span>
              </div>
            </div>

            {/* Goal Input (Pressing Enter creates task) */}
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
                  <span className="font-bold truncate text-[11px] font-mono">🎯 {selectedTask.text}</span>
                  <button onClick={() => updateState({ selectedTodoId: null })} className="text-[10px] opacity-60 hover:opacity-100">
                    Clear
                  </button>
                </div>

                {(selectedTask.subtasks || []).length > 0 && (
                  <div className="space-y-1 max-h-20 overflow-y-auto pt-1 border-t border-current text-[11px]">
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

            {/* Control Buttons Grid (Log Distraction, Reset, Play/Pause, Complete, Settings) */}
            <div className="flex items-center gap-2">
              {/* Log Distraction Button (title: "Log Distraction") */}
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

            {/* Quick Add Task Form (without priority select) */}
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

        {/* MOOD NOTES TAB */}
        {activeTab === "notes" && (
          <div className="flex flex-col gap-3 h-full">
            <form onSubmit={addMoodNote} className={`p-3 rounded-xl border flex flex-col gap-2 ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono flex items-center gap-1.5">
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  LOG MOOD REFLECTION
                </span>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium border focus:outline-none ${
                    isDark ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-neutral-300 text-black"
                  }`}
                >
                  {MOOD_EMOJIS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <textarea
                value={newMoodText}
                onChange={(e) => setNewMoodText(e.target.value)}
                placeholder="How did your session go? Write a reflection..."
                rows={2}
                className={`w-full p-2 rounded-lg text-xs border focus:outline-none ${
                  isDark
                    ? "bg-black border-neutral-800 text-white placeholder-neutral-600 focus:border-white"
                    : "bg-white border-neutral-300 text-black placeholder-neutral-400 focus:border-black"
                }`}
              />
              <button
                type="submit"
                className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  isDark ? "bg-white text-black border-white hover:bg-neutral-200" : "bg-black text-white border-black hover:bg-neutral-800"
                }`}
              >
                Save Reflection
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                Saved Reflections ({state.moodNotes.length})
              </div>

              {state.moodNotes.length === 0 ? (
                <div className={`text-center py-8 text-xs font-mono ${isDark ? "text-neutral-600" : "text-neutral-400"}`}>
                  NO MOOD REFLECTIONS SAVED YET.
                </div>
              ) : (
                state.moodNotes.map((note) => (
                  <div key={note.id} className={`p-3 rounded-xl border flex flex-col gap-1 text-xs transition-all ${
                    isDark ? "bg-neutral-900/60 border-neutral-800 text-neutral-300" : "bg-neutral-50 border-neutral-200 text-neutral-800"
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={`font-bold px-1.5 py-0.5 rounded border ${
                        isDark ? "bg-neutral-800 text-white border-neutral-700" : "bg-neutral-200 text-black border-neutral-300"
                      }`}>
                        {note.mood}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="opacity-60">{note.date}</span>
                        <button
                          onClick={() => deleteMoodNote(note.id)}
                          className={`p-0.5 ${isDark ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-black"}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed mt-1">{note.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
            {/* Top 3 Cards Side-by-Side: Focused Today, Finished Tasks, Pending Tasks */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <Clock className="w-4 h-4 mb-1" />
                <span className="text-sm font-extrabold font-mono">{state.stats.todayMinutes}m</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">Focused Today</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <CheckSquare className="w-4 h-4 mb-1" />
                <span className="text-sm font-extrabold font-mono">{finishedTasksTodayCount}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">Tasks Finished</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <ListTodo className="w-4 h-4 mb-1" />
                <span className="text-sm font-extrabold font-mono">{pendingTasksCount}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">Pending Tasks</span>
              </div>
            </div>

            {/* Streak (Vertical current and best streak) & Task Done Rate Underneath */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <Flame className="w-5 h-5 flex-shrink-0" />
                <div className="flex flex-col text-[11px] font-mono leading-tight">
                  <div>Current: <b>{state.stats.streakDays}d</b></div>
                  <div>Best: <b>{state.stats.longestStreak}d</b></div>
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <div>
                    <div className="text-[9px] uppercase tracking-wider font-mono opacity-60">TASK DONE RATE</div>
                    <div className="text-xs font-bold font-mono">
                      {taskDoneRatePercent}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Focus Trend Chart with Actual Data & Hover Tooltips */}
            <div className={`p-3 rounded-xl border ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider font-bold mb-3">FOCUS TREND (ACTUAL DATA)</div>
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
                      {/* Hover Tooltip showing exact length */}
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
              <div className="text-[10px] font-mono uppercase tracking-wider font-bold mb-2">DISTRACTION ANALYSIS</div>
              {Object.keys(distractionCounts).length === 0 ? (
                <div className="text-xs font-mono opacity-50 py-1">No distractions logged yet.</div>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(distractionCounts).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-xs font-mono">
                      <span>{cat}</span>
                      <span className="font-bold border px-1.5 py-0.5 rounded text-[10px]">{count} times</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
