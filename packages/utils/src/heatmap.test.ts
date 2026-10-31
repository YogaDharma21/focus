import assert from "node:assert";
import { buildAnnualHeatmapGrid, getIntensityTier, toDateKey } from "./heatmap.ts";

// Test 1: Intensity tiers
assert.strictEqual(getIntensityTier(0), 0);
assert.strictEqual(getIntensityTier(15), 1);
assert.strictEqual(getIntensityTier(29), 1);
assert.strictEqual(getIntensityTier(30), 2);
assert.strictEqual(getIntensityTier(59), 2);
assert.strictEqual(getIntensityTier(60), 3);
assert.strictEqual(getIntensityTier(119), 3);
assert.strictEqual(getIntensityTier(120), 4);
assert.strictEqual(getIntensityTier(300), 4);

// Test 2: 365 days verification
const anchor = new Date("2026-10-31T12:00:00Z");
const grid = buildAnnualHeatmapGrid({}, anchor);
assert.strictEqual(grid.totalDays, 365, "Must cover exactly 365 days");
assert.ok(grid.weeks.length >= 52 && grid.weeks.length <= 53, "Must have 52-53 weeks");

// Each week must have exactly 7 days
for (const week of grid.weeks) {
  assert.strictEqual(week.days.length, 7, "Each week column must have 7 days");
}

// Test 3: Daily minutes accumulation and active days
const oct31 = toDateKey(anchor);
const sampleData = {
  [oct31]: 75,
};
const gridWithData = buildAnnualHeatmapGrid(sampleData, anchor);
assert.strictEqual(gridWithData.activeDays, 1);
assert.strictEqual(gridWithData.totalMinutes, 75);
assert.strictEqual(gridWithData.totalHours, "1.3");

console.log("Heatmap verification checks passed successfully.");
