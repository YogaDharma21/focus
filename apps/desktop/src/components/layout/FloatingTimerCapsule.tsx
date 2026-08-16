import React, { useState, useRef, useEffect } from 'react';
import { playCompletionSound } from '../../lib/sound';
import { 
  Play, Pause, AlertTriangle, CheckCircle2, Coffee, Timer as TimerIcon, Clock 
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import { cn } from '../../lib/utils';

const DISTRACTION_OPTIONS = ["Phone", "Social Media", "Bathroom", "Meeting", "Other"];

export const FloatingTimerCapsule: React.FC = () => {
  const { 
    currentView, 
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
    pomodoroCount,
    setPomodoroCount,
    todos,
    updateTodo,
    selectedTodoId,
    addDistraction,
    addSession,
    sessionName,
    setDeepFocusMode,
    previousMode,
    setPreviousMode
  } = useDesktopStore();

  const handleToggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (nextActive) {
      setDeepFocusMode(true);
    }
  };

  const handleCompleteSession = () => {
    setIsActive(false);
    playCompletionSound();

    const activeTask = todos.find(t => t.id === selectedTodoId);
    const title = activeTask?.text || sessionName || 'Focus Session';

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

        if (activeTask) {
          updateTodo(activeTask.id, {
            completedPomodoros: (activeTask.completedPomodoros || 0) + 1,
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

    setIsExpanded(false);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [showDistractionMenu, setShowDistractionMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
        setShowDistractionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only show when user is NOT on the main FOCUS view
  if (currentView === 'FOCUS') return null;

  const activeSeconds = timerMode === 'POMODORO' ? timeLeft : flowTimeElapsed;
  const m = Math.floor(activeSeconds / 60);
  const s = activeSeconds % 60;
  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const timerLabel = timerMode === 'POMODORO' 
    ? (timerState === 'WORK' 
        ? `Pomodoro ${((pomodoroCount || 0) % 4) + 1}/4` 
        : (previousMode === 'STOPWATCH'
            ? 'Break'
            : ((pomodoroCount || 0) % 4 === 0 && (pomodoroCount || 0) > 0 ? 'Long Break' : 'Break')))
    : 'Flow';

  const activeTask = todos.find(t => t.id === selectedTodoId);

  const activeTab = timerMode === 'STOPWATCH' 
    ? 'FLOW' 
    : (timerState === 'BREAK' ? 'BREAK' : 'POMODORO');

  const renderModeIcon = () => {
    if (activeTab === 'FLOW') return <Clock className="w-3.5 h-3.5" />;
    if (activeTab === 'BREAK') return <Coffee className="w-3.5 h-3.5" />;
    return <TimerIcon className="w-3.5 h-3.5" />;
  };

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

  return (
    <div ref={containerRef} className="fixed top-1 left-1/2 -translate-x-1/2 z-50 select-none no-drag flex flex-col items-center">
      {/* 1. Compact Pill inside TitleBar (Always rendered at top) */}
      {isActive ? (
        /* Active Playing State (Image 2 style: green border, timer icon, time, green dot) */
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-zinc-900 border border-emerald-500/80 rounded-full px-3.5 py-1 flex items-center gap-2.5 shadow-md hover:bg-zinc-850 hover:border-emerald-400 transition-all active:scale-98 text-xs group"
        >
          <span className="text-xs flex items-center text-zinc-200">{renderModeIcon()}</span>
          <span className="text-[11px] font-mono font-bold text-white tracking-wider">
            {timeString}
          </span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleToggleTimer();
            }}
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition-all shrink-0 shadow-sm"
            title="Pause Timer"
          />
        </button>
      ) : (
        /* Inactive / Paused State (Clean look: mode icon, timer label, time, play button) */
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 flex items-center justify-between gap-3 shadow-md hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-98 text-xs"
        >
          <div className="flex items-center gap-1.5 min-w-0 text-left">
            <span className="text-xs flex items-center">{renderModeIcon()}</span>
            <span className="text-[11px] font-semibold text-zinc-200 tracking-tight">{timerLabel}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-white tracking-wider">
              {timeString}
            </span>
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTimer();
              }}
              className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all flex items-center justify-center shrink-0 shadow-sm"
              title="Start Timer"
            >
              <Play className="w-3 h-3 fill-zinc-950 ml-0.5" />
            </div>
          </div>
        </button>
      )}

      {/* 2. Expanded Card Popup dropdown rendered UNDER the compact pill when active */}
      {isExpanded && (
        <div className="w-[360px] bg-[#121214] border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 relative mt-1.5">
          {/* Header Row (Clicking collapses back to default compact pill) */}
          <div 
            onClick={() => setIsExpanded(false)}
            className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity pb-0.5"
            title="Click to collapse widget"
          >
            <div className="flex items-center gap-2">
              <span className="text-base flex items-center text-zinc-200">{renderModeIcon()}</span>
              <span className="text-xs font-bold text-white tracking-tight">{timerLabel}</span>
            </div>
            <span className="text-xl font-extrabold font-mono text-white tracking-tight">
              {timeString}
            </span>
          </div>

          {/* Mode Selector Capsule Tabs - Fill full width with grid */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <button
              onClick={() => handleSelectTab('POMODORO')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'POMODORO'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-[#1a1a1c] text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              <TimerIcon className="w-3 h-3" />
              <span>Pomodoro</span>
            </button>

            <button
              onClick={() => handleSelectTab('BREAK')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'BREAK'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-[#1a1a1c] text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              <Coffee className="w-3 h-3" />
              <span>Break</span>
            </button>

            <button
              onClick={() => handleSelectTab('FLOW')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'FLOW'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-[#1a1a1c] text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Flow</span>
            </button>
          </div>

          {/* Horizontal Line Divider */}
          <div className="border-t border-zinc-800/80 pt-0.5" />

          {/* Focus Item Text */}
          <div>
            <p className="text-xs font-semibold text-zinc-200 truncate">
              {activeTask ? activeTask.text : (sessionName || "General Focus")}
            </p>
          </div>

          {/* Bottom Controls Bar - Fill full width */}
          <div className="flex items-center justify-between gap-2 pt-1 relative">
            {/* Complete Button */}
            <button
              onClick={handleCompleteSession}
              disabled={!isActive}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181818] border border-zinc-800 text-[11px] font-medium text-zinc-200 hover:bg-zinc-800 transition-colors",
                !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
              )}
              title={isActive ? "Complete Session" : "Start timer to complete session"}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete</span>
            </button>

            {/* Distraction Alert Button & Popover */}
            <div className="relative">
              <button
                onClick={() => setShowDistractionMenu(!showDistractionMenu)}
                disabled={!isActive}
                className={cn(
                  "w-8 h-8 rounded-xl bg-[#181818] border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-rose-400 transition-colors",
                  !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
                )}
                title={isActive ? "Log Distraction" : "Start timer to log distraction"}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </button>

              {isActive && showDistractionMenu && (
                <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-40 bg-[#181818] border border-zinc-800/90 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in zoom-in-95 duration-150">
                  {DISTRACTION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        addDistraction(opt);
                        setShowDistractionMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-[11px] font-semibold text-zinc-100 hover:bg-zinc-800 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={handleToggleTimer}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-[11px] hover:bg-zinc-200 transition-colors shadow-sm"
            >
              {isActive ? (
                <>
                  <Pause className="w-3 h-3 fill-zinc-950" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-zinc-950 ml-0.5" />
                  <span>Start</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
