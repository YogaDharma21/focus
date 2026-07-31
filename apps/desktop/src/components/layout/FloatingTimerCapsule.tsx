import React from 'react';
import { Play, Pause } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';

export const FloatingTimerCapsule: React.FC = () => {
  const { 
    currentView, 
    setView, 
    timerMode, 
    timerState, 
    timeLeft, 
    flowTimeElapsed, 
    isActive, 
    setIsActive,
    todos,
    selectedTodoId 
  } = useDesktopStore();

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

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40 bg-[#141414] border border-zinc-800/90 rounded-2xl px-4 py-2 flex items-center justify-between w-80 shadow-2xl animate-in slide-in-from-top-2 duration-300 select-none">
      {/* Click label to navigate back to Timer view */}
      <button 
        onClick={() => setView('FOCUS')}
        className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
        title="Open Timer"
      >
        <span className="text-sm">🍅</span>
        <span className="text-xs font-semibold text-white tracking-tight">{timerLabel}</span>
        {activeTask && (
          <span className="text-[10px] text-zinc-400 truncate max-w-[80px]">
            · {activeTask.text}
          </span>
        )}
      </button>

      {/* Time & Play/Pause Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setView('FOCUS')}
          className="text-xs font-mono font-bold text-white tracking-wider hover:text-zinc-300 transition-colors"
          title="Open Timer"
        >
          {timeString}
        </button>

        <button
          onClick={() => setIsActive(!isActive)}
          className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all flex items-center justify-center shrink-0 shadow-sm active:scale-95"
          title={isActive ? "Pause Timer" : "Start Timer"}
        >
          {isActive ? (
            <Pause className="w-3.5 h-3.5 fill-zinc-950" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-zinc-950 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
};
