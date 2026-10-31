import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  Target,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import type { TaskItem, TaskPriority } from '@focus/types';
import { cn } from '../../lib/utils';

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: 'bg-crimson-bg text-crimson',
  high: 'bg-amber-bg text-amber',
  medium: 'bg-blue-bg text-blue',
  low: 'bg-surface-inset text-muted-foreground',
};

export const TasksPage: React.FC = () => {
  const {
    tasks,
    selectedTaskId,
    addTask,
    toggleTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    setSelectedTaskId,
    setView,
  } = useDesktopStore();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({
      text: trimmed,
      priority,
      deadline: deadline || undefined,
    });
    setTitle('');
    setDeadline('');
  };

  const handleFocusTask = (task: TaskItem) => {
    if (task.completed) return;
    setSelectedTaskId(task.id);
    setView('FOCUS');
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
  };

  const handleAddSubtask = (taskId: string) => {
    const trimmed = (subtaskInputs[taskId] || '').trim();
    if (!trimmed) return;
    addSubtask(taskId, trimmed);
    setSubtaskInputs((prev) => ({ ...prev, [taskId]: '' }));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 sm:p-6 overflow-y-auto max-h-full">
      {/* Metric Cards Row */}
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

      {/* Task Creation Card */}
      <div className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px]">
        <form onSubmit={handleAddTask} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a new task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-surface-inset border-0 rounded-[12px] px-4 h-11 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="h-11 px-5 rounded-[12px] bg-primary text-primary-foreground text-sm font-medium shadow-md hover:shadow active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Priority:</span>
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'px-2.5 py-1 rounded-full capitalize text-[11px] font-medium transition-all duration-300 cursor-pointer active:scale-95',
                    priority === p
                      ? PRIORITY_STYLES[p]
                      : 'bg-surface-inset text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-transparent border-0 text-[11px] text-muted-foreground focus:outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Filter Tabs & Task List */}
      <div className="p-5 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-surface-inset p-1 rounded-full">
            {(['all', 'active', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-300 cursor-pointer active:scale-95',
                  filter === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
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
              const completedSubtasks = subtasks.filter((s) => s.completed).length;

              return (
                <div
                  key={task.id}
                  className={cn(
                    'p-3.5 rounded-[16px] border transition-all duration-300',
                    isFocused
                      ? 'bg-surface border-foreground/30'
                      : 'bg-surface-inset border-border hover:border-border/80'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="text-muted-foreground hover:text-foreground transition-all duration-300 cursor-pointer active:scale-95 shrink-0"
                        title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className={cn(
                            'text-xs font-medium truncate',
                            task.completed
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          )}
                        >
                          {task.text}
                        </span>

                        <div className="flex items-center gap-2 mt-1">
                          {task.priority && (
                            <span
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full font-medium capitalize',
                                PRIORITY_STYLES[task.priority]
                              )}
                            >
                              {task.priority}
                            </span>
                          )}

                          {task.deadline && (
                            <span className="text-[10px] font-mono tabular-nums text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.deadline}
                            </span>
                          )}

                          {subtasks.length > 0 && (
                            <button
                              onClick={() =>
                                setExpandedTaskId(isExpanded ? null : task.id)
                              }
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          setExpandedTaskId(isExpanded ? null : task.id)
                        }
                        className="p-1.5 rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-300 cursor-pointer active:scale-95"
                        title="Subtasks"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                      </button>

                      {!task.completed && (
                        <button
                          onClick={() => handleFocusTask(task)}
                          className={cn(
                            'p-1.5 rounded-[10px] transition-all duration-300 cursor-pointer active:scale-95',
                            isFocused
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                          )}
                          title={isFocused ? 'Current focus target' : 'Focus on task'}
                        >
                          <Target className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-[10px] text-muted-foreground hover:text-crimson hover:bg-crimson-bg transition-all duration-300 cursor-pointer active:scale-95"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Subtasks */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
                      {subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between gap-2 pl-6 pr-1 text-xs"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              onClick={() => toggleSubtask(task.id, sub.id)}
                              className="text-muted-foreground hover:text-foreground cursor-pointer active:scale-95"
                            >
                              {sub.completed ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span
                              className={cn(
                                'truncate',
                                sub.completed
                                  ? 'line-through text-muted-foreground'
                                  : 'text-foreground'
                              )}
                            >
                              {sub.text}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteSubtask(task.id, sub.id)}
                            className="text-muted-foreground hover:text-crimson transition-colors p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <div className="flex items-center gap-2 pl-6 mt-1">
                        <input
                          type="text"
                          placeholder="Add subtask..."
                          value={subtaskInputs[task.id] || ''}
                          onChange={(e) =>
                            setSubtaskInputs((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtask(task.id);
                            }
                          }}
                          className="flex-1 bg-surface border border-border rounded-[10px] px-3 py-1.5 text-xs text-foreground placeholder:text-subtle-foreground focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddSubtask(task.id)}
                          className="px-3 py-1.5 rounded-[10px] bg-primary text-primary-foreground text-xs font-medium active:scale-95 transition-all duration-300 cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
