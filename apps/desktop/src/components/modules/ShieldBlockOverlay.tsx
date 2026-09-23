import React, { useState } from 'react';
import { ShieldAlert, X, Pause, XCircle, Loader2 } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import type { ShieldViolation } from '../../lib/shield';

export interface ShieldBlockCardProps {
  violations: ShieldViolation[];
  /** Omitted in the standalone overlay window (no timer state there). */
  timeString?: string;
  onTerminate: (kind: "app" | "site", match: string, process?: string) => void;
  terminatingMatch: string | null;
  terminateError: string | null;
  onPauseTimer: () => void;
  onDisableShield: () => void;
  onDismiss: () => void;
}

export const ShieldBlockCard: React.FC<ShieldBlockCardProps> = ({
  violations,
  timeString,
  onTerminate,
  terminatingMatch,
  terminateError,
  onPauseTimer,
  onDisableShield,
  onDismiss,
}) => {
  return (
    <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Focus Shield Blocked
            </p>
            <h3 className="text-sm font-bold text-foreground">
              Distraction detected during Flow
            </h3>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Snooze for 10 minutes"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {timeString && (
        <div className="px-4 py-3 rounded-xl bg-secondary/60 border border-border flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-muted-foreground">
            Flow time
          </span>
          <span className="text-base font-bold font-mono text-foreground">{timeString}</span>
        </div>
      )}

      <div className="space-y-2">
        {violations.map((v) => (
          <div
            key={`${v.kind}:${v.match}`}
            className="px-4 py-3 rounded-xl bg-secondary/60 border border-border flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {v.kind === "app" ? (v.process ?? v.match) : v.match}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                {v.kind === "app"
                  ? "Blocked app is running"
                  : v.title ?? "Blocked site detected"}
              </p>
            </div>
            {v.kind === "app" && (
              <button
                onClick={() => onTerminate(v.kind, v.match, v.process)}
                disabled={terminatingMatch === v.match}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                {terminatingMatch === v.match ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Close app
              </button>
            )}
          </div>
        ))}
      </div>

      {terminateError && (
        <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
          {terminateError}
        </p>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        These items are on your Shield blocklist. Detections are logged as
        distractions for your stats review.
      </p>

      <div className="flex flex-col gap-2 pt-1 border-t border-border mt-1">
        <div className="flex items-center justify-end gap-2.5 pt-3">
          <button
            onClick={onDisableShield}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Disable Shield
          </button>
          <button
            onClick={onPauseTimer}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-muted border border-border text-foreground transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause Timer
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95"
          >
            Keep Focusing
          </button>
        </div>
      </div>
    </div>
  );
};

interface ShieldBlockOverlayProps {
  onDismiss: () => void;
}

/** In-app overlay (renders inside the main Focus window). */
export const ShieldBlockOverlay: React.FC<ShieldBlockOverlayProps> = ({ onDismiss }) => {
  const {
    shieldViolations,
    resolveShieldViolation,
    setIsActive,
    setShieldEnabled,
    flowTimeElapsed,
    timeLeft,
    timerState,
  } = useDesktopStore();

  const [terminating, setTerminating] = useState<string | null>(null);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  if (shieldViolations.length === 0) return null;

  const seconds = timerState === "BREAK" ? timeLeft : flowTimeElapsed;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const handleTerminate = async (kind: "app" | "site", match: string, process?: string) => {
    if (kind !== "app") return;
    setTerminating(match);
    setTerminateError(null);
    const result = await electron.terminateBlockedProcess(process ?? match);
    setTerminating(null);
    if (result.success) {
      resolveShieldViolation(kind, match);
    } else {
      setTerminateError(result.error ?? "Could not close the app.");
    }
  };

  const handlePauseTimer = () => {
    setIsActive(false);
    onDismiss();
  };

  const handleDisableShield = () => {
    setShieldEnabled(false);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <ShieldBlockCard
        violations={shieldViolations}
        timeString={timeString}
        onTerminate={handleTerminate}
        terminatingMatch={terminating}
        terminateError={terminateError}
        onPauseTimer={handlePauseTimer}
        onDisableShield={handleDisableShield}
        onDismiss={onDismiss}
      />
    </div>
  );
};
