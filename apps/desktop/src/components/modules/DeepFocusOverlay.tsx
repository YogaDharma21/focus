import React, { useEffect } from 'react';
import { Minimize2, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';

export const DeepFocusOverlay: React.FC = () => {
  const { 
    deepFocusMode, 
    setDeepFocusMode, 
    timeLeft, 
    flowTimeElapsed,
    timerMode, 
    timerState, 
    isActive, 
    setIsActive,
    todos,
    selectedTodoId
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
    <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-between p-8 select-none animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
          <Sparkles className="w-4 h-4" />
          <span>Deep Focus Zen Mode</span>
        </div>

        <button
          onClick={() => setDeepFocusMode(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:bg-white/5 text-zinc-300 text-xs font-semibold transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Zen Mode (Esc)</span>
        </button>
      </div>

      {/* Center Giant Timer */}
      <div className="flex flex-col items-center space-y-6">
        <span className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-widest">
          {timerMode === 'POMODORO' ? (timerState === 'WORK' ? 'Deep Work Cycle' : 'Rest Break') : 'Flow Session'}
        </span>

        <h1 className="text-8xl md:text-9xl font-bold font-mono tracking-tighter text-white drop-shadow-[0_0_35px_rgba(6,182,212,0.3)]">
          {timeString}
        </h1>

        {activeTask && (
          <p className="text-base text-zinc-300 max-w-md text-center font-medium bg-zinc-900/60 px-5 py-2 rounded-full border border-white/10">
            🎯 {activeTask.text}
          </p>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`p-6 rounded-3xl text-white shadow-2xl transition-all active:scale-95 ${
            isActive ? 'bg-amber-500 shadow-amber-500/30' : 'bg-cyan-500 shadow-cyan-500/30'
          }`}
        >
          {isActive ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-0.5" />}
        </button>
      </div>
    </div>
  );
};
