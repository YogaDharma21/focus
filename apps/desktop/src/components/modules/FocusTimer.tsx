import React, { useEffect, useState } from 'react';
import { playCompletionSound } from '../../lib/sound';
import { 
  Play, Pause, RotateCcw, AlertTriangle, SlidersHorizontal, CheckCircle2, 
  ChevronDown, Check, CheckSquare2
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';

const DISTRACTION_OPTIONS = ["Phone", "Social Media", "Bathroom", "Meeting", "Other"];

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
    addTodo,
    selectedTodoId,
    setSelectedTodoId,
    toggleTodo,
    updateTodo,
    toggleSubtask,
    addSession,
    addDistraction,
    distractions,
    soundEffectEnabled,
    sessionName,
    setSessionName,
    setDeepFocusMode,
    previousMode,
    setPreviousMode
  } = useDesktopStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showDistractionMenu, setShowDistractionMenu] = useState(false);

  const toggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (nextActive) {
      setDeepFocusMode(true);
    }
  };



  const handleCompleteSession = () => {
    setIsActive(false);
    playCompletionSound();

    const currentTask = todos.find(t => t.id === selectedTodoId);
    const title = currentTask?.text || sessionName || 'Focus Session';

    if (timerMode === 'POMODORO') {
      if (timerState === 'WORK') {
        const durationWorked = Math.max(60, (pomodoroSettings.work * 60) - timeLeft);
        
        addSession({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          duration: durationWorked,
          mode: 'POMODORO',
          taskTitle: title
        });

        if (currentTask) {
          updateTodo(currentTask.id, {
            completedPomodoros: (currentTask.completedPomodoros || 0) + 1,
            completed: true,
            completedAt: new Date().toISOString(),
            groupId: 'finished'
          });
        }

        electron.showNotification("Session Complete! 🎉", `Great work finishing "${title}"! Time for a break.`);
        
        setPreviousMode('POMODORO');
        setTimerState('BREAK');
        setTimeLeft(pomodoroSettings.break * 60);

        if (pomodoroSettings.autoStartBreak) {
          setIsActive(true);
        }
      } else {
        if (previousMode === 'STOPWATCH') {
          electron.showNotification("Break Complete! ⚡", "Ready to jump back into Flow state?");
          setTimerMode('STOPWATCH');
          setFlowTimeElapsed(0);
        } else {
          electron.showNotification("Break Complete! ⚡", "Ready to start focusing again?");
          setTimerState('WORK');
          setTimeLeft(pomodoroSettings.work * 60);
        }
      }
    } else {
      const durationWorked = Math.max(1, flowTimeElapsed);
      const calculatedBreakSeconds = Math.max(1, Math.floor(durationWorked / 5));
      
      addSession({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        duration: durationWorked,
        mode: 'STOPWATCH',
        taskTitle: title
      });

      if (currentTask) {
        updateTodo(currentTask.id, {
          completed: true,
          completedAt: new Date().toISOString(),
          groupId: 'finished'
        });
      }

      const breakMins = Math.floor(calculatedBreakSeconds / 60);
      const breakSecs = calculatedBreakSeconds % 60;
      const breakStr = breakMins > 0 
        ? `${breakMins}m${breakSecs > 0 ? ` ${breakSecs}s` : ''}` 
        : `${breakSecs}s`;

      electron.showNotification(
        "Flow Session Complete! 🌊", 
        `Focused for ${Math.floor(durationWorked / 60)}m. Earned ${breakStr} break!`
      );
      
      setPreviousMode('STOPWATCH');
      setTimerMode('POMODORO');
      setTimerState('BREAK');
      setTimeLeft(calculatedBreakSeconds);
      setFlowTimeElapsed(0);

      if (pomodoroSettings.autoStartBreak) {
        setIsActive(true);
      }
    }
  };

  const handleFinishFlowSession = () => {
    if (flowTimeElapsed <= 0) return;
    setIsActive(false);
    playCompletionSound();

    const currentTask = todos.find(t => t.id === selectedTodoId);
    const title = currentTask?.text || sessionName || 'Flow Session';
    const breakDurationSeconds = Math.max(60, Math.floor(flowTimeElapsed / 5));

    addSession({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: flowTimeElapsed,
      mode: 'STOPWATCH',
      taskTitle: title
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

  const handleCustomFocusSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && sessionName.trim()) {
      e.preventDefault();
      const taskText = sessionName.trim();
      const newTaskId = crypto.randomUUID();

      addTodo({
        id: newTaskId,
        text: taskText,
        completed: false,
        priority: "medium",
        groupId: "current",
        estimatedPomodoros: 1,
        completedPomodoros: 0,
        subtasks: []
      });

      setSelectedTodoId(newTaskId);
      setSessionName("");
    }
  };

  const activeSeconds = timerMode === 'POMODORO' ? timeLeft : flowTimeElapsed;
  const totalDurationSeconds = timerMode === 'POMODORO' 
    ? (timerState === 'WORK' ? pomodoroSettings.work * 60 : pomodoroSettings.break * 60)
    : 3600;

  const progressPercent = timerMode === 'POMODORO'
    ? Math.min(100, Math.max(0, ((totalDurationSeconds - activeSeconds) / totalDurationSeconds) * 100))
    : Math.min(100, (flowTimeElapsed / 3600) * 100);

  const activeTask = todos.find((t) => t.id === selectedTodoId);

  const handleSelectTab = (tab: 'POMODORO' | 'BREAK' | 'FLOW') => {
    setIsActive(false);
    if (tab === 'POMODORO') {
      setPreviousMode('POMODORO');
      setTimerMode('POMODORO');
      setTimerState('WORK');
      setTimeLeft(pomodoroSettings.work * 60);
    } else if (tab === 'BREAK') {
      setTimerMode('POMODORO');
      setTimerState('BREAK');
      setTimeLeft(pomodoroSettings.break * 60);
    } else {
      setPreviousMode('STOPWATCH');
      setTimerMode('STOPWATCH');
      setFlowTimeElapsed(0);
    }
  };

  const activeTab = timerMode === 'STOPWATCH' 
    ? 'FLOW' 
    : (timerState === 'BREAK' ? 'BREAK' : 'POMODORO');

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 max-w-2xl mx-auto w-full select-none space-y-6">
      {/* 1. Top Segmented Capsule Tab Bar */}
      <div className="bg-[#141414] border border-zinc-800/80 p-1 rounded-2xl flex items-center justify-between w-80 shadow-md">
        <button
          onClick={() => handleSelectTab('POMODORO')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'POMODORO'
              ? 'bg-[#e6e6e6] text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Pomodoro
        </button>

        <button
          onClick={() => handleSelectTab('BREAK')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'BREAK'
              ? 'bg-[#e6e6e6] text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Break
        </button>

        <button
          onClick={() => handleSelectTab('FLOW')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'FLOW'
              ? 'bg-[#e6e6e6] text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Flow
        </button>
      </div>

      {/* 2. Giant Digital Clock Display */}
      <div className="my-2">
        <h1 className="text-[100px] md:text-[120px] font-extrabold tracking-tighter text-white leading-none font-sans select-none">
          {formatDisplayTime(activeSeconds)}
        </h1>
      </div>

      {/* 3. Task & Custom Focus Input Container */}
      <div className="w-full max-w-sm space-y-2 relative">
        {/* Dashed Border Focus Button / Dropdown */}
        <button
          onClick={() => setShowTaskDropdown(!showTaskDropdown)}
          className="w-full border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-2xl px-4 py-3 text-xs text-zinc-300 flex items-center justify-between transition-colors shadow-sm"
        >
          <span className="truncate">
            {activeTask ? activeTask.text : "What are you focusing on?"}
          </span>
          <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 ml-2" />
        </button>

        {/* Task Selection Dropdown Popover */}
        {showTaskDropdown && (
          <div className="absolute top-12 left-0 w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-2 space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Select Task</p>
            <button
              onClick={() => {
                setSelectedTodoId(null);
                setShowTaskDropdown(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                !selectedTodoId ? "bg-zinc-800 text-white font-medium" : "text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              None (General Focus)
            </button>

            {todos.filter(t => !t.completed).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTodoId(t.id);
                  setShowTaskDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                  selectedTodoId === t.id ? "bg-zinc-800 text-white font-medium" : "text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                <span className="truncate">{t.text}</span>
                {selectedTodoId === t.id && <Check className="w-3.5 h-3.5 text-zinc-100 shrink-0 ml-1" />}
              </button>
            ))}
          </div>
        )}

        {/* Custom Focus Title Textbox (Shown only when no task is selected) */}
        {!activeTask && (
          <input
            type="text"
            placeholder="Or type a custom focus... (Press Enter)"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onKeyDown={handleCustomFocusSubmit}
            className="w-full bg-[#181818] border border-zinc-800/80 rounded-2xl px-4 py-2.5 text-xs text-zinc-200 text-center focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 shadow-inner"
          />
        )}

        {/* Subtasks checklist for selected active task */}
        {activeTask && activeTask.subtasks && activeTask.subtasks.length > 0 && (
          <div className="w-full bg-[#141414] border border-zinc-800/80 rounded-2xl p-3 space-y-2 text-xs shadow-md mt-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Subtasks ({activeTask.subtasks.filter(s => s.completed).length}/{activeTask.subtasks.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {activeTask.subtasks.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => toggleSubtask(activeTask.id, sub.id)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/80 transition-colors text-left text-xs"
                >
                  <CheckSquare2 className={`w-3.5 h-3.5 shrink-0 ${sub.completed ? "text-emerald-400" : "text-zinc-500"}`} />
                  <span className={`truncate ${sub.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                    {sub.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Horizontal Progress Bar */}
      <div className="w-full max-w-sm h-1.5 bg-zinc-800/80 rounded-full overflow-hidden my-2">
        <div 
          className="bg-zinc-200 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 5. Horizontal Control Bar */}
      <div className="flex items-center justify-center gap-3 pt-2 relative">
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all flex items-center justify-center shadow-md active:scale-95"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Distraction Alert Button & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowDistractionMenu(!showDistractionMenu)}
            className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-rose-400 transition-all flex items-center justify-center shadow-md active:scale-95 relative"
            title="Log Distraction"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          {/* Distraction Reason Popover matching user mockup */}
          {showDistractionMenu && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-[#181818] border border-zinc-800/90 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in zoom-in-95 duration-150">
              {DISTRACTION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    addDistraction(opt);
                    setShowDistractionMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleTimer}
          className="w-16 h-16 rounded-2xl bg-[#e6e6e6] hover:bg-white text-zinc-950 shadow-xl transition-all active:scale-95 flex items-center justify-center"
          title={isActive ? "Pause" : "Start"}
        >
          {isActive ? (
            <Pause className="w-6 h-6 fill-zinc-950 text-zinc-950" />
          ) : (
            <Play className="w-6 h-6 fill-zinc-950 text-zinc-950 ml-0.5" />
          )}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all flex items-center justify-center shadow-md active:scale-95"
          title="Timer Settings"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <button
          onClick={handleCompleteSession}
          className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 transition-all flex items-center justify-center shadow-md active:scale-95"
          title="Finish / Complete Session"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          onClick={() => {
            setShowSettings(false);
            if (!isActive) {
              setTimeLeft(timerState === 'WORK' ? pomodoroSettings.work * 60 : pomodoroSettings.break * 60);
            }
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-80 bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
          >
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

              <div 
                className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 mt-1 cursor-pointer"
                onClick={() => setPomodoroSettings({ autoStartBreak: !pomodoroSettings.autoStartBreak })}
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">Auto-start Break</span>
                  <span className="text-[10px] text-zinc-400">Launch break timer immediately after work</span>
                </div>
                <div className={`w-10 h-[22px] rounded-full p-[3px] transition-colors duration-200 shrink-0 ml-4 ${pomodoroSettings.autoStartBreak ? 'bg-zinc-200' : 'bg-zinc-600'}`}>
                  <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${pomodoroSettings.autoStartBreak ? 'translate-x-[18px] bg-zinc-900' : 'translate-x-0 bg-zinc-400'}`} />
                </div>
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
    </div>
  );
};
