import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@focus/utils";

export interface DatePickerPopoverProps {
  value?: string; // ISO format 'YYYY-MM-DD'
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  disabled?: boolean;
  compact?: boolean;
  trigger?: React.ReactNode;
}

export function parseISODate(iso: string): Date {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return new Date();
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateConcise(iso?: string): string {
  if (!iso) return "";
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return iso;
  const [y, m, d] = parts;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = months[m - 1];
  if (y === now.getFullYear()) {
    return `${monthName} ${d}`;
  }
  return `${monthName} ${d}, ${y}`;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePickerPopover({
  value,
  onChange,
  placeholder = "Deadline",
  className,
  align = "right",
  disabled = false,
  compact = false,
  trigger,
}: DatePickerPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const initialDate = React.useMemo(() => {
    return value ? parseISODate(value) : new Date();
  }, [value]);

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  React.useEffect(() => {
    if (value) {
      const d = parseISODate(value);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleSelectDate = (date: Date) => {
    onChange(formatISODate(date));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setIsOpen(false);
  };

  // Calendar grid calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = React.useMemo(() => {
    const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Prev month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      cells.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill 35 or 42 cells
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let day = 1; day <= remaining; day++) {
      cells.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month, firstDayOfWeek, daysInCurrentMonth, daysInPrevMonth]);

  const todayStr = React.useMemo(() => formatISODate(new Date()), []);
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatISODate(d);
  }, []);
  const nextWeekStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatISODate(d);
  }, []);

  const monthLabel = currentMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {trigger ? (
        <div onClick={() => !disabled && setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1.5 h-8 px-2.5 rounded-[10px] text-xs font-medium transition-all duration-300 cursor-pointer active:scale-95 border select-none",
            compact && (value ? "h-7 px-2 rounded-[8px] text-[11px]" : "h-7 w-7 p-0 justify-center rounded-[8px]"),
            value
              ? "bg-surface-inset text-foreground border-white/10"
              : "bg-surface-inset text-muted-foreground hover:text-foreground border-transparent"
          )}
          title={value ? `Deadline: ${value}` : "Set deadline"}
        >
          <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
          {(!compact || value) && <span>{value ? formatDateConcise(value) : placeholder}</span>}
          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 ml-0.5 hover:text-crimson transition-colors"
              title="Clear deadline"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 w-[272px] p-3.5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[16px] text-foreground select-none",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {/* Quick Preset Chips */}
          <div className="flex items-center gap-1 mb-3 pb-2.5 border-b border-border-subtle">
            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setIsOpen(false);
              }}
              className={cn(
                "flex-1 py-1 rounded-[8px] text-[11px] font-medium transition-all duration-200 cursor-pointer active:scale-95 text-center",
                value === todayStr
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-surface-inset text-muted-foreground hover:text-foreground"
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(tomorrowStr);
                setIsOpen(false);
              }}
              className={cn(
                "flex-1 py-1 rounded-[8px] text-[11px] font-medium transition-all duration-200 cursor-pointer active:scale-95 text-center",
                value === tomorrowStr
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-surface-inset text-muted-foreground hover:text-foreground"
              )}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(nextWeekStr);
                setIsOpen(false);
              }}
              className={cn(
                "flex-1 py-1 rounded-[8px] text-[11px] font-medium transition-all duration-200 cursor-pointer active:scale-95 text-center",
                value === nextWeekStr
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-surface-inset text-muted-foreground hover:text-foreground"
              )}
            >
              +7d
            </button>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 rounded-[8px] text-[11px] font-medium text-crimson hover:bg-crimson-bg transition-all duration-200 cursor-pointer active:scale-95"
                title="Clear"
              >
                Clear
              </button>
            )}
          </div>

          {/* Month Header Navigation */}
          <div className="flex items-center justify-between mb-2 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-surface-inset transition-all duration-200 cursor-pointer active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium tracking-tight">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-surface-inset transition-all duration-200 cursor-pointer active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div
            className="grid grid-cols-7 gap-1 mb-1 text-center"
            style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
          >
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground/70 py-1"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div
            className="grid grid-cols-7 gap-1"
            style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
          >
            {calendarCells.map((cell, idx) => {
              const cellStr = formatISODate(cell.date);
              const isSelected = value === cellStr;
              const isToday = todayStr === cellStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDate(cell.date)}
                  className={cn(
                    "h-7 w-7 mx-auto rounded-[8px] text-xs font-mono tabular-nums flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 relative",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : isToday
                      ? "border border-primary/40 text-foreground font-medium hover:bg-surface-inset"
                      : cell.isCurrentMonth
                      ? "text-foreground hover:bg-surface-inset"
                      : "text-subtle-foreground/40 hover:bg-surface-inset/50"
                  )}
                >
                  {cell.date.getDate()}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
