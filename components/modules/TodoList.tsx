"use client";

import { useAppStore, TodoItem } from "@/lib/store";
import { useState } from "react";
import {
    CheckSquare,
    Trash2,
    Plus,
    Calendar as CalendarIcon,
    List,
    Settings2,
    CheckCircle2,
    Target,
    Trash,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function TodoList() {
    const {
        todos,
        addTodo,
        toggleTodo,
        deleteTodo,
        updateTodo,
        groups,
        addGroup,
        deleteGroup,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        setSessionName,
        setView,
    } = useAppStore();

    const [newTodo, setNewTodo] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState<string>("current");
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const editingTask = todos.find((t) => t.id === editingTaskId) || null;

    const handleAddTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        const todo: TodoItem = {
            id: crypto.randomUUID(),
            text: newTodo,
            completed: false,
            category: "General",
            groupId: selectedGroupId,
        };

        addTodo(todo);
        setNewTodo("");
    };

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (newGroupName.trim()) {
            addGroup(newGroupName);
            setNewGroupName("");
            setIsCreatingGroup(false);
        }
    };

    const filteredTodos = todos.filter(
        (t) => (t.groupId || "current") === selectedGroupId,
    );

    return (
        <div className="h-full flex flex-col p-4 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-light tracking-wide">Tasks</h2>
                    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Settings2 className="w-5 h-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>List Settings</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">
                                        Actions
                                    </h4>
                                    <div className="grid gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const completedIds = todos
                                                    .filter((t) => t.completed)
                                                    .map((t) => t.id);
                                                completedIds.forEach((id) =>
                                                    deleteTodo(id),
                                                );
                                                setSettingsOpen(false);
                                            }}
                                            disabled={
                                                !todos.some((t) => t.completed)
                                            }
                                            className="justify-start"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Clear Completed (
                                            {
                                                todos.filter((t) => t.completed)
                                                    .length
                                            }
                                            )
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        "Are you sure you want to delete all tasks?",
                                                    )
                                                ) {
                                                    todos.forEach((t) =>
                                                        deleteTodo(t.id),
                                                    );
                                                    setSettingsOpen(false);
                                                }
                                            }}
                                            disabled={todos.length === 0}
                                            className="justify-start text-destructive hover:text-destructive"
                                        >
                                            <Trash className="w-4 h-4 mr-2" />
                                            Clear All Tasks ({todos.length})
                                        </Button>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        {todos.length} total task
                                        {todos.length !== 1 ? "s" : ""} •{" "}
                                        {
                                            todos.filter((t) => t.completed)
                                                .length
                                        }{" "}
                                        completed
                                    </p>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <form onSubmit={handleAddTodo} className="flex gap-2">
                    <Input
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder={`Add task to ${groups.find((g) => g.id === selectedGroupId)?.name || "Inbox"}...`}
                        className="flex-1 bg-secondary/20 border-none h-12 rounded-none pl-4 text-base placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newTodo}
                        className="h-12 w-12 rounded-none bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex-shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </form>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none items-center">
                {groups.map((group) => (
                    <button
                        key={group.id}
                        className={cn(
                            "px-4 py-1.5 rounded-none text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2",
                            selectedGroupId === group.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50",
                        )}
                        onClick={() => setSelectedGroupId(group.id)}
                    >
                        {group.name}
                        {group.type === "custom" && (
                            <span
                                className="opacity-50 hover:opacity-100 hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteGroup(group.id);
                                    if (selectedGroupId === group.id)
                                        setSelectedGroupId("inbox");
                                }}
                            >
                                ×
                            </span>
                        )}
                    </button>
                ))}

                <Dialog
                    open={isCreatingGroup}
                    onOpenChange={setIsCreatingGroup}
                >
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 rounded-none border border-dashed text-muted-foreground text-xs hover:text-primary hover:border-primary"
                        >
                            + Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New List</DialogTitle>
                        </DialogHeader>
                        <form
                            onSubmit={handleCreateGroup}
                            className="space-y-4 pt-4"
                        >
                            <Input
                                value={newGroupName}
                                onChange={(e) =>
                                    setNewGroupName(e.target.value)
                                }
                                placeholder="List Name..."
                                autoFocus
                            />
                            <Button
                                type="submit"
                                disabled={!newGroupName.trim()}
                                className="w-full"
                            >
                                Create List
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-3 pb-24">
                    {filteredTodos.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground/30">
                            <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>
                                No tasks in{" "}
                                {
                                    groups.find((g) => g.id === selectedGroupId)
                                        ?.name
                                }
                            </p>
                        </div>
                    )}

                    {filteredTodos.map((todo) => (
                        <div
                            key={todo.id}
                            className="group flex items-start gap-3 p-3 rounded-none hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                        >
                            <button
                                onClick={() => toggleTodo(todo.id)}
                                className={cn(
                                    "mt-0.5 shrink-0 w-5 h-5 rounded-none border flex items-center justify-center transition-all",
                                    todo.completed
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/30 hover:border-primary/50 text-transparent",
                                )}
                            >
                                <CheckSquare className="w-3.5 h-3.5" />
                            </button>

                            <div
                                className="flex-1 space-y-1 cursor-pointer"
                                onClick={() => setEditingTaskId(todo.id)}
                            >
                                <p
                                    className={cn(
                                        "text-sm transition-all",
                                        todo.completed
                                            ? "text-muted-foreground line-through"
                                            : "text-foreground",
                                    )}
                                >
                                    {todo.text}
                                </p>
                                <div className="flex gap-3 text-[10px] text-muted-foreground/70">
                                    {todo.deadline && (
                                        <div className="flex items-center gap-1 text-orange-400">
                                            <CalendarIcon className="w-3 h-3" />
                                            {format(
                                                new Date(todo.deadline),
                                                "MMM d",
                                            )}
                                        </div>
                                    )}
                                    {todo.subtasks &&
                                        todo.subtasks.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <List className="w-3 h-3" />
                                                {
                                                    todo.subtasks.filter(
                                                        (s) => s.completed,
                                                    ).length
                                                }
                                                /{todo.subtasks.length}
                                            </div>
                                        )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => {
                                        setSessionName(todo.text);
                                        setView("FOCUS");
                                    }}
                                    title="Focus on this task"
                                >
                                    <Target className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                                    onClick={() => deleteTodo(todo.id)}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <Sheet
                open={!!editingTaskId}
                onOpenChange={(open) => !open && setEditingTaskId(null)}
            >
                <SheetContent
                    side="right"
                    className="w-[100%] sm:w-[540px] bg-background border-l border-border/50 p-0"
                >
                    {editingTask && (
                        <div className="h-full flex flex-col p-10 pr-14 gap-10 overflow-y-auto">
                            <SheetHeader className="mb-2">
                                <SheetTitle className="text-2xl font-light">
                                    Task Details
                                </SheetTitle>
                            </SheetHeader>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                    Task
                                </label>
                                <div className="text-lg font-medium p-2 bg-secondary/10 rounded-none">
                                    {editingTask.text}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                    Deadline
                                </label>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "flex-1 justify-start text-left font-normal h-10",
                                                        !editingTask.deadline &&
                                                            "text-muted-foreground",
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {editingTask.deadline ? (
                                                        format(
                                                            new Date(
                                                                editingTask.deadline,
                                                            ),
                                                            "PPP",
                                                        )
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={
                                                        editingTask.deadline
                                                            ? new Date(
                                                                  editingTask.deadline,
                                                              )
                                                            : undefined
                                                    }
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            const existingDate =
                                                                editingTask.deadline
                                                                    ? new Date(
                                                                          editingTask.deadline,
                                                                      )
                                                                    : new Date();
                                                            date.setHours(
                                                                existingDate.getHours(),
                                                            );
                                                            date.setMinutes(
                                                                existingDate.getMinutes(),
                                                            );
                                                            updateTodo(
                                                                editingTask.id,
                                                                {
                                                                    deadline:
                                                                        date.toISOString(),
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Input
                                            type="time"
                                            className="w-32 h-10"
                                            value={
                                                editingTask.deadline
                                                    ? format(
                                                          new Date(
                                                              editingTask.deadline,
                                                          ),
                                                          "HH:mm",
                                                      )
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const time = e.target.value;
                                                if (time) {
                                                    const date =
                                                        editingTask.deadline
                                                            ? new Date(
                                                                  editingTask.deadline,
                                                              )
                                                            : new Date();
                                                    const [hours, minutes] =
                                                        time
                                                            .split(":")
                                                            .map(Number);
                                                    date.setHours(hours);
                                                    date.setMinutes(minutes);
                                                    updateTodo(editingTask.id, {
                                                        deadline:
                                                            date.toISOString(),
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {editingTask.deadline
                                            ? `Due at ${format(new Date(editingTask.deadline), "p")}`
                                            : "No time set"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">
                                    Group
                                </label>
                                <Select
                                    defaultValue={
                                        editingTask.groupId || "inbox"
                                    }
                                    onValueChange={(val) => {
                                        updateTodo(editingTask.id, {
                                            groupId: val,
                                        });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.map((g) => (
                                            <SelectItem key={g.id} value={g.id}>
                                                {g.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                                    Subtasks
                                    <span className="text-[10px] font-normal lowercase">
                                        {editingTask.subtasks?.filter(
                                            (s) => s.completed,
                                        ).length || 0}
                                        /{editingTask.subtasks?.length || 0}
                                    </span>
                                </label>

                                <div className="space-y-2">
                                    {editingTask.subtasks?.map((subtask) => (
                                        <div
                                            key={subtask.id}
                                            className="flex items-center gap-2 group/sub"
                                        >
                                            <button
                                                onClick={() =>
                                                    toggleSubtask(
                                                        editingTask.id,
                                                        subtask.id,
                                                    )
                                                }
                                                className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                    subtask.completed
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-muted-foreground/30",
                                                )}
                                            >
                                                {subtask.completed && (
                                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                                )}
                                            </button>
                                            <span
                                                className={cn(
                                                    "text-sm flex-1",
                                                    subtask.completed &&
                                                        "text-muted-foreground line-through",
                                                )}
                                            >
                                                {subtask.text}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover/sub:opacity-100"
                                                onClick={() =>
                                                    deleteSubtask(
                                                        editingTask.id,
                                                        subtask.id,
                                                    )
                                                }
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}

                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add subtask..."
                                            className="h-8 text-xs bg-secondary/10"
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" &&
                                                    e.currentTarget.value.trim()
                                                ) {
                                                    const text =
                                                        e.currentTarget.value.trim();
                                                    addSubtask(
                                                        editingTask.id,
                                                        text,
                                                    );
                                                    e.currentTarget.value = "";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() => {
                                    deleteTodo(editingTask.id);
                                    setEditingTaskId(null);
                                }}
                            >
                                Delete Task
                            </Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
