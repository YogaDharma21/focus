import assert from "node:assert/strict";
import { sessionsToCsv, sessionsToMarkdown, validateBackupJson } from "./src/index.ts";

const mockSessions = [
  {
    id: "s-1",
    date: "2026-10-31T10:00:00.000Z",
    duration: 1500,
    mode: "STOPWATCH",
    taskId: "t-1",
    taskName: "Fix, \"auth\" bug",
  },
  {
    id: "s-2",
    date: "2026-10-31T11:00:00.000Z",
    duration: 3000,
    mode: "FLOW",
  },
];

const mockDistractions = [
  {
    id: "d-1",
    timestamp: "2026-10-31T10:15:00.000Z",
    category: "social",
  },
];

// Test CSV export
const csv = sessionsToCsv(mockSessions);
assert.match(csv, /^id,date,duration_seconds,duration_minutes,mode,task_id,task_name/);
assert.match(csv, /"Fix, ""auth"" bug"/);
assert.match(csv, /25\.0/); // 1500s -> 25.0 min
assert.match(csv, /50\.0/); // 3000s -> 50.0 min

// Test Markdown summary
const md = sessionsToMarkdown(mockSessions, mockDistractions);
assert.match(md, /# Focus Session Summary/);
assert.match(md, /- Total Sessions: 2/);
assert.match(md, /- Total Focus Time: 75 mins/);
assert.match(md, /- Total Distractions: 1/);
assert.match(md, /Fix, "auth" bug/);

// Test validation
const validPersistJson = JSON.stringify({
  version: 0,
  state: {
    sessions: mockSessions,
  },
});
const result1 = validateBackupJson(validPersistJson);
assert.equal(result1.isValid, true);
assert.equal(Array.isArray(result1.data?.sessions), true);

const validDirectJson = JSON.stringify({
  sessions: mockSessions,
});
const result2 = validateBackupJson(validDirectJson);
assert.equal(result2.isValid, true);

const invalidNoData = JSON.stringify({ foo: "bar" });
const result3 = validateBackupJson(invalidNoData);
assert.equal(result3.isValid, false);

const invalidSyntax = "{ invalid json ";
const result4 = validateBackupJson(invalidSyntax);
assert.equal(result4.isValid, false);

console.log("All data-hub self-tests passed successfully!");
