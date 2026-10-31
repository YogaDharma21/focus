import React, { useMemo, useState, useRef } from "react";
import { Calendar } from "lucide-react";
import { buildAnnualHeatmapGrid, toDateKey } from "@focus/utils";
import { cn } from "../../lib/utils";
import type { Session } from "@focus/types";

interface AnnualHeatmapProps {
  sessions: Session[];
  liveElapsed?: number;
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export const AnnualHeatmap: React.FC<AnnualHeatmapProps> = ({ sessions, liveElapsed = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    dateStr: string;
    minutes: number;
  } | null>(null);

  const dailyMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions) {
      if (!s || !s.date) continue;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) continue;
      const key = toDateKey(d);
      map[key] = (map[key] || 0) + Math.round(s.duration / 60);
    }
    if (liveElapsed > 0) {
      const todayKey = toDateKey(new Date());
      map[todayKey] = (map[todayKey] || 0) + Math.round(liveElapsed / 60);
    }
    return map;
  }, [sessions, liveElapsed]);

  const grid = useMemo(() => buildAnnualHeatmapGrid(dailyMinutes), [dailyMinutes]);

  const getCellColorClass = (intensity: 0 | 1 | 2 | 3 | 4) => {
    switch (intensity) {
      case 1:
        return "bg-emerald-bg";
      case 2:
        return "bg-emerald/40";
      case 3:
        return "bg-emerald/70";
      case 4:
        return "bg-emerald";
      default:
        return "bg-surface-inset";
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Annual Focus</h3>
        </div>
        <span className="text-xs font-mono font-bold text-muted-foreground tabular-nums">
          {grid.activeDays} Active Days
        </span>
      </div>

      <div ref={containerRef} className="relative overflow-x-auto pb-1 pt-1 select-none">
        {/* Floating Tooltip */}
        {hoveredCell && (
          <div
            className="absolute pointer-events-none z-30 px-2 py-1 -translate-x-1/2 -translate-y-full -mt-2 rounded-md bg-secondary border border-border text-[11px] font-medium text-foreground shadow-lg whitespace-nowrap"
            style={{ left: hoveredCell.x, top: hoveredCell.y }}
          >
            <span className="font-semibold tabular-nums">
              {hoveredCell.minutes > 0 ? `${hoveredCell.minutes}m focus` : "No focus"}
            </span>{" "}
            <span className="text-muted-foreground">on {hoveredCell.dateStr}</span>
          </div>
        )}

        <div className="flex gap-2 min-w-max">
          {/* Weekday Row Labels */}
          <div className="flex flex-col gap-[2.5px] pt-4 shrink-0">
            {WEEKDAY_LABELS.map((label, index) => (
              <div
                key={index}
                className="h-[10px] text-[9px] font-medium text-muted-foreground flex items-center justify-end w-6 pr-1 leading-none"
              >
                {label}
              </div>
            ))}
          </div>

          {/* 52-53 Week Columns */}
          <div className="flex gap-[2.5px]">
            {grid.weeks.map((week) => (
              <div key={week.weekIndex} className="flex flex-col gap-[2.5px] items-center">
                {/* Month Label Header */}
                <div className="h-4 text-[9px] font-medium text-muted-foreground flex items-center justify-start w-[10px] leading-none overflow-visible whitespace-nowrap">
                  {week.monthLabel || ""}
                </div>

                {/* 7 Days in Week */}
                {week.days.map((day) => (
                  <div
                    key={day.dateKey}
                    title={`${day.minutes > 0 ? `${day.minutes}m focus` : "No focus"} on ${day.formattedDate}`}
                    className={cn(
                      "w-[10px] h-[10px] rounded-[2px] transition-colors duration-150",
                      day.isValid ? getCellColorClass(day.intensity) : "opacity-0 pointer-events-none",
                      day.isValid && "hover:ring-1 hover:ring-foreground/40 cursor-pointer"
                    )}
                    onMouseEnter={(e) => {
                      if (!day.isValid) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parentRect = containerRef.current?.getBoundingClientRect();
                      if (parentRect) {
                        setHoveredCell({
                          x: rect.left - parentRect.left + rect.width / 2,
                          y: rect.top - parentRect.top,
                          dateStr: day.formattedDate,
                          minutes: day.minutes,
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border-subtle">
        <span className="tabular-nums font-mono">
          {grid.totalHours}h focused across {grid.activeDays} days
        </span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>Less</span>
          <div className="w-[10px] h-[10px] rounded-[2px] bg-surface-inset border border-border-subtle" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-bg" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald/40" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald/70" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
