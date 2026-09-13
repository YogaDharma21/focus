import React, { useState, useEffect } from 'react';
import { 
  Plus, CheckCircle2, Circle, Trash2, FolderPlus, Folder,
  ListTodo, CheckSquare2, Square, Target, X, Sparkles, List,
  Calendar, Clock, FileText, ListChecks
} from 'lucide-react';
import { useDesktopStore, TodoItem } from '../../lib/store';

export const TodoList: React.FC = () => {
  const { 
    todos, addTodo, toggleTodo, deleteTodo, updateTodo, 
    groups, addGroup,
    addSubtask, toggleSubtask, deleteSubtask, updateSubtask,
    selectedTodoId, setSelectedTodoId, setView
  } = useDesktopStore();

  const [activeGroupId, setActiveGroupId] = useState<string>("all");
  const [newGroupInput, setNewGroupInput] = useState("");
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [detailTodoId, setDetailTodoId] = useState<string | null>(null);

  const [textInput, setTextInput] = useState("");
  const [newSubtaskInput, setNewSubtaskInput] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && detailTodoId) {
        setDetailTodoId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailTodoId]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const newTask: TodoItem = {
      id: crypto.randomUUID(),
      text: textInput.trim(),
      completed: false,
      priority: "medium",
      groupId: activeGroupId === "all" || activeGroupId === "finished" ? "current" : activeGroupId,
      subtasks: []
    };

    addTodo(newTask);
    setDetailTodoId(newTask.id);
    setTextInput("");
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

  const activeTodoDetails = todos.find(t => t.id === detailTodoId);

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-950/60 border-rose-800 text-rose-300';
      case 'high': return 'bg-amber-950/60 border-amber-800 text-amber-300';
      case 'medium': return 'bg-secondary border-border text-foreground';
      default: return 'bg-secondary border-border text-muted-foreground';
    }
  };

  return (
    <div className="min-h-full lg:h-full flex flex-col lg:flex-row gap-4 p-4 lg:p-6 max-w-6xl mx-auto w-full select-none overflow-y-auto lg:overflow-hidden">
      <div className="w-full lg:w-72 flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0">
        <div className="shadcn-card p-4 space-y-2 flex-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
            <button
              onClick={() => setShowAddGroupModal(true)}
              className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Add Folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex sm:flex-col gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveGroupId("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap ${
                activeGroupId === "all" ? "bg-secondary text-foreground font-semibold border border-border" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              All Tasks ({todos.length})
            </button>
            <button
              onClick={() => setActiveGroupId("current")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap ${
                activeGroupId === "current" ? "bg-secondary text-foreground font-semibold border border-border" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              Current ({todos.filter(t => !t.completed).length})
            </button>
            <button
              onClick={() => setActiveGroupId("finished")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors whitespace-nowrap ${
                activeGroupId === "finished" ? "bg-secondary text-foreground font-semibold border border-border" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              Finished ({todos.filter(t => t.completed).length})
            </button>

            {groups.filter(g => g.type === 'custom').map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors truncate flex items-center gap-1.5 ${
                  activeGroupId === g.id ? "bg-secondary text-foreground font-semibold border border-border" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="shadcn-card p-4 space-y-3 flex-1">
          <h4 className="text-xs font-semibold text-foreground">New Task</h4>
          <input
            type="text"
            placeholder="Task name... (Press Enter)"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full shadcn-input px-3 py-2 text-xs"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </form>
      </div>

      <div className="flex-1 shadcn-card p-4 flex flex-col overflow-hidden min-h-[350px] lg:min-h-0">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
          <span className="text-xs font-semibold text-foreground">Tasks</span>
          <span className="text-[10px] text-muted-foreground">{filteredTodos.length} Items</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredTodos.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-xs space-y-1">
              <ListTodo className="w-8 h-8 stroke-1 text-muted-foreground/60" />
              <p>No tasks found.</p>
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const isSelected = detailTodoId === todo.id || selectedTodoId === todo.id;
              return (
                <div
                  key={todo.id}
                  onClick={() => setDetailTodoId(todo.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-secondary border-border text-foreground font-medium"
                      : todo.completed
                      ? "bg-secondary/40 border-border text-muted-foreground opacity-60"
                      : "bg-secondary/60 border-border hover:border-muted-foreground text-foreground"
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTodo(todo.id);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                    >
                      {todo.completed ? (
                        <CheckSquare2 className="w-4 h-4 text-foreground shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground hover:text-muted-foreground shrink-0" />
                      )}
                    </button>

                    <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                      <span className={`text-xs font-semibold ${todo.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {todo.text}
                      </span>

                      {(() => {
                        const hasDeadline = Boolean(todo.deadline);
                        const hasSubtasks = Boolean(todo.subtasks && todo.subtasks.length > 0);
                        const hasPriority = Boolean(todo.priority && todo.priority !== 'medium');
                        const hasMetadata = hasDeadline || hasSubtasks || hasPriority;

                        if (!hasMetadata) return null;

                        return (
                          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground flex-wrap">
                            {hasDeadline && (
                              <div className="flex items-center gap-1 text-orange-500 font-medium">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {(() => {
                                    const dl = todo.deadline || '';
                                    const datePart = dl.split('T')[0];
                                    const timePart = dl.split('T')[1] || '';
                                    if (!datePart) return '';
                                    const d = new Date(datePart);
                                    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                                    const formatted = `${months[d.getMonth()]} ${d.getDate()}`;
                                    return timePart ? `${formatted}, ${timePart}` : formatted;
                                  })()}
                                </span>
                              </div>
                            )}
                            {hasPriority && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Sparkles className="w-3 h-3" />
                                <span>{todo.priority}</span>
                              </div>
                            )}
                            {hasSubtasks && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <ListChecks className="w-3 h-3" />
                                <span>{todo.subtasks!.filter(s => s.completed).length}/{todo.subtasks!.length}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTodoId(todo.id);
                        setView("FOCUS");
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/60"
                      title="Focus on this task"
                    >
                      <Target className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTodo(todo.id);
                        if (detailTodoId === todo.id) setDetailTodoId(null);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-rose-400 transition-colors rounded-md hover:bg-secondary/60"
                      title="Delete task"
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

      {activeTodoDetails && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDetailTodoId(null)}
        >
          <div 
            className="w-full max-w-lg bg-background border border-border rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto select-text"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">TASK DETAILS</span>
              <button
                onClick={() => setDetailTodoId(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <input
                type="text"
                value={activeTodoDetails.text}
                onChange={(e) => updateTodo(activeTodoDetails.id, { text: e.target.value })}
                className="w-full text-xl font-bold text-foreground bg-transparent border-b border-transparent focus:border-border focus:outline-none py-1"
                placeholder="Task title..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/60 border border-border rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">PRIORITY</span>
                </div>
                <select
                  value={activeTodoDetails.priority || 'medium'}
                  onChange={(e: any) => updateTodo(activeTodoDetails.id, { priority: e.target.value })}
                  className="w-full bg-secondary border border-border text-xs font-medium text-foreground rounded-lg px-3 py-2 focus:outline-none focus:border-muted-foreground"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="bg-secondary/60 border border-border rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GROUP</span>
                </div>
                <select
                  value={activeTodoDetails.groupId || 'current'}
                  onChange={(e: any) => updateTodo(activeTodoDetails.id, { groupId: e.target.value })}
                  className="w-full bg-secondary border border-border text-xs font-medium text-foreground rounded-lg px-3 py-2 focus:outline-none focus:border-muted-foreground"
                >
                  <option value="current">Current Tasks</option>
                  {groups.filter(g => g.type === 'custom').map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Card 2: DEADLINE */}
            <div className="bg-secondary/60 border border-border rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">DEADLINE</span>
                </div>
                {activeTodoDetails.deadline && (
                  <button
                    onClick={() => updateTodo(activeTodoDetails.id, { deadline: '' })}
                    className="text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative flex items-center">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none z-10" />
                  <input
                    type="date"
                    value={(activeTodoDetails.deadline || '').split('T')[0] || ''}
                    onChange={(e) => {
                      const dateVal = e.target.value;
                      const timeVal = (activeTodoDetails.deadline || '').split('T')[1] || '';
                      updateTodo(activeTodoDetails.id, {
                        deadline: dateVal ? (timeVal ? `${dateVal}T${timeVal}` : dateVal) : ''
                      });
                    }}
                    className="w-full bg-secondary border border-border text-xs text-foreground rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-muted-foreground [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [color-scheme:dark]"
                  />
                </div>
                <div className="relative flex items-center">
                  <input
                    type="time"
                    value={(activeTodoDetails.deadline || '').split('T')[1] || ''}
                    onChange={(e) => {
                      const timeVal = e.target.value;
                      const dateVal = (activeTodoDetails.deadline || '').split('T')[0] || new Date().toISOString().split('T')[0];
                      updateTodo(activeTodoDetails.id, {
                        deadline: timeVal ? `${dateVal}T${timeVal}` : dateVal
                      });
                    }}
                    className="w-full bg-secondary border border-border text-xs text-foreground rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-muted-foreground [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [color-scheme:dark]"
                  />
                  <Clock className="w-3.5 h-3.5 text-muted-foreground absolute right-3 pointer-events-none z-10" />
                </div>
              </div>
            </div>

            <div className="bg-secondary/60 border border-border rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">NOTES</span>
              </div>
              <textarea
                rows={3}
                placeholder="Add notes or details for this task..."
                value={activeTodoDetails.notes || ''}
                onChange={(e) => updateTodo(activeTodoDetails.id, { notes: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg p-3 text-xs text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-muted-foreground"
              />
            </div>

            <div className="bg-secondary/60 border border-border rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckSquare2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SUBTASKS</span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
                  {activeTodoDetails.subtasks?.filter(s => s.completed).length || 0}/{activeTodoDetails.subtasks?.length || 0}
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                {activeTodoDetails.subtasks?.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 text-xs bg-secondary p-2 rounded-lg border border-border">
                    <button
                      onClick={() => toggleSubtask(activeTodoDetails.id, sub.id)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {sub.completed ? (
                        <CheckSquare2 className="w-3.5 h-3.5 text-foreground" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={sub.text}
                      onChange={(e) => updateSubtask(activeTodoDetails.id, sub.id, e.target.value)}
                      className={`flex-1 bg-transparent text-xs focus:outline-none ${sub.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                    />
                    <button
                      onClick={() => deleteSubtask(activeTodoDetails.id, sub.id)}
                      className="text-muted-foreground hover:text-rose-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSubtaskInput.trim()) {
                      e.preventDefault();
                      addSubtask(activeTodoDetails.id, newSubtaskInput.trim());
                      setNewSubtaskInput("");
                    }
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => {
                  deleteTodo(activeTodoDetails.id);
                  setDetailTodoId(null);
                }}
                className="text-rose-500 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddGroupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddGroup} className="w-72 bg-secondary p-5 rounded-2xl border border-border space-y-3 shadow-2xl">
            <h4 className="text-xs font-semibold text-foreground">Create Folder</h4>
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
                className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
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
