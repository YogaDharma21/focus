import React, { useState, useEffect } from 'react';
import { 
  Plus, CheckCircle2, Circle, Trash2, FolderPlus, Folder,
  ListTodo, CheckSquare2, Square, Target, X, Sparkles, List,
  Timer, Calendar, Clock, FileText, ListChecks
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

  // Simplified new task form state (only task name)
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
      estimatedPomodoros: 1,
      completedPomodoros: 0,
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
      case 'medium': return 'bg-zinc-800 border-zinc-700 text-zinc-300';
      default: return 'bg-zinc-900 border-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 md:p-6 max-w-6xl mx-auto w-full select-none overflow-hidden">
      {/* Left Column: Folders & Simplified New Task Form */}
      <div className="w-full md:w-72 flex flex-col space-y-4 shrink-0">
        <div className="shadcn-card p-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Folders</span>
            <button
              onClick={() => setShowAddGroupModal(true)}
              className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Add Folder"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors truncate flex items-center gap-1.5 ${
                  activeGroupId === g.id ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700" : "text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Simplified Quick Add Task Form (Name Only) */}
        <form onSubmit={handleCreateTask} className="shadcn-card p-4 space-y-3">
          <h4 className="text-xs font-semibold text-zinc-200">New Task</h4>
          <input
            type="text"
            placeholder="Task name... (Press Enter)"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full shadcn-input px-3 py-2 text-xs"
          />
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </form>
      </div>

      {/* Main Task List */}
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
              const isSelected = detailTodoId === todo.id || selectedTodoId === todo.id;
              return (
                <div
                  key={todo.id}
                  onClick={() => setDetailTodoId(todo.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-zinc-800 border-zinc-700 text-zinc-100 font-medium"
                      : todo.completed
                      ? "bg-zinc-950/40 border-zinc-800 text-zinc-500 opacity-60"
                      : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-200"
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTodo(todo.id);
                      }}
                      className="text-zinc-400 hover:text-zinc-100 transition-colors shrink-0 mt-0.5"
                    >
                      {todo.completed ? (
                        <CheckSquare2 className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-500 hover:text-zinc-400 shrink-0" />
                      )}
                    </button>

                    <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                      <span className={`text-xs font-semibold ${todo.completed ? "line-through text-zinc-500" : "text-zinc-100"}`}>
                        {todo.text}
                      </span>

                      {(() => {
                        const hasDeadline = Boolean(todo.deadline);
                        const hasSessions = Boolean((todo.estimatedPomodoros && todo.estimatedPomodoros > 0) || (todo.completedPomodoros && todo.completedPomodoros > 0));
                        const hasSubtasks = Boolean(todo.subtasks && todo.subtasks.length > 0);
                        const hasPriority = Boolean(todo.priority && todo.priority !== 'medium');
                        const hasMetadata = hasDeadline || hasSessions || hasSubtasks || hasPriority;

                        if (!hasMetadata) return null;

                        return (
                          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 flex-wrap">
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
                            {hasSessions && (
                              <div className="flex items-center gap-1 text-zinc-400">
                                <Timer className="w-3 h-3" />
                                <span>{todo.completedPomodoros || 0}/{todo.estimatedPomodoros || 1}</span>
                              </div>
                            )}
                            {hasPriority && (
                              <div className="flex items-center gap-1 text-zinc-400">
                                <Sparkles className="w-3 h-3" />
                                <span>{todo.priority}</span>
                              </div>
                            )}
                            {hasSubtasks && (
                              <div className="flex items-center gap-1 text-zinc-400">
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
                    {/* Focus on this task */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTodoId(todo.id);
                        setView("FOCUS");
                      }}
                      className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-800/60"
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
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors rounded-md hover:bg-zinc-800/60"
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

      {/* Task Details Dialog Modal */}
      {activeTodoDetails && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDetailTodoId(null)}
        >
          <div 
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">TASK DETAILS</span>
              <button
                onClick={() => setDetailTodoId(null)}
                className="p-1 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800/60 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task Name Header */}
            <div>
              <input
                type="text"
                value={activeTodoDetails.text}
                onChange={(e) => updateTodo(activeTodoDetails.id, { text: e.target.value })}
                className="w-full text-xl font-bold text-zinc-100 bg-transparent border-b border-transparent focus:border-zinc-800 focus:outline-none py-1"
                placeholder="Task title..."
              />
            </div>

            {/* Card 1: PRIORITY & GROUP (2-column Grid) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Priority Card */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">PRIORITY</span>
                </div>
                <select
                  value={activeTodoDetails.priority || 'medium'}
                  onChange={(e: any) => updateTodo(activeTodoDetails.id, { priority: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Group Card */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-sky-400">
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">GROUP</span>
                </div>
                <select
                  value={activeTodoDetails.groupId || 'current'}
                  onChange={(e: any) => updateTodo(activeTodoDetails.id, { groupId: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-700"
                >
                  <option value="current">Current Tasks</option>
                  {groups.filter(g => g.type === 'custom').map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Card 2: FOCUS SESSIONS */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Timer className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">FOCUS SESSIONS</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">Estimated</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={activeTodoDetails.estimatedPomodoros || 1}
                    onChange={(e) => updateTodo(activeTodoDetails.id, { estimatedPomodoros: Number(e.target.value) || 1 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-100 text-left focus:outline-none focus:border-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 font-medium block mb-1">Completed</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={activeTodoDetails.completedPomodoros || 0}
                    onChange={(e) => updateTodo(activeTodoDetails.id, { completedPomodoros: Number(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-100 text-left focus:outline-none focus:border-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round(((activeTodoDetails.completedPomodoros || 0) / (activeTodoDetails.estimatedPomodoros || 1)) * 100))}%`
                    }}
                  />
                </div>
                <div className="text-[10px] text-zinc-400 font-medium text-right mt-1.5">
                  {Math.min(100, Math.round(((activeTodoDetails.completedPomodoros || 0) / (activeTodoDetails.estimatedPomodoros || 1)) * 100))}% Completed
                </div>
              </div>
            </div>

            {/* Card 3: DEADLINE */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-purple-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">DEADLINE</span>
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
                  <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none z-10" />
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
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-zinc-700 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [color-scheme:dark]"
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
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-zinc-700 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [color-scheme:dark]"
                  />
                  <Clock className="w-3.5 h-3.5 text-zinc-500 absolute right-3 pointer-events-none z-10" />
                </div>
              </div>
            </div>

            {/* Card 4: NOTES */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-500">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">NOTES</span>
              </div>
              <textarea
                rows={3}
                placeholder="Add notes or details for this task..."
                value={activeTodoDetails.notes || ''}
                onChange={(e) => updateTodo(activeTodoDetails.id, { notes: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-700"
              />
            </div>

            {/* Card 5: SUBTASKS */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-teal-400">
                  <CheckSquare2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">SUBTASKS</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                  {activeTodoDetails.subtasks?.filter(s => s.completed).length || 0}/{activeTodoDetails.subtasks?.length || 0}
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                {activeTodoDetails.subtasks?.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 text-xs bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                    <button
                      onClick={() => toggleSubtask(activeTodoDetails.id, sub.id)}
                      className="text-zinc-400 hover:text-zinc-100 shrink-0"
                    >
                      {sub.completed ? (
                        <CheckSquare2 className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={sub.text}
                      onChange={(e) => updateSubtask(activeTodoDetails.id, sub.id, e.target.value)}
                      className={`flex-1 bg-transparent text-xs focus:outline-none ${sub.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}
                    />
                    <button
                      onClick={() => deleteSubtask(activeTodoDetails.id, sub.id)}
                      className="text-zinc-500 hover:text-rose-400 transition-colors shrink-0"
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
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
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

            {/* Footer / Delete Task Button */}
            <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
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

      {/* Add Folder Modal */}
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

