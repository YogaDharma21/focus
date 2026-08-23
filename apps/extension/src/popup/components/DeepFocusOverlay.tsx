import React, { useEffect, useCallback } from "react";
import { Pause, Play, X, CheckCircle2, AlertTriangle, Music, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { AppStateData } from "../../types";

interface DeepFocusOverlayProps {
  state: AppStateData;
  onToggleTimer: () => void;
  onCompleteSession: () => void;
  onSelectDistraction: (category: string) => void;
  onToggleMusic: () => void;
  onSetMusicVolume: (volume: number) => void;
  onResetPomodoroCount?: () => void;
  onExit: () => void;
}

const DISTRACTION_CATEGORIES = [
  "Phone",
  "Social Media",
  "Bathroom",
  "Meeting",
  "Other",
];

export function DeepFocusOverlay({
  state,
  onToggleTimer,
  onCompleteSession,
  onSelectDistraction,
  onToggleMusic,
  onSetMusicVolume,
  onResetPomodoroCount,
  onExit,
}: DeepFocusOverlayProps) {
  const [showDistractions, setShowDistractions] = React.useState(false);
  const [showMusicMenu, setShowMusicMenu] = React.useState(false);

  // ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  const handleDistraction = useCallback(
    (category: string) => {
      onSelectDistraction(category);
      setShowDistractions(false);
    },
    [onSelectDistraction]
  );

  const handleComplete = useCallback(() => {
    onCompleteSession();
  }, [onCompleteSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Top Left Lofi-Beats Music Control */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setShowMusicMenu(!showMusicMenu)}
          className={`h-8 px-2.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-semibold ${
            state.isMusicPlaying
              ? "bg-neutral-800 border-neutral-700 text-white ring-1 ring-neutral-600 shadow"
              : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800/60"
          }`}
          title={state.isMusicPlaying ? "Lofi-Beats: Playing" : "Lofi-Beats: Paused"}
        >
          <Music className={`w-3.5 h-3.5 ${state.isMusicPlaying ? "text-white animate-pulse" : ""}`} />
          <span>Lofi-Beats</span>
          {state.isMusicPlaying && (
            <span className="flex items-center gap-0.5 h-2.5 ml-0.5">
              <span className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-0.5 h-1.5 bg-white rounded-full animate-bounce" />
            </span>
          )}
        </button>

        {showMusicMenu && (
          <div className="absolute top-full left-0 mt-2 w-56 p-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-[200] space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-neutral-200">
                <Music className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs font-semibold">Lofi-Beats</span>
              </div>
              <button
                onClick={onToggleMusic}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                  state.isMusicPlaying
                    ? "bg-white text-black hover:bg-white/90 shadow"
                    : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                }`}
              >
                {state.isMusicPlaying ? (
                  <>
                    <Pause className="w-3 h-3 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" /> Play
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-neutral-800">
              {state.musicVolume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              )}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.musicVolume ?? 0.8}
                onChange={(e) => onSetMusicVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-lg accent-neutral-100 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
        aria-label="Exit focus mode"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center gap-4">
        {/* Pomodoro Cycle & Progress Indicator */}
        {state.timerMode === "POMODORO" && state.previousMode !== "FLOW" && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 shadow-sm animate-in fade-in duration-150 group">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((index) => {
                const currentCycleStep = (state.pomodoroCount || 0) % 4;
                const isCompleted = index < currentCycleStep;
                const isCurrent = index === currentCycleStep && state.timerState === "WORK";
                return (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      isCompleted
                        ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                        : isCurrent
                        ? "bg-white/80 ring-2 ring-white/30 animate-pulse"
                        : "bg-neutral-700"
                    }`}
                    title={`Pomodoro ${index + 1} of 4`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] font-bold text-neutral-300">
              {state.timerState === "BREAK"
                ? ((state.pomodoroCount || 0) % 4 === 0 && (state.pomodoroCount || 0) > 0
                    ? `Long Break (${state.pomodoroSettings.longBreak || 15}m)`
                    : `Short Break (${state.pomodoroSettings.break || 5}m)`)
                : `Pomodoro ${((state.pomodoroCount || 0) % 4) + 1} of 4`}
            </span>
            {(state.pomodoroCount || 0) % 4 !== 0 && onResetPomodoroCount && (
              <button
                type="button"
                onClick={onResetPomodoroCount}
                className="p-0.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Reset pomodoro count to 1 of 4"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}

        {/* Large Timer Display */}
        <div
          className={`text-6xl font-black font-mono tracking-tighter leading-none text-white select-none ${
            state.isActive ? "animate-pulse" : ""
          }`}
        >
          {formatTime(state.timeLeft)}
        </div>

        {/* Session / Selected Task Name */}
        {(() => {
          const selectedTask = state.todos?.find((t) => t.id === state.selectedTodoId);
          const displayTitle = selectedTask ? selectedTask.text : state.sessionName;
          if (!displayTitle) return null;
          return (
            <div className="text-sm font-semibold text-neutral-400 text-center max-w-[280px] px-4 truncate">
              {displayTitle}
            </div>
          );
        })()}

        {/* Control Buttons */}
        <div className="flex items-center gap-3 mt-4">
          {/* Log Distraction */}
          <div className="relative">
            <button
              disabled={!state.isActive}
              onClick={() => {
                if (state.isActive) setShowDistractions(!showDistractions);
              }}
              className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all ${
                !state.isActive
                  ? "border-neutral-800 text-neutral-700 cursor-not-allowed opacity-50"
                  : "border-neutral-700 text-neutral-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10"
              }`}
              title={state.isActive ? "Log Distraction" : "Start timer first"}
            >
              <AlertTriangle className="w-4.5 h-4.5" />
            </button>

            {/* Distraction Picker Dropdown */}
            {showDistractions && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-[200]">
                <div className="flex flex-col gap-0.5">
                  {DISTRACTION_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
                      onClick={() => handleDistraction(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Play / Pause */}
          <button
            onClick={onToggleTimer}
            className="w-14 h-14 rounded-2xl border-2 border-neutral-700 hover:border-white/20 hover:bg-white/5 flex items-center justify-center transition-all"
          >
            {state.isActive ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </button>

          {/* Complete Session */}
          <button
            disabled={!state.isActive}
            onClick={handleComplete}
            className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all ${
              state.isActive
                ? "border-neutral-700 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                : "border-neutral-800 text-neutral-700 opacity-50 cursor-not-allowed"
            }`}
            title={state.isActive ? "Complete Session" : "Start timer first"}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
