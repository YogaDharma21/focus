import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, CheckCircle2, AlertCircle, Sparkles, SlidersHorizontal, Settings } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';

export const FocusTimer: React.FC = () => {
  const {
    timerMode,
    setTimerMode,
    timerState,
    setTimerState,
    timeLeft,
    setTimeLeft,
    flowTimeElapsed,
    setFlowTimeElapsed,
    isActive,
    setIsActive,
    pomodoroSettings,
    setPomodoroSettings,
    todos,
    selectedTodoId,
    setSelectedTodoId,
    toggleTodo,
    addSession,
    addDistraction,
    distractions,
    soundEffectEnabled
  } = useDesktopStore();

  const [showSettings, setShowSettings] = React.useState(false);

  // Play audio chime synthesized via Web Audio API
  const playCompletionSound = () => {
    if (!soundEffectEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio chime failed", e);
    }
  };

  // Timer Tick Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (timerMode === 'POMODORO') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handlePomodoroComplete();
              return 0;
            }
            return prev - 1;
          });
        } else {
          // Flow mode: count up
          setFlowTimeElapsed((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timerMode]);

  // Pomodoro Completion Handler
  const handlePomodoroComplete = () => {
    setIsActive(false);
    playCompletionSound();

    const currentTask = todos.find(t => t.id === selectedTodoId);

    if (timerState === 'WORK') {
      electron.showNotification("Focus Session Complete! 🎉", "Great work! Time for a well-deserved break.");
      
      // Log session
      addSession({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        duration: pomodoroSettings.work * 60,
        mode: 'POMODORO',
        taskTitle: currentTask?.text || 'Focus Session'
      });

      // Switch to break
      setTimerState('BREAK');
      setTimeLeft(pomodoroSettings.break * 60);

      if (pomodoroSettings.autoStartBreak) {
        setIsActive(true);
      }
    } else {
      electron.showNotification("Break Completed! ⚡", "Ready to get back into flow state?");
      setTimerState('WORK');
      setTimeLeft(pomodoroSettings.work * 60);
    }
  };

  // Finish Flow Stopwatch session and calculate smart 1/5 break
  const handleFinishFlowSession = () => {
    if (flowTimeElapsed <= 0) return;
    setIsActive(false);
    playCompletionSound();

    const currentTask = todos.find(t => t.id === selectedTodoId);

    // Smart break math: 1/5th of flow time (minimum 1 minute)
    const breakDurationSeconds = Math.max(60, Math.floor(flowTimeElapsed / 5));

    addSession({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: flowTimeElapsed,
      mode: 'STOPWATCH',
      taskTitle: currentTask?.text || 'Flow Session'
    });

    electron.showNotification(
      "Flow Session Completed! 🌊",
      `Focused for ${Math.floor(flowTimeElapsed / 60)}m. Recommended break: ${Math.floor(breakDurationSeconds / 60)}m.`
    );

    // Set up break timer
    setTimerMode('POMODORO');
    setTimerState('BREAK');
    setTimeLeft(breakDurationSeconds);
    setFlowTimeElapsed(0);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (timerMode === 'POMODORO') {
      setTimeLeft(timerState === 'WORK' ? pomodoroSettings.work * 60 : pomodoroSettings.break * 60);
    } else {
      setFlowTimeElapsed(0);
    }
  };

  const formatDisplayTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeSeconds = timerMode === 'POMODORO' ? timeLeft : flowTimeElapsed;
  const totalDurationSeconds = timerMode === 'POMODORO' 
    ? (timerState === 'WORK' ? pomodoroSettings.work * 60 : pomodoroSettings.break * 60)
    : 3600; // max scale for ring in flow mode

  const progressPercent = timerMode === 'POMODORO'
    ? Math.min(100, Math.max(0, ((totalDurationSeconds - activeSeconds) / totalDurationSeconds) * 100))
    : Math.min(100, (flowTimeElapsed / 3600) * 100);

  const strokeDashoffset = 565 - (565 * progressPercent) / 100;
  const activeTask = todos.find((t) => t.id === selectedTodoId);

  return (
    <div className="flex flex-col items-center justify-between h-full p-4 md:p-8 max-w-4xl mx-auto w-full select-none">
      {/* Mode Switches */}
      <div className="flex items-center gap-3">
        <div className="flex bg-zinc-900/80 p-1 rounded-2xl border border-white/10 shadow-xl">
          <button
            onClick={() => {
              setIsActive(false);
              setTimerMode('POMODORO');
              setTimerState('WORK');
              setTimeLeft(pomodoroSettings.work * 60);
            }}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
              timerMode === 'POMODORO'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pomodoro Mode
          </button>
          <button
            onClick={() => {
              setIsActive(false);
              setTimerMode('STOPWATCH');
              setFlowTimeElapsed(0);
            }}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
              timerMode === 'STOPWATCH'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Flow Stopwatch
          </button>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Timer Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Modal overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-80 glass-panel p-6 rounded-3xl space-y-4 border border-white/10 shadow-2xl">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              Pomodoro Duration Settings
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Work Duration (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={pomodoroSettings.work}
                  onChange={(e) => setPomodoroSettings({ work: Number(e.target.value) || 25 })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Break Duration (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={pomodoroSettings.break}
                  onChange={(e) => setPomodoroSettings({ break: Number(e.target.value) || 5 })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-zinc-300">Auto-start Break</span>
                <input
                  type="checkbox"
                  checked={pomodoroSettings.autoStartBreak}
                  onChange={(e) => setPomodoroSettings({ autoStartBreak: e.target.checked })}
                  className="accent-cyan-500 w-4 h-4 rounded"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setShowSettings(false);
                if (!isActive) {
                  setTimeLeft(timerState === 'WORK' ? pomodoroSettings.work * 60 : pomodoroSettings.break * 60);
                }
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Ring Timer */}
      <div className="relative flex items-center justify-center my-6">
        <svg className="w-72 h-72 md:w-80 md:h-80 transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="90"
            className="stroke-zinc-800/60"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="50%"
            cy="50%"
            r="90"
            className={`transition-all duration-500 ease-out ${
              timerState === 'WORK' ? 'stroke-cyan-500' : 'stroke-emerald-400'
            }`}
            strokeWidth="12"
            strokeDasharray="565"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            {timerMode === 'POMODORO' ? (timerState === 'WORK' ? 'Work Session' : 'Break Time') : 'Flow Session'}
          </span>
          <h1 className="text-5xl md:text-6xl font-bold font-mono tracking-tight text-white drop-shadow-lg">
            {formatDisplayTime(activeSeconds)}
          </h1>
          {activeTask ? (
            <p className="text-xs text-zinc-300 max-w-[200px] truncate text-center font-medium bg-zinc-900/60 px-3 py-1 rounded-full border border-white/5">
              🎯 {activeTask.text}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">No active task selected</p>
          )}
        </div>
      </div>

      {/* Task Selector & Controls */}
      <div className="w-full space-y-4 max-w-md">
        <div className="flex items-center gap-2">
          <select
            value={selectedTodoId || ''}
            onChange={(e) => setSelectedTodoId(e.target.value || null)}
            className="w-full bg-zinc-900/90 border border-white/10 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="">-- Link to a Task (Optional) --</option>
            {todos.filter(t => !t.completed).map((t) => (
              <option key={t.id} value={t.id}>
                {t.text} {t.priority ? `(${t.priority.toUpperCase()})` : ''}
              </option>
            ))}
          </select>

          {activeTask && (
            <button
              onClick={() => toggleTodo(activeTask.id)}
              className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              title="Mark Task Completed"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Play/Pause, Reset & Distraction Log Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={resetTimer}
            className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-all shadow-lg active:scale-95"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className={`p-5 rounded-2xl font-bold text-white transition-all shadow-xl active:scale-95 flex items-center justify-center ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25'
            }`}
          >
            {isActive ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-0.5" />}
          </button>

          {timerMode === 'STOPWATCH' && isActive && (
            <button
              onClick={handleFinishFlowSession}
              className="px-4 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Finish Flow
            </button>
          )}

          <button
            onClick={() => addDistraction('Quick Distraction')}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 transition-all shadow-lg active:scale-95 relative"
            title="Log Distraction"
          >
            <AlertCircle className="w-5 h-5" />
            {distractions.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {distractions.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
