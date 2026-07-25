"use client";

import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Flame,
    List,
    Timer,
} from "lucide-react";
import { isSameDay, parseISO, format, addSeconds } from "date-fns";
import { cn } from "@/lib/utils";

export function FocusSessionHistory() {
    const { sessions, distractions } = useAppStore();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const groupedSessions = useMemo(() => {
        const groups: Record<string, typeof sessions> = {};

        const sorted = [...sessions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        sorted.forEach((session) => {
            const sessionDate = parseISO(session.date);
            const dateKey = format(sessionDate, "yyyy-MM-dd");
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(session);
        });

        return groups;
    }, [sessions]);

    const availableDates = useMemo(() => {
        return Object.keys(groupedSessions)
            .map((key) => parseISO(key))
            .sort((a, b) => b.getTime() - a.getTime());
    }, [groupedSessions]);

    const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
    const daysSessions = groupedSessions[selectedDateKey] || [];

    const sessionStats = useMemo(() => {
        const totalSessions = daysSessions.length;
        const totalSeconds = daysSessions.reduce((acc, s) => acc + s.duration, 0);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = (totalSeconds / 3600).toFixed(1);

        let interruptions = 0;
        daysSessions.forEach((session) => {
            const sessionStart = parseISO(session.date);
            const sessionEnd = addSeconds(sessionStart, session.duration);
            const hadDistraction = distractions.some((d) => {
                const distractionTime = parseISO(d.timestamp);
                return (
                    distractionTime >= sessionStart &&
                    distractionTime <= sessionEnd
                );
            });
            if (hadDistraction) interruptions++;
        });

        const avgSeconds = totalSessions > 0 ? Math.round(totalSeconds / totalSessions) : 0;
        const avgMinutes = Math.floor(avgSeconds / 60);
        const avgSecs = avgSeconds % 60;

        return {
            totalSessions,
            totalMinutes,
            totalHours,
            interruptions,
            avgMinutes,
            avgSecs,
        };
    }, [daysSessions, distractions]);

    const formatSessionTime = (dateStr: string, duration: number) => {
        const start = parseISO(dateStr);
        const end = addSeconds(start, duration);
        const startTime = format(start, "HH:mm");
        const endTime = format(end, "HH:mm");
        return `${startTime} - ${endTime}`;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs}s`;
        if (secs === 0) return `${mins}m`;
        return `${mins}m ${secs}s`;
    };

    const isSessionInterrupted = (session: typeof sessions[0]) => {
        const sessionStart = parseISO(session.date);
        const sessionEnd = addSeconds(sessionStart, session.duration);
        return distractions.some((d) => {
            const distractionTime = parseISO(d.timestamp);
            return (
                distractionTime >= sessionStart &&
                distractionTime <= sessionEnd
            );
        });
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4 bg-primary/5 border-primary/10 shadow-md backdrop-blur-sm rounded-[var(--radius)]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-primary/10 rounded-[var(--radius)] text-primary">
                            <List className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">
                            Sessions
                        </span>
                    </div>
                    <div className="text-2xl font-bold">
                        {sessionStats.totalSessions}
                    </div>
                </Card>

                <Card className="p-4 bg-green-500/5 border-green-500/10 shadow-md backdrop-blur-sm rounded-[var(--radius)]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-green-500/10 rounded-[var(--radius)] text-green-500">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">
                            Focus Time
                        </span>
                    </div>
                    <div className="text-2xl font-bold">
                        {sessionStats.totalMinutes}m
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {sessionStats.totalHours}h total
                    </div>
                </Card>

                <Card className="p-4 bg-red-500/5 border-red-500/10 shadow-md backdrop-blur-sm rounded-[var(--radius)]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-[var(--radius)] text-red-500">
                            <XCircle className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">
                            Interruptions
                        </span>
                    </div>
                    <div className="text-2xl font-bold">
                        {sessionStats.interruptions}
                    </div>
                </Card>

                <Card className="p-4 bg-blue-500/5 border-blue-500/10 shadow-md backdrop-blur-sm rounded-[var(--radius)]">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-[var(--radius)] text-blue-500">
                            <Timer className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">
                            Avg Session
                        </span>
                    </div>
                    <div className="text-2xl font-bold">
                        {sessionStats.avgMinutes}m
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {sessionStats.avgSecs}s
                    </div>
                </Card>
            </div>

            {availableDates.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {availableDates.map((date) => {
                        const isSelected = isSameDay(date, selectedDate);
                        return (
                            <button
                                key={format(date, "yyyy-MM-dd")}
                                onClick={() => setSelectedDate(date)}
                                className={cn(
                                    "px-4 py-2 rounded-[var(--radius)] text-sm font-medium transition-all duration-300 whitespace-nowrap",
                                    isSelected
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                                )}
                            >
                                {format(date, "dd MMM")}
                            </button>
                        );
                    })}
                </div>
            )}

            <Card className="flex-1 bg-card/50 border-0 shadow-md backdrop-blur-sm rounded-[var(--radius)] overflow-hidden">
                <ScrollArea className="h-[400px] pr-4">
                    <div className="p-6 space-y-6">
                        {daysSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Flame className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground text-sm">
                                    No sessions recorded for this day
                                </p>
                                <p className="text-muted-foreground/60 text-xs mt-1">
                                    Complete a focus session to see it here
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold">
                                        {format(selectedDate, "dd MMM yyyy")}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {daysSessions.length} session{daysSessions.length !== 1 ? "s" : ""} recorded
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {daysSessions.map((session) => {
                                        const interrupted = isSessionInterrupted(session);
                                        return (
                                            <div
                                                key={session.id}
                                                className="flex items-start gap-3 p-4 rounded-[var(--radius)] bg-secondary/20 border border-white/5 transition-all duration-300 hover:bg-secondary/30"
                                            >
                                                <div className="mt-0.5">
                                                    {interrupted ? (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    ) : (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium truncate">
                                                            {session.name}
                                                        </span>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] uppercase tracking-wider"
                                                        >
                                                            {session.mode === "POMODORO"
                                                                ? "Pomodoro"
                                                                : "Flow"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatSessionTime(session.date, session.duration)}
                                                        </span>
                                                        <span>
                                                            {formatDuration(session.duration)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </Card>
        </div>
    );
}
