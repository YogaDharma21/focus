import React from 'react';
import { Play, Pause, Maximize2, Coffee, Clock } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { cn } from '../../lib/utils';

export const MiniTimerCapsule: React.FC = () => {
  const {
    timeLeft,
    flowTimeElapsed,
    timerState,
    isActive,
    setIsActive,
    setDeepFocusMode,
    setMiniMode,
  } = useDesktopStore();

  const handleToggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (nextActive) {
      setDeepFocusMode(true);
    }
  };

  const handleExitMiniMode = () => {
    setMiniMode(false);
  };

  const activeSeconds = timerState === 'BREAK' ? timeLeft : flowTimeElapsed;
  const m = Math.floor(activeSeconds / 60);
  const s = activeSeconds % 60;
  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="w-full h-full bg-card border border-border flex items-center justify-between px-3 select-none drag-region text-foreground">
      {/* State icon + Time display */}
      <div className="flex items-center gap-2 no-drag">
        <span className="flex items-center text-muted-foreground">
          {timerState === 'BREAK' ? (
            <Coffee className="w-3.5 h-3.5 text-amber" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-foreground" />
          )}
        </span>
        <span className="font-extrabold font-mono text-sm tracking-tight tabular-nums">
          {timeString}
        </span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1.5 no-drag">
        {/* Play / Pause Toggle Button */}
        <button
          onClick={handleToggleTimer}
          className={cn(
            "p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center",
            isActive
              ? "bg-secondary border-border text-foreground hover:bg-accent"
              : "bg-primary border-primary text-primary-foreground hover:opacity-90"
          )}
          title={isActive ? "Pause Timer" : "Start Timer"}
        >
          {isActive ? (
            <Pause className="w-3 h-3 fill-current" />
          ) : (
            <Play className="w-3 h-3 fill-current ml-0.5" />
          )}
        </button>

        {/* Restore / Expand to Normal Window Button */}
        <button
          onClick={handleExitMiniMode}
          className="p-1.5 rounded-lg border border-border bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center"
          title="Restore Full App Window (Ctrl+Alt+M)"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
