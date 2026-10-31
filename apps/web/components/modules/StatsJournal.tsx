"use client";

import { useAppStore, Distraction } from "@/lib/store";
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
} from "lucide-react";
import { format } from "date-fns";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DISTRACTION_CATEGORIES = ["Phone", "Social Media", "Bathroom", "Meeting", "Other"];

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

export function StatsJournal() {
    const { sessions, sessionStartTime, isActive, distractions } =
        useAppStore(
            useShallow((s) => ({
                sessions: s.sessions,
                sessionStartTime: s.sessionStartTime,
                isActive: s.isActive,
                distractions: s.distractions,
            }))
        );
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [showHours, setShowHours] = useState(false);

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

    // Calculate streaks
    const { currentStreak, bestStreak } = useMemo(() => {
        if (sessions.length === 0) return { currentStreak: 0, bestStreak: 0 };

        const uniqueDates = Array.from(
            new Set(sessions.map((s) => s.date.split("T")[0])),
        ).sort().reverse();

        let streak = 0;
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const dateStr of uniqueDates) {
            const sessionDate = new Date(dateStr);
            sessionDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

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
            const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentRun++;
                best = Math.max(best, currentRun);
            } else {
                currentRun = 1;
            }
        }

        return { currentStreak: streak, bestStreak: best };
    }, [sessions]);

    // Calculate weekly minutes (Sun - Sat)
    const { weeklyMinutes, maxWeeklyMins } = useMemo(() => {
        const weekly: Record<string, number> = {
            Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
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

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutesPassed = currentHour * 60 + currentMinute;
    const totalMinutesInDay = 24 * 60;
    const dayProgress = Math.round(
        (totalMinutesPassed / totalMinutesInDay) * 100,
    );

    return (
        <div className="h-full flex flex-col gap-6">
            <Card className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-surface-inset rounded-[10px] text-foreground">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-[15px] font-medium tracking-[-0.015em]">
                            Day Progress
                        </span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-foreground">
                        {dayProgress}%
                    </span>
                </div>
                <Progress value={dayProgress} className="h-2 bg-surface-inset" />
                <p className="text-[11px] text-muted-foreground mt-2">
                    {Math.floor((totalMinutesInDay - totalMinutesPassed) / 60)}h{" "}
                    {(totalMinutesInDay - totalMinutesPassed) % 60}m remaining
                    today
                </p>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card
                    className="p-5 flex flex-col justify-between bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px] cursor-pointer hover:bg-surface transition-colors"
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
                    <div className="p-4 border border-dashed border-border rounded-[16px] text-center text-sm text-muted-foreground bg-surface-inset">
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
