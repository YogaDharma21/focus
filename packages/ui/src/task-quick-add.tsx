import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@focus/utils";
import type { TaskPriority } from "@focus/types";
import { PriorityPopover } from "./priority-popover";
import { DurationPopover } from "./duration-popover";
import { DatePickerPopover } from "./date-picker-popover";

export interface TaskQuickAddPayload {
  text: string;
  priority?: TaskPriority;
  deadline?: string;
  estimatedMinutes?: number;
}

export interface TaskQuickAddProps {
  onAdd: (payload: TaskQuickAddPayload) => void | Promise<void>;
  placeholder?: string;
  defaultPriority?: TaskPriority;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function TaskQuickAdd({
  onAdd,
  placeholder = "Add a new task...",
  defaultPriority,
  autoFocus = false,
  disabled = false,
  className,
  inputClassName,
}: TaskQuickAddProps) {
  const [text, setText] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority | undefined>(defaultPriority);
  const [deadline, setDeadline] = React.useState<string | undefined>(undefined);
  const [estimatedMinutes, setEstimatedMinutes] = React.useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setText("");
    setPriority(defaultPriority);
    setDeadline(undefined);
    setEstimatedMinutes(undefined);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      await onAdd({
        text: trimmed,
        priority,
        deadline,
        estimatedMinutes,
      });
      reset();
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 bg-surface-inset border-0 rounded-xl px-3 py-1.5 min-h-[46px] transition-all duration-300",
        className
      )}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        autoFocus={autoFocus}
        className={cn(
          "flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none min-w-[140px]",
          inputClassName
        )}
      />

      {/* Inline trigger chips */}
      <div className="flex items-center gap-1.5 shrink-0">
        <PriorityPopover
          value={priority}
          onChange={setPriority}
          disabled={disabled || isSubmitting}
          align="right"
        />

        <DurationPopover
          value={estimatedMinutes}
          onChange={setEstimatedMinutes}
          disabled={disabled || isSubmitting}
          align="right"
        />

        <DatePickerPopover
          value={deadline}
          onChange={setDeadline}
          disabled={disabled || isSubmitting}
          align="right"
        />

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!text.trim() || isSubmitting || disabled}
          className="h-8 px-3 rounded-[10px] bg-primary text-primary-foreground text-xs font-medium shadow-sm hover:opacity-90 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 select-none"
          title="Add task (Enter)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </div>
  );
}
