import assert from "node:assert";

// 1. Pomodoro interval logic
function getPomodoroDurations(interval) {
    const isLong = interval === "50/10";
    return {
        workSecs: isLong ? 50 * 60 : 25 * 60,
        breakSecs: isLong ? 10 * 60 : 5 * 60,
    };
}

const standard = getPomodoroDurations("25/5");
assert.strictEqual(standard.workSecs, 1500);
assert.strictEqual(standard.breakSecs, 300);

const extended = getPomodoroDurations("50/10");
assert.strictEqual(extended.workSecs, 3000);
assert.strictEqual(extended.breakSecs, 600);

// Early completion elapsed calculation
const timeLeft = 900; // 15 mins remaining on 25m pomo
const elapsed = Math.max(1, standard.workSecs - timeLeft);
assert.strictEqual(elapsed, 600); // 10 mins elapsed

// 2. Project tag breakdown calculation
function calculateTagStats(sessions, activeTag = "work", liveElapsed = 0) {
    const stats = {};
    for (const s of sessions) {
        const tag = s.tag || "general";
        if (!stats[tag]) stats[tag] = { seconds: 0, count: 0 };
        stats[tag].seconds += s.duration;
        stats[tag].count += 1;
    }
    if (liveElapsed > 0) {
        if (!stats[activeTag]) stats[activeTag] = { seconds: 0, count: 0 };
        stats[activeTag].seconds += liveElapsed;
    }
    const totalSecs = Object.values(stats).reduce((acc, c) => acc + c.seconds, 0);
    const list = Object.entries(stats).map(([tag, data]) => ({
        tag,
        minutes: Math.floor(data.seconds / 60),
        count: data.count,
        percentage: totalSecs > 0 ? Math.round((data.seconds / totalSecs) * 100) : 0,
    }));
    list.sort((a, b) => b.minutes - a.minutes);
    return { list, totalMinutes: Math.floor(totalSecs / 60) };
}

const mockSessions = [
    { id: "1", date: "2026-10-28T09:00:00Z", duration: 3600, mode: "POMODORO", tag: "code" },
    { id: "2", date: "2026-10-28T11:00:00Z", duration: 1800, mode: "POMODORO", tag: "study" },
    { id: "3", date: "2026-10-28T14:00:00Z", duration: 5400, mode: "STOPWATCH", tag: "work" },
];

const tagResult = calculateTagStats(mockSessions);
assert.strictEqual(tagResult.totalMinutes, 180); // 1h + 30m + 1.5h = 3h = 180m
assert.strictEqual(tagResult.list[0].tag, "work");
assert.strictEqual(tagResult.list[0].minutes, 90);
assert.strictEqual(tagResult.list[0].percentage, 50);

assert.strictEqual(tagResult.list[1].tag, "code");
assert.strictEqual(tagResult.list[1].minutes, 60);
assert.strictEqual(tagResult.list[1].percentage, 33);

assert.strictEqual(tagResult.list[2].tag, "study");
assert.strictEqual(tagResult.list[2].minutes, 30);
assert.strictEqual(tagResult.list[2].percentage, 17);

// 3. Heatmap intensity level logic
function getHeatmapLevel(minutes, targetMinutes) {
    if (minutes <= 0) return 0;
    const percent = Math.round((minutes / targetMinutes) * 100);
    if (percent >= 100) return 4;
    if (percent >= 60) return 3;
    if (percent >= 25) return 2;
    return 1;
}

const target = 120;
assert.strictEqual(getHeatmapLevel(0, target), 0);
assert.strictEqual(getHeatmapLevel(20, target), 1); // 17%
assert.strictEqual(getHeatmapLevel(40, target), 2); // 33%
assert.strictEqual(getHeatmapLevel(80, target), 3); // 67%
assert.strictEqual(getHeatmapLevel(120, target), 4); // 100%
assert.strictEqual(getHeatmapLevel(150, target), 4); // 125%

// 4. Daily Target Progress calculation
function getDailyProgress(focusMinutes, targetMinutes) {
    const progress = Math.min(100, Math.round((focusMinutes / targetMinutes) * 100));
    const isMet = focusMinutes >= targetMinutes;
    const remaining = Math.max(0, targetMinutes - focusMinutes);
    return { progress, isMet, remaining };
}

const progressUnder = getDailyProgress(75, 120);
assert.strictEqual(progressUnder.progress, 63);
assert.strictEqual(progressUnder.isMet, false);
assert.strictEqual(progressUnder.remaining, 45);

const progressMet = getDailyProgress(130, 120);
assert.strictEqual(progressMet.progress, 100);
assert.strictEqual(progressMet.isMet, true);
assert.strictEqual(progressMet.remaining, 0);

console.log("All core timer self-checks passed successfully.");
