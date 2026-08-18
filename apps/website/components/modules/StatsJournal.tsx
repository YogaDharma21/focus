"use client";

import { useAppStore, Distraction } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Activity,
    CheckCircle2,
    List,
    Clock,
    Flame,
    Target,
    BarChart3,
    TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DISTRACTION_CATEGORIES = ["Phone", "Social Media", "Bathroom", "Meeting", "Other"];

const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
        "Phone": "bg-rose-500",
        "Social Media": "bg-rose-500",
        "Bathroom": "bg-rose-500",
        "Meeting": "bg-rose-500",
        "Other": "bg-rose-500",
    };
    return colors[category] || "bg-rose-500";
};

export function StatsJournal() {
    const { sessions, sessionStartTime, isActive, todos, distractions } =
        useAppStore(
            useShallow((s) => ({
                sessions: s.sessions,
                sessionStartTime: s.sessionStartTime,
                isActive: s.isActive,
                todos: s.todos,
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

    const { tasksCompletedToday, tasksPending, completionRate } = useMemo(() => {
        const completedToday = todos.filter(
            (t) =>
                t.completed &&
                t.completedAt &&
                t.completedAt.startsWith(todayStr),
        ).length;
        const pending = todos.filter((t) => !t.completed).length;
        const rate = todos.length > 0
            ? Math.round((todos.filter((t) => t.completed).length / todos.length) * 100)
            : 0;
        return {
            tasksCompletedToday: completedToday,
            tasksPending: pending,
            completionRate: rate,
        };
    }, [todos, todayStr]);

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
            <Card className="p-4 bg-primary/5 border border-primary/10 shadow-sm rounded-[var(--radius)]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-[var(--radius)] text-primary">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">
                            Day Progress
                        </span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                        {dayProgress}%
                    </span>
                </div>
                <Progress value={dayProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                    {Math.floor((totalMinutesInDay - totalMinutesPassed) / 60)}h{" "}
                    {(totalMinutesInDay - totalMinutesPassed) % 60}m remaining
                    today
                </p>
            </Card>

            <div className="grid grid-cols-3 gap-4">
                <Card
                    className="p-4 flex flex-col items-center justify-center gap-2 bg-primary/5 border border-primary/10 shadow-sm rounded-[var(--radius)] cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setShowHours(!showHours)}
                >
                    <div className="p-2 bg-primary/10 border border-primary/20 rounded-[var(--radius)] text-primary mb-1">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">
                        {showHours ? focusHours : focusMinutes}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {showHours ? "Hours Today" : "Minutes Today"}
                    </span>
                </Card>

                <Card className="p-4 flex flex-col items-center justify-center gap-2 bg-primary/5 border border-primary/10 shadow-sm rounded-[var(--radius)]">
                    <div className="p-2 bg-primary/10 border border-primary/20 rounded-[var(--radius)] text-primary mb-1">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">
                        {tasksCompletedToday}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Tasks Today
                    </span>
                </Card>

                <Card className="p-4 flex flex-col items-center justify-center gap-2 bg-primary/5 border border-primary/10 shadow-sm rounded-[var(--radius)]">
                    <div className="p-2 bg-primary/10 border border-primary/20 rounded-[var(--radius)] text-primary mb-1">
                        <List className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{tasksPending}</div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Pending Tasks
                    </span>
                </Card>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Longest Streak */}
                <Card className="p-4 bg-card border border-border/50 shadow-sm flex flex-col gap-3 rounded-[var(--radius)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[var(--radius)] bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm">
                            <Flame className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold tracking-tight text-foreground">Longest Streak</h3>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Current</span>
                            <span className="text-base font-bold">{currentStreak} Days</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Best</span>
                            <span className="text-base font-bold">{bestStreak} Days</span>
                        </div>
                    </div>
                </Card>

                {/* Completion Rate */}
                <Card className="p-4 bg-card border border-border/50 shadow-sm flex flex-col gap-3 rounded-[var(--radius)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[var(--radius)] bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm">
                            <Target className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold tracking-tight text-foreground">Completion Rate</h3>
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                        <div className="text-2xl font-bold">
                            {completionRate}%
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                            Tasks Finished
                        </div>
                    </div>
                </Card>
            </div>

            {/* Weekly Focus Trend Chart */}
            <Card className="p-4 bg-card border border-border/50 shadow-sm flex flex-col rounded-[var(--radius)] space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[var(--radius)] bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold tracking-tight text-foreground">Focus Trend</h3>
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

                                    <span className="text-[10px] font-mono text-muted-foreground">
                                        {minsLogged}m
                                    </span>
                                    <div
                                        className={`w-full rounded-t-md transition-all duration-300 ${
                                            minsLogged > 0
                                                ? "bg-foreground group-hover:bg-foreground/80"
                                                : "bg-muted/40"
                                        }`}
                                        style={{ height: `${heightPercent}%` }}
                                    />
                                    <span className="text-xs font-mono font-bold text-foreground mt-1">
                                        {day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="w-full border-b border-foreground/20" />
                </div>
            </Card>

            <Card className="p-6 bg-card border border-border/50 shadow-sm flex flex-col gap-4 rounded-[var(--radius)]">
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
