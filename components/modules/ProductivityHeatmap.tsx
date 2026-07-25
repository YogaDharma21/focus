"use client";

import { useAppStore } from "@/lib/store";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import {
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  getDay,
  format,
  parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";

type Level = 0 | 1 | 2 | 3 | 4;

interface HeatmapDay {
  date: Date;
  minutes: number;
  level: Level;
  key: string;
}

const LEVEL_COLORS: Record<Level, string> = {
  0: "bg-muted",
  1: "bg-green-200 dark:bg-green-900/40",
  2: "bg-green-300 dark:bg-green-800/60",
  3: "bg-green-400 dark:bg-green-700/80",
  4: "bg-green-500 dark:bg-green-600",
};

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MIN_YEAR = 2020;

export function ProductivityHeatmap() {
  const { sessions } = useAppStore();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const heatmapData = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

    const dayMap = new Map<string, number>();
    sessions.forEach((session) => {
      const date = parseISO(session.date);
      if (date >= yearStart && date <= yearEnd) {
        const key = format(date, "yyyy-MM-dd");
        dayMap.set(key, (dayMap.get(key) || 0) + session.duration / 60);
      }
    });

    return eachDayOfInterval({ start: yearStart, end: yearEnd }).map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const minutes = dayMap.get(key) || 0;

      let level: Level = 0;
      if (minutes > 0) level = 1;
      if (minutes >= 15) level = 2;
      if (minutes >= 45) level = 3;
      if (minutes >= 90) level = 4;

      return { date: day, minutes, level, key };
    });
  }, [sessions, selectedYear]);

  const weeks = useMemo((): HeatmapDay[][] => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const startDayOfWeek = getDay(yearStart);

    const weeksArray: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        date: new Date(NaN),
        minutes: 0,
        level: 0,
        key: "",
      });
    }

    heatmapData.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(NaN),
          minutes: 0,
          level: 0,
          key: "",
        });
      }
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [heatmapData, selectedYear]);

  const yearStats = useMemo(() => {
    const totalMinutes = heatmapData.reduce((acc, d) => acc + d.minutes, 0);
    const activeDays = heatmapData.filter((d) => d.level > 0).length;
    return { totalMinutes, activeDays };
  }, [heatmapData]);

  const getMonthLabel = (week: HeatmapDay[]): string | null => {
    const monthStart = week.find(
      (d) => !isNaN(d.date.getTime()) && d.date.getDate() === 1,
    );
    return monthStart ? format(monthStart.date, "MMM") : null;
  };

  return (
    <Card className="p-4 bg-primary/5 border-primary/10 shadow-md backdrop-blur-sm rounded-[var(--radius)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/10 rounded-[var(--radius)] text-orange-500">
            <Flame className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium">Productivity Heatmap</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSelectedYear((y) => Math.max(MIN_YEAR, y - 1))}
            disabled={selectedYear <= MIN_YEAR}
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <span className="text-sm font-bold w-12 text-center">
            {selectedYear}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() =>
              setSelectedYear((y) => Math.min(currentYear, y + 1))
            }
            disabled={selectedYear >= currentYear}
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex gap-1">
        <div className="flex flex-col gap-[2px] mr-1 pt-5">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="h-[10px] text-[9px] text-muted-foreground leading-[10px]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-[2px] min-w-fit">
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="flex flex-col gap-[2px]"
              >
                <div className="h-5 text-[9px] text-muted-foreground flex items-start">
                  {getMonthLabel(week)}
                </div>
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    title={
                      !isNaN(day.date.getTime())
                        ? `${format(day.date, "MMM d, yyyy")}: ${Math.round(day.minutes)} min`
                        : ""
                    }
                    className={cn(
                      "w-[10px] h-[10px] rounded-[2px]",
                      LEVEL_COLORS[day.level],
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>{yearStats.activeDays} active days</span>
          <span>
            {(yearStats.totalMinutes / 60).toFixed(1)}h total
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground mr-1">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "w-[10px] h-[10px] rounded-[2px]",
                LEVEL_COLORS[level as Level],
              )}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">More</span>
        </div>
      </div>
    </Card>
  );
}
