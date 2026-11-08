import * as React from "react";
import { Flag, Check } from "lucide-react";
import { cn } from "@focus/utils";
import type { TaskPriority } from "@focus/types";

export interface PriorityPopoverProps {
  value?: TaskPriority;
  onChange: (priority: TaskPriority | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; bg: string; text: string; dot: string }
> = {
  urgent: {
    label: "Urgent",
    bg: "bg-crimson-bg",
    text: "text-crimson",
    dot: "bg-crimson",
  },
  high: {
    label: "High",
    bg: "bg-amber-bg",
    text: "text-amber",
    dot: "bg-amber",
  },
  medium: {
    label: "Medium",
    bg: "bg-blue-bg",
    text: "text-blue",
    dot: "bg-blue",
  },
  low: {
    label: "Low",
    bg: "bg-surface-inset",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low"];

export function PriorityPopover({
  value,
  onChange,
  placeholder = "Priority",
  className,
  align = "left",
  disabled = false,
  trigger,
}: PriorityPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  const handleSelect = (p: TaskPriority) => {
    if (value === p) {
      onChange(undefined);
    } else {
      onChange(p);
    }
    setIsOpen(false);
  };

  const handleCycle = (e: React.MouseEvent) => {
    // If shift key is pressed or secondary click, cycle directly
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const order: Array<TaskPriority | undefined> = [
        undefined,
        "low",
        "medium",
        "high",
        "urgent",
      ];
      const currentIndex = order.indexOf(value);
      const nextIndex = (currentIndex + 1) % order.length;
      onChange(order[nextIndex]);
      return;
    }
    setIsOpen(!isOpen);
  };

  const currentConfig = value ? PRIORITY_CONFIG[value] : null;

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {trigger ? (
        <div onClick={() => !disabled && setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={handleCycle}
          className={cn(
            "flex items-center gap-1.5 h-8 px-2.5 rounded-[10px] text-xs font-medium transition-all duration-300 cursor-pointer active:scale-95 border select-none",
            currentConfig
              ? cn(currentConfig.bg, currentConfig.text, "border-transparent")
              : "bg-surface-inset text-muted-foreground hover:text-foreground border-transparent"
          )}
          title={
            value
              ? `Priority: ${currentConfig?.label} (Shift+click to cycle)`
              : "Set priority"
          }
        >
          {currentConfig ? (
            <span className={cn("w-2 h-2 rounded-full", currentConfig.dot)} />
          ) : (
            <Flag className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="capitalize">{currentConfig ? currentConfig.label : placeholder}</span>
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 w-44 p-1.5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[16px] text-foreground select-none flex flex-col gap-1",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="px-2 py-1 border-b border-border-subtle flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Select Priority
            </span>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className="text-[10px] text-muted-foreground hover:text-crimson transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {PRIORITIES.map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            const isSelected = value === p;

            return (
              <button
                key={p}
                type="button"
                onClick={() => handleSelect(p)}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 text-left",
                  isSelected
                    ? cn(cfg.bg, cfg.text, "font-semibold")
                    : "hover:bg-surface-inset text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                  <span>{cfg.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
