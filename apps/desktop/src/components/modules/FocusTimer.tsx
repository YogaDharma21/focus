import React, { useState, useEffect, useRef } from 'react';
import { playCompletionSound } from '../../lib/sound';
import {
  Play, Pause, RotateCcw, AlertTriangle, Focus, CheckCircle2,
  Clock, Coffee, Target, X
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import { cn } from '../../lib/utils';

function formatBreakDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) {
    return `${mins} minute${mins === 1 ? '' : 's'} ${secs} second${secs === 1 ? '' : 's'}`;
  }
  if (mins > 0) {
    return `${mins} minute${mins === 1 ? '' : 's'}`;
  }
  return `${secs} second${secs === 1 ? '' : 's'}`;
}

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
    setDeepFocusMode,
    autoStartBreak,
    autoStartFlow,
    tasks,
    selectedTaskId,
    setSelectedTaskId,
  } = useDesktopStore();

  const [showDistractionMenu, setShowDistractionMenu] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const prevTimerStateRef = useRef(timerState);
  const prevIsActiveRef = useRef(isActive);
  const isInitialMountRef = useRef(true);
  const isResetRef = useRef(false);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevTimerStateRef.current = timerState;
      prevIsActiveRef.current = isActive;
      return;
    }

    if (isResetRef.current) {
      isResetRef.current = false;
      prevTimerStateRef.current = timerState;
      prevIsActiveRef.current = isActive;
      return;
    }

    const prevTimerState = prevTimerStateRef.current;
    const prevIsActive = prevIsActiveRef.current;
    let message = '';

    if (prevTimerState === 'FLOW' && timerState === 'BREAK') {
      const timeStr = formatBreakDuration(timeLeft);
      message = `Break started, ${timeStr} remaining.`;
    } else if (prevTimerState === 'BREAK' && timerState === 'FLOW') {
      message = isActive ? 'Break finished. Flow session started.' : 'Break finished.';
    } else if (prevIsActive !== isActive) {
      if (isActive) {
        message = timerState === 'BREAK' ? 'Break resumed.' : (flowTimeElapsed > 0 ? 'Flow session resumed.' : 'Flow session started.');
      } else if (flowTimeElapsed > 0 || timerState === 'BREAK') {
        message = 'Timer paused.';
      }
    }

    if (message && liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }

    prevTimerStateRef.current = timerState;
    prevIsActiveRef.current = isActive;
  }, [timerState, isActive, timeLeft, flowTimeElapsed]);

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

    const durationWorked = Math.max(1, flowTimeElapsed);
    const calculatedBreakSeconds = Math.max(1, Math.floor(durationWorked / 5));

    const focusedTask = tasks.find((t) => t.id === selectedTaskId);
    addSession({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      duration: durationWorked,
      mode: 'STOPWATCH',
      taskId: focusedTask?.id,
      taskName: focusedTask?.text,
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
    isResetRef.current = true;
    setIsActive(false);
    setFlowTimeElapsed(0);
    setTimeLeft(0);
    setTimerState("FLOW");
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "Timer reset.";
    }
  };

  const formatDisplayTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeSeconds = timerState === "BREAK" ? timeLeft : flowTimeElapsed;
  const progressPercent = Math.min(100, (flowTimeElapsed / 3600) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-full max-w-2xl mx-auto w-full select-none space-y-6">
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Giant Digital Clock Display */}
      <div className="my-2 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-1.5 mt-1 mb-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {timerState === "BREAK" ? (
            <>
              <Coffee className="w-3.5 h-3.5" />
              <span>Break</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" />
              <span>Flow</span>
            </>
          )}
        </div>
        <h1
          role="timer"
          aria-label={`${timerState === "BREAK" ? "Break time remaining" : "Flow time elapsed"}: ${formatDisplayTime(activeSeconds)}`}
          className="text-[100px] md:text-[120px] font-extrabold tracking-tighter text-foreground leading-none font-sans select-none"
        >
          {formatDisplayTime(activeSeconds)}
        </h1>

        {/* Focused Task Pill / Selector */}
        {(() => {
          const focused = tasks.find((t) => t.id === selectedTaskId);
          if (focused) {
            return (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border text-xs text-foreground shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] max-w-xs truncate animate-in fade-in duration-300">
                <Target className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{focused.text}</span>
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="text-muted-foreground hover:text-foreground ml-1 p-0.5 rounded cursor-pointer transition-colors"
                  title="Clear focused task"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          }
          const activeTasks = tasks.filter((t) => !t.completed);
          if (activeTasks.length > 0) {
            return (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedTaskId || ""}
                  onChange={(e) => setSelectedTaskId(e.target.value || null)}
                  className="bg-card border border-border text-[11px] text-muted-foreground rounded-full px-3 py-1 focus:outline-none cursor-pointer max-w-[220px] truncate"
                >
                  <option value="" disabled>Link a task to focus...</option>
                  {activeTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.text}
                    </option>
                  ))}
                </select>
              </div>
            );
          }
          return null;
        })()}
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
          aria-label="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDistractionMenu(!showDistractionMenu)}
            disabled={!isActive}
            className={cn(
              "w-12 h-12 rounded-2xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-crimson transition-all flex items-center justify-center shadow-md active:scale-95 relative",
              !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
            )}
            title={isActive ? "Log Distraction" : "Start timer to log distraction"}
            aria-label={isActive ? "Log distraction" : "Start timer to log distraction"}
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
          aria-label={isActive ? "Pause timer" : "Start timer"}
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
            "w-12 h-12 rounded-2xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-emerald transition-all flex items-center justify-center shadow-md active:scale-95",
            !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
          )}
          title={isActive ? "Finish / Complete Session" : "Start timer to complete session"}
          aria-label={isActive ? "Complete session" : "Start timer to complete session"}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setDeepFocusMode(true)}
          className="w-12 h-12 rounded-2xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center justify-center shadow-md active:scale-95"
          title="Deep Focus Mode"
          aria-label="Deep focus mode"
        >
          <Focus className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
