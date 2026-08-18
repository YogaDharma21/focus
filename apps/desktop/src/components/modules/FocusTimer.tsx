import React, { useEffect, useState, useRef } from 'react';
import { playCompletionSound } from '../../lib/sound';
import { 
  Play, Pause, RotateCcw, AlertTriangle, Focus, CheckCircle2, 
  ChevronDown, Check, CheckSquare2, Square, Coffee, Timer, Clock, ListTodo, Edit3, X, FileText
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import { cn } from '../../lib/utils';

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
    pomodoroCount,
    setPomodoroCount,
    resetPomodoroCount,
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

  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showDistractionMenu, setShowDistractionMenu] = useState(false);

  const taskSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (taskSelectorRef.current && !taskSelectorRef.current.contains(e.target as Node)) {
        setShowTaskDropdown(false);
      }
    };
    if (showTaskDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTaskDropdown]);

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
        const nextCount = (pomodoroCount || 0) + 1;
        setPomodoroCount(nextCount);
        
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

        const isLongBreak = nextCount % 4 === 0;
        const breakDuration = isLongBreak
          ? (pomodoroSettings.longBreak || 15) * 60
          : (pomodoroSettings.break || 5) * 60;

        electron.showNotification(
          isLongBreak ? "4 Pomodoros Completed!" : "Session Complete!",
          isLongBreak 
            ? `Great job completing 4 pomodoro sessions! Time for a ${pomodoroSettings.longBreak || 15} minute long break.`
            : `Great work finishing "${title}"! Time for a break.`
        );
        
        setPreviousMode('POMODORO');
        setTimerState('BREAK');
        setTimeLeft(breakDuration);

        if (pomodoroSettings.autoStartBreak) {
          setIsActive(true);
        }
        setDeepFocusMode(false);
      } else {
        if (previousMode === 'STOPWATCH') {
          electron.showNotification("Break Complete!", "Ready to jump back into Flow state?");
          setTimerMode('STOPWATCH');
          setTimerState('WORK');
          setFlowTimeElapsed(0);
          setTimeLeft(0);
        } else {
          electron.showNotification("Break Complete!", "Ready to start focusing again?");
          setTimerMode('POMODORO');
          setTimerState('WORK');
          setTimeLeft(pomodoroSettings.work * 60);
        }
        if (pomodoroSettings.autoStartTimer) {
          setIsActive(true);
          setDeepFocusMode(true);
        } else {
          setDeepFocusMode(false);
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

      if (activeTask) {
        updateTodo(activeTask.id, {
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
        "Flow Session Complete!", 
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
      setDeepFocusMode(false);
    }
  };

  const handleFinishFlowSession = () => {
    handleCompleteSession();
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
      const newTaskId = crypto.randomUUID();
      addTodo({
        id: newTaskId,
        text: sessionName.trim(),
        completed: false,
        priority: 'medium',
        groupId: 'current',
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
      setPreviousMode(timerMode === 'STOPWATCH' ? 'STOPWATCH' : 'POMODORO');
      setTimerMode('POMODORO');
      setTimerState('BREAK');
      setTimeLeft(pomodoroSettings.break * 60);
    } else {
      setPreviousMode('STOPWATCH');
      setTimerMode('STOPWATCH');
      setTimerState('WORK');
      setFlowTimeElapsed(0);
      setTimeLeft(0);
    }
  };

  const activeTab = timerMode === 'STOPWATCH' 
    ? 'FLOW' 
    : (timerState === 'BREAK' ? 'BREAK' : 'POMODORO');

  return (
    <div className="flex flex-col items-center justify-center min-h-full max-w-2xl mx-auto w-full select-none space-y-6">
      {/* 1. Top Segmented Capsule Tab Bar */}
      <div className="bg-[#141414] border border-zinc-800/80 p-1 rounded-lg flex items-center justify-between w-80 shadow-md">
        <button
          onClick={() => handleSelectTab('POMODORO')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'POMODORO'
              ? 'bg-[#e6e6e6] text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Pomodoro</span>
        </button>

        <button
          onClick={() => handleSelectTab('BREAK')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'BREAK'
              ? 'bg-[#e6e6e6] text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Break</span>
        </button>

        <button
          onClick={() => handleSelectTab('FLOW')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'FLOW'
              ? 'bg-[#e6e6e6] text-zinc-950 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Flow</span>
        </button>
      </div>

      {/* Pomodoro Cycle & Progress Indicator */}
      {timerMode === 'POMODORO' && previousMode !== 'STOPWATCH' && (
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 shadow-sm animate-in fade-in duration-150 group">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((index) => {
              const currentCycleStep = (pomodoroCount || 0) % 4;
              const isCompleted = index < currentCycleStep;
              const isCurrent = index === currentCycleStep && timerState === 'WORK';
              return (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    isCompleted
                      ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                      : isCurrent
                      ? "bg-zinc-300 ring-2 ring-white/30"
                      : "bg-zinc-700/60"
                  )}
                  title={`Pomodoro ${index + 1} of 4`}
                />
              );
            })}
          </div>
          <span className="text-[11px] font-medium text-zinc-300">
            {timerState === 'BREAK'
              ? ((pomodoroCount || 0) % 4 === 0 && (pomodoroCount || 0) > 0
                  ? `Long Break (${pomodoroSettings.longBreak || 15}m)`
                  : `Short Break (${pomodoroSettings.break || 5}m)`)
              : `Pomodoro ${((pomodoroCount || 0) % 4) + 1} of 4`}
          </span>
          {(pomodoroCount || 0) % 4 !== 0 && (
            <button
              type="button"
              onClick={resetPomodoroCount}
              className="p-0.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Reset pomodoro count to 1 of 4"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 2. Giant Digital Clock Display */}
      <div className="my-2">
        <h1 className="text-[100px] md:text-[120px] font-extrabold tracking-tighter text-white leading-none font-sans select-none">
          {formatDisplayTime(activeSeconds)}
        </h1>
      </div>

      {/* 3. Task & Custom Focus Input Container */}
      <div className="w-full max-w-sm relative space-y-2" ref={taskSelectorRef}>
        {/* Task Selection Dropdown Popover (Matching reference design from website & extension) */}
        {showTaskDropdown && (
          <div className="absolute bottom-full left-0 right-0 mb-2 z-50 p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/95 text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1">
            {/* Header: FOCUS TOPIC with X close button */}
            <div className="flex items-center justify-between px-2 pt-0.5 pb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 opacity-70 tracking-wider">
                FOCUS TOPIC
              </span>
              <button
                type="button"
                onClick={() => setShowTaskDropdown(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Close task selector"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom Focus Card Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedTodoId(null);
                setSessionName("");
                setShowTaskDropdown(false);
              }}
              className={cn(
                "w-full p-2.5 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer",
                !activeTask
                  ? "bg-neutral-800 text-white font-semibold"
                  : "hover:bg-neutral-800/60 text-neutral-300 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Edit3 className="w-4 h-4 text-white shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-xs leading-tight">Custom Focus</span>
                  <span className="text-[10px] font-mono text-neutral-400">Type custom goal</span>
                </div>
              </div>
              {!activeTask && <Check className="w-4 h-4 text-white shrink-0" />}
            </button>

            {/* Section Header: MY TASKS */}
            <div className="px-2 pt-2 pb-1 text-[10px] font-mono font-bold uppercase text-neutral-400 opacity-70 tracking-wider">
              MY TASKS
            </div>

            {/* Tasks List */}
            <div className="max-h-40 overflow-y-auto space-y-1 pr-0.5">
              {todos.filter((t) => !t.completed).length === 0 ? (
                <div className="px-3 py-2 text-xs text-neutral-500 italic text-center">
                  No pending tasks
                </div>
              ) : (
                todos.filter((t) => !t.completed).map((todo) => {
                  const isSelected = selectedTodoId === todo.id;
                  return (
                    <button
                      key={todo.id}
                      type="button"
                      onClick={() => {
                        setSelectedTodoId(todo.id);
                        setSessionName(todo.text);
                        setShowTaskDropdown(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer",
                        isSelected
                          ? "bg-neutral-800 text-white font-semibold"
                          : "hover:bg-neutral-800/60 text-neutral-300 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <ListTodo className="w-4 h-4 text-white shrink-0" />
                        <span className="truncate">{todo.text}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Selected Task Capsule OR Custom Focus Pill Input */}
        {activeTask ? (
          /* Task Selected Mode: Pill showing task name + dropdown trigger */
          <button
            type="button"
            onClick={() => setShowTaskDropdown(!showTaskDropdown)}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 shadow-sm cursor-pointer group relative",
              "bg-neutral-900/90 text-white",
              showTaskDropdown ? "border-white" : "border-neutral-800 hover:border-neutral-700"
            )}
            title="Click to select another task or custom focus"
          >
            <div className="flex items-center justify-center gap-2 min-w-0 flex-1 mx-auto">
              <ListTodo className="w-4 h-4 text-white shrink-0" />
              <span className="font-semibold text-sm tracking-tight truncate max-w-[220px] text-white">
                {activeTask.text}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform duration-200 text-white shrink-0 group-hover:opacity-100" />
            </div>
          </button>
        ) : (
          /* Custom Focus Mode: Pill input container matching reference image */
          <div
            className={cn(
              "w-full flex items-center rounded-lg border bg-neutral-900 transition-colors shadow-sm px-3 py-1.5 relative",
              showTaskDropdown ? "border-white" : "border-neutral-800 focus-within:border-white"
            )}
          >
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onKeyDown={handleCustomFocusSubmit}
              placeholder="Session Goal (Press Enter)..."
              className="flex-1 min-w-0 bg-transparent text-sm text-center font-medium text-white placeholder-neutral-500 focus:outline-none pl-6 pr-1 py-1"
            />
            <button
              type="button"
              onClick={() => setShowTaskDropdown(!showTaskDropdown)}
              className="shrink-0 p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Select from your tasks"
            >
              <ListTodo className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Subtasks checklist for selected active task */}
        {activeTask && activeTask.subtasks && activeTask.subtasks.length > 0 && (
          <div className="w-full bg-[#141414] border border-zinc-800/80 rounded-lg p-3 space-y-2 text-xs shadow-md mt-3 animate-in fade-in duration-200">
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
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/80 transition-colors text-left text-xs cursor-pointer"
                >
                  {sub.completed ? (
                    <CheckSquare2 className="w-3.5 h-3.5 shrink-0 text-white" />
                  ) : (
                    <Square className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                  )}
                  <span className={`truncate ${sub.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                    {sub.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Task Notes for selected active task */}
        {activeTask && activeTask.notes && activeTask.notes.trim().length > 0 && (
          <div className="w-full bg-[#141414] border border-zinc-800/80 rounded-lg p-3 space-y-1.5 text-xs shadow-md mt-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <span>Task Notes</span>
            </div>
            <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed text-xs">
              {activeTask.notes}
            </p>
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
            disabled={!isActive}
            className={cn(
              "w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-rose-400 transition-all flex items-center justify-center shadow-md active:scale-95 relative",
              !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
            title={isActive ? "Log Distraction" : "Start timer to log distraction"}
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          {/* Distraction Reason Popover matching user mockup */}
          {isActive && showDistractionMenu && (
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
          onClick={handleCompleteSession}
          disabled={!isActive}
          className={cn(
            "w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-400 transition-all flex items-center justify-center shadow-md active:scale-95",
            !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
          )}
          title={isActive ? "Finish / Complete Session" : "Start timer to complete session"}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setDeepFocusMode(true)}
          className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all flex items-center justify-center shadow-md active:scale-95"
          title="Deep Focus Mode"
        >
          <Focus className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
