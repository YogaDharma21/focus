export type BreakRatio = "1/5" | "1/4" | "1/3";

export const BREAK_RATIO_DIVISORS: Record<BreakRatio, number> = {
  "1/5": 5,
  "1/4": 4,
  "1/3": 3,
};

export function getBreakDuration(durationSeconds: number, ratio: BreakRatio = "1/5"): number {
  const divisor = BREAK_RATIO_DIVISORS[ratio] ?? 5;
  return Math.floor(durationSeconds / divisor);
}
