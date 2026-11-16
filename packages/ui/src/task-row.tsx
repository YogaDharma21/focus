import * as React from "react";
import {
  CheckSquare,
  Square,
  Trash2,
  Calendar,
  Target,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Clock,
} from "lucide-react";
import {
  cn,
  formatTaskDuration,
  getVelocityStatus,
  type VelocityStatus,
} from "@focus/utils";
import type { TaskItem, TaskPriority } from "@focus/types";
import { formatDateConcise } from "./date-picker-popover";

export interface TaskRowProps {
  task: TaskItem;
  isFocused?: boolean;
  actualMinutes?: number;
  isExpanded?: boolean;
  onToggle?: (taskId: string) => void;
  onFocus?: (task: TaskItem) => void;
  onDelete?: (taskId: string) => void;
  onToggleExpand?: (taskId: string) => void;
  onTitleClick?: (task: TaskItem) => void;
  className?: string;
  children?: React.ReactNode;
}

const PRIORITY_BADGES: Record<TaskPriority, string> = {
  urgent: "bg-crimson-bg text-crimson",
  high: "bg-amber-bg text-amber",
  medium: "bg-blue-bg text-blue",
  low: "bg-emerald-bg text-emerald",
};

const VELOCITY_BADGES: Record<VelocityStatus, string> = {
  "completed-on-time": "bg-emerald-bg text-emerald",
  "on-track": "bg-surface-inset text-muted-foreground",
  approaching: "bg-amber-bg text-amber",
  exceeded: "bg-crimson-bg text-crimson",
};

export function TaskRow({
  task,
  isFocused = false,
  actualMinutes = 0,
  isExpanded = false,
  onToggle,
  onFocus,
  onDelete,
  onToggleExpand,
  onTitleClick,
  className,
  children,
}: TaskRowProps) {
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  const hasEstimate =
    typeof task.estimatedMinutes === "number" && task.estimatedMinutes > 0;
  const velocityStatus = hasEstimate
    ? getVelocityStatus(actualMinutes, task.estimatedMinutes!, task.completed)
    : null;

  return (
    <div
      className={cn(
        "p-3.5 rounded-[16px] border transition-all duration-300 flex flex-col gap-2",
        isFocused
          ? "bg-surface border-foreground/30 shadow-sm"
          : "bg-surface-inset border-border hover:border-border/80",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Checkbox and main content */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onToggle?.(task.id)}
            className="text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer active:scale-95 shrink-0"
            title={task.completed ? "Mark incomplete" : "Mark complete"}
          >
            {task.completed ? (
              <CheckSquare className="w-4 h-4 text-emerald" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          <div className="flex flex-col min-w-0 flex-1">
            <span
              onClick={() => onTitleClick?.(task)}
              className={cn(
                "text-xs font-medium truncate select-none",
                onTitleClick && "cursor-pointer hover:underline",
                task.completed
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              )}
            >
              {task.text}
            </span>

            {/* Metadata badges row */}
            <div className="flex items-center flex-wrap gap-2 mt-1 select-none">
              {task.priority && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium capitalize",
                    PRIORITY_BADGES[task.priority]
                  )}
                >
                  {task.priority}
                </span>
              )}

              {task.deadline && (
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDateConcise(task.deadline)}</span>
                </span>
              )}

              {hasEstimate && velocityStatus && (
                <span
                  className={cn(
                    "text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                    VELOCITY_BADGES[velocityStatus]
                  )}
                  title={`Velocity: ${actualMinutes}m actual of ${task.estimatedMinutes}m estimated (${velocityStatus})`}
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatTaskDuration(actualMinutes)} /{" "}
                    {formatTaskDuration(task.estimatedMinutes!)}
                  </span>
                </span>
              )}

              {!hasEstimate && actualMinutes > 0 && (
                <span
                  className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full font-medium flex items-center gap-1 bg-surface-inset text-muted-foreground"
                  title={`Focus time: ${actualMinutes}m`}
                >
                  <Clock className="w-3 h-3" />
                  <span>{formatTaskDuration(actualMinutes)}</span>
                </span>
              )}

              {subtasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleExpand?.(task.id)}
                  className="text-[10px] font-mono tabular-nums text-muted-foreground hover:text-foreground flex items-center gap-0.5 cursor-pointer"
                >
                  <span>
                    {completedSubtasks}/{subtasks.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleExpand && (
            <button
              type="button"
              onClick={() => onToggleExpand(task.id)}
              className={cn(
                "p-1.5 rounded-[10px] transition-all duration-300 cursor-pointer active:scale-95",
                isExpanded
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
              title="Subtasks"
            >
              <ListChecks className="w-3.5 h-3.5" />
            </button>
          )}

          {!task.completed && onFocus && (
            <button
              type="button"
              onClick={() => onFocus(task)}
              className={cn(
                "p-1.5 rounded-[10px] transition-all duration-300 cursor-pointer active:scale-95",
                isFocused
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
              title={isFocused ? "Current focus target" : "Focus on task"}
            >
              <Target className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded-[10px] text-muted-foreground hover:text-crimson hover:bg-crimson-bg transition-all duration-300 cursor-pointer active:scale-95"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded subtask container / children */}
      {isExpanded && children && (
        <div className="pt-2 border-t border-border-subtle mt-1">
          {children}
        </div>
      )}
    </div>
  );
}
