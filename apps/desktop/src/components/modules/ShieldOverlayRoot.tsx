import React, { useEffect, useRef, useState } from 'react';
import { electron } from '../../lib/electron';
import type { ShieldViolation } from '../../lib/shield';
import { ShieldBlockCard } from './ShieldBlockOverlay';

const TERMINATE_GRACE_MS = 15000;

/**
 * Root component for the system-wide Shield overlay window
 * (`?overlay=shield`). Runs in its own fullscreen always-on-top window so
 * the warning appears over the blocked app or site — not inside the main
 * Focus window. All timer/shield state mutations are delegated to the main
 * window through the main process.
 */
export const ShieldOverlayRoot: React.FC = () => {
  const [violations, setViolations] = useState<ShieldViolation[]>([]);
  const [terminating, setTerminating] = useState<string | null>(null);
  const [terminateError, setTerminateError] = useState<string | null>(null);
  const terminatedAt = useRef(new Map<string, number>());

  useEffect(() => {
    try {
      const raw = localStorage.getItem('focus-desktop-storage-v1');
      const theme = raw ? JSON.parse(raw)?.state?.theme : 'dark';
      document.documentElement.classList.toggle('dark', theme !== 'light');
    } catch {
      document.documentElement.classList.add('dark');
    }
    document.body.style.background = 'transparent';

    return electron.onShieldViolation((violation) => {
      const key = `${violation.kind}:${violation.match}`;
      const cooledDown = Date.now() - (terminatedAt.current.get(key) ?? 0) < TERMINATE_GRACE_MS;
      if (cooledDown) return;
      setViolations((prev) => {
        if (prev.some((v) => v.kind === violation.kind && v.match === violation.match)) {
          return prev;
        }
        return [...prev.slice(-9), violation];
      });
    });
  }, []);

  const handleTerminate = async (kind: "app" | "site", match: string, process?: string) => {
    if (kind !== "app") return;
    setTerminating(match);
    setTerminateError(null);
    const result = await electron.terminateBlockedProcess(process ?? match);
    setTerminating(null);
    if (result.success) {
      terminatedAt.current.set(`${kind}:${match}`, Date.now());
      setViolations((prev) => prev.filter((v) => !(v.kind === kind && v.match === match)));
    } else {
      setTerminateError(result.error ?? "Could not close the app.");
    }
  };

  if (violations.length === 0) return null;

  const violationKeys = violations.map((v) => `${v.kind}:${v.match}`);

  return (
    <div className="w-screen h-screen bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 select-none font-sans">
      <ShieldBlockCard
        violations={violations}
        onTerminate={handleTerminate}
        terminatingMatch={terminating}
        terminateError={terminateError}
        onPauseTimer={() => electron.sendShieldOverlayAction('pause-timer')}
        onDisableShield={() => electron.sendShieldOverlayAction('disable-shield')}
        onDismiss={() => electron.sendShieldOverlayAction('dismiss', violationKeys)}
      />
    </div>
  );
};
