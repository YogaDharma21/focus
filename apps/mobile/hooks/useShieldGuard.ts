import { useCallback } from 'react';
import {
  logBlockedAppAttempt,
  openGuardedUrl,
  useShieldGateStore,
} from '@/lib/shieldGuard';

export function useShieldGuard() {
  const blockedTarget = useShieldGateStore((s) => s.blockedTarget);
  const clearBlocked = useShieldGateStore((s) => s.clearBlocked);

  const openUrl = useCallback((url: string) => openGuardedUrl(url), []);
  const reportAppOpened = useCallback((appId: string) => logBlockedAppAttempt(appId), []);

  return { blockedTarget, clearBlocked, openUrl, reportAppOpened };
}
