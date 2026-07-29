import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useAppStore, TodoItem } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  AlertCircle,
  Clock,
  ListCheck,
} from 'lucide-react-native';

const PRIORITIES: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];

export function TodoList() {
  const { colors } = useTheme();
  const {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    groups,
    addGroup,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useAppStore();

  const [activeGroupId, setActiveGroupId] = useState<string>('current');
  const [newTodoText, setNewTodoText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newEstPomodoros, setNewEstPomodoros] = useState('1');
  const [expandedTodoIds, setExpandedTodoIds] = useState<string[]>([]);
  const [subtaskInputMap, setSubtaskInputMap] = useState<Record<string, string>>({});
  const [addGroupModalOpen, setAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const est = parseInt(newEstPomodoros, 10) || 1;
    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      priority: newPriority,
      estimatedPomodoros: est,
      completedPomodoros: 0,
      groupId: activeGroupId === 'finished' ? 'current' : activeGroupId,
      subtasks: [],
    };
    addTodo(todo);
    setNewTodoText('');
  };

  const handleAddSubtask = (todoId: string) => {
    const text = subtaskInputMap[todoId];
    if (!text || !text.trim()) return;
    addSubtask(todoId, text.trim());
    setSubtaskInputMap({ ...subtaskInputMap, [todoId]: '' });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    addGroup(newGroupName.trim());
    setNewGroupName('');
    setAddGroupModalOpen(false);
  };

  const toggleExpand = (id: string) => {
    if (expandedTodoIds.includes(id)) {
      setExpandedTodoIds(expandedTodoIds.filter((item) => item !== id));
    } else {
      setExpandedTodoIds([...expandedTodoIds, id]);
    }
  };

  const filteredTodos = todos.filter((todo) => {
    if (activeGroupId === 'finished') {
      return todo.completed;
    }
    if (activeGroupId === 'current') {
      return !todo.completed;
    }
    return todo.groupId === activeGroupId && !todo.completed;
  });

  return (
    <View style={styles.container}>
      {/* Group Navigation Tabs */}
      <View style={styles.groupBarRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupBar}>
          {groups.map((group) => {
            const active = activeGroupId === group.id;
            return (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setActiveGroupId(group.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.groupChipText,
                    { color: active ? colors.primaryForeground : colors.text },
                  ]}
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.groupChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setAddGroupModalOpen(true)}
          >
            <FolderPlus size={14} color={colors.text} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Quick Add Todo Input Card */}
      {activeGroupId !== 'finished' && (
        <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.addInputRow}>
            <TextInput
              style={[styles.addInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
              placeholder="Add a new task..."
              placeholderTextColor={colors.textMuted}
              value={newTodoText}
              onChangeText={setNewTodoText}
              onSubmitEditing={handleAddTodo}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddTodo}
              activeOpacity={0.8}
            >
              <Plus size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>

          {/* Priority & Pomodoro Selector */}
          <View style={styles.optionsRow}>
            <View style={styles.prioritySelector}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChip,
                    newPriority === p && { backgroundColor: colors.border },
                  ]}
                  onPress={() => setNewPriority(p)}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      { color: newPriority === p ? colors.text : colors.textMuted },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.pomodoroEstimate}>
              <Clock size={14} color={colors.textMuted} />
              <TextInput
                style={[styles.pomoInput, { color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={newEstPomodoros}
                onChangeText={setNewEstPomodoros}
                maxLength={2}
              />
              <Text style={{ fontSize: 12, color: colors.textMuted }}>pomo</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tasks List */}
      <ScrollView contentContainerStyle={styles.todosList}>
        {filteredTodos.length === 0 ? (
          <View style={styles.emptyBox}>
            <ListCheck size={36} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {activeGroupId === 'finished' ? 'No finished tasks yet' : 'No tasks in this group'}
            </Text>
          </View>
        ) : (
          filteredTodos.map((todo) => {
            const isExpanded = expandedTodoIds.includes(todo.id);
            return (
              <View
                key={todo.id}
                style={[
                  styles.todoCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.todoMainRow}>
                  <TouchableOpacity onPress={() => toggleTodo(todo.id)} style={styles.checkBtn}>
                    {todo.completed ? (
                      <CheckSquare size={20} color={colors.text} />
                    ) : (
                      <Square size={20} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => toggleExpand(todo.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.todoTitle,
                        { color: colors.text },
                        todo.completed && styles.todoTitleDone,
                      ]}
                    >
                      {todo.text}
                    </Text>

                    <View style={styles.badgeRow}>
                      {todo.priority && (
                        <View style={[styles.badge, { backgroundColor: colors.border }]}>
                          <Text style={[styles.badgeText, { color: colors.text }]}>
                            {todo.priority}
                          </Text>
                        </View>
                      )}
                      {todo.estimatedPomodoros && (
                        <View style={[styles.badge, { backgroundColor: colors.border }]}>
                          <Text style={[styles.badgeText, { color: colors.text }]}>
                            ⏱ {todo.estimatedPomodoros} pomo
                          </Text>
                        </View>
                      )}
                      {todo.subtasks && todo.subtasks.length > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.border }]}>
                          <Text style={[styles.badgeText, { color: colors.text }]}>
                            {todo.subtasks.filter((s) => s.completed).length}/{todo.subtasks.length} subtasks
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => toggleExpand(todo.id)} style={{ padding: 4 }}>
                    {isExpanded ? (
                      <ChevronDown size={18} color={colors.textMuted} />
                    ) : (
                      <ChevronRight size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => deleteTodo(todo.id)} style={{ padding: 4, marginLeft: 4 }}>
                    <Trash2 size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Subtasks Section */}
                {isExpanded && (
                  <View style={[styles.subtaskContainer, { borderColor: colors.border }]}>
                    <Text style={[styles.subtaskHeader, { color: colors.textMuted }]}>Subtasks</Text>

                    {todo.subtasks?.map((subtask) => (
                      <View key={subtask.id} style={styles.subtaskRow}>
                        <TouchableOpacity onPress={() => toggleSubtask(todo.id, subtask.id)}>
                          {subtask.completed ? (
                            <CheckSquare size={16} color={colors.text} />
                          ) : (
                            <Square size={16} color={colors.textMuted} />
                          )}
                        </TouchableOpacity>
                        <Text
                          style={[
                            styles.subtaskText,
                            { color: colors.text },
                            subtask.completed && styles.todoTitleDone,
                          ]}
                        >
                          {subtask.text}
                        </Text>
                        <TouchableOpacity onPress={() => deleteSubtask(todo.id, subtask.id)}>
                          <Trash2 size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    <View style={styles.subtaskAddRow}>
                      <TextInput
                        style={[styles.subtaskInput, { color: colors.text, borderColor: colors.border }]}
                        placeholder="Add subtask..."
                        placeholderTextColor={colors.textMuted}
                        value={subtaskInputMap[todo.id] || ''}
                        onChangeText={(val) =>
                          setSubtaskInputMap({ ...subtaskInputMap, [todo.id]: val })
                        }
                        onSubmitEditing={() => handleAddSubtask(todo.id)}
                      />
                      <TouchableOpacity
                        style={[styles.subtaskAddBtn, { backgroundColor: colors.border }]}
                        onPress={() => handleAddSubtask(todo.id)}
                      >
                        <Plus size={14} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Group Modal */}
      <Modal visible={addGroupModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Task Group</Text>
            <TextInput
              style={[styles.addInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border, marginVertical: 12 }]}
              placeholder="Group name (e.g., Work, Personal)"
              placeholderTextColor={colors.textMuted}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setAddGroupModalOpen(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateGroup}
              >
                <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  groupBarRow: {
    marginBottom: 12,
  },
  groupBar: {
    flexDirection: 'row',
    gap: 8,
  },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityChipText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  pomodoroEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pomoInput: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  todosList: {
    gap: 10,
    paddingBottom: 30,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  todoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  todoMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBtn: {
    padding: 2,
  },
  todoTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  todoTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  subtaskContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  subtaskHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  subtaskText: {
    flex: 1,
    fontSize: 13,
  },
  subtaskAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  subtaskInput: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  subtaskAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
