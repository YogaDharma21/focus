import React, { useState } from 'react';
import { 
  Plus, CheckCircle2, Circle, Trash2, FolderPlus, Tag, 
  ExternalLink, Calendar, ListTodo, ChevronRight, CheckSquare2
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
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(2);
  const [linkInput, setLinkInput] = useState("");
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
      link: linkInput.trim() || undefined,
      subtasks: []
    };

    addTodo(newTask);
    setTextInput("");
    setDescriptionInput("");
    setLinkInput("");
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
      case 'urgent': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'high': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'medium': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default: return 'bg-zinc-800 border-zinc-700 text-zinc-400';
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 md:p-6 max-w-6xl mx-auto w-full select-none overflow-hidden">
      {/* Left: Group list & Add task panel */}
      <div className="w-full md:w-80 flex flex-col space-y-4 shrink-0">
        {/* Groups selection */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Folders & Groups</span>
            <button
              onClick={() => setShowAddGroupModal(true)}
              className="p-1 rounded-md hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Add Group"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveGroupId("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-colors whitespace-nowrap ${
                activeGroupId === "all" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              All Tasks ({todos.length})
            </button>
            <button
              onClick={() => setActiveGroupId("current")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-colors whitespace-nowrap ${
                activeGroupId === "current" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              Current ({todos.filter(t => !t.completed).length})
            </button>
            <button
              onClick={() => setActiveGroupId("finished")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-colors whitespace-nowrap ${
                activeGroupId === "finished" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              Finished ({todos.filter(t => t.completed).length})
            </button>

            {groups.filter(g => g.type === 'custom').map((g) => (
              <div key={g.id} className="flex items-center justify-between group">
                <button
                  onClick={() => setActiveGroupId(g.id)}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-colors truncate ${
                    activeGroupId === g.id ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-zinc-400 hover:bg-white/5"
                  }`}
                >
                  📁 {g.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Create Task Form */}
        <form onSubmit={handleCreateTask} className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
          <h4 className="text-xs font-semibold text-zinc-300">Create New Task</h4>
          <input
            type="text"
            placeholder="Task title..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="Description (optional)..."
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
          />
          <div className="flex gap-2">
            <select
              value={priorityInput}
              onChange={(e: any) => setPriorityInput(e.target.value)}
              className="bg-zinc-900 border border-white/10 text-xs text-zinc-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
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
              className="w-16 bg-zinc-900 border border-white/10 text-xs text-zinc-200 rounded-xl px-2 py-1.5 text-center focus:outline-none"
              title="Estimated Pomodoros"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </form>
      </div>

      {/* Center/Right: Task items list & details panel */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Tasks list */}
        <div className="flex-1 glass-panel p-4 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
            <span className="text-xs font-semibold text-zinc-300">Task List</span>
            <span className="text-[10px] text-zinc-500">{filteredTodos.length} Items</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredTodos.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-zinc-500 text-xs space-y-1">
                <ListTodo className="w-8 h-8 stroke-1 text-zinc-600" />
                <p>No tasks in this list yet.</p>
              </div>
            ) : (
              filteredTodos.map((todo) => {
                const isSelected = selectedTodoId === todo.id;
                return (
                  <div
                    key={todo.id}
                    onClick={() => setSelectedTodoId(todo.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/30 text-white"
                        : todo.completed
                        ? "bg-zinc-900/40 border-white/5 text-zinc-500 opacity-60"
                        : "bg-zinc-900/80 border-white/5 hover:border-white/10 text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTodo(todo.id);
                        }}
                        className="text-zinc-400 hover:text-cyan-400 transition-colors shrink-0"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <span className={`text-xs font-medium truncate ${todo.completed ? "line-through" : ""}`}>
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

        {/* Details & Subtasks panel */}
        {activeTodoDetails && (
          <div className="w-full md:w-80 glass-panel p-4 rounded-2xl border border-white/10 flex flex-col space-y-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h4 className="text-xs font-bold text-zinc-200">Task Details</h4>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${getPriorityBadgeClass(activeTodoDetails.priority)}`}>
                {activeTodoDetails.priority}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">{activeTodoDetails.text}</h3>
              {activeTodoDetails.description && (
                <p className="text-xs text-zinc-400 mt-1">{activeTodoDetails.description}</p>
              )}
            </div>

            {/* Subtasks Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Subtasks Checklist</span>
              <div className="space-y-1.5">
                {activeTodoDetails.subtasks?.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between text-xs bg-zinc-900/60 p-2 rounded-lg border border-white/5">
                    <button
                      onClick={() => toggleSubtask(activeTodoDetails.id, sub.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <CheckSquare2 className={`w-3.5 h-3.5 ${sub.completed ? "text-cyan-400" : "text-zinc-500"}`} />
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
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (newSubtaskInput.trim()) {
                      addSubtask(activeTodoDetails.id, newSubtaskInput.trim());
                      setNewSubtaskInput("");
                    }
                  }}
                  className="px-3 py-1 rounded-xl bg-cyan-500 text-zinc-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddGroup} className="w-72 glass-panel p-5 rounded-2xl border border-white/10 space-y-3 shadow-2xl">
            <h4 className="text-xs font-semibold text-zinc-200">Create Custom Folder</h4>
            <input
              type="text"
              placeholder="Folder Name (e.g. Work, Project Focus)..."
              value={newGroupInput}
              onChange={(e) => setNewGroupInput(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddGroupModal(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-cyan-500 text-zinc-950 text-xs font-bold hover:bg-cyan-400 transition-colors"
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
