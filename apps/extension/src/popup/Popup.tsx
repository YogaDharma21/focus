import React, { useEffect, useState } from "react";
import {
  Timer,
  CheckSquare,
  Shield,
  Volume2,
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
  Sparkles,
  Smile,
  ShieldAlert,
  ShieldCheck,
  Music,
  CloudRain,
  Waves,
  Wind,
  CheckCircle2,
  Circle
} from "lucide-react";
import { AppStateData, TodoItem } from "../types";
import { getStoredState, saveStoredState, subscribeToStateChanges } from "../lib/storage";
import { AMBIENT_TRACKS, playAmbientTrack, setAmbientVolume, stopAmbientTrack } from "../lib/audio";
import "../index.css";

export function Popup() {
  const [state, setState] = useState<AppStateData | null>(null);
  const [activeTab, setActiveTab] = useState<"timer" | "tasks" | "shield" | "ambient" | "stats">("timer");

  // Local input states
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newMoodText, setNewMoodText] = useState("");
  const [selectedMood, setSelectedMood] = useState("🎯 Focused");

  useEffect(() => {
    getStoredState().then(setState);
    const unsubscribe = subscribeToStateChanges(setState);
    return () => unsubscribe();
  }, []);

  if (!state) return <div className="w-[420px] h-[580px] bg-[#0b0f17] flex items-center justify-center text-slate-400 font-medium">Loading Focus...</div>;

  const updateState = (updates: Partial<AppStateData>) => {
    saveStoredState(updates).then(setState);
  };

  // Timer Handlers
  const toggleTimer = () => {
    updateState({ isActive: !state.isActive });
  };

  const resetTimer = () => {
    const defaultTime = state.timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60;
    updateState({ isActive: false, timeLeft: defaultTime });
  };

  const switchTimerMode = (mode: "POMODORO" | "STOPWATCH") => {
    updateState({
      timerMode: mode,
      isActive: false,
      timeLeft: mode === "POMODORO" ? state.pomodoroSettings.work * 60 : 0
    });
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
      priority: newTaskPriority,
      category: "General"
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

  // Ambient Handlers
  const toggleAmbient = (trackId: string) => {
    if (state.ambientPlaying === trackId) {
      stopAmbientTrack();
      updateState({ ambientPlaying: null });
    } else {
      playAmbientTrack(trackId, state.ambientVolume);
      updateState({ ambientPlaying: trackId });
    }
  };

  const handleVolumeChange = (v: number) => {
    setAmbientVolume(v);
    updateState({ ambientVolume: v });
  };

  // Mood / Distraction Handlers
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

  const logDistraction = () => {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category: "Manual Log"
    };
    updateState({ distractions: [...state.distractions, entry] });
  };

  const openDashboard = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    } else {
      window.open("/dashboard.html", "_blank");
    }
  };

  // Format time
  const mins = Math.floor(state.timeLeft / 60);
  const secs = state.timeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const totalDuration = state.timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60;
  const progressPercent = totalDuration > 0 ? Math.min(100, Math.max(0, ((totalDuration - state.timeLeft) / totalDuration) * 100)) : 0;

  return (
    <div className="w-[420px] h-[580px] bg-[#0b0f17] text-slate-100 flex flex-col overflow-hidden relative select-none">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent font-heading">
              Focus Shield
            </h1>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Browser Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openDashboard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all hover:scale-105"
            title="Open Full Dashboard in New Tab"
          >
            <span>Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <nav className="flex items-center justify-between px-3 py-2 bg-slate-900/40 border-b border-slate-800/60 z-10">
        {[
          { id: "timer", label: "Timer", icon: Timer },
          { id: "tasks", label: "Tasks", icon: CheckSquare, badge: state.todos.filter(t => !t.completed).length },
          { id: "shield", label: "Shield", icon: Shield, activeIndicator: state.shield.enabled },
          { id: "ambient", label: "Sounds", icon: Volume2, activeIndicator: !!state.ambientPlaying },
          { id: "stats", label: "Stats", icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all relative ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-indigo-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
                {tab.activeIndicator && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                )}
              </div>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 z-10 relative">
        {/* TIMER TAB */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center justify-between h-full py-2">
            {/* Work / Break Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 w-full max-w-[260px]">
              <button
                onClick={() => switchTimerState("WORK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  state.timerState === "WORK"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Work Session ({state.pomodoroSettings.work}m)
              </button>
              <button
                onClick={() => switchTimerState("BREAK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  state.timerState === "BREAK"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Break ({state.pomodoroSettings.break}m)
              </button>
            </div>

            {/* Circular Timer Ring Display */}
            <div className="relative w-48 h-48 my-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="82"
                  className="stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="82"
                  className={`transition-all duration-1000 ease-linear ${
                    state.timerState === "WORK" ? "stroke-emerald-400" : "stroke-cyan-400"
                  }`}
                  strokeWidth="10"
                  strokeDasharray={515}
                  strokeDashoffset={515 - (515 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold tracking-tight font-heading text-white">
                  {timeFormatted}
                </span>
                <span className={`text-xs font-semibold uppercase tracking-wider mt-1 px-2.5 py-0.5 rounded-full ${
                  state.timerState === "WORK"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                }`}>
                  {state.isActive ? (state.timerState === "WORK" ? "Focusing..." : "Resting...") : "Paused"}
                </span>
              </div>
            </div>

            {/* Session Name Input */}
            <div className="w-full max-w-[300px] mb-4">
              <input
                type="text"
                value={state.sessionName}
                onChange={(e) => updateState({ sessionName: e.target.value })}
                placeholder="What are you focusing on?"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-center text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
              />
            </div>

            {/* Main Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={resetTimer}
                className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleTimer}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 ${
                  state.isActive
                    ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-orange-500/30"
                    : state.timerState === "WORK"
                    ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/30 neon-glow-emerald"
                    : "bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-cyan-500/30 neon-glow-cyan"
                }`}
              >
                {state.isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => switchTimerState(state.timerState === "WORK" ? "BREAK" : "WORK")}
                className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
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
            {/* Quick Add Form */}
            <form onSubmit={addTodo} className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new focus task..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as typeof newTaskPriority)}
                className="px-2 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Med</option>
                <option value="high">High</option>
                <option value="urgent">🔥 Urgent</option>
              </select>
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Todo List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {state.todos.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No tasks added yet. Add one above to start focusing!
                </div>
              ) : (
                state.todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      todo.completed
                        ? "bg-slate-900/30 border-slate-800/60 opacity-60 line-through"
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className="text-slate-400 hover:text-indigo-400 transition-colors flex-shrink-0"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-xs text-slate-200 truncate font-medium">{todo.text}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {todo.priority && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                          todo.priority === "urgent" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                          todo.priority === "high" ? "bg-amber-500/20 text-amber-400" :
                          todo.priority === "medium" ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-400"
                        }`}>
                          {todo.priority}
                        </span>
                      )}
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      >
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
            {/* Master Toggle Banner */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
              state.shield.enabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400"
            }`}>
              <div className="flex items-center gap-2.5">
                {state.shield.enabled ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <h3 className="text-xs font-bold font-heading">Distraction Shield</h3>
                  <p className="text-[10px] opacity-80">
                    {state.shield.enabled ? "Active during Focus sessions" : "Shield is disabled"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => updateState({ shield: { ...state.shield, enabled: !state.shield.enabled } })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  state.shield.enabled
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {state.shield.enabled ? "ACTIVE" : "TURN ON"}
              </button>
            </div>

            {/* Add Blocked Site Form */}
            <form onSubmit={addBlockedSite} className="flex gap-2">
              <input
                type="text"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                placeholder="Block domain (e.g. reddit.com)..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
              >
                Block
              </button>
            </form>

            {/* Blocked Sites List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Blocked Domains ({state.shield.blockedSites.length})
              </div>
              {state.shield.blockedSites.map((site) => (
                <div
                  key={site}
                  className="px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-slate-300 text-[11px]">{site}</span>
                  <button
                    onClick={() => removeBlockedSite(site)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AMBIENT SOUNDS TAB */}
        {activeTab === "ambient" && (
          <div className="flex flex-col gap-4 h-full">
            {/* Volume Control */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.ambientVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400 w-8 text-right">
                {Math.round(state.ambientVolume * 100)}%
              </span>
            </div>

            {/* Ambient Track Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {AMBIENT_TRACKS.map((track) => {
                const isPlaying = state.ambientPlaying === track.id;
                const IconComponent =
                  track.id === "rain" ? CloudRain :
                  track.id === "waves" ? Waves :
                  track.id === "whitenoise" ? Wind : Music;

                return (
                  <button
                    key={track.id}
                    onClick={() => toggleAmbient(track.id)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                      isPlaying
                        ? "bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10 text-white"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${isPlaying ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-indigo-400 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-200 font-heading">{track.title}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{track.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STATS & NOTES TAB */}
        {activeTab === "stats" && (
          <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
                <Clock className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-base font-bold font-heading text-white">{state.stats.todayMinutes}m</span>
                <span className="text-[10px] text-slate-400">Focused Today</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
                <Flame className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-base font-bold font-heading text-white">{state.stats.streakDays}d</span>
                <span className="text-[10px] text-slate-400">Daily Streak</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
                <CheckSquare className="w-4 h-4 text-indigo-400 mb-1" />
                <span className="text-base font-bold font-heading text-white">{state.stats.completedTasksCount}</span>
                <span className="text-[10px] text-slate-400">Done Tasks</span>
              </div>
            </div>

            {/* Distraction Logger Action */}
            <button
              onClick={logDistraction}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Log Distraction ({state.distractions.length})</span>
            </button>

            {/* Quick Mood Note Form */}
            <form onSubmit={addMoodNote} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-indigo-400" />
                  Daily Mood Note
                </span>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
                >
                  <option value="🎯 Focused">🎯 Focused</option>
                  <option value="🔥 Energetic">🔥 Energetic</option>
                  <option value="☕ Calm">☕ Calm</option>
                  <option value="⚡ Productive">⚡ Productive</option>
                  <option value="😴 Tired">😴 Tired</option>
                </select>
              </div>

              <textarea
                value={newMoodText}
                onChange={(e) => setNewMoodText(e.target.value)}
                placeholder="Write a quick thought or reflection..."
                rows={2}
                className="w-full p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-semibold transition-all"
              >
                Save Reflection
              </button>
            </form>

            {/* Recent Reflections List */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recent Reflections</span>
              {state.moodNotes.slice(0, 3).map((note) => (
                <div key={note.id} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold text-indigo-300">{note.mood}</span>
                    <span>{note.date}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
