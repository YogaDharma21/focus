import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
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

  const playCompletionSound = () => {
    if (!soundEffectEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);

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
          setFlowTimeElapsed((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timerMode]);

  const handlePomodoroComplete = () => {
    setIsActive(false);
    playCompletionSound();

    const currentTask = todos.find(t => t.id === selectedTodoId);

    if (timerState === 'WORK') {
      electron.showNotification("Focus Session Complete! 🎉", "Great work! Time for a well-deserved break.");
      
      addSession({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        duration: pomodoroSettings.work * 60,
        mode: 'POMODORO',
        taskTitle: currentTask?.text || 'Focus Session'
      });

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

  const handleFinishFlowSession = () => {
    if (flowTimeElapsed <= 0) return;
    setIsActive(false);
    playCompletionSound();

    const currentTask = todos.find(t => t.id === selectedTodoId);
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

    setTimerMode('POMODORO');
    setTimerState('BREAK');
    setTimeLeft(breakDurationSeconds);
    setFlowTimeElapsed(0);
  };

  const toggleTimer = () => setIsActive(!isActive);

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
    : 3600;

  const progressPercent = timerMode === 'POMODORO'
    ? Math.min(100, Math.max(0, ((totalDurationSeconds - activeSeconds) / totalDurationSeconds) * 100))
    : Math.min(100, (flowTimeElapsed / 3600) * 100);

  const strokeDashoffset = 565 - (565 * progressPercent) / 100;
  const activeTask = todos.find((t) => t.id === selectedTodoId);

  return (
    <div className="flex flex-col items-center justify-between h-full p-4 md:p-8 max-w-4xl mx-auto w-full select-none">
      {/* Mode Switches */}
      <div className="flex items-center gap-3">
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 shadow-sm">
          <button
            onClick={() => {
              setIsActive(false);
              setTimerMode('POMODORO');
              setTimerState('WORK');
              setTimeLeft(pomodoroSettings.work * 60);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timerMode === 'POMODORO'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700 shadow-sm'
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
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timerMode === 'STOPWATCH'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Flow Stopwatch
          </button>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Timer Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-80 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100">Pomodoro Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Work Duration (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={pomodoroSettings.work}
                  onChange={(e) => setPomodoroSettings({ work: Number(e.target.value) || 25 })}
                  className="w-full shadcn-input px-3 py-2 text-xs"
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
                  className="w-full shadcn-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-zinc-300">Auto-start Break</span>
                <input
                  type="checkbox"
                  checked={pomodoroSettings.autoStartBreak}
                  onChange={(e) => setPomodoroSettings({ autoStartBreak: e.target.checked })}
                  className="accent-zinc-100 w-4 h-4 rounded"
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
              className="w-full py-2 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors"
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
            className="stroke-zinc-800/80"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="50%"
            cy="50%"
            r="90"
            className="stroke-zinc-100 transition-all duration-500 ease-out"
            strokeWidth="10"
            strokeDasharray="565"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            {timerMode === 'POMODORO' ? (timerState === 'WORK' ? 'Work Session' : 'Break Time') : 'Flow Session'}
          </span>
          <h1 className="text-5xl md:text-6xl font-bold font-mono tracking-tight text-zinc-100">
            {formatDisplayTime(activeSeconds)}
          </h1>
          {activeTask ? (
            <p className="text-xs text-zinc-300 max-w-[200px] truncate text-center font-medium bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              🎯 {activeTask.text}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">No active task selected</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="w-full space-y-4 max-w-md">
        <div className="flex items-center gap-2">
          <select
            value={selectedTodoId || ''}
            onChange={(e) => setSelectedTodoId(e.target.value || null)}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-zinc-700"
          >
            <option value="">-- Select Task to Focus On --</option>
            {todos.filter(t => !t.completed).map((t) => (
              <option key={t.id} value={t.id}>
                {t.text} {t.priority ? `(${t.priority.toUpperCase()})` : ''}
              </option>
            ))}
          </select>

          {activeTask && (
            <button
              onClick={() => toggleTodo(activeTask.id)}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 hover:bg-zinc-800 transition-colors"
              title="Mark Task Completed"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={resetTimer}
            className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className="px-8 py-4 rounded-xl bg-zinc-100 text-zinc-950 font-bold text-sm hover:bg-zinc-200 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            {isActive ? <Pause className="w-5 h-5 fill-zinc-950" /> : <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />}
            <span>{isActive ? 'Pause' : 'Start Focus'}</span>
          </button>

          {timerMode === 'STOPWATCH' && isActive && (
            <button
              onClick={handleFinishFlowSession}
              className="px-4 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md active:scale-95"
            >
              Finish Flow
            </button>
          )}

          <button
            onClick={() => addDistraction('Quick Distraction')}
            className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors relative"
            title="Log Distraction"
          >
            <AlertCircle className="w-5 h-5" />
            {distractions.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-zinc-700 text-zinc-100 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {distractions.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
