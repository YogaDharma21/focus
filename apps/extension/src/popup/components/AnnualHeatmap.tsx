import React, { useMemo, useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { buildAnnualHeatmapGrid, toDateKey, cn } from "@focus/utils";
import type { Session } from "../../types";

interface AnnualHeatmapProps {
  sessions?: Session[];
  liveElapsed?: number;
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export const AnnualHeatmap: React.FC<AnnualHeatmapProps> = ({
  sessions,
  liveElapsed = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    dateStr: string;
    minutes: number;
  } | null>(null);

  const dailyMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of (sessions || [])) {
      if (!s || !s.date) continue;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) continue;
      const key = toDateKey(d);
      map[key] = (map[key] || 0) + Math.round((s.duration || 0) / 60);
    }
    if (liveElapsed > 0) {
      const todayKey = toDateKey(new Date());
      map[todayKey] = (map[todayKey] || 0) + Math.round(liveElapsed / 60);
    }
    return map;
  }, [sessions, liveElapsed]);

  const grid = useMemo(() => buildAnnualHeatmapGrid(dailyMinutes), [dailyMinutes]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, []);

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

  const cardWidth = cardRef.current?.clientWidth ?? 380;

  return (
    <div
      ref={cardRef}
      className="p-3 rounded-xl border bg-card border-border flex flex-col gap-2.5 relative select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-secondary border border-border text-foreground flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-foreground" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
            Annual Focus
          </span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
          {grid.activeDays} active days
        </span>
      </div>

      {/* Floating Tooltip */}
      {hoveredCell && (
        <div
          className="absolute pointer-events-none z-30 px-2 py-1 -translate-x-1/2 -translate-y-full -mt-1.5 rounded-md bg-secondary border border-border text-[11px] font-mono text-foreground shadow-lg whitespace-nowrap"
          style={{
            left: Math.max(65, Math.min(cardWidth - 65, hoveredCell.x)),
            top: hoveredCell.y,
          }}
        >
          <span className="font-bold tabular-nums">
            {hoveredCell.minutes > 0 ? `${hoveredCell.minutes}m focus` : "No focus"}
          </span>{" "}
          <span className="text-muted-foreground">on {hoveredCell.dateStr}</span>
        </div>
      )}

      {/* Grid Scroll Container */}
      <div
        ref={containerRef}
        onScroll={() => setHoveredCell(null)}
        className="relative overflow-x-auto pb-1 pt-0.5 select-none"
      >
        <div className="flex gap-1.5 min-w-max">
          {/* Weekday Row Labels */}
          <div className="flex flex-col gap-[2px] pt-3.5 shrink-0">
            {WEEKDAY_LABELS.map((label, index) => (
              <div
                key={index}
                className="h-[9px] text-[8px] font-mono text-muted-foreground flex items-center justify-end w-5 pr-1 leading-none"
              >
                {label}
              </div>
            ))}
          </div>

          {/* 52-53 Week Columns */}
          <div className="flex gap-[2px]">
            {grid.weeks.map((week) => (
              <div
                key={week.weekIndex}
                className="flex flex-col gap-[2px] items-center"
              >
                {/* Month Label Header */}
                <div className="h-3 text-[8px] font-mono text-muted-foreground flex items-center justify-start w-[9px] leading-none overflow-visible whitespace-nowrap">
                  {week.monthLabel || ""}
                </div>

                {/* 7 Days in Week */}
                {week.days.map((day) => (
                  <div
                    key={day.dateKey}
                    title={`${day.minutes > 0 ? `${day.minutes}m focus` : "No focus"} on ${day.formattedDate}`}
                    className={cn(
                      "w-[9px] h-[9px] rounded-[1.5px] transition-colors duration-150",
                      day.isValid
                        ? getCellColorClass(day.intensity)
                        : "opacity-0 pointer-events-none",
                      day.isValid &&
                        "hover:ring-1 hover:ring-foreground/50 cursor-pointer"
                    )}
                    onMouseEnter={(e) => {
                      if (!day.isValid) return;
                      const cellRect = e.currentTarget.getBoundingClientRect();
                      const cardRect = cardRef.current?.getBoundingClientRect();
                      if (cardRect) {
                        setHoveredCell({
                          x: cellRect.left - cardRect.left + cellRect.width / 2,
                          y: cellRect.top - cardRect.top,
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
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border-subtle">
        <span className="tabular-nums font-mono text-[10px]">
          {grid.totalHours}h focused across {grid.activeDays} days
        </span>
        <div className="flex items-center gap-1.5 text-[9px] font-mono">
          <span>Less</span>
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-surface-inset border border-border-subtle" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald-bg" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald/40" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald/70" />
          <div className="w-[9px] h-[9px] rounded-[1.5px] bg-emerald" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
