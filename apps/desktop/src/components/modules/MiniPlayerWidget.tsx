import React from 'react';
import { Play, Pause, Maximize2, Sparkles } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';

export const MiniPlayerWidget: React.FC = () => {
  const {
    isMiniWidget,
    setMiniWidget,
    timeLeft,
    flowTimeElapsed,
    timerMode,
    timerState,
    isActive,
    setIsActive,
    todos,
    selectedTodoId
  } = useDesktopStore();

  if (!isMiniWidget) return null;

  const seconds = timerMode === 'POMODORO' ? timeLeft : flowTimeElapsed;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const activeTask = todos.find(t => t.id === selectedTodoId);

  const handleExpand = () => {
    setMiniWidget(false);
    electron.setWindowSize(1200, 800);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 bg-zinc-950/90 backdrop-blur-2xl text-white select-none drag-region">
      {/* Top Header */}
      <div className="flex items-center justify-between no-drag">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wide text-zinc-300">Focus Mini</span>
        </div>
        <button
          onClick={handleExpand}
          className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Restore Full App Window"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Center Mini Timer */}
      <div className="flex flex-col items-center justify-center my-4 space-y-2 no-drag">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          {timerMode === 'POMODORO' ? timerState : 'FLOW'}
        </span>
        <h1 className="text-5xl font-mono font-bold tracking-tight text-white drop-shadow-md">
          {timeString}
        </h1>
        {activeTask && (
          <p className="text-xs text-zinc-400 max-w-[240px] truncate text-center font-medium">
            {activeTask.text}
          </p>
        )}
      </div>

      {/* Bottom Play/Pause */}
      <div className="flex justify-center no-drag">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`w-full py-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
            isActive ? 'bg-amber-500 text-zinc-950' : 'bg-cyan-500 text-zinc-950'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-zinc-950" />
              <span>Pause Session</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-zinc-950" />
              <span>Start Session</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
