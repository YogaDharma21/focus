import React, { useState, useRef, useEffect } from 'react';
import { playCompletionSound } from '../../lib/sound';
import { 
  Play, Pause, AlertTriangle, CheckCircle2, Clock, Coffee
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import { cn } from '../../lib/utils';

const DISTRACTION_OPTIONS = ["Phone", "Social Media", "Bathroom", "Meeting", "Other"];

export const FloatingTimerCapsule: React.FC = () => {
  const {
    currentView,
    timeLeft,
    setTimeLeft,
    setTimerState,
    flowTimeElapsed,
    setFlowTimeElapsed,
    timerState,
    isActive,
    setIsActive,
    todos,
    updateTodo,
    selectedTodoId,
    addDistraction,
    addSession,
    sessionName,
    setDeepFocusMode,
  } = useDesktopStore();

  const handleToggleTimer = () => {
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
      setDeepFocusMode(false);
      setIsExpanded(false);
      return;
    }

    const activeTask = todos.find(t => t.id === selectedTodoId);
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
    setTimeLeft(calculatedBreakSeconds);
    setTimerState("BREAK");
    setIsActive(true);
    setDeepFocusMode(false);
    setIsExpanded(false);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [showDistractionMenu, setShowDistractionMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
        setShowDistractionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (currentView === 'FOCUS') return null;

  const activeSeconds = timerState === "BREAK" ? timeLeft : flowTimeElapsed;
  const m = Math.floor(activeSeconds / 60);
  const s = activeSeconds % 60;
  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const activeTask = todos.find(t => t.id === selectedTodoId);

  return (
    <div ref={containerRef} className="fixed top-1 left-1/2 -translate-x-1/2 z-50 select-none no-drag flex flex-col items-center">
      {isActive ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-card border border-emerald-500/80 rounded-full px-3.5 py-1 flex items-center gap-2.5 shadow-md hover:bg-secondary hover:border-emerald-400 transition-all active:scale-98 text-xs group"
        >
          <span className="text-xs flex items-center text-foreground"><Clock className="w-3.5 h-3.5" /></span>
          <span className="text-[11px] font-mono font-bold text-foreground tracking-wider">
            {timeString}
          </span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleToggleTimer();
            }}
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition-all shrink-0 shadow-sm"
            title="Pause Timer"
          />
        </button>
      ) : (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-card border border-border rounded-full px-3 py-1 flex items-center justify-between gap-3 shadow-md hover:bg-secondary hover:border-muted-foreground transition-all active:scale-98 text-xs"
        >
          <div className="flex items-center gap-1.5 min-w-0 text-left">
            <span className="text-xs flex items-center text-foreground">
              {timerState === "BREAK" ? <Coffee className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            </span>
            <span className="text-[11px] font-semibold text-foreground tracking-tight">
              {timerState === "BREAK" ? "Break" : "Flow"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-foreground tracking-wider">
              {timeString}
            </span>
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTimer();
              }}
              className="w-5 h-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center shrink-0 shadow-sm"
              title="Start Timer"
            >
              <Play className="w-3 h-3 fill-primary-foreground ml-0.5" />
            </div>
          </div>
        </button>
      )}

      {isExpanded && (
        <div className="w-[360px] bg-card border border-border rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 relative mt-1.5">
          <div 
            onClick={() => setIsExpanded(false)}
            className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity pb-0.5"
            title="Click to collapse widget"
          >
            <div className="flex items-center gap-2">
              <span className="text-base flex items-center text-foreground">
                {timerState === "BREAK" ? <Coffee className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              </span>
              <span className="text-xs font-bold text-foreground tracking-tight">
                {timerState === "BREAK" ? "Break" : "Flow"}
              </span>
            </div>
            <span className="text-xl font-extrabold font-mono text-foreground tracking-tight">
              {timeString}
            </span>
          </div>

          <div className="border-t border-border pt-0.5" />

          <div>
            <p className="text-xs font-semibold text-foreground truncate">
              {activeTask ? activeTask.text : (sessionName || "General Focus")}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 relative">
            <button
              onClick={handleCompleteSession}
              disabled={!isActive}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border text-[11px] font-medium text-foreground hover:bg-muted transition-colors",
                !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
              )}
              title={isActive ? "Complete Session" : "Start timer to complete session"}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDistractionMenu(!showDistractionMenu)}
                disabled={!isActive}
                className={cn(
                  "w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-rose-400 transition-colors",
                  !isActive && "opacity-40 cursor-not-allowed pointer-events-none"
                )}
                title={isActive ? "Log Distraction" : "Start timer to log distraction"}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
              </button>

              {isActive && showDistractionMenu && (
                <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-40 bg-card border border-border rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in zoom-in-95 duration-150">
                  {DISTRACTION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        addDistraction(opt);
                        setShowDistractionMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-[11px] font-semibold text-foreground hover:bg-secondary transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleToggleTimer}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-[11px] hover:bg-primary/90 transition-colors shadow-sm"
            >
              {isActive ? (
                <>
                  <Pause className="w-3 h-3 fill-primary-foreground" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-primary-foreground ml-0.5" />
                  <span>Start</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
