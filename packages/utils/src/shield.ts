import type { ShieldConfig, ShieldSchedule } from "@focus/types";

export const DEFAULT_SHIELD_SCHEDULES: ShieldSchedule[] = [
  {
    id: "work-hours",
    name: "Work Hours",
    enabled: false,
    start: "09:00",
    end: "17:00",
    days: [1, 2, 3, 4, 5],
  },
];

export function isScheduleActive(
  schedules?: ShieldSchedule[] | null,
  now: Date = new Date(),
): boolean {
  if (!schedules || schedules.length === 0) return false;
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return schedules.some((rule) => {
    if (!rule.enabled) return false;
    if (rule.days && rule.days.length > 0 && !rule.days.includes(currentDay)) {
      return false;
    }
    const [startH, startM] = (rule.start || "09:00").split(":").map(Number);
    const [endH, endM] = (rule.end || "17:00").split(":").map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
      return false;
    }
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (startTotal <= endTotal) {
      return currentMinutes >= startTotal && currentMinutes < endTotal;
    } else {
      return currentMinutes >= startTotal || currentMinutes < endTotal;
    }
  });
}

export function getActiveSchedule(
  schedules?: ShieldSchedule[] | null,
  now: Date = new Date(),
): ShieldSchedule | null {
  if (!schedules || schedules.length === 0) return null;
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const rule of schedules) {
    if (!rule.enabled) continue;
    if (rule.days && rule.days.length > 0 && !rule.days.includes(currentDay)) {
      continue;
    }
    const [startH, startM] = (rule.start || "09:00").split(":").map(Number);
    const [endH, endM] = (rule.end || "17:00").split(":").map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
      continue;
    }
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    const matches =
      startTotal <= endTotal
        ? currentMinutes >= startTotal && currentMinutes < endTotal
        : currentMinutes >= startTotal || currentMinutes < endTotal;

    if (matches) return rule;
  }
  return null;
}

export function isBlocklistLocked(
  shield: { strictMode?: boolean } | null | undefined,
  isActive: boolean,
  timerState: string,
): boolean {
  return Boolean(shield?.strictMode && isActive && timerState === "FLOW");
}

export function isBlockingRequired(
  shield: (ShieldConfig & { blockedApps?: string[] }) | boolean,
  isActive: boolean,
  timerState: string,
  now: Date = new Date(),
): boolean {
  if (typeof shield === "boolean") {
    return shield && isActive && timerState === "FLOW";
  }
  const inSchedule = isScheduleActive(shield.schedules, now);
  const isEnabled = shield.enabled || inSchedule;
  const inFlow = isActive && timerState === "FLOW";
  return isEnabled && (inFlow || inSchedule);
}
