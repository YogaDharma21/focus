import assert from "node:assert";

// Pure function version of getEffectiveTimeLeft to test the exact logic
function getEffectiveTimeLeft(state, now = Date.now()) {
  if (!state.isActive) {
    return Math.max(0, state.timeLeft || 0);
  }

  if (state.timerState === "BREAK") {
    if (state.targetEndTime) {
      return Math.max(0, Math.round((state.targetEndTime - now) / 1000));
    }
    return Math.max(0, state.timeLeft || 0);
  }

  if (state.timerAnchorTimestamp) {
    return Math.max(0, Math.floor((now - state.timerAnchorTimestamp) / 1000));
  }

  return Math.max(0, state.timeLeft || 0);
}

const baseTime = 1700000000000;

// 1. Inactive state returns saved timeLeft
const inactiveState = {
  isActive: false,
  timerState: "FLOW",
  timeLeft: 42,
  timerAnchorTimestamp: null,
  targetEndTime: null,
};
assert.strictEqual(getEffectiveTimeLeft(inactiveState, baseTime), 42);

// 2. Active FLOW calculates elapsed time from timerAnchorTimestamp
const activeFlowState = {
  isActive: true,
  timerState: "FLOW",
  timeLeft: 0,
  timerAnchorTimestamp: baseTime - 65000, // 65 seconds ago
  targetEndTime: null,
};
assert.strictEqual(getEffectiveTimeLeft(activeFlowState, baseTime), 65);

// 3. Active BREAK calculates countdown from targetEndTime
const activeBreakState = {
  isActive: true,
  timerState: "BREAK",
  timeLeft: 300,
  timerAnchorTimestamp: null,
  targetEndTime: baseTime + 120000, // 120 seconds in future
};
assert.strictEqual(getEffectiveTimeLeft(activeBreakState, baseTime), 120);

// 4. Active BREAK clamped at 0 when time expires
const expiredBreakState = {
  isActive: true,
  timerState: "BREAK",
  timeLeft: 0,
  timerAnchorTimestamp: null,
  targetEndTime: baseTime - 5000, // 5 seconds in past
};
assert.strictEqual(getEffectiveTimeLeft(expiredBreakState, baseTime), 0);

console.log("Timer anchor assertions passed.");
