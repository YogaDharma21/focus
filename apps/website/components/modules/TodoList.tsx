"use client";

import { useAppStore, TodoItem } from "@/lib/store";
import { useState, useEffect } from "react";
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
    Sparkles,
    Timer,
    FileText,
    Square,
    CheckSquare2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Badge } from "@/components/ui/badge";
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
        updateSubtask,
        setSessionName,
        setView,
        selectedTodoId,
        setSelectedTodoId,
        setSelectedSubtaskId,
    } = useAppStore();

    const [newTodo, setNewTodo] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState<string>("current");
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isEditingTaskName, setIsEditingTaskName] = useState(false);
    const [editingTaskName, setEditingTaskName] = useState("");
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
    const [editingSubtaskText, setEditingSubtaskText] = useState("");
    const editingTask = todos.find((t) => t.id === editingTaskId) || null;
    
    useEffect(() => {
        if (editingTask) {
            setIsEditingTaskName(false);
            setEditingTaskName(editingTask.text);
        }
    }, [editingTask?.id]);

    const handleAddTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        const todo: TodoItem = {
            id: crypto.randomUUID(),
            text: newTodo,
            completed: false,
            category: "General",
            groupId: selectedGroupId,
            priority: "medium",
            estimatedPomodoros: 1,
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
        <div className="h-full flex flex-col p-4">
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
                        className="flex-1 bg-secondary/20 border-none h-12 rounded-[var(--radius)] pl-4 text-base placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newTodo}
                        className="h-12 w-12 rounded-[var(--radius)] bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex-shrink-0"
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
                            "px-4 py-1.5 rounded-[var(--radius)] text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2",
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
                            className="h-7 px-2 rounded-[var(--radius)] border border-dashed text-muted-foreground text-xs hover:text-primary hover:border-primary"
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
                        <div className="text-center py-12 text-muted-foreground">
                            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>
                                No tasks in{" "}
                                {
                                    groups.find((g) => g.id === selectedGroupId)
                                        ?.name
                                } yet.
                            </p>
                            <p className="text-sm">
                                Add a task above to get started.
                            </p>
                        </div>
                    )}

                    {filteredTodos.map((todo) => (
                        <div
                            key={todo.id}
                            className={cn(
                                "group flex items-start gap-3 p-3 rounded-lg transition-all border",
                                selectedTodoId === todo.id || editingTaskId === todo.id
                                    ? "bg-zinc-800 border-zinc-700 text-zinc-100 font-medium"
                                    : todo.completed
                                      ? "bg-zinc-950/40 border-zinc-800/80 text-muted-foreground opacity-60"
                                      : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 text-foreground",
                            )}
                        >
                            <button
                                onClick={() => toggleTodo(todo.id)}
                                className="mt-0.5 shrink-0 transition-colors"
                            >
                                {todo.completed ? (
                                    <CheckSquare2 className="w-5 h-5 text-white shrink-0" />
                                ) : (
                                    <Square className="w-5 h-5 text-muted-foreground/60 hover:text-foreground shrink-0" />
                                )}
                            </button>

                            <div
                                className="flex-1 space-y-1 cursor-pointer"
                                onClick={() => {
                                    setSelectedTodoId(todo.id);
                                    setEditingTaskId(todo.id);
                                }}
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
                                <div className="flex gap-3 text-[10px] text-muted-foreground/70 flex-wrap">
                                    {todo.deadline && (
                                        <div className="flex items-center gap-1 text-orange-400">
                                            <CalendarIcon className="w-3 h-3" />
                                            {format(
                                                new Date(todo.deadline),
                                                new Date(todo.deadline).getHours() !== 0 || new Date(todo.deadline).getMinutes() !== 0
                                                    ? "MMM d, HH:mm"
                                                    : "MMM d",
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1" title="Sessions (completed / estimated)">
                                        <Timer className="w-3 h-3" />
                                        {todo.completedPomodoros || 0}/{todo.estimatedPomodoros || 1}
                                    </div>
                                    {todo.priority && todo.priority !== "medium" && (
                                        <div className="flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            {todo.priority}
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
                                        setSelectedTodoId(todo.id);
                                        setSelectedSubtaskId(null);
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

            <Dialog
                open={!!editingTaskId}
                onOpenChange={(open) => !open && setEditingTaskId(null)}
            >
                <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 bg-background/95 backdrop-blur-md border-border/60 shadow-2xl rounded-2xl">
                    {editingTask && (
                        <div className="space-y-6">
                            <DialogHeader className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <span>Task Details</span>
                                </div>
                                {isEditingTaskName ? (
                                    <Input
                                        autoFocus
                                        value={editingTaskName}
                                        onChange={(e) => setEditingTaskName(e.target.value)}
                                        onBlur={() => {
                                            if (editingTaskName.trim()) {
                                                updateTodo(editingTask.id, { text: editingTaskName.trim() });
                                            }
                                            setIsEditingTaskName(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                if (editingTaskName.trim()) {
                                                    updateTodo(editingTask.id, { text: editingTaskName.trim() });
                                                }
                                                setIsEditingTaskName(false);
                                            }
                                            if (e.key === "Escape") {
                                                setIsEditingTaskName(false);
                                            }
                                        }}
                                        className="text-xl font-medium h-11 bg-muted/40 border-primary/50"
                                    />
                                ) : (
                                    <DialogTitle
                                        className="text-xl font-semibold cursor-pointer hover:bg-muted/40 p-2 -ml-2 rounded-lg transition-colors group flex items-center gap-2"
                                        onClick={() => {
                                            setEditingTaskName(editingTask.text);
                                            setIsEditingTaskName(true);
                                        }}
                                    >
                                        <span className={cn(editingTask.completed && "line-through text-muted-foreground")}>
                                            {editingTask.text}
                                        </span>
                                    </DialogTitle>
                                )}
                            </DialogHeader>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3.5 space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Priority
                                    </label>
                                    <Select
                                        defaultValue={editingTask.priority || "medium"}
                                        onValueChange={(val) => {
                                            updateTodo(editingTask.id, { priority: val as TodoItem["priority"] });
                                        }}
                                    >
                                        <SelectTrigger className="w-full bg-background/50 border-border/50 rounded-lg h-9">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="bg-muted/30 border border-border/40 rounded-xl p-3.5 space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <List className="w-3.5 h-3.5 text-blue-500" /> Group
                                    </label>
                                    <Select
                                        defaultValue={editingTask.groupId || "inbox"}
                                        onValueChange={(val) => {
                                            updateTodo(editingTask.id, { groupId: val });
                                        }}
                                    >
                                        <SelectTrigger className="w-full bg-background/50 border-border/50 rounded-lg h-9">
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
                            </div>

                            <div className="bg-muted/30 border border-border/40 rounded-xl p-4 space-y-3">
                                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <Timer className="w-3.5 h-3.5 text-emerald-500" /> Focus Sessions
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] text-muted-foreground mb-1 block">Estimated</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={editingTask.estimatedPomodoros || 1}
                                            onChange={(e) => {
                                                updateTodo(editingTask.id, {
                                                    estimatedPomodoros: parseInt(e.target.value) || 1,
                                                });
                                            }}
                                            className="h-9 bg-background/50 border-border/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-muted-foreground mb-1 block">Completed</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={editingTask.completedPomodoros || 0}
                                            onChange={(e) => {
                                                updateTodo(editingTask.id, {
                                                    completedPomodoros: parseInt(e.target.value) || 0,
                                                });
                                            }}
                                            className="h-9 bg-background/50 border-border/50"
                                        />
                                    </div>
                                </div>
                                {(editingTask.estimatedPomodoros || 0) > 0 && (
                                    <div className="space-y-1 pt-1">
                                        <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(100, ((editingTask.completedPomodoros || 0) / (editingTask.estimatedPomodoros || 1)) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground text-right font-medium">
                                            {Math.round(Math.min(100, ((editingTask.completedPomodoros || 0) / (editingTask.estimatedPomodoros || 1)) * 100))}% Completed
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-muted/30 border border-border/40 rounded-xl p-4 space-y-2.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" /> Deadline
                                </label>
                                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "flex-1 justify-start text-left font-normal h-9 bg-background/50 border-border/50 text-xs",
                                                    !editingTask.deadline && "text-muted-foreground",
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                                {editingTask.deadline ? (
                                                    format(new Date(editingTask.deadline), "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={
                                                    editingTask.deadline
                                                        ? new Date(editingTask.deadline)
                                                        : undefined
                                                }
                                                onSelect={(date) => {
                                                    if (date) {
                                                        const existingDate = editingTask.deadline
                                                            ? new Date(editingTask.deadline)
                                                            : new Date();
                                                        date.setHours(existingDate.getHours());
                                                        date.setMinutes(existingDate.getMinutes());
                                                        updateTodo(editingTask.id, {
                                                            deadline: date.toISOString(),
                                                        });
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <Input
                                        type="time"
                                        className="w-full sm:w-32 h-9 bg-background/50 border-border/50 text-xs"
                                        value={
                                            editingTask.deadline
                                                ? format(new Date(editingTask.deadline), "HH:mm")
                                                : ""
                                        }
                                        onChange={(e) => {
                                            const time = e.target.value;
                                            if (time) {
                                                const date = editingTask.deadline
                                                    ? new Date(editingTask.deadline)
                                                    : new Date();
                                                const [hours, minutes] = time.split(":").map(Number);
                                                date.setHours(hours);
                                                date.setMinutes(minutes);
                                                updateTodo(editingTask.id, {
                                                    deadline: date.toISOString(),
                                                });
                                            }
                                        }}
                                    />
                                </div>
                                {editingTask.deadline && (
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        Due at {format(new Date(editingTask.deadline), "p")}
                                    </p>
                                )}
                            </div>

                            <div className="bg-muted/30 border border-border/40 rounded-xl p-4 space-y-2.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-amber-500" /> Notes
                                </label>
                                <Textarea
                                    placeholder="Add notes or details for this task..."
                                    value={editingTask.notes || ""}
                                    onChange={(e) => {
                                        updateTodo(editingTask.id, { notes: e.target.value });
                                    }}
                                    className="min-h-[90px] text-xs bg-background/50 border-border/40 focus:bg-background resize-y leading-relaxed"
                                />
                            </div>

                            <div className="bg-muted/30 border border-border/40 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                                        <CheckSquare className="w-3.5 h-3.5 text-foreground" /> Subtasks
                                    </label>
                                    <span className="text-[11px] text-muted-foreground font-medium bg-background/50 px-2 py-0.5 rounded-full border border-border/40">
                                        {editingTask.subtasks?.filter((s) => s.completed).length || 0}/
                                        {editingTask.subtasks?.length || 0}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex gap-2 pb-1">
                                        <Input
                                            placeholder="Add a subtask..."
                                            className="h-8 text-xs bg-background/50 border-border/40 focus:bg-background"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                                    const text = e.currentTarget.value.trim();
                                                    addSubtask(editingTask.id, text);
                                                    e.currentTarget.value = "";
                                                }
                                            }}
                                        />
                                    </div>

                                    {editingTask.subtasks?.map((subtask) => (
                                        <div
                                            key={subtask.id}
                                            className="flex items-center gap-2 group/sub bg-background/40 hover:bg-background/70 p-2 rounded-lg border border-border/30 transition-colors"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleSubtask(editingTask.id, subtask.id)
                                                }
                                                className="shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {subtask.completed ? (
                                                    <CheckSquare2 className="w-4 h-4 text-white shrink-0" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                                                )}
                                            </button>
                                            {editingSubtaskId === subtask.id ? (
                                                <Input
                                                    autoFocus
                                                    value={editingSubtaskText}
                                                    onChange={(e) => setEditingSubtaskText(e.target.value)}
                                                    onBlur={() => {
                                                        if (editingSubtaskText.trim()) {
                                                            updateSubtask(editingTask.id, subtask.id, editingSubtaskText.trim());
                                                        }
                                                        setEditingSubtaskId(null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            if (editingSubtaskText.trim()) {
                                                                updateSubtask(editingTask.id, subtask.id, editingSubtaskText.trim());
                                                            }
                                                            setEditingSubtaskId(null);
                                                        }
                                                        if (e.key === "Escape") {
                                                            setEditingSubtaskId(null);
                                                        }
                                                    }}
                                                    className="h-7 text-xs flex-1 bg-background"
                                                />
                                            ) : (
                                                <span
                                                    className={cn(
                                                        "text-xs flex-1 cursor-pointer hover:text-foreground transition-colors",
                                                        subtask.completed &&
                                                            "text-muted-foreground line-through",
                                                    )}
                                                    onClick={() => {
                                                        setEditingSubtaskText(subtask.text);
                                                        setEditingSubtaskId(subtask.id);
                                                    }}
                                                >
                                                    {subtask.text}
                                                </span>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover/sub:opacity-100 transition-opacity"
                                                onClick={() =>
                                                    deleteSubtask(editingTask.id, subtask.id)
                                                }
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end border-t border-border/40">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1.5 text-xs"
                                    onClick={() => {
                                        deleteTodo(editingTask.id);
                                        setEditingTaskId(null);
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Task
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
