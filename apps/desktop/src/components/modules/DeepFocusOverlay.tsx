import React, { useEffect, useState } from 'react';
import { playCompletionSound } from '../../lib/sound';
import { X, Play, Pause, AlertTriangle, CheckCircle2, Music, Volume2, VolumeX } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import { cn } from '../../lib/utils';

const DISTRACTION_OPTIONS = ["Phone", "Social Media", "Bathroom", "Meeting", "Other"];

export const DeepFocusOverlay: React.FC = () => {
  const { 
    deepFocusMode, 
    setDeepFocusMode, 
    timeLeft, 
    setTimeLeft,
    flowTimeElapsed,
    setFlowTimeElapsed,
    isActive, 
    setIsActive,
    addDistraction,
    addSession,
    todos,
    updateTodo,
    selectedTodoId,
    sessionName,
    isMusicPlaying,
    setIsMusicPlaying,
    volume,
    setVolume
  } = useDesktopStore();

  const [showDistractionMenu, setShowDistractionMenu] = useState(false);
  const [showMusicMenu, setShowMusicMenu] = useState(false);

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

  const seconds = flowTimeElapsed;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const activeTask = todos.find(t => t.id === selectedTodoId);

  const handleCompleteSession = () => {
    setIsActive(false);
    playCompletionSound();

    const title = activeTask?.text || sessionName || 'Focus Session';

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
    
    setFlowTimeElapsed(0);
    setTimeLeft(0);
    setDeepFocusMode(false);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-between p-8 select-none animate-in fade-in duration-200">
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => setShowMusicMenu(!showMusicMenu)}
          className={cn(
            "h-10 px-3.5 rounded-full border transition-all flex items-center gap-2 backdrop-blur-md shadow-sm",
            isMusicPlaying
              ? "bg-secondary/95 border-border text-foreground ring-1 ring-muted-foreground shadow-md"
              : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          )}
          title={isMusicPlaying ? "Lofi-Beats: Playing" : "Lofi-Beats: Paused"}
        >
          <Music className={cn("w-4 h-4", isMusicPlaying && "text-foreground animate-pulse")} />
          <span className="text-xs font-semibold tracking-wide">Lofi-Beats</span>
          {isMusicPlaying && (
            <span className="flex items-center gap-0.5 h-3 ml-0.5">
              <span className="w-0.5 h-2.5 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-0.5 h-3 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-0.5 h-2 bg-foreground rounded-full animate-bounce" />
            </span>
          )}
        </button>

        {showMusicMenu && (
          <div className="absolute top-full left-0 mt-2.5 w-60 bg-card border border-border rounded-2xl shadow-2xl z-50 p-3.5 space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <Music className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold">Lofi-Beats</span>
              </div>
              <button
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  isMusicPlaying
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow"
                    : "bg-secondary text-foreground hover:bg-muted"
                )}
              >
                {isMusicPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" /> Play
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2.5 pt-1 border-t border-border">
              {volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 bg-muted rounded-lg accent-primary cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setDeepFocusMode(false)}
        className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground transition-colors"
        title="Close Focus Mode (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      <div />

      <div className="flex flex-col items-center justify-center space-y-6 my-auto">
        <h1 className="text-[120px] md:text-[150px] font-extrabold tracking-tight text-foreground leading-none font-sans select-none">
          {timeString}
        </h1>

        {(activeTask?.text || sessionName) && (
          <div className="text-sm md:text-base font-semibold text-muted-foreground text-center max-w-md px-4 truncate">
            {activeTask?.text || sessionName}
          </div>
        )}

        <div className="flex items-center gap-6 relative">
          <div className="relative">
            <button
              onClick={() => setShowDistractionMenu(!showDistractionMenu)}
              disabled={!isActive}
              className={cn(
                "w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-rose-400 transition-colors shadow-sm",
                !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
              )}
              title={isActive ? "Log Distraction" : "Start timer to log distraction"}
            >
              <AlertTriangle className="w-4 h-4" />
            </button>

            {isActive && showDistractionMenu && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-48 bg-card border border-border rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in zoom-in-95 duration-150">
                {DISTRACTION_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      addDistraction(opt);
                      setShowDistractionMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsActive(!isActive)}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:scale-110 transition-transform"
            title={isActive ? "Pause" : "Start"}
          >
            {isActive ? (
              <Pause className="w-5 h-5 fill-foreground text-foreground" />
            ) : (
              <Play className="w-5 h-5 fill-foreground text-foreground ml-0.5" />
            )}
          </button>

          <button
            onClick={handleCompleteSession}
            disabled={!isActive}
            className={cn(
              "w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-emerald-400 transition-colors",
              !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
            title={isActive ? "Complete Session" : "Start timer to complete session"}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pb-2">
        <p className="text-xs text-muted-foreground font-medium tracking-wide flex items-center gap-1">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground font-mono text-[10px]">Esc</kbd>
          <span>to exit focus mode</span>
        </p>
      </div>
    </div>
  );
};
