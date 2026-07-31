import React from 'react';
import { Minus, Square, Copy, X, Pin, Sparkles } from 'lucide-react';
import { electron } from '../../lib/electron';
import { useDesktopStore } from '../../lib/store';

export const TitleBar: React.FC = () => {
  const { 
    isAlwaysOnTop, 
    setAlwaysOnTop, 
    timeLeft, 
    flowTimeElapsed,
    isActive, 
    timerMode,
    timerState 
  } = useDesktopStore();
  const [isMaximized, setIsMaximized] = React.useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeSeconds = timerMode === 'POMODORO' ? timeLeft : flowTimeElapsed;
  const modeLabel = timerMode === 'STOPWATCH' 
    ? 'FLOW' 
    : (timerState === 'WORK' ? 'FOCUS' : 'BREAK');

  const handleTogglePin = async () => {
    const nextState = !isAlwaysOnTop;
    electron.setAlwaysOnTop(nextState);
    setAlwaysOnTop(nextState);
  };

  const handleMaximize = () => {
    electron.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  return (
    <header className="h-10 w-full bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-3 select-none drag-region text-xs text-zinc-300 relative z-50 shrink-0">
      {/* Left: App Branding & Live Status */}
      <div className="flex items-center gap-2.5 no-drag">
        <img src="/icon.png" className="w-5 h-5 rounded-md object-contain shadow-sm" alt="Focus Desktop" />
        <span className="font-bold text-zinc-100 tracking-tight text-xs">Focus Desktop</span>
        
        {isActive && (
          <div className="flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">{modeLabel}</span>
            <span className="text-zinc-500">•</span>
            <span className="font-bold text-white">{formatTime(activeSeconds)}</span>
          </div>
        )}
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleTogglePin}
          title={isAlwaysOnTop ? "Unpin Always on Top" : "Pin Always on Top"}
          className={`p-1.5 rounded-md transition-colors ${
            isAlwaysOnTop 
              ? 'bg-zinc-700 text-white border border-zinc-600' 
              : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <button
          onClick={() => electron.minimizeWindow()}
          title="Minimize"
          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => electron.closeWindow()}
          title="Close"
          className="p-1.5 rounded-md hover:bg-rose-600 hover:text-white text-zinc-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
