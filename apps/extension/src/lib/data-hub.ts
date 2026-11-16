import {
  sessionsToCsv,
  sessionsToMarkdown,
  downloadFile,
  validateBackupJson,
  type SessionRecord,
  type DistractionRecord,
  type BackupPayload,
} from "@focus/utils";
import {
  exportFullBackup,
  restoreFullBackup,
  replaceStoredState,
} from "./storage";
import type { AppStateData } from "../types";

export {
  sessionsToCsv,
  sessionsToMarkdown,
  downloadFile,
  validateBackupJson,
  exportFullBackup,
  restoreFullBackup,
  replaceStoredState,
};

export type { SessionRecord, DistractionRecord, BackupPayload };

/**
 * Downloads a complete JSON backup file for the extension.
 */
export async function downloadBackupJson(): Promise<void> {
  const json = await exportFullBackup();
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(json, `focus-extension-backup-${dateStr}.json`, "application/json");
}

/**
 * Downloads a CSV file with session history.
 */
export function downloadSessionsCsv(sessions: SessionRecord[]): void {
  const csv = sessionsToCsv(sessions);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `focus-extension-sessions-${dateStr}.csv`, "text/csv;charset=utf-8");
}

/**
 * Downloads a Markdown summary of sessions and distractions.
 */
export function downloadSessionsMarkdown(
  sessions: SessionRecord[],
  distractions?: DistractionRecord[]
): void {
  const md = sessionsToMarkdown(sessions, distractions);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(md, `focus-extension-summary-${dateStr}.md`, "text/markdown;charset=utf-8");
}
