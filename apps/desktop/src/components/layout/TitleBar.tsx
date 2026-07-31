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
    <div className="h-10 w-full bg-zinc-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-3 select-none drag-region text-xs text-zinc-400">
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-2.5 no-drag">
        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20">
          <Sparkles className="w-3 h-3" />
        </div>
        <span className="font-semibold text-zinc-200 tracking-wide">Focus Desktop</span>
        
        {isActive && (
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{timerState === 'WORK' ? 'FOCUS' : 'BREAK'}</span>
            <span>•</span>
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Right: Window controls */}
      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={handleTogglePin}
          title={isAlwaysOnTop ? "Unpin Always on Top" : "Pin Always on Top"}
          className={`p-1.5 rounded-md transition-colors ${
            isAlwaysOnTop 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
              : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleToggleMini}
          title={isMiniWidget ? "Expand Window" : "Mini Player Mode"}
          className={`p-1.5 rounded-md transition-colors ${
            isMiniWidget 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MonitorSmartphone className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-white/10 mx-1" />

        <button
          onClick={() => electron.minimizeWindow()}
          title="Minimize"
          className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
          className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => electron.closeWindow()}
          title="Close"
          className="p-1.5 rounded-md hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
