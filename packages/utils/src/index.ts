import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export { clsx, type ClassValue };
export * from "./heatmap";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export * from "./audio";
export * from "./break-ratio";

export interface SessionRecord {
  id: string;
  date: string;
  duration: number;
  mode?: string;
  taskId?: string;
  taskName?: string;
}

export interface DistractionRecord {
  id: string;
  timestamp: string;
  category: string;
  website?: string;
  app?: string;
}

export interface BackupPayload {
  version?: number;
  exportedAt?: string;
  sessions?: SessionRecord[];
  distractions?: DistractionRecord[];
  [key: string]: unknown;
}

/**
 * Converts session records to CSV format.
 */
export function sessionsToCsv(sessions: SessionRecord[]): string {
  const headers = ["id", "date", "duration_seconds", "duration_minutes", "mode", "task_id", "task_name"];

  const escapeCell = (val: unknown): string => {
    if (val === undefined || val === null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = (sessions || []).map((s) => [
    escapeCell(s.id),
    escapeCell(s.date),
    escapeCell(s.duration),
    escapeCell((Number(s.duration || 0) / 60).toFixed(1)),
    escapeCell(s.mode || "FLOW"),
    escapeCell(s.taskId),
    escapeCell(s.taskName),
  ].join(","));

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Generates a clean Markdown summary of sessions and distractions.
 */
export function sessionsToMarkdown(
  sessions: SessionRecord[],
  distractions?: DistractionRecord[]
): string {
  const totalSessions = sessions?.length || 0;
  const totalSeconds = (sessions || []).reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgMinutes = totalSessions > 0 ? (totalMinutes / totalSessions).toFixed(1) : "0";
  const totalDistractions = distractions?.length || 0;

  const lines: string[] = [
    "# Focus Session Summary",
    `Exported: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Overview",
    `- Total Sessions: ${totalSessions}`,
    `- Total Focus Time: ${totalMinutes} mins (${totalHours} hrs)`,
    `- Average Session Duration: ${avgMinutes} mins`,
    `- Total Distractions: ${totalDistractions}`,
    "",
    "## Session History",
    "| Date | Duration (min) | Task | Mode |",
    "| :--- | :--- | :--- | :--- |",
  ];

  if (totalSessions === 0) {
    lines.push("| None | 0 | - | - |");
  } else {
    for (const s of sessions) {
      const dateFormatted = s.date ? s.date.replace("T", " ").slice(0, 16) : "-";
      const dur = (Number(s.duration || 0) / 60).toFixed(1);
      const task = s.taskName ? s.taskName.replace(/\|/g, "/") : "-";
      lines.push(`| ${dateFormatted} | ${dur} | ${task} | ${s.mode || "FLOW"} |`);
    }
  }

  return lines.join("\n");
}

/**
 * Triggers a native browser file download using Blob and ObjectURL.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Validates imported JSON string for Focus backup data.
 */
export function validateBackupJson(raw: string): {
  isValid: boolean;
  error?: string;
  data?: Record<string, unknown>;
} {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { isValid: false, error: "Backup file is not a valid JSON object." };
    }

    const state = (parsed.state && typeof parsed.state === "object" && !Array.isArray(parsed.state))
      ? (parsed.state as Record<string, unknown>)
      : (parsed as Record<string, unknown>);

    const hasSessions = Array.isArray(state.sessions);
    const hasTasks = Array.isArray(state.tasks);
    const hasDistractions = Array.isArray(state.distractions);

    if (!hasSessions && !hasTasks && !hasDistractions) {
      return {
        isValid: false,
        error: "Backup file contains no recognizable Focus data (sessions, tasks, or distractions).",
      };
    }

    return { isValid: true, data: state };
  } catch {
    return { isValid: false, error: "Failed to parse JSON file." };
  }
}
