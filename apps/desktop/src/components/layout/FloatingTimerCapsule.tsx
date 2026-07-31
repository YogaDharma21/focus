import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, AlertTriangle, CheckCircle2, Coffee, Timer as TimerIcon 
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';

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
    todos,
    selectedTodoId,
    toggleTodo,
    addDistraction,
    sessionName
  } = useDesktopStore();

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
    ? (timerState === 'WORK' ? 'Pomodoro' : 'Break')
    : 'Flow';

  const activeTask = todos.find(t => t.id === selectedTodoId);

  const activeTab = timerMode === 'STOPWATCH' 
    ? 'FLOW' 
    : (timerState === 'BREAK' ? 'BREAK' : 'POMODORO');

  const handleSelectTab = (tab: 'POMODORO' | 'BREAK' | 'FLOW') => {
    setIsActive(false);
    if (tab === 'POMODORO') {
      setTimerMode('POMODORO');
      setTimerState('WORK');
      setTimeLeft(pomodoroSettings.work * 60);
    } else if (tab === 'BREAK') {
      setTimerMode('POMODORO');
      setTimerState('BREAK');
      setTimeLeft(pomodoroSettings.break * 60);
    } else {
      setTimerMode('STOPWATCH');
      setFlowTimeElapsed(0);
    }
  };

  return (
    <div ref={containerRef} className="fixed top-1 left-1/2 -translate-x-1/2 z-50 select-none no-drag">
      {/* 1. Compact Pill inside TitleBar (When not expanded) */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 flex items-center justify-between gap-3 shadow-md hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-98 text-xs"
        >
          <div className="flex items-center gap-1.5 min-w-0 text-left">
            <span className="text-xs">🍅</span>
            <span className="text-[11px] font-semibold text-zinc-200 tracking-tight">{timerLabel}</span>
            {activeTask && (
              <span className="text-[10px] text-zinc-400 truncate max-w-[70px]">
                · {activeTask.text}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-white tracking-wider">
              {timeString}
            </span>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsActive(!isActive);
              }}
              className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all flex items-center justify-center shrink-0 shadow-sm"
              title={isActive ? "Pause Timer" : "Start Timer"}
            >
              {isActive ? (
                <Pause className="w-3 h-3 fill-zinc-950" />
              ) : (
                <Play className="w-3 h-3 fill-zinc-950 ml-0.5" />
              )}
            </div>
          </div>
        </button>
      ) : (
        /* 2. Expanded Card Popup dropdown matching user image mockup */
        <div className="w-[380px] bg-[#121214] border border-zinc-800 rounded-2xl p-4 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200 relative mt-1">
          {/* Header Row (Clicking collapses back to default compact pill) */}
          <div 
            onClick={() => setIsExpanded(false)}
            className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to collapse widget"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🍅</span>
              <span className="text-xs font-bold text-white tracking-tight">{timerLabel}</span>
            </div>
            <span className="text-xl font-extrabold font-mono text-white tracking-tight">
              {timeString}
            </span>
          </div>

          {/* Mode Selector Capsule Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectTab('POMODORO')}
              className={`px-3 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'POMODORO'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-[#1a1a1c] text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              <span>🍅</span>
              <span>Pomodoro</span>
            </button>

            <button
              onClick={() => handleSelectTab('BREAK')}
              className={`px-3 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
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
              className={`px-3 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'FLOW'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-[#1a1a1c] text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              <TimerIcon className="w-3 h-3" />
              <span>Flow</span>
            </button>
          </div>

          {/* Horizontal Line Divider */}
          <div className="border-t border-zinc-800/80 pt-1" />

          {/* Focus Item Text & Work Category Badge */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-200 truncate">
              {activeTask ? activeTask.text : (sessionName || "General Focus")}
            </p>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/80 text-[10px] font-medium text-zinc-300">
              Work
            </span>
          </div>

          {/* Bottom Controls Bar */}
          <div className="flex items-center justify-end gap-2 pt-1 relative">
            {/* Complete Button */}
            <button
              onClick={() => {
                if (activeTask) toggleTodo(activeTask.id);
                else setIsActive(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181818] border border-zinc-800 text-[11px] font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete</span>
            </button>

            {/* Distraction Alert Button & Popover */}
            <div className="relative">
              <button
                onClick={() => setShowDistractionMenu(!showDistractionMenu)}
                className="w-8 h-8 rounded-xl bg-[#181818] border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-rose-400 transition-colors"
                title="Log Distraction"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </button>

              {showDistractionMenu && (
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
              onClick={() => setIsActive(!isActive)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-[11px] hover:bg-zinc-200 transition-colors shadow-sm"
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
