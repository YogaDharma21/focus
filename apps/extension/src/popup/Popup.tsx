import React, { useEffect, useState } from "react";
import {
  Timer,
  CheckSquare,
  Shield,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
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
  Smile,
  Wifi,
  WifiOff,
  X,
  Zap,
  Sparkles
} from "lucide-react";
import { AppStateData, MoodEntry, MoodType, TodoItem } from "../types";
import { getStoredState, saveStoredState, subscribeToStateChanges } from "../lib/storage";
import { checkOnlineStatus, subscribeOnlineStatus } from "../lib/convex";
import "../index.css";

const MOOD_OPTIONS: { type: MoodType; label: string }[] = [
  { type: "🎯 Focused", label: "Focused" },
  { type: "🔥 Energetic", label: "Energetic" },
  { type: "☕ Calm", label: "Calm" },
  { type: "⚡ Productive", label: "Productive" },
  { type: "😴 Tired", label: "Tired" },
  { type: "🧘 Mindful", label: "Mindful" },
];

export function Popup() {
  const [state, setState] = useState<AppStateData | null>(null);
  const [activeTab, setActiveTab] = useState<"timer" | "tasks" | "shield" | "mood" | "stats">("timer");
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Local inputs
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  
  // Mood Mode inputs
  const [selectedMood, setSelectedMood] = useState<MoodType>("🎯 Focused");
  const [moodNoteText, setMoodNoteText] = useState("");
  const [energyLevel, setEnergyLevel] = useState<number>(4);

  useEffect(() => {
    getStoredState().then((initial) => {
      const online = checkOnlineStatus();
      const next = { ...initial, isOnline: online };
      setState(next);
      document.body.className = initial.themeMode || "dark";
    });

    const unsubscribeState = subscribeToStateChanges((updated) => {
      setState(updated);
      document.body.className = updated.themeMode || "dark";
    });

    const unsubscribeOnline = subscribeOnlineStatus((online) => {
      setState((prev) => (prev ? { ...prev, isOnline: online } : null));
    });

    return () => {
      unsubscribeState();
      unsubscribeOnline();
    };
  }, []);

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
    updateState({ themeMode: isDark ? "light" : "dark" });
  };

  // Timer Handlers
  const toggleTimer = () => {
    updateState({ isActive: !state.isActive });
  };

  const resetTimer = () => {
    const defaultTime = state.timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60;
    updateState({ isActive: false, timeLeft: defaultTime });
  };

  const switchTimerState = (timerState: "WORK" | "BREAK") => {
    const nextTime = timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60;
    updateState({
      timerState,
      isActive: false,
      timeLeft: nextTime
    });
  };

  // Task Handlers
  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const item: TodoItem = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority
    };
    updateState({ todos: [item, ...state.todos] });
    setNewTaskText("");
  };

  const toggleTodo = (id: string) => {
    const updated = state.todos.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t);
    const completedCount = updated.filter(t => t.completed).length;
    updateState({ todos: updated, stats: { ...state.stats, completedTasksCount: completedCount } });
  };

  const deleteTodo = (id: string) => {
    updateState({ todos: state.todos.filter(t => t.id !== id) });
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

  // Mood Mode Handlers
  const addMoodEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodNoteText.trim()) return;
    const entry: MoodEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      mood: selectedMood,
      text: moodNoteText.trim(),
      energyLevel
    };
    updateState({ moodEntries: [entry, ...state.moodEntries] });
    setMoodNoteText("");
  };

  const deleteMoodEntry = (id: string) => {
    updateState({ moodEntries: state.moodEntries.filter(m => m.id !== id) });
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
  const totalDuration = state.timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60;
  const progressPercent = totalDuration > 0 ? Math.min(100, Math.max(0, ((totalDuration - state.timeLeft) / totalDuration) * 100)) : 0;

  return (
    <div className={`w-[420px] h-[580px] flex flex-col overflow-hidden select-none font-sans relative ${
      isDark ? "bg-black text-white" : "bg-white text-black"
    }`}>
      {/* Top Header */}
      <header className={`px-4 py-3 border-b flex items-center justify-between z-10 ${
        isDark ? "bg-neutral-950 border-neutral-800" : "bg-neutral-100 border-neutral-200"
      }`}>
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
            <p className={`text-[10px] font-mono -mt-0.5 flex items-center gap-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              {state.isOnline ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Wifi className="w-3 h-3" /> Convex & Clerk
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controls: Mode Toggle beside Info Button */}
        <div className="flex items-center gap-2">
          {/* Info Button beside Mode Toggle */}
          <button
            onClick={() => setShowInfoModal(true)}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
              isDark
                ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
                : "bg-white border-neutral-300 text-black hover:bg-neutral-100"
            }`}
            title="Extension Information & GitHub"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Dark and Light Mode Toggle */}
          <button
            onClick={toggleThemeMode}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
              isDark
                ? "bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
                : "bg-white border-neutral-300 text-black hover:bg-neutral-100"
            }`}
            title={`Switch to ${isDark ? "Light Monochrome" : "Dark Monochrome"} Mode`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Internet Requirement Fallback Banner when Offline */}
      {!state.isOnline && (
        <div className={`px-4 py-2 border-b text-xs font-mono flex items-center justify-between z-10 ${
          isDark ? "bg-neutral-900 border-neutral-800 text-neutral-200" : "bg-neutral-100 border-neutral-300 text-neutral-800"
        }`}>
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Internet required for Convex & Clerk sync.</span>
          </div>
          <button
            onClick={() => updateState({ isOnline: checkOnlineStatus() })}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
              isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className={`flex items-center justify-between px-3 py-1.5 border-b z-10 ${
        isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-neutral-50 border-neutral-200"
      }`}>
        {[
          { id: "timer", label: "Timer", icon: Timer },
          { id: "tasks", label: "Tasks", icon: CheckSquare, badge: state.todos.filter(t => !t.completed).length },
          { id: "shield", label: "Shield", icon: Shield, activeIndicator: state.shield.enabled && state.isActive },
          { id: "mood", label: "Mood Mode", icon: Smile },
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
            <div className={`flex items-center p-1 rounded-xl border w-full max-w-[260px] ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-100 border-neutral-300"
            }`}>
              <button
                onClick={() => switchTimerState("WORK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  state.timerState === "WORK"
                    ? isDark ? "bg-white text-black shadow-md" : "bg-black text-white shadow-md"
                    : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
              >
                Work ({state.pomodoroSettings.work}m)
              </button>
              <button
                onClick={() => switchTimerState("BREAK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  state.timerState === "BREAK"
                    ? isDark ? "bg-white text-black shadow-md" : "bg-black text-white shadow-md"
                    : isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
              >
                Break ({state.pomodoroSettings.break}m)
              </button>
            </div>

            <div className="relative w-44 h-44 my-3 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="74"
                  className={isDark ? "stroke-neutral-800" : "stroke-neutral-200"}
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="74"
                  className={`transition-all duration-1000 ease-linear ${
                    isDark ? "stroke-white" : "stroke-black"
                  }`}
                  strokeWidth="8"
                  strokeDasharray={465}
                  strokeDashoffset={465 - (465 * progressPercent) / 100}
                  strokeLinecap="square"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black font-mono tracking-tighter">
                  {timeFormatted}
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-widest mt-1 px-2 py-0.5 rounded border ${
                  isDark
                    ? "bg-neutral-900 text-neutral-300 border-neutral-700"
                    : "bg-neutral-100 text-neutral-800 border-neutral-300"
                }`}>
                  {state.isActive ? (state.timerState === "WORK" ? "WORK IN PROGRESS" : "ON BREAK") : "PAUSED"}
                </span>
              </div>
            </div>

            <div className="w-full max-w-[280px] mb-3">
              <input
                type="text"
                value={state.sessionName}
                onChange={(e) => updateState({ sessionName: e.target.value })}
                placeholder="Session Goal / Objective..."
                className={`w-full px-3 py-2 rounded-xl text-xs text-center font-medium border focus:outline-none ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 text-white placeholder-neutral-500 focus:border-white"
                    : "bg-neutral-100 border-neutral-300 text-black placeholder-neutral-400 focus:border-black"
                }`}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={resetTimer}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                    : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-700"
                }`}
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleTimer}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all shadow-lg active:scale-95 ${
                  isDark
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                {state.isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => switchTimerState(state.timerState === "WORK" ? "BREAK" : "WORK")}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                  isDark
                    ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                    : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-700"
                }`}
                title="Skip Session"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="flex flex-col h-full gap-3">
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
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as typeof newTaskPriority)}
                className={`px-2 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark ? "bg-neutral-900 border-neutral-800 text-neutral-300" : "bg-neutral-100 border-neutral-300 text-neutral-700"
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Med</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="submit"
                className={`p-2 rounded-xl font-bold transition-all ${
                  isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {state.todos.length === 0 ? (
                <div className={`text-center py-12 text-xs font-mono ${isDark ? "text-neutral-600" : "text-neutral-400"}`}>
                  NO TASKS LISTED. ADD ONE ABOVE.
                </div>
              ) : (
                state.todos.map((todo) => (
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
                      <span className="text-xs font-medium truncate">{todo.text}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {todo.priority && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border ${
                          isDark ? "bg-neutral-800 text-neutral-300 border-neutral-700" : "bg-neutral-200 text-neutral-800 border-neutral-300"
                        }`}>
                          {todo.priority}
                        </span>
                      )}
                      <button onClick={() => deleteTodo(todo.id)} className={`p-1 ${isDark ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-black"}`}>
                        <Trash2 className="w-3.5 h-3.5" />
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
                    {state.shield.enabled ? "Active during Pomodoro work sessions" : "Shield currently OFF"}
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

        {/* MOOD MODE TAB (NEW) */}
        {activeTab === "mood" && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
            {/* Mood Selector Pills */}
            <div className="space-y-1">
              <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
                CURRENT MOOD STATE
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {MOOD_OPTIONS.map((item) => {
                  const isSelected = selectedMood === item.type;
                  return (
                    <button
                      key={item.type}
                      onClick={() => setSelectedMood(item.type)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                        isSelected
                          ? isDark ? "bg-white text-black border-white shadow-md" : "bg-black text-white border-black shadow-md"
                          : isDark ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800" : "bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      {item.type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Energy Level Selector */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
            }`}>
              <span className="text-xs font-mono font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Energy Rating:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setEnergyLevel(lvl)}
                    className={`w-6 h-6 rounded-lg text-xs font-mono font-bold border ${
                      energyLevel >= lvl
                        ? isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
                        : isDark ? "bg-neutral-950 text-neutral-600 border-neutral-800" : "bg-neutral-200 text-neutral-400 border-neutral-300"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Reflection Note Form */}
            <form onSubmit={addMoodEntry} className={`p-3 rounded-xl border flex flex-col gap-2 ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
            }`}>
              <span className="text-xs font-bold font-mono">MOOD REFLECTION LOG</span>
              <textarea
                value={moodNoteText}
                onChange={(e) => setMoodNoteText(e.target.value)}
                placeholder="Log your mindset, win of the day, or focus note..."
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
                Log Mood Entry
              </button>
            </form>

            {/* Mood History Timeline */}
            <div className="space-y-1.5">
              <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                Mood History ({state.moodEntries.length})
              </span>
              {state.moodEntries.length === 0 ? (
                <div className={`text-center py-6 text-xs font-mono ${isDark ? "text-neutral-600" : "text-neutral-400"}`}>
                  NO MOOD LOGS RECORDED YET.
                </div>
              ) : (
                state.moodEntries.map((entry) => (
                  <div key={entry.id} className={`p-3 rounded-xl border text-xs relative ${
                    isDark ? "bg-neutral-900/60 border-neutral-800 text-neutral-200" : "bg-neutral-50 border-neutral-200 text-neutral-800"
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="font-bold border px-1.5 py-0.5 rounded border-current">{entry.mood}</span>
                      <div className="flex items-center gap-2">
                        <span>Energy: {"⚡".repeat(entry.energyLevel || 3)}</span>
                        <span>{entry.date}</span>
                        <button onClick={() => deleteMoodEntry(entry.id)} className="text-neutral-500 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed mt-1">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <Clock className="w-4 h-4 mb-1" />
                <span className="text-base font-extrabold font-mono">{state.stats.todayMinutes}m</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">Focused Today</span>
              </div>
              <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <Flame className="w-4 h-4 mb-1" />
                <span className="text-base font-extrabold font-mono">{state.stats.streakDays}d</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">Streak</span>
              </div>
              <div className={`p-2.5 rounded-xl border flex flex-col items-center text-center ${
                isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
              }`}>
                <CheckSquare className="w-4 h-4 mb-1" />
                <span className="text-base font-extrabold font-mono">{state.stats.completedTasksCount}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-60">Completed</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                Session History ({state.sessions.length})
              </span>
              {state.sessions.length === 0 ? (
                <div className={`text-center py-8 text-xs font-mono ${isDark ? "text-neutral-600" : "text-neutral-400"}`}>
                  NO COMPLETED SESSIONS YET.
                </div>
              ) : (
                state.sessions.map((session) => (
                  <div key={session.id} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    isDark ? "bg-neutral-900/40 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                  }`}>
                    <span className="font-bold">{session.sessionName || "Focus Session"}</span>
                    <span className="opacity-70">{Math.round(session.duration / 60)}m • {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* INFO MODAL DIALOG (Triggered from header Info button beside Theme toggle) */}
      {showInfoModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm p-5 rounded-2xl border flex flex-col gap-3 shadow-2xl relative ${
            isDark ? "bg-neutral-950 border-neutral-800 text-white" : "bg-white border-neutral-300 text-black"
          }`}>
            <button
              onClick={() => setShowInfoModal(false)}
              className={`absolute top-3 right-3 p-1 rounded-lg ${isDark ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-neutral-200 text-neutral-600"}`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs font-mono ${
                isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
              }`}>
                F
              </div>
              <div>
                <h3 className="text-sm font-extrabold font-heading tracking-wider">FOCUS EXTENSION</h3>
                <span className="text-[10px] font-mono opacity-60">Version 1.0.0</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed opacity-80">
              A black & white productivity extension built for deep work, Pomodoro sessions, site blocking, and daily mood tracking.
            </p>

            <div className={`p-3 rounded-xl border space-y-1.5 text-xs font-mono ${
              isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-100 border-neutral-200"
            }`}>
              <div className="font-bold border-b pb-1 opacity-70 border-current">FEATURE OVERVIEW</div>
              <div className="space-y-1 text-[11px]">
                <div>• ⏱️ <b>Pomodoro Timer</b> with badge status.</div>
                <div>• 🛡️ <b>Distraction Shield</b> auto-blocks sites during work.</div>
                <div>• 📋 <b>Task Checklist</b> with priority levels.</div>
                <div>• 😊 <b>Mood Mode</b> daily reflection & energy tracking.</div>
                <div>• 🌐 <b>Convex & Clerk Integration</b> with offline fallback.</div>
              </div>
            </div>

            <button
              onClick={openGithubLink}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                isDark ? "bg-white text-black border-white hover:bg-neutral-200" : "bg-black text-white border-black hover:bg-neutral-800"
              }`}
            >
              <Github className="w-4 h-4" />
              <span>View Source on GitHub Pages</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
