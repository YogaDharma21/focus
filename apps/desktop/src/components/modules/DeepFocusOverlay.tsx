import React, { useEffect } from 'react';
import { X, Play, Pause, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';

export const DeepFocusOverlay: React.FC = () => {
  const { 
    deepFocusMode, 
    setDeepFocusMode, 
    timeLeft, 
    flowTimeElapsed,
    timerMode, 
    isActive, 
    setIsActive,
    addDistraction,
    todos,
    selectedTodoId,
    toggleTodo
  } = useDesktopStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!deepFocusMode) return;
      if (e.key === 'Escape') {
        setDeepFocusMode(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsActive(!isActive);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deepFocusMode, isActive]);

  if (!deepFocusMode) return null;

  const seconds = timerMode === 'POMODORO' ? timeLeft : flowTimeElapsed;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const activeTask = todos.find(t => t.id === selectedTodoId);

  return (
    <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col items-center justify-between p-8 select-none animate-in fade-in duration-200">
      {/* Top Right Close X Button */}
      <button
        onClick={() => setDeepFocusMode(false)}
        className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white transition-colors"
        title="Close Focus Mode (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Spacer to push content to center */}
      <div />

      {/* Center Giant Clock & Subtle Controls */}
      <div className="flex flex-col items-center justify-center space-y-8 my-auto">
        <h1 className="text-[120px] md:text-[150px] font-extrabold tracking-tight text-white leading-none font-sans select-none">
          {timeString}
        </h1>

        {/* Minimal Control Row */}
        <div className="flex items-center gap-6">
          {/* Distraction Alert */}
          <button
            onClick={() => addDistraction('Distraction')}
            className="w-11 h-11 rounded-xl bg-[#141414] border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-rose-400 transition-colors shadow-sm"
            title="Log Distraction"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setIsActive(!isActive)}
            className="w-11 h-11 flex items-center justify-center text-white hover:scale-110 transition-transform"
            title={isActive ? "Pause" : "Start"}
          >
            {isActive ? (
              <Pause className="w-5 h-5 fill-white text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            )}
          </button>

          {/* Finish / Complete Task */}
          <button
            onClick={() => {
              if (activeTask) {
                toggleTodo(activeTask.id);
              } else {
                setIsActive(false);
              }
            }}
            className="w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-emerald-400 transition-colors"
            title="Complete Session"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Key Instruction */}
      <div className="pb-2">
        <p className="text-xs text-zinc-500 font-medium tracking-wide flex items-center gap-1">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Esc</kbd>
          <span>to exit focus mode</span>
        </p>
      </div>
    </div>
  );
};
