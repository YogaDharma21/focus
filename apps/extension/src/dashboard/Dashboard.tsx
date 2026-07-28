import React, { useEffect, useState } from "react";
import {
  Timer,
  CheckSquare,
  BarChart3,
  BookOpen,
  Shield,
  Focus,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Trash2,
  Volume2,
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  Smile,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { AppStateData, BackgroundType, TodoItem } from "../types";
import { getStoredState, saveStoredState, subscribeToStateChanges } from "../lib/storage";
import { AMBIENT_TRACKS, playAmbientTrack, setAmbientVolume, stopAmbientTrack } from "../lib/audio";
import "../index.css";

export function Dashboard() {
  const [state, setState] = useState<AppStateData | null>(null);
  const [currentView, setCurrentView] = useState<"FOCUS" | "TODO" | "JOURNAL" | "NOTES" | "SHIELD">("FOCUS");
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (state) {
          updateState({ deepFocusMode: !state.deepFocusMode });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state]);

  if (!state) return <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center text-slate-400 font-medium">Loading Dashboard...</div>;

  const updateState = (updates: Partial<AppStateData>) => {
    saveStoredState(updates).then(setState);
  };

  const toggleTimer = () => updateState({ isActive: !state.isActive });
  const resetTimer = () => {
    const defaultTime = state.timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60;
    updateState({ isActive: false, timeLeft: defaultTime });
  };

  const switchTimerState = (timerState: "WORK" | "BREAK") => {
    const nextTime = timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60;
    updateState({ timerState, isActive: false, timeLeft: nextTime });
  };

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

  const deleteTodo = (id: string) => updateState({ todos: state.todos.filter(t => t.id !== id) });

  const addBlockedSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteUrl.trim()) return;
    let clean = newSiteUrl.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    if (!clean) return;
    if (state.shield.blockedSites.includes(clean)) return;
    updateState({ shield: { ...state.shield, blockedSites: [...state.shield.blockedSites, clean] } });
    setNewSiteUrl("");
  };

  const removeBlockedSite = (site: string) => {
    updateState({ shield: { ...state.shield, blockedSites: state.shield.blockedSites.filter(s => s !== site) } });
  };

  const toggleAmbient = (trackId: string) => {
    if (state.ambientPlaying === trackId) {
      stopAmbientTrack();
      updateState({ ambientPlaying: null });
    } else {
      playAmbientTrack(trackId, state.ambientVolume);
      updateState({ ambientPlaying: trackId });
    }
  };

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

  const mins = Math.floor(state.timeLeft / 60);
  const secs = state.timeLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const totalDuration = state.timerState === "WORK" ? state.pomodoroSettings.work * 60 : state.pomodoroSettings.break * 60;
  const progressPercent = totalDuration > 0 ? Math.min(100, Math.max(0, ((totalDuration - state.timeLeft) / totalDuration) * 100)) : 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0f17] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Visual Wallpapers */}
      <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-700">
        {state.background === "dark" && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17] via-[#0f172a] to-[#0b0f17]" />
        )}
        {state.background === "gradient" && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-slate-950 to-emerald-950/60" />
        )}
        {state.background === "mountain" && (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-25 filter blur-sm" />
        )}
        {state.background === "library" && (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-20 filter blur-sm" />
        )}
        {state.background === "cafe" && (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-20 filter blur-sm" />
        )}
        {state.background === "anime-room" && (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-25 filter blur-sm" />
        )}
      </div>

      {/* Deep Focus Mode Overlay */}
      {state.deepFocusMode && (
        <div className="fixed inset-0 z-50 bg-[#0b0f17]/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
          <button
            onClick={() => updateState({ deepFocusMode: false })}
            className="absolute top-6 right-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all"
          >
            Exit Deep Focus (Esc / F)
          </button>

          <div className="flex flex-col items-center justify-center max-w-md text-center p-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">Deep Focus Zone</span>
            <h1 className="text-8xl font-black font-heading tracking-tight text-white mb-6 drop-shadow-2xl">
              {timeFormatted}
            </h1>
            <p className="text-slate-400 text-sm mb-8 font-medium">
              {state.sessionName ? `"${state.sessionName}"` : "Eliminate distractions and enter deep flow."}
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTimer}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                  state.isActive ? "bg-amber-500 text-white" : "bg-emerald-500 text-white neon-glow-emerald"
                }`}
              >
                {state.isActive ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout Container */}
      <div className="relative z-10 min-h-screen flex flex-col max-w-7xl mx-auto px-6 py-6 pb-28">
        {/* Top Navbar */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-heading">
                Focus Dashboard
              </h1>
              <p className="text-xs text-slate-400 font-medium">Browser Extension Command Center</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
            {[
              { id: "FOCUS", label: "Focus Timer", icon: Timer },
              { id: "TODO", label: "Tasks", icon: CheckSquare },
              { id: "JOURNAL", label: "Stats & Journal", icon: BarChart3 },
              { id: "NOTES", label: "Mood Notes", icon: BookOpen },
              { id: "SHIELD", label: "Shield Config", icon: Shield }
            ].map((nav) => {
              const Icon = nav.icon;
              const active = currentView === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setCurrentView(nav.id as typeof currentView)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{nav.label}</span>
                </button>
              );
            })}
          </div>

          {/* Actions & Theme Selection */}
          <div className="flex items-center gap-3">
            {/* Deep Focus Toggle Button */}
            <button
              onClick={() => updateState({ deepFocusMode: true })}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all hover:scale-105"
            >
              <Focus className="w-4 h-4" />
              <span>Deep Focus (F)</span>
            </button>

            {/* Background Theme Selector */}
            <select
              value={state.background}
              onChange={(e) => updateState({ background: e.target.value as BackgroundType })}
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="dark">Theme: Dark Slate</option>
              <option value="gradient">Theme: Cyber Gradient</option>
              <option value="mountain">Theme: Mountain Retreat</option>
              <option value="library">Theme: Cozy Library</option>
              <option value="cafe">Theme: Lo-Fi Cafe</option>
              <option value="anime-room">Theme: Anime Room</option>
            </select>
          </div>
        </header>

        {/* View Contents */}
        {currentView === "FOCUS" && (
          <div className="flex-1 flex flex-col items-center justify-center my-8">
            <div className="glass-panel p-10 rounded-3xl border border-slate-800 flex flex-col items-center max-w-xl w-full text-center shadow-2xl relative">
              {/* Work / Break Selector */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800 mb-8">
                <button
                  onClick={() => switchTimerState("WORK")}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                    state.timerState === "WORK"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Work Session ({state.pomodoroSettings.work}m)
                </button>
                <button
                  onClick={() => switchTimerState("BREAK")}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                    state.timerState === "BREAK"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Break Session ({state.pomodoroSettings.break}m)
                </button>
              </div>

              {/* Big Circular Timer Ring */}
              <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="128" cy="128" r="110" className="stroke-slate-800" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="128"
                    cy="128"
                    r="110"
                    className={`transition-all duration-1000 ease-linear ${
                      state.timerState === "WORK" ? "stroke-emerald-400" : "stroke-cyan-400"
                    }`}
                    strokeWidth="12"
                    strokeDasharray={690}
                    strokeDashoffset={690 - (690 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center">
                  <span className="text-6xl font-extrabold tracking-tight font-heading text-white">
                    {timeFormatted}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full ${
                    state.timerState === "WORK" ? "bg-emerald-500/10 text-emerald-400" : "bg-cyan-500/10 text-cyan-400"
                  }`}>
                    {state.isActive ? (state.timerState === "WORK" ? "In Focus Zone" : "Resting") : "Paused"}
                  </span>
                </div>
              </div>

              {/* Session Objective */}
              <div className="w-full max-w-md mb-8">
                <input
                  type="text"
                  value={state.sessionName}
                  onChange={(e) => updateState({ sessionName: e.target.value })}
                  placeholder="What task are you executing right now?"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-center text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={resetTimer}
                  className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 flex items-center justify-center transition-all hover:scale-105"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleTimer}
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 ${
                    state.isActive
                      ? "bg-amber-500 text-white"
                      : state.timerState === "WORK"
                      ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-white neon-glow-emerald"
                      : "bg-gradient-to-tr from-cyan-500 to-blue-500 text-white neon-glow-cyan"
                  }`}
                >
                  {state.isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>

                <button
                  onClick={() => switchTimerState(state.timerState === "WORK" ? "BREAK" : "WORK")}
                  className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 flex items-center justify-center transition-all hover:scale-105"
                  title="Skip Session"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === "TODO" && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-4xl mx-auto w-full my-4">
            <h2 className="text-xl font-bold font-heading text-white mb-6 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              Task Manager
            </h2>

            <form onSubmit={addTodo} className="flex gap-3 mb-6">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new task objective..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as typeof newTaskPriority)}
                className="px-3 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-slate-300 focus:outline-none"
              >
                <option value="low">Priority: Low</option>
                <option value="medium">Priority: Medium</option>
                <option value="high">Priority: High</option>
                <option value="urgent">Priority: Urgent</option>
              </select>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-semibold text-sm transition-all hover:scale-105"
              >
                Add Task
              </button>
            </form>

            <div className="space-y-3">
              {state.todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    todo.completed
                      ? "bg-slate-900/30 border-slate-800/60 opacity-60 line-through"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleTodo(todo.id)} className="text-slate-400 hover:text-indigo-400">
                      {todo.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <span className="text-sm text-slate-200 font-medium">{todo.text}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {todo.priority && (
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase ${
                        todo.priority === "urgent" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        todo.priority === "high" ? "bg-amber-500/20 text-amber-400" :
                        todo.priority === "medium" ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-400"
                      }`}>
                        {todo.priority}
                      </span>
                    )}
                    <button onClick={() => deleteTodo(todo.id)} className="text-slate-500 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === "JOURNAL" && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-4xl mx-auto w-full my-4">
            <h2 className="text-xl font-bold font-heading text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Focus Analytics & History
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
                <Clock className="w-6 h-6 text-emerald-400 mb-2" />
                <span className="text-2xl font-bold text-white font-heading">{state.stats.todayMinutes} mins</span>
                <span className="text-xs text-slate-400">Total Focused Today</span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
                <Flame className="w-6 h-6 text-amber-400 mb-2" />
                <span className="text-2xl font-bold text-white font-heading">{state.stats.streakDays} Days</span>
                <span className="text-xs text-slate-400">Active Streak</span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center">
                <CheckSquare className="w-6 h-6 text-indigo-400 mb-2" />
                <span className="text-2xl font-bold text-white font-heading">{state.stats.completedTasksCount} Tasks</span>
                <span className="text-xs text-slate-400">Completed Tasks</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Completed Focus Sessions ({state.sessions.length})</h3>
              {state.sessions.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No completed sessions logged yet today.</p>
              ) : (
                state.sessions.map((session) => (
                  <div key={session.id} className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{session.sessionName || "Focus Session"}</span>
                    <span className="text-slate-400">{Math.round(session.duration / 60)} minutes • {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentView === "NOTES" && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-4xl mx-auto w-full my-4">
            <h2 className="text-xl font-bold font-heading text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Daily Mood & Reflection Journal
            </h2>

            <form onSubmit={addMoodNote} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">New Reflection Note</span>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200"
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
                placeholder="Reflect on your progress, challenges, or thoughts today..."
                rows={3}
                className="w-full p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-xs font-bold transition-all self-end px-6"
              >
                Save Reflection Note
              </button>
            </form>

            <div className="space-y-3">
              {state.moodNotes.map((note) => (
                <div key={note.id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold text-indigo-300">{note.mood}</span>
                    <span>{note.date}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === "SHIELD" && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-4xl mx-auto w-full my-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Distraction Shield Settings
              </h2>

              <button
                onClick={() => updateState({ shield: { ...state.shield, enabled: !state.shield.enabled } })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  state.shield.enabled ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-slate-800 text-slate-300"
                }`}
              >
                {state.shield.enabled ? "SHIELD IS ENABLED" : "SHIELD IS DISABLED"}
              </button>
            </div>

            <form onSubmit={addBlockedSite} className="flex gap-3 mb-6">
              <input
                type="text"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                placeholder="Enter domain to block (e.g. twitter.com)..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-white font-semibold text-sm transition-all"
              >
                Block Site
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Blacklisted Sites</h3>
              {state.shield.blockedSites.map((site) => (
                <div key={site} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                  <span className="font-mono text-slate-300 text-sm">{site}</span>
                  <button onClick={() => removeBlockedSite(site)} className="text-slate-500 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Ambient Sound Dock */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold">
          <Volume2 className="w-4 h-4" />
          <span>Ambient Audio</span>
        </div>

        <div className="flex items-center gap-3">
          {AMBIENT_TRACKS.map((track) => {
            const isPlaying = state.ambientPlaying === track.id;
            return (
              <button
                key={track.id}
                onClick={() => toggleAmbient(track.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isPlaying
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 font-bold"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80"
                }`}
              >
                {track.title} {isPlaying && "🔊"}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
