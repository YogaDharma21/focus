import React from 'react';
import { Minus, Square, Copy, X, Pin, Sparkles, MonitorSmartphone } from 'lucide-react';
import { electron } from '../../lib/electron';
import { useDesktopStore } from '../../lib/store';

export const TitleBar: React.FC = () => {
  const { 
    isAlwaysOnTop, 
    setAlwaysOnTop, 
    isMiniWidget, 
    setMiniWidget, 
    timeLeft, 
    isActive, 
    timerState 
  } = useDesktopStore();
  const [isMaximized, setIsMaximized] = React.useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTogglePin = async () => {
    const nextState = !isAlwaysOnTop;
    electron.setAlwaysOnTop(nextState);
    setAlwaysOnTop(nextState);
  };

  const handleToggleMini = () => {
    const nextMini = !isMiniWidget;
    setMiniWidget(nextMini);
    if (nextMini) {
      electron.setWindowSize(380, 560);
    } else {
      electron.setWindowSize(1200, 800);
    }
  };

  const handleMaximize = () => {
    electron.maximizeWindow();
    setIsMaximized(!isMaximized);
  };

  return (
    <div className="h-9 w-full bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between px-3 select-none drag-region text-xs text-zinc-400">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-2.5 no-drag">
        <div className="w-4 h-4 rounded-md bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-[10px]">
          <Sparkles className="w-2.5 h-2.5 stroke-[2.5]" />
        </div>
        <span className="font-semibold text-zinc-200 tracking-tight text-xs">Focus Desktop</span>
        
        {isActive && (
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{timerState === 'WORK' ? 'FOCUS' : 'BREAK'}</span>
            <span className="text-zinc-600">•</span>
            <span className="font-semibold text-zinc-100">{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Right: Window controls */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleTogglePin}
          title={isAlwaysOnTop ? "Unpin Always on Top" : "Pin Always on Top"}
          className={`p-1 rounded-md transition-colors ${
            isAlwaysOnTop 
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' 
              : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleToggleMini}
          title={isMiniWidget ? "Expand Window" : "Mini Player Mode"}
          className={`p-1 rounded-md transition-colors ${
            isMiniWidget 
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' 
              : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MonitorSmartphone className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-zinc-800 mx-1" />

        <button
          onClick={() => electron.minimizeWindow()}
          title="Minimize"
          className="p-1 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
          className="p-1 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => electron.closeWindow()}
          title="Close"
          className="p-1 rounded-md hover:bg-rose-950/80 hover:text-rose-400 text-zinc-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
