"use client";

import React, { useState } from "react";
import { useAppStore, TaskItem } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
    CheckSquare,
    Square,
    Trash2,
    ListChecks,
} from "lucide-react";
import { cn, getTaskActualMinutes } from "@/lib/utils";
import { TaskQuickAdd, TaskRow, type TaskQuickAddPayload } from "@focus/ui";

export function TasksPage() {
    const {
        tasks,
        sessions,
        selectedTaskId,
        addTask,
        toggleTask,
        deleteTask,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        setSelectedTaskId,
        setView,
    } = useAppStore(
        useShallow((s) => ({
            tasks: s.tasks,
            sessions: s.sessions,
            selectedTaskId: s.selectedTaskId,
            addTask: s.addTask,
            toggleTask: s.toggleTask,
            deleteTask: s.deleteTask,
            addSubtask: s.addSubtask,
            toggleSubtask: s.toggleSubtask,
            deleteSubtask: s.deleteSubtask,
            setSelectedTaskId: s.setSelectedTaskId,
            setView: s.setView,
        })),
    );

    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});

    const handleAddTask = (payload: TaskQuickAddPayload) => {
        addTask({
            text: payload.text,
            priority: payload.priority,
            deadline: payload.deadline,
            estimatedMinutes: payload.estimatedMinutes,
        });
    };

    const handleFocusTask = (task: TaskItem) => {
        if (task.completed) return;
        setSelectedTaskId(task.id);
        setView("FOCUS");
    };

    const handleDeleteTask = (taskId: string) => {
        deleteTask(taskId);
        if (expandedTaskId === taskId) {
            setExpandedTaskId(null);
        }
    };

    const handleAddSubtask = (taskId: string) => {
        const trimmed = (subtaskInputs[taskId] || "").trim();
        if (!trimmed) return;
        addSubtask(taskId, trimmed);
        setSubtaskInputs((prev) => ({ ...prev, [taskId]: "" }));
    };

    const filteredTasks = tasks.filter((t) => {
        if (filter === "active") return !t.completed;
        if (filter === "completed") return t.completed;
        return true;
    });

    const activeCount = tasks.filter((t) => !t.completed).length;
    const completedCount = tasks.filter((t) => t.completed).length;

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
            {/* Header & Metric Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 flex flex-col justify-between bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Active Tasks
                        </span>
                        <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
                            <CheckSquare className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-[22px] font-medium tabular-nums tracking-[-0.03em] text-foreground my-1">
                        {activeCount}
                    </div>
                </div>

                <div className="p-5 flex flex-col justify-between bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Completed
                        </span>
                        <div className="p-1.5 bg-surface-inset rounded-[10px] text-muted-foreground">
                            <ListChecks className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-[22px] font-medium tabular-nums tracking-[-0.03em] text-foreground my-1">
                        {completedCount}
                    </div>
                </div>
            </div>

            {/* Quick Add Bar */}
            <TaskQuickAdd
                onAdd={handleAddTask}
                className="border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)]"
            />

            {/* Filter Tabs & Task List */}
            <div className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 bg-surface-inset p-1 rounded-full">
                        {(["all", "active", "completed"] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setFilter(tab)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-300 cursor-pointer active:scale-95",
                                    filter === tab
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                        {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
                    </span>
                </div>

                {filteredTasks.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground text-xs gap-1">
                        <CheckSquare className="w-8 h-8 opacity-40 mb-1" />
                        <span>No tasks in this view</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filteredTasks.map((task) => {
                            const isFocused = selectedTaskId === task.id;
                            const isExpanded = expandedTaskId === task.id;
                            const subtasks = task.subtasks || [];
                            const actualMinutes = getTaskActualMinutes(sessions, task.id);

                            return (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    isFocused={isFocused}
                                    actualMinutes={actualMinutes}
                                    isExpanded={isExpanded}
                                    onToggle={toggleTask}
                                    onFocus={handleFocusTask}
                                    onDelete={handleDeleteTask}
                                    onToggleExpand={(id) =>
                                        setExpandedTaskId(expandedTaskId === id ? null : id)
                                    }
                                >
                                    <div className="flex flex-col gap-2 pt-0.5">
                                        {subtasks.map((sub) => (
                                            <div
                                                key={sub.id}
                                                className="flex items-center justify-between gap-2 pl-6 pr-1 text-xs"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleSubtask(task.id, sub.id)
                                                        }
                                                        className="text-muted-foreground hover:text-foreground cursor-pointer active:scale-95 shrink-0"
                                                        title={
                                                            sub.completed
                                                                ? "Mark incomplete"
                                                                : "Mark complete"
                                                        }
                                                    >
                                                        {sub.completed ? (
                                                            <CheckSquare className="w-3.5 h-3.5 text-emerald" />
                                                        ) : (
                                                            <Square className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                    <span
                                                        className={cn(
                                                            "truncate",
                                                            sub.completed
                                                                ? "line-through text-muted-foreground"
                                                                : "text-foreground",
                                                        )}
                                                    >
                                                        {sub.text}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteSubtask(task.id, sub.id)
                                                    }
                                                    className="text-muted-foreground hover:text-crimson transition-colors p-1 shrink-0 cursor-pointer"
                                                    title="Delete subtask"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        <div className="flex items-center gap-2 pl-6 mt-1">
                                            <input
                                                type="text"
                                                placeholder="Add subtask..."
                                                value={subtaskInputs[task.id] || ""}
                                                onChange={(e) =>
                                                    setSubtaskInputs((prev) => ({
                                                        ...prev,
                                                        [task.id]: e.target.value,
                                                    }))
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleAddSubtask(task.id);
                                                    }
                                                }}
                                                className="flex-1 bg-surface border border-border rounded-[10px] px-3 py-1.5 text-xs text-foreground placeholder:text-subtle-foreground focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddSubtask(task.id)}
                                                disabled={!(subtaskInputs[task.id] || "").trim()}
                                                className="px-3 py-1.5 rounded-[10px] bg-primary text-primary-foreground text-xs font-medium active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </TaskRow>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
