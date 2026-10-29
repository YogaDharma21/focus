import assert from "node:assert";

// Self-contained test suite for Shield logic: Strict Mode & Schedule Rules

function isScheduleActive(schedules, now = new Date()) {
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

function isBlocklistLocked(shield, isActive, timerState) {
  return Boolean(shield?.strictMode && isActive && timerState === "FLOW");
}

function isBlockingRequired(shield, isActive, timerState, now = new Date()) {
  if (typeof shield === "boolean") {
    return shield && isActive && timerState === "FLOW";
  }
  const inSchedule = isScheduleActive(shield?.schedules, now);
  const isEnabled = Boolean(shield?.enabled || inSchedule);
  const inFlow = Boolean(isActive && timerState === "FLOW");
  return isEnabled && (inFlow || inSchedule);
}

// 1. Strict Mode Tests
console.log("Running Strict Mode tests...");
const strictShield = {
  enabled: true,
  strictMode: true,
  blockedSites: ["facebook.com"],
  allowedSites: [],
  blockedApps: ["discord.exe"],
};
const normalShield = {
  enabled: true,
  strictMode: false,
  blockedSites: ["facebook.com"],
  allowedSites: [],
  blockedApps: ["discord.exe"],
};

// Strict mode locks when Flow is active
assert.strictEqual(isBlocklistLocked(strictShield, true, "FLOW"), true, "Should lock when Flow is active");
assert.strictEqual(isBlocklistLocked(strictShield, false, "FLOW"), false, "Should not lock when timer is inactive");
assert.strictEqual(isBlocklistLocked(strictShield, true, "BREAK"), false, "Should not lock during BREAK");
assert.strictEqual(isBlocklistLocked(normalShield, true, "FLOW"), false, "Should not lock if strictMode is false");

// 2. Schedule Rules Tests
console.log("Running Schedule Rules tests...");
const workHoursSchedule = [
  {
    id: "work-hours",
    name: "Work Hours",
    enabled: true,
    start: "09:00",
    end: "17:00",
    days: [1, 2, 3, 4, 5], // Mon-Fri
  },
];

// Wednesday 10:30 AM (in schedule)
const wednesdayWorkHour = new Date("2026-10-28T10:30:00");
assert.strictEqual(isScheduleActive(workHoursSchedule, wednesdayWorkHour), true, "Wed 10:30 should be in schedule");

// Wednesday 18:30 (outside schedule)
const wednesdayEvening = new Date("2026-10-28T18:30:00");
assert.strictEqual(isScheduleActive(workHoursSchedule, wednesdayEvening), false, "Wed 18:30 should be outside schedule");

// Sunday 11:00 AM (day not in schedule)
const sundayMorning = new Date("2026-10-25T11:00:00");
assert.strictEqual(isScheduleActive(workHoursSchedule, sundayMorning), false, "Sunday should not match Mon-Fri schedule");

// Overnight schedule (22:00 to 06:00)
const nightSchedule = [
  {
    id: "night",
    enabled: true,
    start: "22:00",
    end: "06:00",
    days: [0, 1, 2, 3, 4, 5, 6],
  },
];
const midnight = new Date("2026-10-28T02:00:00");
const noon = new Date("2026-10-28T12:00:00");
assert.strictEqual(isScheduleActive(nightSchedule, midnight), true, "02:00 should match 22:00-06:00");
assert.strictEqual(isScheduleActive(nightSchedule, noon), false, "12:00 should not match 22:00-06:00");

// 3. Combined Enforcement Tests
console.log("Running Combined Enforcement tests...");
const scheduledShield = {
  enabled: false, // master toggle OFF, but schedule is ON
  schedules: workHoursSchedule,
};

// Auto-enable shield during schedule
assert.strictEqual(
  isBlockingRequired(scheduledShield, false, "FLOW", wednesdayWorkHour),
  true,
  "Should enforce during schedule even if timer inactive and shield disabled"
);

// Outside schedule without flow -> no blocking
assert.strictEqual(
  isBlockingRequired(scheduledShield, false, "FLOW", wednesdayEvening),
  false,
  "Should not enforce outside schedule when timer inactive"
);

// Flow session active with shield enabled -> enforces even outside schedule
const activeShield = {
  enabled: true,
  schedules: workHoursSchedule,
};
assert.strictEqual(
  isBlockingRequired(activeShield, true, "FLOW", wednesdayEvening),
  true,
  "Flow session should enforce even outside schedule"
);

console.log("All Shield tests passed successfully.");
