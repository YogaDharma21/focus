import test from "node:test";
import assert from "node:assert/strict";
import {
  formatTaskDuration,
  getTaskActualMinutes,
  getVelocityStatus,
} from "./velocity.ts";

test("formatTaskDuration formats minutes into clean strings", () => {
  assert.equal(formatTaskDuration(0), "0m");
  assert.equal(formatTaskDuration(45), "45m");
  assert.equal(formatTaskDuration(60), "1h");
  assert.equal(formatTaskDuration(75), "1h 15m");
  assert.equal(formatTaskDuration(120), "2h");
});

test("getTaskActualMinutes sums durations from matching sessions", () => {
  const sessions = [
    { taskId: "task-1", duration: 1800 },
    { taskId: "task-2", duration: 1200 },
    { taskId: "task-1", duration: 900 },
  ];
  assert.equal(getTaskActualMinutes(sessions, "task-1"), 45);
  assert.equal(getTaskActualMinutes(sessions, "task-2"), 20);
  assert.equal(getTaskActualMinutes(sessions, "task-3"), 0);
});

test("getVelocityStatus accurately evaluates velocity relative to estimate", () => {
  // Over budget
  assert.equal(getVelocityStatus(50, 45, false), "exceeded");
  assert.equal(getVelocityStatus(50, 45, true), "exceeded");

  // Completed on time or under budget
  assert.equal(getVelocityStatus(30, 45, true), "completed-on-time");
  assert.equal(getVelocityStatus(45, 45, true), "completed-on-time");

  // In progress: approaching
  assert.equal(getVelocityStatus(38, 45, false), "approaching");

  // In progress: on track
  assert.equal(getVelocityStatus(15, 45, false), "on-track");
  assert.equal(getVelocityStatus(0, 45, false), "on-track");
});
