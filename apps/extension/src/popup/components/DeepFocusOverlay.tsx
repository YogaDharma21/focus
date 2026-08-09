import React, { useEffect, useCallback } from "react";
import { Pause, Play, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { AppStateData } from "../../types";

interface DeepFocusOverlayProps {
  state: AppStateData;
  onToggleTimer: () => void;
  onCompleteSession: () => void;
  onSelectDistraction: (category: string) => void;
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
  onExit,
}: DeepFocusOverlayProps) {
  const [showDistractions, setShowDistractions] = React.useState(false);

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
    <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
      {/* Close button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800"
        aria-label="Exit focus mode"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center gap-5">
        {/* Large Timer Display */}
        <div
          className={`text-6xl font-black font-mono tracking-tighter leading-none text-white select-none ${
            state.isActive ? "animate-pulse" : ""
          }`}
        >
          {formatTime(state.timeLeft)}
        </div>

        {/* Session Name */}
        {state.sessionName && (
          <div className="text-sm text-neutral-400 text-center max-w-[280px] px-4 truncate">
            {state.sessionName}
          </div>
        )}

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

      {/* ESC hint */}
      <div className="absolute bottom-5 text-[10px] text-neutral-600 flex items-center gap-1.5">
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-neutral-900 rounded text-[9px] font-mono border border-neutral-800">
          Esc
        </kbd>{" "}
        to exit focus mode
      </div>
    </div>
  );
}
