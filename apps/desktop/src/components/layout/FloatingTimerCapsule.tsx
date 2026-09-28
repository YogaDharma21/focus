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
    addDistraction,
    addSession,
    sessionName,
    setSessionName,
    setDeepFocusMode,
    autoStartBreak,
    autoStartFlow,
  } = useDesktopStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showDistractionMenu, setShowDistractionMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      setIsActive(autoStartFlow ?? true);
      setDeepFocusMode(autoStartFlow ?? true);
      setIsExpanded(false);
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
    setIsExpanded(false);
  };

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

  return (
    <div ref={containerRef} className="fixed top-1 left-1/2 -translate-x-1/2 z-50 select-none no-drag flex flex-col items-center">
      {/* Collapsed pill - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all shadow-sm",
          isExpanded
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card border-border text-foreground hover:bg-secondary",
          isActive && "border-foreground/60 ring-1 ring-foreground/30"
        )}
        title="Toggle Floating Timer Controls"
      >
        <span className="flex items-center">
          {timerState === "BREAK" ? <Coffee className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        </span>
        <span className="font-extrabold font-mono text-[11px] tracking-tight">
          {timeString}
        </span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
        )}
      </button>

      {/* Expanded card - matches extension layout */}
      {isExpanded && (
        <div className="w-[360px] bg-card border border-border rounded-2xl p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 relative mt-1.5">
          {/* Top Row: Time + Session name */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center">
                {timerState === "BREAK" ? <Coffee className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </span>
              <span className="text-2xl font-black font-mono tracking-tight tabular-nums">
                {timeString}
              </span>
              {isActive && <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />}
            </div>

            {/* Session name input */}
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Session goal..."
              className="px-2.5 py-1 rounded-lg text-xs font-medium border bg-secondary border-border text-secondary-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground max-w-[180px] truncate"
              title="Session goal"
            />
          </div>

          {/* Bottom Row: Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Complete Session Button */}
            <button
              onClick={handleCompleteSession}
              disabled={!isActive}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                !isActive
                  ? "bg-card border-border text-muted-foreground cursor-not-allowed opacity-50"
                  : "bg-secondary border-border hover:bg-accent text-foreground cursor-pointer"
              )}
              title={isActive ? "Complete Session" : "Start timer to complete session"}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete</span>
            </button>

            {/* Log Distraction Button */}
            <div className="relative">
              <button
                disabled={!isActive}
                onClick={() => {
                  if (!isActive) return;
                  setShowDistractionMenu(!showDistractionMenu);
                }}
                className={cn(
                  "p-2 rounded-xl border transition-all",
                  !isActive
                    ? "bg-card border-border text-muted-foreground cursor-not-allowed opacity-50"
                    : "bg-secondary border-border hover:bg-accent text-muted-foreground"
                )}
                title={isActive ? "Log Distraction" : "Start timer to log distraction"}
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              {isActive && showDistractionMenu && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-card border border-border rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in zoom-in-95 duration-150">
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

            {/* Start / Pause Button */}
            <button
              onClick={handleToggleTimer}
              className="flex-1 py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow bg-primary text-primary-foreground border-primary hover:bg-accent"
            >
              {isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
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
