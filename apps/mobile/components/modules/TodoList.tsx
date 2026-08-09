import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore, TodoItem } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  FolderPlus,
  ListCheck,
  X,
  Calendar,
  Repeat,
  Tag,
  AlignLeft,
  Target,
  Play,
} from 'lucide-react-native';

const PRIORITIES: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];
const RECURRING_OPTIONS: ('none' | 'daily' | 'weekly' | 'monthly')[] = ['none', 'daily', 'weekly', 'monthly'];

export function TodoList() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    todos,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    groups,
    addGroup,
    deleteGroup,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    setSelectedTodoId,
    setSessionName,
    setView,
  } = useAppStore();

  const [activeGroupId, setActiveGroupId] = useState<string>('current');
  const [newTodoText, setNewTodoText] = useState('');
  const [addGroupModalOpen, setAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Task Detail Modal State
  const [detailTodo, setDetailTodo] = useState<TodoItem | null>(null);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailDesc, setDetailDesc] = useState('');
  const [detailNotes, setDetailNotes] = useState('');
  const [detailPriority, setDetailPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [detailPomoEst, setDetailPomoEst] = useState('1');
  const [detailRecurring, setDetailRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [detailDeadline, setDetailDeadline] = useState('');
  const [detailGroupId, setDetailGroupId] = useState('current');
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const [isAddFocused, setIsAddFocused] = useState(false);
  const [isGroupInputFocused, setIsGroupInputFocused] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);
  const [isEstFocused, setIsEstFocused] = useState(false);
  const [isSubtaskFocused, setIsSubtaskFocused] = useState(false);

  const handleFocusOnTask = (todo: TodoItem) => {
    setSelectedTodoId(todo.id);
    setSessionName(todo.text);
    setView('FOCUS');
    if (detailTodo) setDetailTodo(null);
    router.push('/');
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      priority: 'medium',
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      groupId: activeGroupId === 'finished' ? 'current' : activeGroupId,
      subtasks: [],
    };
    addTodo(todo);
    setNewTodoText('');
  };

  const handleOpenDetail = (todo: TodoItem) => {
    setDetailTodo(todo);
    setDetailTitle(todo.text);
    setDetailDesc(todo.description || '');
    setDetailNotes(todo.notes || '');
    setDetailPriority(todo.priority || 'medium');
    setDetailPomoEst((todo.estimatedPomodoros || 1).toString());
    setDetailRecurring(todo.recurring || 'none');
    setDetailDeadline(todo.deadline || new Date().toISOString().slice(0, 16).replace('T', ' '));
    setDetailGroupId(todo.groupId || 'current');
    setNewSubtaskText('');
  };

  const handleSaveDetail = () => {
    if (!detailTodo) return;
    updateTodo(detailTodo.id, {
      text: detailTitle.trim() || detailTodo.text,
      description: detailDesc.trim(),
      notes: detailNotes.trim(),
      priority: detailPriority,
      estimatedPomodoros: parseInt(detailPomoEst, 10) || 1,
      recurring: detailRecurring,
      deadline: detailDeadline.trim(),
      groupId: detailGroupId,
    });
    setDetailTodo(null);
  };

  const handleAddDetailSubtask = () => {
    if (!detailTodo || !newSubtaskText.trim()) return;
    addSubtask(detailTodo.id, newSubtaskText.trim());
    setNewSubtaskText('');
    // refresh detailTodo ref
    const updated = todos.find((t) => t.id === detailTodo.id);
    if (updated) setDetailTodo(updated);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    addGroup(newGroupName.trim());
    setNewGroupName('');
    setAddGroupModalOpen(false);
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"? Tasks in this group will be moved to Current Tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (activeGroupId === groupId) {
              setActiveGroupId('current');
            }
            deleteGroup(groupId);
          },
        },
      ]
    );
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

  // Active detail todo from store
  const activeDetailTodo = detailTodo ? todos.find((t) => t.id === detailTodo.id) || detailTodo : null;

  return (
    <View style={styles.container}>
      {/* Group Navigation Tabs */}
      <View style={styles.groupBarRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupBar}>
          {groups.map((group) => {
            const active = activeGroupId === group.id;
            const isCustom = group.type === 'custom' && group.id !== 'current' && group.id !== 'finished';
            return (
              <View
                key={group.id}
                style={[
                  styles.groupChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  },
                ]}
              >
                <TouchableOpacity
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

                {isCustom && (
                  <TouchableOpacity
                    onPress={() => handleDeleteGroup(group.id, group.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={12} color={active ? colors.primaryForeground : colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
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

      {/* Simplified Quick Add Todo Bar */}
      {activeGroupId !== 'finished' && (
        <View style={[styles.addCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.addInputRow}>
            <TextInput
              style={[
                styles.addInput,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: isAddFocused ? colors.text : colors.border,
                },
              ]}
              placeholder="Add a new task..."
              placeholderTextColor={colors.textMuted}
              value={newTodoText}
              onChangeText={setNewTodoText}
              onSubmitEditing={handleAddTodo}
              onFocus={() => setIsAddFocused(true)}
              onBlur={() => setIsAddFocused(false)}
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddTodo}
              activeOpacity={0.8}
            >
              <Plus size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
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
            const subtaskCount = todo.subtasks?.length || 0;
            const completedSubtasks = todo.subtasks?.filter((s) => s.completed).length || 0;

            return (
              <TouchableOpacity
                key={todo.id}
                style={[
                  styles.todoCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => handleOpenDetail(todo)}
                activeOpacity={0.7}
              >
                <View style={styles.todoMainRow}>
                  <TouchableOpacity onPress={() => toggleTodo(todo.id)} style={styles.checkBtn}>
                    {todo.completed ? (
                      <CheckSquare size={20} color={colors.text} />
                    ) : (
                      <Square size={20} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
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
                      <View style={[styles.badge, { backgroundColor: colors.border }]}>
                        <Text style={[styles.badgeText, { color: colors.text }]}>
                          🎯 {todo.completedPomodoros || 0}/{todo.estimatedPomodoros || 1} sessions
                        </Text>
                      </View>
                      {todo.priority && (
                        <View style={[styles.badge, { backgroundColor: colors.border }]}>
                          <Text style={[styles.badgeText, { color: colors.text }]}>
                            {todo.priority}
                          </Text>
                        </View>
                      )}
                      {subtaskCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.border }]}>
                          <Text style={[styles.badgeText, { color: colors.text }]}>
                            {completedSubtasks}/{subtaskCount} subtasks
                          </Text>
                        </View>
                      )}
                      {todo.deadline ? (
                        <View style={[styles.badge, { backgroundColor: colors.border }]}>
                          <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                            📅 {todo.deadline}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {!todo.completed && (
                      <TouchableOpacity
                        style={[styles.focusTaskBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleFocusOnTask(todo)}
                        activeOpacity={0.8}
                      >
                        <Play size={12} color={colors.primaryForeground} style={{ marginRight: 4 }} />
                        <Text style={[styles.focusTaskBtnText, { color: colors.primaryForeground }]}>
                          Focus on this task
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => deleteTodo(todo.id)}
                    style={{ padding: 6 }}
                  >
                    <Trash2 size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Task Detail Modal */}
      <Modal visible={!!activeDetailTodo} transparent animationType="fade" onRequestClose={() => setDetailTodo(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDetailTodo(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.detailModalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Task Details</Text>
              <TouchableOpacity onPress={() => setDetailTodo(null)} style={styles.closeBtn}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.detailContent}>
              {/* Task Title */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Task Name</Text>
                <TextInput
                  style={[
                    styles.titleInput,
                    {
                      color: colors.text,
                      borderColor: isTitleFocused ? colors.text : colors.border,
                      backgroundColor: colors.inputBg,
                    },
                  ]}
                  value={detailTitle}
                  onChangeText={setDetailTitle}
                  onFocus={() => setIsTitleFocused(true)}
                  onBlur={() => setIsTitleFocused(false)}
                />
                {activeDetailTodo && !activeDetailTodo.completed && (
                  <TouchableOpacity
                    style={[styles.fullFocusBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      handleSaveDetail();
                      handleFocusOnTask(activeDetailTodo);
                    }}
                    activeOpacity={0.8}
                  >
                    <Play size={16} color={colors.primaryForeground} style={{ marginRight: 6 }} />
                    <Text style={[styles.fullFocusBtnText, { color: colors.primaryForeground }]}>
                      Focus on this task
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Description */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <AlignLeft size={14} color={colors.textMuted} />
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Description</Text>
                </View>
                <TextInput
                  style={[
                    styles.multilineInput,
                    {
                      color: colors.text,
                      borderColor: isDescFocused ? colors.text : colors.border,
                      backgroundColor: colors.inputBg,
                    },
                  ]}
                  multiline
                  numberOfLines={2}
                  placeholder="Add a detailed description..."
                  placeholderTextColor={colors.textMuted}
                  value={detailDesc}
                  onChangeText={setDetailDesc}
                  onFocus={() => setIsDescFocused(true)}
                  onBlur={() => setIsDescFocused(false)}
                />
              </View>

              {/* Group Selector */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <Tag size={14} color={colors.textMuted} />
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Group</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {groups.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.chipBtn,
                        {
                          backgroundColor: detailGroupId === g.id ? colors.primary : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setDetailGroupId(g.id)}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: detailGroupId === g.id ? colors.primaryForeground : colors.text,
                        }}
                      >
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Estimated Sessions */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <Target size={14} color={colors.textMuted} />
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                    Session Estimated (Completed: {activeDetailTodo?.completedPomodoros || 0})
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.singleInput,
                    {
                      color: colors.text,
                      borderColor: isEstFocused ? colors.text : colors.border,
                      backgroundColor: colors.inputBg,
                    },
                  ]}
                  keyboardType="numeric"
                  placeholder="Estimated sessions..."
                  placeholderTextColor={colors.textMuted}
                  value={detailPomoEst}
                  onChangeText={setDetailPomoEst}
                  onFocus={() => setIsEstFocused(true)}
                  onBlur={() => setIsEstFocused(false)}
                />
              </View>

              {/* Priority Selector */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Priority</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.chipBtn,
                        {
                          backgroundColor: detailPriority === p ? colors.primary : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setDetailPriority(p)}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          color: detailPriority === p ? colors.primaryForeground : colors.text,
                        }}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Deadline & Recurring Row */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <Calendar size={14} color={colors.textMuted} />
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Deadline (Date & Time)</Text>
                </View>
                <TextInput
                  style={[styles.singleInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  placeholder="YYYY-MM-DD HH:mm"
                  placeholderTextColor={colors.textMuted}
                  value={detailDeadline}
                  onChangeText={setDetailDeadline}
                />
              </View>

              {/* Recurring */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <Repeat size={14} color={colors.textMuted} />
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Recurring</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {RECURRING_OPTIONS.map((rec) => (
                    <TouchableOpacity
                      key={rec}
                      style={[
                        styles.chipBtn,
                        {
                          backgroundColor: detailRecurring === rec ? colors.primary : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setDetailRecurring(rec)}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          color: detailRecurring === rec ? colors.primaryForeground : colors.text,
                        }}
                      >
                        {rec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                <TextInput
                  style={[styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                  multiline
                  numberOfLines={2}
                  placeholder="Additional notes or references..."
                  placeholderTextColor={colors.textMuted}
                  value={detailNotes}
                  onChangeText={setDetailNotes}
                />
              </View>

              {/* Subtasks Section */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Subtasks</Text>
                <View style={{ gap: 6 }}>
                  {activeDetailTodo?.subtasks?.map((subtask) => (
                    <View key={subtask.id} style={styles.subtaskRow}>
                      <TouchableOpacity onPress={() => toggleSubtask(activeDetailTodo.id, subtask.id)}>
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
                      <TouchableOpacity onPress={() => deleteSubtask(activeDetailTodo.id, subtask.id)}>
                        <Trash2 size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.subtaskAddRow}>
                  <TextInput
                    style={[
                      styles.subtaskInput,
                      {
                        color: colors.text,
                        borderColor: isSubtaskFocused ? colors.text : colors.border,
                        backgroundColor: colors.inputBg,
                      },
                    ]}
                    placeholder="Add new subtask..."
                    placeholderTextColor={colors.textMuted}
                    value={newSubtaskText}
                    onChangeText={setNewSubtaskText}
                    onSubmitEditing={handleAddDetailSubtask}
                    onFocus={() => setIsSubtaskFocused(true)}
                    onBlur={() => setIsSubtaskFocused(false)}
                  />
                  <TouchableOpacity
                    style={[styles.subtaskAddBtn, { backgroundColor: colors.primary }]}
                    onPress={handleAddDetailSubtask}
                  >
                    <Plus size={14} color={colors.primaryForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={[styles.modalActions, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.border }]}
                onPress={() => {
                  if (activeDetailTodo) deleteTodo(activeDetailTodo.id);
                  setDetailTodo(null);
                }}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 13 }}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleSaveDetail}
              >
                <Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 14 }}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add Group Modal */}
      <Modal visible={addGroupModalOpen} transparent animationType="fade" onRequestClose={() => setAddGroupModalOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setAddGroupModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Task Group</Text>
            <TextInput
              style={[
                styles.groupModalInput,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: isGroupInputFocused ? colors.text : colors.border,
                },
              ]}
              placeholder="Group name (e.g., Work, Personal)"
              placeholderTextColor={colors.textMuted}
              value={newGroupName}
              onChangeText={setNewGroupName}
              onSubmitEditing={handleCreateGroup}
              onFocus={() => setIsGroupInputFocused(true)}
              onBlur={() => setIsGroupInputFocused(false)}
              autoFocus
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
          </TouchableOpacity>
        </TouchableOpacity>
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
    padding: 10,
    marginBottom: 14,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addInput: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
  focusTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  focusTaskBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fullFocusBtn: {
    width: '100%',
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  fullFocusBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  detailModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  detailContent: {
    padding: 18,
    gap: 14,
  },
  fieldBlock: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleInput: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  singleInput: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  multilineInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  subtaskText: {
    flex: 1,
    fontSize: 13,
  },
  subtaskAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  subtaskInput: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  subtaskAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  groupModalInput: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginVertical: 14,
  },
});
