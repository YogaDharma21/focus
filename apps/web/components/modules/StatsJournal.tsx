"use client";

import { useAppStore, Distraction, Session } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Activity,
    Clock,
    Flame,
    BarChart3,
    TrendingUp,
    Target,
    Tag,
    Calendar,
    CheckCircle2,
} from "lucide-react";
import { format, subDays, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DISTRACTION_CATEGORIES = ["Phone", "Social Media", "Bathroom", "Meeting", "Other"];
const TARGET_PRESETS = [60, 120, 180, 240];

const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
        "Phone": "bg-crimson",
        "Social Media": "bg-crimson",
        "Bathroom": "bg-blue",
        "Meeting": "bg-amber",
        "Other": "bg-muted-foreground",
    };
    return colors[category] || "bg-crimson";
};

const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
        case "work":
            return {
                text: "text-amber",
                bg: "bg-amber-bg",
                bar: "bg-amber",
                border: "border-amber/30",
            };
        case "study":
            return {
                text: "text-blue",
                bg: "bg-blue-bg",
                bar: "bg-blue",
                border: "border-blue/30",
            };
        case "code":
            return {
                text: "text-emerald",
                bg: "bg-emerald-bg",
                bar: "bg-emerald",
                border: "border-emerald/30",
            };
        default:
            return {
                text: "text-foreground",
                bg: "bg-surface-inset",
                bar: "bg-primary",
                border: "border-border",
            };
    }
};

export function StatsJournal() {
    const {
        sessions,
        sessionStartTime,
        isActive,
        distractions,
        dailyTargetMinutes,
        setDailyTargetMinutes,
        activeTag,
    } = useAppStore(
        useShallow((s) => ({
            sessions: s.sessions,
            sessionStartTime: s.sessionStartTime,
            isActive: s.isActive,
            distractions: s.distractions,
            dailyTargetMinutes: s.dailyTargetMinutes ?? 120,
            setDailyTargetMinutes: s.setDailyTargetMinutes,
            activeTag: s.activeTag ?? "work",
        }))
    );

    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [showHours, setShowHours] = useState(false);
    const [hoveredDay, setHoveredDay] = useState<{
        dateStr: string;
        mins: number;
        percent: number;
    } | null>(null);

    useEffect(() => {
        if (!isActive || !sessionStartTime) return;
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, [isActive, sessionStartTime]);

    const liveElapsed = isActive && sessionStartTime
        ? Math.max(0, Math.floor((currentTime - new Date(sessionStartTime).getTime()) / 1000))
        : 0;

    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

    // Distraction stats
    const { totalDistractions, categoryCounts, mostCommon } = useMemo(() => {
        const total = distractions.length;
        const counts: Record<string, number> = {};
        distractions.forEach((d: Distraction) => {
            counts[d.category] = (counts[d.category] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return {
            totalDistractions: total,
            categoryCounts: counts,
            mostCommon: sorted[0],
        };
    }, [distractions]);

    const historicalSeconds = useMemo(() => {
        const todaysSessions = sessions.filter((s) =>
            s.date && s.date.startsWith(todayStr)
        );
        return todaysSessions.reduce((acc, s) => acc + s.duration, 0);
    }, [sessions, todayStr]);

    const totalSeconds = historicalSeconds + liveElapsed;
    const focusMinutes = Math.floor(totalSeconds / 60);
    const focusHours = (totalSeconds / 3600).toFixed(1);

    const targetProgress = Math.min(
        100,
        Math.round((focusMinutes / dailyTargetMinutes) * 100)
    );
    const isTargetMet = focusMinutes >= dailyTargetMinutes;

    // Calculate streaks
    const { currentStreak, bestStreak } = useMemo(() => {
        if (sessions.length === 0) return { currentStreak: 0, bestStreak: 0 };

        const uniqueDates = Array.from(
            new Set(sessions.map((s) => s.date.split("T")[0]))
        ).sort().reverse();

        let streak = 0;
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const dateStr of uniqueDates) {
            const sessionDate = new Date(dateStr);
            sessionDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor(
                (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === streak) {
                streak++;
            } else if (diffDays > streak) {
                break;
            }
        }

        const sortedAsc = [...uniqueDates].sort();
        let best = 1;
        let currentRun = 1;

        for (let i = 1; i < sortedAsc.length; i++) {
            const prev = new Date(sortedAsc[i - 1]);
            const curr = new Date(sortedAsc[i]);
            const diffDays = Math.floor(
                (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 1) {
                currentRun++;
                best = Math.max(best, currentRun);
            } else {
                currentRun = 1;
            }
        }

        return { currentStreak: streak, bestStreak: best };
    }, [sessions]);

    // Categorized Stats by Project Tag
    const tagStats = useMemo(() => {
        const stats: Record<string, { seconds: number; count: number }> = {};

        sessions.forEach((s) => {
            const tag = s.tag || "general";
            if (!stats[tag]) {
                stats[tag] = { seconds: 0, count: 0 };
            }
            stats[tag].seconds += s.duration;
            stats[tag].count += 1;
        });

        // Add live elapsed to current active tag
        if (isActive && liveElapsed > 0) {
            const curTag = activeTag || "work";
            if (!stats[curTag]) {
                stats[curTag] = { seconds: 0, count: 0 };
            }
            stats[curTag].seconds += liveElapsed;
        }

        const totalTaggedSeconds = Object.values(stats).reduce(
            (acc, curr) => acc + curr.seconds,
            0
        );

        const list = Object.entries(stats).map(([tag, data]) => {
            const mins = Math.floor(data.seconds / 60);
            const percent = totalTaggedSeconds > 0
                ? Math.round((data.seconds / totalTaggedSeconds) * 100)
                : 0;
            return {
                tag,
                seconds: data.seconds,
                minutes: mins,
                count: data.count,
                percentage: percent,
            };
        });

        list.sort((a, b) => b.seconds - a.seconds);

        return {
            items: list,
            totalSeconds: totalTaggedSeconds,
            totalMinutes: Math.floor(totalTaggedSeconds / 60),
        };
    }, [sessions, isActive, liveElapsed, activeTag]);

    // GitHub-style Daily Focus Heatmap (Trailing 14 weeks)
    const { heatmapWeeks, monthLabels } = useMemo(() => {
        const numWeeks = 14;
        const totalDays = numWeeks * 7;
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        // Daily seconds map
        const dayMap: Record<string, number> = {};
        sessions.forEach((s) => {
            const dStr = s.date.split("T")[0];
            dayMap[dStr] = (dayMap[dStr] || 0) + s.duration;
        });

        if (isActive && liveElapsed > 0) {
            dayMap[todayStr] = (dayMap[todayStr] || 0) + liveElapsed;
        }

        // Align grid start to Sunday
        const startDate = subDays(endDate, totalDays - 1);
        const gridStart = startOfWeek(startDate, { weekStartsOn: 0 });

        const weeks: Array<Array<{
            date: Date;
            dateStr: string;
            minutes: number;
            level: number;
            percent: number;
            isFuture: boolean;
        }>> = [];

        const months: Array<{ label: string; weekIndex: number }> = [];
        let lastMonth = -1;

        let cursor = new Date(gridStart);

        for (let w = 0; w < numWeeks; w++) {
            const weekDays = [];
            for (let d = 0; d < 7; d++) {
                const dateCopy = new Date(cursor);
                const dStr = format(dateCopy, "yyyy-MM-dd");
                const isFuture = dateCopy.getTime() > today.getTime() && !isSameDay(dateCopy, today);
                const secs = dayMap[dStr] || 0;
                const mins = Math.floor(secs / 60);
                const percent = Math.round((mins / dailyTargetMinutes) * 100);

                let level = 0;
                if (!isFuture && mins > 0) {
                    if (percent >= 100) level = 4;
                    else if (percent >= 60) level = 3;
                    else if (percent >= 25) level = 2;
                    else level = 1;
                }

                weekDays.push({
                    date: dateCopy,
                    dateStr: dStr,
                    minutes: mins,
                    level,
                    percent,
                    isFuture,
                });

                if (d === 0) {
                    const m = dateCopy.getMonth();
                    if (m !== lastMonth) {
                        months.push({
                            label: format(dateCopy, "MMM"),
                            weekIndex: w,
                        });
                        lastMonth = m;
                    }
                }

                cursor = addDays(cursor, 1);
            }
            weeks.push(weekDays);
        }

        return { heatmapWeeks: weeks, monthLabels: months };
    }, [today, todayStr, sessions, isActive, liveElapsed, dailyTargetMinutes]);

    // Calculate weekly minutes (Sun - Sat)
    const { weeklyMinutes, maxWeeklyMins } = useMemo(() => {
        const weekly: Record<string, number> = {
            Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0,
        };

        const currentDayOfWeek = today.getDay();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - currentDayOfWeek);
        sunday.setHours(0, 0, 0, 0);

        DAYS_OF_WEEK.forEach((day, index) => {
            const targetDate = new Date(sunday);
            targetDate.setDate(sunday.getDate() + index);
            const targetStr = format(targetDate, "yyyy-MM-dd");

            const daySessions = sessions.filter(
                (s) => s.date && s.date.startsWith(targetStr)
            );
            const histSecs = daySessions.reduce(
                (acc, s) => acc + s.duration,
                0
            );
            const isTodayTarget = targetStr === todayStr;
            const liveSecs = isTodayTarget ? liveElapsed : 0;
            weekly[day] = Math.floor((histSecs + liveSecs) / 60);
        });

        return {
            weeklyMinutes: weekly,
            maxWeeklyMins: Math.max(120, ...Object.values(weekly)),
        };
    }, [sessions, today, todayStr, liveElapsed]);

    const getCellColorClass = (level: number, isFuture: boolean) => {
        if (isFuture) return "bg-surface-inset/40 border-transparent opacity-30";
        switch (level) {
            case 1:
                return "bg-emerald-bg border border-emerald/20";
            case 2:
                return "bg-emerald/35 border border-emerald/40";
            case 3:
                return "bg-emerald/70 border border-emerald/80";
            case 4:
                return "bg-emerald border border-emerald text-primary-foreground";
            default:
                return "bg-surface-inset border border-border-subtle hover:border-border";
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Daily Target Progress Card */}
            <Card className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-surface-inset rounded-[10px] text-foreground">
                            <Target className="w-4 h-4" />
                        </div>
                        <span className="text-[15px] font-medium tracking-[-0.015em] text-foreground">
                            Daily Target
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isTargetMet ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald bg-emerald-bg px-2.5 py-1 rounded-full border border-emerald/30">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Target Met
                            </span>
                        ) : (
                            <span className="text-sm font-medium tabular-nums text-foreground">
                                {targetProgress}%
                            </span>
                        )}
                    </div>
                </div>

                <Progress
                    value={targetProgress}
                    className="h-2 bg-surface-inset"
                    indicatorClassName={isTargetMet ? "bg-emerald" : "bg-primary"}
                />

                <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground tabular-nums">{focusMinutes}m</span> of{" "}
                        <span className="tabular-nums">{dailyTargetMinutes}m</span> target
                        {!isTargetMet && (
                            <span className="ml-1 tabular-nums">
                                ({dailyTargetMinutes - focusMinutes}m remaining)
                            </span>
                        )}
                    </div>

                    {/* Target Preset Switcher */}
                    <div className="flex items-center gap-1">
                        {TARGET_PRESETS.map((target) => (
                            <button
                                key={target}
                                type="button"
                                onClick={() => setDailyTargetMinutes(target)}
                                className={cn(
                                    "px-2 py-0.5 rounded-[6px] text-[10px] font-mono transition-all duration-300 cursor-pointer active:scale-95 border",
                                    dailyTargetMinutes === target
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-surface-inset text-muted-foreground border-transparent hover:text-foreground"
                                )}
                            >
                                {target}m
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* GitHub-style Heatmap Card */}
            <Card className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] flex flex-col gap-3 rounded-[24px]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">
                            Consistency Heatmap
                        </h3>
                    </div>

                    <div className="text-[11px] text-muted-foreground font-mono tabular-nums">
                        {hoveredDay ? (
                            <span>
                                {hoveredDay.dateStr}: {hoveredDay.mins}m ({hoveredDay.percent}%)
                            </span>
                        ) : (
                            <span>Target: {dailyTargetMinutes}m/day</span>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto pb-2">
                    <div className="min-w-[480px]">
                        {/* Month Labels */}
                        <div className="flex pl-7 text-[9px] font-medium text-muted-foreground h-4 mb-1 relative">
                            {monthLabels.map((m, idx) => (
                                <span
                                    key={idx}
                                    className="absolute"
                                    style={{ left: `${28 + m.weekIndex * 15}px` }}
                                >
                                    {m.label}
                                </span>
                            ))}
                        </div>

                        {/* Grid with Weekday Labels */}
                        <div className="flex gap-1.5 items-start">
                            {/* Weekday indicators */}
                            <div className="flex flex-col gap-1 text-[9px] font-medium text-muted-foreground pr-1 pt-0.5 select-none">
                                <span className="h-3 leading-3">Sun</span>
                                <span className="h-3 leading-3 opacity-0">Mon</span>
                                <span className="h-3 leading-3">Tue</span>
                                <span className="h-3 leading-3 opacity-0">Wed</span>
                                <span className="h-3 leading-3">Thu</span>
                                <span className="h-3 leading-3 opacity-0">Fri</span>
                                <span className="h-3 leading-3">Sat</span>
                            </div>

                            {/* Heatmap Columns */}
                            <div className="flex gap-1">
                                {heatmapWeeks.map((week, wIdx) => (
                                    <div key={wIdx} className="flex flex-col gap-1">
                                        {week.map((cell, dIdx) => (
                                            <div
                                                key={dIdx}
                                                onMouseEnter={() =>
                                                    setHoveredDay({
                                                        dateStr: cell.dateStr,
                                                        mins: cell.minutes,
                                                        percent: cell.percent,
                                                    })
                                                }
                                                onMouseLeave={() => setHoveredDay(null)}
                                                className={cn(
                                                    "w-3 h-3 rounded-[2px] transition-all duration-200 cursor-pointer",
                                                    getCellColorClass(cell.level, cell.isFuture)
                                                )}
                                                title={`${cell.dateStr}: ${cell.minutes} mins (${cell.percent}% of target)`}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-end gap-1.5 mt-3 text-[9px] font-medium text-muted-foreground select-none">
                            <span>Less</span>
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-surface-inset border border-border-subtle" />
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-bg border border-emerald/20" />
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald/35 border border-emerald/40" />
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald/70 border border-emerald/80" />
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald border border-emerald" />
                            <span>More</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Categorized Stats by Project Tag */}
            <Card className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] flex flex-col gap-4 rounded-[24px]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
                            <Tag className="w-4 h-4" />
                        </div>
                        <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">
                            Project Tags Breakdown
                        </h3>
                    </div>
                    {tagStats.totalMinutes > 0 && (
                        <span className="text-xs text-muted-foreground font-mono tabular-nums">
                            {tagStats.totalMinutes}m logged
                        </span>
                    )}
                </div>

                {tagStats.items.length === 0 ? (
                    <div className="p-4 border border-dashed rounded-[16px] text-center text-sm text-muted-foreground bg-surface-inset">
                        No tagged sessions yet. Select a tag on the timer to track stats.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tagStats.items.map((item) => {
                            const colors = getTagColor(item.tag);
                            const hours = (item.minutes / 60).toFixed(1);
                            return (
                                <div key={item.tag} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border",
                                                    colors.bg,
                                                    colors.text,
                                                    colors.border
                                                )}
                                            >
                                                {item.tag}
                                            </span>
                                            <span className="text-muted-foreground text-[11px] tabular-nums">
                                                {item.count} {item.count === 1 ? "session" : "sessions"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono tabular-nums">
                                            <span className="font-medium text-foreground">
                                                {item.minutes >= 60 ? `${hours}h` : `${item.minutes}m`}
                                            </span>
                                            <span className="text-muted-foreground text-[11px]">
                                                ({item.percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                    <Progress
                                        value={item.percentage}
                                        className="h-1.5 bg-surface-inset"
                                        indicatorClassName={colors.bar}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card
                    className="p-5 flex flex-col justify-between bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px] cursor-pointer hover:bg-surface/50 transition-colors"
                    onClick={() => setShowHours(!showHours)}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            {showHours ? "Hours Today" : "Minutes Today"}
                        </span>
                        <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
                            <Activity className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-[22px] font-medium tabular-nums tracking-[-0.03em] text-foreground my-1">
                        {showHours ? focusHours : focusMinutes}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                        Click to toggle units
                    </span>
                </Card>

                {/* Longest Streak */}
                <Card className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] flex flex-col justify-between rounded-[24px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Streak
                        </span>
                        <div className="p-1.5 bg-amber-bg rounded-[10px] text-amber">
                            <Flame className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between my-1">
                        <div>
                            <span className="text-[22px] font-medium tabular-nums tracking-[-0.03em] text-foreground">
                                {currentStreak}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">days current</span>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                {bestStreak}
                            </span>
                            <span className="text-[11px] text-muted-foreground ml-1">best</span>
                        </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                        Consecutive focus days
                    </span>
                </Card>
            </div>

            {/* Weekly Focus Trend Chart */}
            <Card className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] flex flex-col rounded-[24px] space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">Focus Trend</h3>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-end justify-between gap-2 h-24 pt-2">
                        {DAYS_OF_WEEK.map((day) => {
                            const minsLogged = weeklyMinutes[day] || 0;
                            const heightPercent =
                                minsLogged > 0
                                    ? Math.min(100, Math.max(12, Math.round((minsLogged / maxWeeklyMins) * 100)))
                                    : 4;
                            return (
                                <div
                                    key={day}
                                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative cursor-pointer"
                                >
                                    <div className="absolute -top-8 px-2 py-1 rounded text-[10px] font-mono font-bold bg-popover text-popover-foreground border border-border pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-md">
                                        {day}: {minsLogged} mins
                                    </div>

                                    <span className="text-[10px] tabular-nums text-muted-foreground">
                                        {minsLogged}m
                                    </span>
                                    <div
                                        className={`w-full rounded-[2px] transition-all duration-300 ${
                                            minsLogged > 0
                                                ? "bg-primary group-hover:bg-primary/80"
                                                : "bg-surface-inset"
                                        }`}
                                        style={{ height: `${heightPercent}%` }}
                                    />
                                    <span className="text-[10px] font-medium text-muted-foreground mt-1">
                                        {day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="w-full border-b border-border-subtle" />
                </div>
            </Card>

            <Card className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] flex flex-col gap-4 rounded-[24px]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-[var(--radius)] bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        <h2 className="font-semibold text-lg">Distraction Analysis</h2>
                    </div>
                    {totalDistractions > 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                            {totalDistractions} total
                        </span>
                    )}
                </div>

                <div className="text-sm text-muted-foreground">
                    Most common:{" "}
                    <span className="font-medium text-foreground">
                        {totalDistractions > 0 ? mostCommon?.[0] : "None"}
                    </span>{" "}
                    {totalDistractions > 0 &&
                        `(${Math.round(((mostCommon?.[1] || 0) / totalDistractions) * 100)}%)`}
                </div>

                {totalDistractions === 0 ? (
                    <div className="p-4 border border-dashed rounded-[var(--radius)] text-center text-sm text-muted-foreground bg-muted/10">
                        No distractions logged yet. Keep up the deep focus!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {DISTRACTION_CATEGORIES.map((cat) => {
                            const count = categoryCounts[cat] || 0;
                            if (count === 0) return null;
                            const percentage = Math.round((count / totalDistractions) * 100);
                            return (
                                <div key={cat} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{cat}</span>
                                        <span className="text-muted-foreground">
                                            {count} ({percentage}%)
                                        </span>
                                    </div>
                                    <Progress
                                        value={percentage}
                                        className="h-1.5"
                                        indicatorClassName={getCategoryColor(cat)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
