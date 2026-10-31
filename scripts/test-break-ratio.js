import assert from "node:assert";
import { getBreakDuration, BREAK_RATIO_DIVISORS } from "../packages/utils/src/break-ratio.ts";

// 1. Verify divisors dictionary
assert.strictEqual(BREAK_RATIO_DIVISORS["1/5"], 5);
assert.strictEqual(BREAK_RATIO_DIVISORS["1/4"], 4);
assert.strictEqual(BREAK_RATIO_DIVISORS["1/3"], 3);

// 2. 25-minute flow (1500 seconds)
assert.strictEqual(getBreakDuration(1500, "1/5"), 300); // 5 minutes
assert.strictEqual(getBreakDuration(1500, "1/4"), 375); // 6m 15s
assert.strictEqual(getBreakDuration(1500, "1/3"), 500); // 8m 20s

// 3. 50-minute flow (3000 seconds)
assert.strictEqual(getBreakDuration(3000, "1/5"), 600); // 10 minutes
assert.strictEqual(getBreakDuration(3000, "1/4"), 750); // 12m 30s
assert.strictEqual(getBreakDuration(3000, "1/3"), 1000); // 16m 40s

// 4. Default ratio should be 1/5
assert.strictEqual(getBreakDuration(1500), 300);

// 5. Short flow rounding (Math.floor)
assert.strictEqual(getBreakDuration(64, "1/5"), 12);
assert.strictEqual(getBreakDuration(64, "1/4"), 16);
assert.strictEqual(getBreakDuration(64, "1/3"), 21);

// 6. Zero or negligible duration
assert.strictEqual(getBreakDuration(0, "1/5"), 0);
assert.strictEqual(getBreakDuration(4, "1/5"), 0);

console.log("All break ratio verification checks passed!");
