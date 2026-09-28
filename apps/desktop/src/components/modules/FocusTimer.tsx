import React, { useState } from 'react';
import { playCompletionSound } from '../../lib/sound';
import {
  Play, Pause, RotateCcw, AlertTriangle, Focus, CheckCircle2,
  Clock, Coffee
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import { cn } from '../../lib/utils';

const DISTRACTION_OPTIONS = ["Phone", "Social Media", "Bathroom", "Meeting", "Other"];

export const FocusTimer: React.FC = () => {
  const {
    timeLeft,
    setTimeLeft,
    setTimerState,
    flowTimeElapsed,
    setFlowTimeElapsed,
    timerState,
    isActive,
    setIsActive,
    addSession,
    addDistraction,
    soundEffectEnabled,
    sessionName,
    setSessionName,
    setDeepFocusMode,
    autoStartBreak,
    autoStartFlow,
  } = useDesktopStore();

  const [showDistractionMenu, setShowDistractionMenu] = useState(false);

  const toggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (nextActive) {
      setDeepFocusMode(true);
    }
  };

  const handleCompleteSession = () => {
    setIsActive(false);
    playCompletionSound();

    if (timerState === "BREAK") {
      setFlowTimeElapsed(0);
      setTimeLeft(0);
      setTimerState("FLOW");
      setIsActive(autoStartFlow ?? true);
      setDeepFocusMode(autoStartFlow ?? true);
      return;
    }

    const title = sessionName.trim() || 'Focus Session';

    const durationWorked = Math.max(1, flowTimeElapsed);
    const calculatedBreakSeconds = Math.max(1, Math.floor(durationWorked / 5));

    addSession({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: durationWorked,
      mode: 'STOPWATCH',
      title
    });

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
    setTimeLeft(calculatedBreakSeconds);
    setTimerState("BREAK");
    setIsActive(autoStartBreak ?? true);
    setDeepFocusMode(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setFlowTimeElapsed(0);
    setTimeLeft(0);
    setTimerState("FLOW");
  };

  const formatDisplayTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCustomFocusSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const activeSeconds = timerState === "BREAK" ? timeLeft : flowTimeElapsed;
  const progressPercent = Math.min(100, (flowTimeElapsed / 3600) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-full max-w-2xl mx-auto w-full select-none space-y-6">
      {/* Giant Digital Clock Display */}
      <div className="my-2 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-2 mt-1 mb-0.5">
          {timerState === "BREAK" ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted-foreground shadow-sm">
              <Coffee className="w-3 h-3" />
              <span className="text-[10px] font-bold">Break</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs font-mono text-muted-foreground shadow-sm">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-bold">Flow</span>
            </div>
          )}
        </div>
        <h1 className="text-[100px] md:text-[120px] font-extrabold tracking-tighter text-foreground leading-none font-sans select-none">
          {formatDisplayTime(activeSeconds)}
        </h1>
      </div>

      <div className="w-full max-w-sm relative space-y-2">
        <div className="w-full flex items-center rounded-lg border bg-card transition-colors shadow-sm px-3 py-1.5 relative border-border focus-within:border-foreground">
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onKeyDown={handleCustomFocusSubmit}
            placeholder="Session Goal (Press Enter)..."
            className="flex-1 min-w-0 bg-transparent text-sm text-center font-medium text-foreground placeholder-muted-foreground focus:outline-none px-1 py-1"
          />
        </div>
      </div>

      <div className="w-full max-w-sm h-1.5 bg-muted/80 rounded-full overflow-hidden my-2">
        <div 
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-3 pt-2 relative">
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-2xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center justify-center shadow-md active:scale-95"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDistractionMenu(!showDistractionMenu)}
            disabled={!isActive}
            className={cn(
              "w-12 h-12 rounded-2xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-rose-400 transition-all flex items-center justify-center shadow-md active:scale-95 relative",
              !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
            title={isActive ? "Log Distraction" : "Start timer to log distraction"}
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          {isActive && showDistractionMenu && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-card border border-border rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in zoom-in-95 duration-150">
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
          onClick={toggleTimer}
          className="w-16 h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl transition-all active:scale-95 flex items-center justify-center"
          title={isActive ? "Pause" : "Start"}
        >
          {isActive ? (
            <Pause className="w-6 h-6 fill-primary-foreground text-primary-foreground" />
          ) : (
            <Play className="w-6 h-6 fill-primary-foreground text-primary-foreground ml-0.5" />
          )}
        </button>

        <button
          onClick={handleCompleteSession}
          disabled={!isActive}
          className={cn(
            "w-12 h-12 rounded-2xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-emerald-400 transition-all flex items-center justify-center shadow-md active:scale-95",
            !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
          )}
          title={isActive ? "Finish / Complete Session" : "Start timer to complete session"}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setDeepFocusMode(true)}
          className="w-12 h-12 rounded-2xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center justify-center shadow-md active:scale-95"
          title="Deep Focus Mode"
        >
          <Focus className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
