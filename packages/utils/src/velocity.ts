export type VelocityStatus =
  | "exceeded"
  | "completed-on-time"
  | "approaching"
  | "on-track";

/**
 * Formats task duration in minutes to human-readable string: e.g. 45m, 1h, 1h 15m.
 */
export function formatTaskDuration(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  if (safeMinutes < 60) {
    return `${safeMinutes}m`;
  }
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Computes total actual focus time in minutes from recorded sessions for a task.
 */
export function getTaskActualMinutes(
  sessions: Array<{ taskId?: string; duration: number }>,
  taskId: string
): number {
  if (!sessions || !taskId) return 0;
  const totalSeconds = sessions
    .filter((s) => s.taskId === taskId)
    .reduce((sum, s) => sum + (s.duration || 0), 0);
  return Math.round(totalSeconds / 60);
}

/**
 * Evaluates velocity status relative to estimated minutes.
 */
export function getVelocityStatus(
  actualMinutes: number,
  estimatedMinutes: number,
  completed: boolean
): VelocityStatus {
  if (actualMinutes > estimatedMinutes) {
    return "exceeded";
  }
  if (completed) {
    return "completed-on-time";
  }
  if (actualMinutes >= estimatedMinutes * 0.8) {
    return "approaching";
  }
  return "on-track";
}
