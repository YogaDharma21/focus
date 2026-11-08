import React, { useState } from 'react';
import { ShieldAlert, X, Pause, XCircle, Loader2, Lock } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import type { ShieldViolation } from '../../lib/shield';
import { BlockedAppIcon, SiteIcon } from './ShieldIcons';

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
  /** Snooze a single item (row X). Falls back to onDismiss when omitted. */
  onSnoozeOne?: (kind: "app" | "site", match: string) => void;
  /** When true, strict mode prevents snoozing or disabling shield during Flow. */
  isStrictLocked?: boolean;
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
  onSnoozeOne,
  isStrictLocked = false,
}) => {
  const handleSnoozeOne = (kind: "app" | "site", match: string) => {
    if (isStrictLocked) return;
    if (onSnoozeOne) onSnoozeOne(kind, match);
    else onDismiss();
  };

  const handleDismiss = () => {
    if (isStrictLocked) return;
    onDismiss();
  };

  const handleDisableShield = () => {
    if (isStrictLocked) return;
    onDisableShield();
  };

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
        {isStrictLocked ? (
          <button
            type="button"
            disabled
            className="p-1.5 rounded-lg text-muted-foreground/40 border border-border/40 bg-secondary/30 cursor-not-allowed flex items-center justify-center"
            title="Locked during active flow session"
            aria-label="Locked during active flow session"
          >
            <Lock className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300 active:scale-95 cursor-pointer"
            title="Snooze for 10 minutes"
            aria-label="Snooze for 10 minutes"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
            <div className="min-w-0 flex items-center gap-2.5 flex-1">
              {v.kind === "app" ? (
                <BlockedAppIcon image={v.process ?? v.match} />
              ) : (
                <SiteIcon site={v.match} />
              )}
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
            </div>
            {v.kind === "app" && (
              <button
                type="button"
                onClick={() => onTerminate(v.kind, v.match, v.process)}
                disabled={terminatingMatch === v.match}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {terminatingMatch === v.match ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                Close app
              </button>
            )}
            {isStrictLocked ? (
              <button
                type="button"
                disabled
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground/40 border border-border/40 bg-secondary/30 cursor-not-allowed flex items-center justify-center"
                title="Locked during active flow session"
                aria-label="Locked during active flow session"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSnoozeOne(v.kind, v.match)}
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300 active:scale-95 cursor-pointer"
                title={`Snooze ${v.match} for 10 minutes`}
                aria-label={`Snooze ${v.match} for 10 minutes`}
              >
                <X className="w-3.5 h-3.5" />
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
        {isStrictLocked
          ? "Shield is locked during Flow. Close the app or site, or pause your timer to continue."
          : "These items are on your Shield blocklist. Detections are logged as distractions for your stats review."}
      </p>

      <div className="flex flex-col gap-2 pt-1 border-t border-border mt-1">
        <div className="flex items-center justify-end gap-2.5 pt-3">
          {isStrictLocked ? (
            <button
              type="button"
              disabled
              title="Locked during active flow session"
              aria-label="Locked during active flow session"
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground/40 bg-secondary/30 border border-border/50 cursor-not-allowed flex items-center gap-1.5 transition-all duration-300"
            >
              <Lock className="w-3.5 h-3.5" />
              Disable Shield
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisableShield}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Disable Shield
            </button>
          )}
          <button
            type="button"
            onClick={onPauseTimer}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              isStrictLocked
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                : "bg-secondary hover:bg-muted border border-border text-foreground"
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
            Pause Timer
          </button>
          {!isStrictLocked && (
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 active:scale-95 cursor-pointer"
            >
              Keep Focusing
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ShieldBlockOverlayProps {
  /** Snooze all violations for 10 minutes ("Keep Focusing" / header X). */
  onSnooze: () => void;
  /** Snooze a single violation row for 10 minutes. */
  onSnoozeOne: (kind: "app" | "site", match: string) => void;
  /** Clear violations without snoozing (pause timer / disable shield). */
  onClear: () => void;
}

/** In-app overlay (renders inside the main Focus window). */
export const ShieldBlockOverlay: React.FC<ShieldBlockOverlayProps> = ({ onSnooze, onSnoozeOne, onClear }) => {
  const {
    shieldViolations,
    resolveShieldViolation,
    setIsActive,
    setShieldEnabled,
    flowTimeElapsed,
    timeLeft,
    timerState,
    isActive,
  } = useDesktopStore();

  const [terminating, setTerminating] = useState<string | null>(null);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  const isStrictLocked = Boolean(isActive && timerState === "FLOW");

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
      // Short main-side quiet period so a lingering process doesn't instantly
      // re-pop the card. Not a snooze: detections resume after ~30s if alive.
      electron.sendShieldOverlayAction('terminate-cooldown', [`${kind}:${match}`]);
      resolveShieldViolation(kind, match);
    } else {
      setTerminateError(result.error ?? "Could not close the app.");
    }
  };

  const handlePauseTimer = () => {
    setIsActive(false);
    // No snooze: resuming the timer re-triggers the overlay while the
    // offender is still present.
    onClear();
  };

  const handleDisableShield = () => {
    if (isStrictLocked) return;
    setShieldEnabled(false);
    onClear();
  };

  const handleSnooze = () => {
    if (isStrictLocked) return;
    onSnooze();
  };

  const handleSnoozeOneItem = (kind: "app" | "site", match: string) => {
    if (isStrictLocked) return;
    onSnoozeOne(kind, match);
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
        onDismiss={handleSnooze}
        onSnoozeOne={handleSnoozeOneItem}
        isStrictLocked={isStrictLocked}
      />
    </div>
  );
};
