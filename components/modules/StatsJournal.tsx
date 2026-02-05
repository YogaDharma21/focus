"use client";

import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Flame, StickyNote, CheckCircle2, List, Clock } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";
import { Progress } from "@/components/ui/progress";

export function StatsJournal() {
    const { notes, setNotes, sessions, sessionStartTime, isActive, todos } =
        useAppStore();
    const [liveElapsed, setLiveElapsed] = useState(0);

    // Stats Calculations
    const today = new Date();

    // Update live elapsed time every second if a session is active
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && sessionStartTime) {
            interval = setInterval(() => {
                const elapsed = Math.floor(
                    (Date.now() - new Date(sessionStartTime).getTime()) / 1000,
                );
                setLiveElapsed(elapsed);
            }, 1000);
        } else {
            setLiveElapsed(0);
        }
        return () => clearInterval(interval);
    }, [isActive, sessionStartTime]);

    const todaysSessions = sessions.filter((s) =>
        isSameDay(parseISO(s.date), today),
    );

    const historicalSeconds = todaysSessions.reduce(
        (acc, s) => acc + s.duration,
        0,
    );
    const totalSeconds = historicalSeconds + liveElapsed;
    const focusMinutes = Math.floor(totalSeconds / 60);

    // Task Stats
    const tasksCompletedToday = todos.filter(
        (t) =>
            t.completed &&
            t.completedAt &&
            isSameDay(parseISO(t.completedAt), today),
    ).length;

    const tasksPending = todos.filter((t) => !t.completed).length;

    // Simple Streak Calculation
    const uniqueDates = Array.from(
        new Set(sessions.map((s) => s.date.split("T")[0])),
    );
    // TODO: Improvement - check consecutive days
    const streak = uniqueDates.length;

    // Day Progress Calculation
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const totalMinutesPassed = currentHour * 60 + currentMinute;
    const totalMinutesInDay = 24 * 60;
    const dayProgress = Math.round((totalMinutesPassed / totalMinutesInDay) * 100);

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Day Progress */}
            <Card className="p-4 bg-primary/5 border-primary/10 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Day Progress</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{dayProgress}%</span>
                </div>
                <Progress value={dayProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                    {Math.floor((totalMinutesInDay - totalMinutesPassed) / 60)}h {(totalMinutesInDay - totalMinutesPassed) % 60}m remaining today
                </p>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 flex flex-col items-center justify-center gap-2 bg-primary/5 border-primary/10 shadow-lg backdrop-blur-sm">
                    <div className="p-2 bg-primary/10 rounded-full text-primary mb-1">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{focusMinutes}</div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Minutes Today
                    </span>
                </Card>

                <Card className="p-4 flex flex-col items-center justify-center gap-2 bg-orange-500/5 border-orange-500/10 shadow-lg backdrop-blur-sm">
                    <div className="p-2 bg-orange-500/10 rounded-full text-orange-500 mb-1">
                        <Flame className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{streak}</div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Day Streak
                    </span>
                </Card>

                <Card className="p-4 flex flex-col items-center justify-center gap-2 bg-green-500/5 border-green-500/10 shadow-lg backdrop-blur-sm">
                    <div className="p-2 bg-green-500/10 rounded-full text-green-500 mb-1">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">
                        {tasksCompletedToday}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Tasks Today
                    </span>
                </Card>

                <Card className="p-4 flex flex-col items-center justify-center gap-2 bg-blue-500/5 border-blue-500/10 shadow-lg backdrop-blur-sm">
                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-500 mb-1">
                        <List className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold">{tasksPending}</div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        Pending Tasks
                    </span>
                </Card>
            </div>

            {/* Notes Section */}
            <Card className="flex-1 p-6 bg-card/50 border-0 shadow-lg backdrop-blur-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-primary" />
                        Quick Notes
                    </h2>
                </div>

                <Textarea
                    placeholder="Brain dump, ideas, or reminders..."
                    className="flex-1 resize-none bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-base"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </Card>
        </div>
    );
}
