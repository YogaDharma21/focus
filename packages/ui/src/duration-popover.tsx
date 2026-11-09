import * as React from "react";
import { Clock, X, Check } from "lucide-react";
import { cn, formatTaskDuration } from "@focus/utils";

export interface DurationPopoverProps {
  value?: number; // in minutes
  onChange: (minutes: number | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  disabled?: boolean;
  compact?: boolean;
  presets?: number[];
  trigger?: React.ReactNode;
}

const DEFAULT_PRESETS = [15, 25, 45, 60];

export function DurationPopover({
  value,
  onChange,
  placeholder = "Est",
  className,
  align = "right",
  disabled = false,
  compact = false,
  presets = DEFAULT_PRESETS,
  trigger,
}: DurationPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [customInput, setCustomInput] = React.useState<string>(
    value ? String(value) : ""
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setCustomInput(value ? String(value) : "");
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

  const handleSelectPreset = (minutes: number) => {
    onChange(minutes);
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customInput, 10);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 1440) {
      onChange(parsed);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setCustomInput("");
    setIsOpen(false);
  };

  const parsedCustom = parseInt(customInput, 10);
  const isCustomValid = Number.isFinite(parsedCustom) && parsedCustom > 0 && parsedCustom <= 1440;

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
              ? "bg-surface-inset text-foreground border-border"
              : "bg-surface-inset text-muted-foreground hover:text-foreground border-transparent"
          )}
          title={value ? `Estimate: ${formatTaskDuration(value)}` : "Set duration"}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {(!compact || value) && (
            <span className="font-mono tabular-nums">
              {value ? formatTaskDuration(value) : placeholder}
            </span>
          )}
          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 ml-0.5 hover:text-crimson transition-colors"
              title="Clear duration"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 w-56 p-3 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[16px] text-foreground select-none",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border-subtle">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Duration Preset
            </span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-medium text-crimson hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Preset Buttons Grid */}
          <div
            className={cn("grid gap-1.5 mb-3", presets.length === 4 ? "grid-cols-4" : "grid-cols-3")}
            style={{ display: "grid", gridTemplateColumns: `repeat(${presets.length === 4 ? 4 : 3}, minmax(0, 1fr))` }}
          >
            {presets.map((m) => {
              const isSelected = value === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectPreset(m)}
                  className={cn(
                    "py-1.5 rounded-[8px] text-xs font-mono tabular-nums font-medium transition-all duration-200 cursor-pointer active:scale-95 text-center",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-surface-inset text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m}m
                </button>
              );
            })}
          </div>

          {/* Custom Duration Input */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                max="1440"
                placeholder="Custom (m)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full bg-surface-inset border-0 rounded-[8px] px-2.5 py-1 text-xs text-foreground placeholder:text-subtle-foreground focus:outline-none font-mono tabular-nums"
              />
            </div>
            <button
              type="submit"
              disabled={!isCustomValid}
              className="p-1 rounded-[8px] bg-primary text-primary-foreground disabled:opacity-40 transition-all duration-200 active:scale-95 cursor-pointer"
              title="Apply duration"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
