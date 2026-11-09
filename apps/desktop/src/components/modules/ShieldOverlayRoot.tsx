import React, { useEffect, useRef, useState } from 'react';
import { electron } from '../../lib/electron';
import { useDesktopStore } from '../../lib/store';
import type { ShieldViolation } from '../../lib/shield';
import { ShieldBlockCard } from './ShieldBlockOverlay';

const TERMINATE_GRACE_MS = 15000;

const readStorageSessionState = (): { isActive: boolean; timerState: string } => {
  try {
    const raw =
      localStorage.getItem('focus-desktop-storage-v2') ??
      localStorage.getItem('focus-desktop-storage-v1');
    if (!raw) return { isActive: false, timerState: 'FLOW' };
    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? parsed;
    return {
      isActive: Boolean(state?.isActive),
      timerState: state?.timerState ?? 'FLOW',
    };
  } catch {
    return { isActive: false, timerState: 'FLOW' };
  }
};

/**
 * Root component for the system-wide Shield overlay window
 * (`?overlay=shield`). Runs in its own fullscreen always-on-top window so
 * the warning appears over the blocked app or site, not inside the main
 * Focus window. All timer/shield state mutations are delegated to the main
 * window through the main process.
 */
export const ShieldOverlayRoot: React.FC = () => {
  const [violations, setViolations] = useState<ShieldViolation[]>([]);
  const [terminating, setTerminating] = useState<string | null>(null);
  const [terminateError, setTerminateError] = useState<string | null>(null);
  const terminatedAt = useRef(new Map<string, number>());

  const { isActive: storeActive, timerState: storeTimerState } = useDesktopStore();
  const [storageState, setStorageState] = useState(readStorageSessionState);

  const isActive = storeActive || storageState.isActive;
  const timerState = storeActive ? storeTimerState : storageState.timerState;
  const isStrictLocked = Boolean(isActive && timerState === 'FLOW');

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem('focus-desktop-storage-v2') ??
        localStorage.getItem('focus-desktop-storage-v1');
      const theme = raw ? JSON.parse(raw)?.state?.theme : 'dark';
      document.documentElement.classList.toggle('dark', theme !== 'light');
    } catch {
      document.documentElement.classList.add('dark');
    }
    document.body.style.background = 'transparent';

    const handleStorage = () => {
      setStorageState(readStorageSessionState());
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);

    const cleanupViolation = electron.onShieldViolation((violation) => {
      setStorageState(readStorageSessionState());
      const key = `${violation.kind}:${violation.match}`;
      const cooledDown = Date.now() - (terminatedAt.current.get(key) ?? 0) < TERMINATE_GRACE_MS;
      if (cooledDown) return;
      // Upsert: re-reports move the offender to the end (latest), which is
      // also the window the main process just positioned the overlay over.
      setViolations((prev) => {
        const rest = prev.filter((v) => !(v.kind === violation.kind && v.match === violation.match));
        return [...rest.slice(-9), violation];
      });
    });

    return () => {
      cleanupViolation();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
    };
  }, []);

  const handleTerminate = async (kind: "app" | "site", match: string, process?: string) => {
    if (kind !== "app") return;
    setTerminating(match);
    setTerminateError(null);
    const result = await electron.terminateBlockedProcess(process ?? match);
    setTerminating(null);
    if (result.success) {
      terminatedAt.current.set(`${kind}:${match}`, Date.now());
      electron.sendShieldOverlayAction('terminate-cooldown', [`${kind}:${match}`]);
      setViolations((prev) => prev.filter((v) => !(v.kind === kind && v.match === match)));
    } else {
      setTerminateError(result.error ?? "Could not close the app.");
    }
  };

  if (violations.length === 0) return null;

  const violationKeys = violations.map((v) => `${v.kind}:${v.match}`);
  // Latest offender first: matches the window the overlay is covering.
  const ordered = [...violations].reverse();

  const handleSnoozeOne = (kind: "app" | "site", match: string) => {
    if (isStrictLocked) return;
    setViolations((prev) => prev.filter((v) => !(v.kind === kind && v.match === match)));
    electron.sendShieldOverlayAction('dismiss', [`${kind}:${match}`]);
  };

  return (
    <div className="w-screen h-screen bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 select-none font-sans">
      <ShieldBlockCard
        violations={ordered}
        onTerminate={handleTerminate}
        terminatingMatch={terminating}
        terminateError={terminateError}
        onPauseTimer={() => electron.sendShieldOverlayAction('pause-timer')}
        onDisableShield={() => {
          if (isStrictLocked) return;
          electron.sendShieldOverlayAction('disable-shield');
        }}
        onDismiss={() => {
          if (isStrictLocked) return;
          electron.sendShieldOverlayAction('dismiss', violationKeys);
        }}
        onSnoozeOne={handleSnoozeOne}
        isStrictLocked={isStrictLocked}
      />
    </div>
  );
};
