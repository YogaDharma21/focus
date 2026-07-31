import React, { useState } from 'react';
import { 
  Plus, CheckCircle2, Circle, Trash2, FolderPlus, Tag, 
  ExternalLink, Calendar, ListTodo, CheckSquare2
} from 'lucide-react';
import { useDesktopStore, TodoItem } from '../../lib/store';

export const TodoList: React.FC = () => {
  const { 
    todos, addTodo, toggleTodo, deleteTodo, updateTodo, 
    groups, addGroup, deleteGroup,
    addSubtask, toggleSubtask, deleteSubtask,
    selectedTodoId, setSelectedTodoId
  } = useDesktopStore();

  const [activeGroupId, setActiveGroupId] = useState<string>("all");
  const [newGroupInput, setNewGroupInput] = useState("");
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  // New task form state
  const [textInput, setTextInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [priorityInput, setPriorityInput] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const newTask: TodoItem = {
      id: crypto.randomUUID(),
      text: textInput.trim(),
      description: descriptionInput.trim() || undefined,
      completed: false,
      priority: priorityInput,
      groupId: activeGroupId === "all" || activeGroupId === "finished" ? "current" : activeGroupId,
      estimatedPomodoros,
      completedPomodoros: 0,
      subtasks: []
    };

    addTodo(newTask);
    setTextInput("");
    setDescriptionInput("");
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupInput.trim()) return;
    addGroup(newGroupInput.trim());
    setNewGroupInput("");
    setShowAddGroupModal(false);
  };

  const filteredTodos = todos.filter((todo) => {
    if (activeGroupId === "all") return true;
    if (activeGroupId === "finished") return todo.completed;
    if (activeGroupId === "current") return !todo.completed;
    return todo.groupId === activeGroupId;
  });

  const activeTodoDetails = todos.find(t => t.id === selectedTodoId);

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-950/60 border-rose-800 text-rose-300';
      case 'high': return 'bg-amber-950/60 border-amber-800 text-amber-300';
      case 'medium': return 'bg-zinc-800 border-zinc-700 text-zinc-300';
      default: return 'bg-zinc-900 border-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 md:p-6 max-w-6xl mx-auto w-full select-none overflow-hidden">
      {/* Left: Folders & Create Task */}
      <div className="w-full md:w-72 flex flex-col space-y-4 shrink-0">
        <div className="shadcn-card p-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Folders</span>
            <button
              onClick={() => setShowAddGroupModal(true)}
              className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Add Group"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveGroupId("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap ${
                activeGroupId === "all" ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              All Tasks ({todos.length})
            </button>
            <button
              onClick={() => setActiveGroupId("current")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap ${
                activeGroupId === "current" ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              Current ({todos.filter(t => !t.completed).length})
            </button>
            <button
              onClick={() => setActiveGroupId("finished")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap ${
                activeGroupId === "finished" ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              Finished ({todos.filter(t => t.completed).length})
            </button>

            {groups.filter(g => g.type === 'custom').map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors truncate ${
                  activeGroupId === g.id ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700" : "text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                📁 {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Create Task Form */}
        <form onSubmit={handleCreateTask} className="shadcn-card p-4 space-y-3">
          <h4 className="text-xs font-semibold text-zinc-200">New Task</h4>
          <input
            type="text"
            placeholder="Task title..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full shadcn-input px-3 py-1.5 text-xs"
          />
          <input
            type="text"
            placeholder="Description (optional)..."
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            className="w-full shadcn-input px-3 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <select
              value={priorityInput}
              onChange={(e: any) => setPriorityInput(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="number"
              min={1}
              max={10}
              value={estimatedPomodoros}
              onChange={(e) => setEstimatedPomodoros(Number(e.target.value) || 1)}
              className="w-16 shadcn-input px-2 py-1 text-xs text-center"
              title="Estimated Pomodoros"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </form>
      </div>

      {/* Tasks List */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="flex-1 shadcn-card p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-200">Tasks</span>
            <span className="text-[10px] text-zinc-500">{filteredTodos.length} Items</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredTodos.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-zinc-500 text-xs space-y-1">
                <ListTodo className="w-8 h-8 stroke-1 text-zinc-600" />
                <p>No tasks found.</p>
              </div>
            ) : (
              filteredTodos.map((todo) => {
                const isSelected = selectedTodoId === todo.id;
                return (
                  <div
                    key={todo.id}
                    onClick={() => setSelectedTodoId(todo.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-zinc-800 border-zinc-700 text-zinc-100 font-medium"
                        : todo.completed
                        ? "bg-zinc-950/40 border-zinc-800 text-zinc-500 opacity-60"
                        : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTodo(todo.id);
                        }}
                        className="text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <span className={`text-xs ${todo.completed ? "line-through" : ""}`}>
                        {todo.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${getPriorityBadgeClass(todo.priority)}`}>
                        {todo.priority || 'medium'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTodo(todo.id);
                        }}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Task Details Sheet Panel */}
        {activeTodoDetails && (
          <div className="w-full md:w-80 shadcn-card p-4 flex flex-col space-y-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-200">Task Details</h4>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${getPriorityBadgeClass(activeTodoDetails.priority)}`}>
                {activeTodoDetails.priority}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-100">{activeTodoDetails.text}</h3>
              {activeTodoDetails.description && (
                <p className="text-xs text-zinc-400 mt-1">{activeTodoDetails.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Subtasks</span>
              <div className="space-y-1.5">
                {activeTodoDetails.subtasks?.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between text-xs bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                    <button
                      onClick={() => toggleSubtask(activeTodoDetails.id, sub.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <CheckSquare2 className={`w-3.5 h-3.5 ${sub.completed ? "text-zinc-100" : "text-zinc-500"}`} />
                      <span className={sub.completed ? "line-through text-zinc-500" : "text-zinc-200"}>{sub.text}</span>
                    </button>
                    <button
                      onClick={() => deleteSubtask(activeTodoDetails.id, sub.id)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Add subtask..."
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  className="flex-1 shadcn-input px-2.5 py-1 text-xs"
                />
                <button
                  onClick={() => {
                    if (newSubtaskInput.trim()) {
                      addSubtask(activeTodoDetails.id, newSubtaskInput.trim());
                      setNewSubtaskInput("");
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-zinc-200 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddGroup} className="w-72 bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3 shadow-2xl">
            <h4 className="text-xs font-semibold text-zinc-200">Create Folder</h4>
            <input
              type="text"
              placeholder="Folder name..."
              value={newGroupInput}
              onChange={(e) => setNewGroupInput(e.target.value)}
              className="w-full shadcn-input px-3 py-2 text-xs"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddGroupModal(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
