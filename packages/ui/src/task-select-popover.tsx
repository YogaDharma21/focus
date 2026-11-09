import * as React from "react";
import { Target, ChevronDown, Check } from "lucide-react";
import { cn } from "@focus/utils";
import type { TaskItem } from "@focus/types";
import { PRIORITY_CONFIG } from "./priority-popover";

export interface TaskSelectPopoverProps {
  tasks: TaskItem[];
  selectedTaskId?: string | null;
  value?: string | null;
  onSelectTask?: (taskId: string | null) => void;
  onChange?: (taskId: string | null) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right" | "center";
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function TaskSelectPopover({
  tasks,
  selectedTaskId,
  value,
  onSelectTask,
  onChange,
  placeholder = "Link a task...",
  className,
  align = "center",
  disabled = false,
  trigger,
}: TaskSelectPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const currentTaskId = selectedTaskId !== undefined ? selectedTaskId : value ?? null;

  const activeTasks = React.useMemo(() => {
    return tasks.filter((t) => !t.completed || t.id === currentTaskId);
  }, [tasks, currentTaskId]);

  const selectedTask = React.useMemo(() => {
    if (!currentTaskId) return null;
    return tasks.find((t) => t.id === currentTaskId) || null;
  }, [tasks, currentTaskId]);

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

  const handleSelect = (taskId: string | null) => {
    if (taskId === currentTaskId) {
      onSelectTask?.(null);
      onChange?.(null);
    } else {
      onSelectTask?.(taskId);
      onChange?.(taskId);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectTask?.(null);
    onChange?.(null);
    setIsOpen(false);
  };

  const displayLabel = selectedTask ? selectedTask.text : placeholder;

  return (
    <div ref={containerRef} className="relative inline-block">
      {trigger ? (
        <div onClick={() => !disabled && setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-inset hover:bg-surface border border-border text-[11px] text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-200 cursor-pointer max-w-[220px] select-none",
            selectedTask && "text-foreground",
            isOpen && "bg-surface text-foreground",
            className
          )}
          title={selectedTask ? `Linked: ${selectedTask.text}` : "Link a task to focus"}
        >
          <Target className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            className={cn(
              "w-3 h-3 shrink-0 opacity-70 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 z-50 min-w-[220px] max-w-[280px] max-h-56 overflow-y-auto bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[16px] p-1.5 text-foreground select-none flex flex-col gap-1",
            align === "right" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "left" && "left-0"
          )}
        >
          <div className="px-2 py-1 border-b border-border-subtle flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Link Task
            </span>
            {currentTaskId && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] text-muted-foreground hover:text-crimson transition-colors cursor-pointer"
              >
                Unlink
              </button>
            )}
          </div>

          {activeTasks.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No active tasks
            </div>
          ) : (
            activeTasks.map((task) => {
              const isSelected = currentTaskId === task.id;
              const priorityConfig = task.priority ? PRIORITY_CONFIG[task.priority] : null;

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleSelect(task.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 text-left w-full",
                    isSelected
                      ? "bg-surface text-foreground font-semibold"
                      : "hover:bg-surface-inset text-foreground"
                  )}
                  title={task.text}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {priorityConfig ? (
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityConfig.dot)} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/30" />
                    )}
                    <span className="truncate">{task.text}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-foreground" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export const TaskLinkPopover = TaskSelectPopover;
export type TaskLinkPopoverProps = TaskSelectPopoverProps;
