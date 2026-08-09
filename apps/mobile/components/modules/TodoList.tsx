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
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore, TodoItem } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import {
  CheckSquare,
  Square,
  Target,
  Plus,
  Trash2,
  FolderPlus,
  ListCheck,
  X,
  Calendar,
  Sparkles,
  List,
  Timer,
  FileText,
  ChevronDown,
  Clock,
  Play,
} from 'lucide-react-native';
import DatePickerModal, { formatDeadlineDisplay } from './DatePickerModal';

const PRIORITIES: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];

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
    selectedTodoId,
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
  const [detailNotes, setDetailNotes] = useState('');
  const [detailPriority, setDetailPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [detailPomoEst, setDetailPomoEst] = useState('1');
  const [detailPomoComp, setDetailPomoComp] = useState('0');
  const [detailDeadline, setDetailDeadline] = useState('');
  const [detailGroupId, setDetailGroupId] = useState('current');
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Date & Time Picker Modal State
  const [datePickerModalOpen, setDatePickerModalOpen] = useState(false);
  const [datePickerInitialMode, setDatePickerInitialMode] = useState<'date' | 'time'>('date');

  // Dropdown states
  const [priorityPickerOpen, setPriorityPickerOpen] = useState(false);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  const [isAddFocused, setIsAddFocused] = useState(false);
  const [isGroupInputFocused, setIsGroupInputFocused] = useState(false);

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
    setDetailNotes(todo.notes || '');
    setDetailPriority(todo.priority || 'medium');
    setDetailPomoEst((todo.estimatedPomodoros || 1).toString());
    setDetailPomoComp((todo.completedPomodoros || 0).toString());
    setDetailDeadline(todo.deadline || '');
    setDetailGroupId(todo.groupId || 'current');
    setNewSubtaskText('');
    setPriorityPickerOpen(false);
    setGroupPickerOpen(false);
  };

  const handleSaveDetail = () => {
    if (!detailTodo) return;
    updateTodo(detailTodo.id, {
      text: detailTitle.trim() || detailTodo.text,
      notes: detailNotes.trim(),
      priority: detailPriority,
      estimatedPomodoros: Math.max(1, parseInt(detailPomoEst, 10) || 1),
      completedPomodoros: Math.max(0, parseInt(detailPomoComp, 10) || 0),
      deadline: detailDeadline.trim(),
      groupId: detailGroupId,
    });
    setDetailTodo(null);
  };

  const handleAddDetailSubtask = () => {
    if (!detailTodo || !newSubtaskText.trim()) return;
    addSubtask(detailTodo.id, newSubtaskText.trim());
    setNewSubtaskText('');
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

      {/* Quick Add Todo Bar */}
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
            const isSelected = selectedTodoId === todo.id || detailTodo?.id === todo.id;

            return (
              <TouchableOpacity
                key={todo.id}
                style={[
                  styles.todoCard,
                  {
                    backgroundColor: isSelected ? "#27272a" : colors.card,
                    borderColor: isSelected ? "#3f3f46" : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedTodoId(todo.id);
                  handleOpenDetail(todo);
                }}
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
                      <View style={[styles.badge, { backgroundColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
                        <Timer size={12} color={colors.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.badgeText, { color: colors.text }]}>
                          {todo.completedPomodoros || 0}/{todo.estimatedPomodoros || 1} sessions
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
                        <View style={[styles.badge, { backgroundColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}>
                          <Calendar size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                          <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                            {(() => {
                              const d = formatDeadlineDisplay(todo.deadline);
                              return `${d.dateStr}${d.timeStr !== 'No time set' ? ' • ' + d.timeStr : ''}`;
                            })()}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity
                      onPress={() => handleFocusOnTask(todo)}
                      style={{ padding: 6 }}
                      accessibilityLabel="Focus on this task"
                    >
                      <Target size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => deleteTodo(todo.id)}
                      style={{ padding: 6 }}
                      accessibilityLabel="Delete task"
                    >
                      <Trash2 size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Task Detail Modal */}
      <Modal
        visible={!!activeDetailTodo}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailTodo(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setPriorityPickerOpen(false);
              setGroupPickerOpen(false);
              setDetailTodo(null);
            }}
          />
          <View style={styles.detailModalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderLabel}>TASK DETAILS</Text>
              <TouchableOpacity
                onPress={() => setDetailTodo(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Editable Task Title */}
            <TextInput
              style={styles.detailTitleInput}
              value={detailTitle}
              onChangeText={setDetailTitle}
              placeholder="Task title..."
              placeholderTextColor="#71717a"
            />

            <ScrollView
              contentContainerStyle={styles.detailContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {/* Row 1: Priority & Group Cards */}
              <View style={styles.gridRow}>
                {/* Priority Card */}
                <View style={[styles.cardBlock, { flex: 1, zIndex: priorityPickerOpen ? 999 : 1 }]}>
                  <View style={styles.cardHeaderRow}>
                    <Sparkles size={14} color="#f59e0b" style={{ marginRight: 6 }} />
                    <Text style={[styles.cardHeaderLabel, { color: '#f59e0b' }]}>PRIORITY</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => {
                      setPriorityPickerOpen(!priorityPickerOpen);
                      setGroupPickerOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownBtnText}>
                      {detailPriority.charAt(0).toUpperCase() + detailPriority.slice(1)}
                    </Text>
                    <ChevronDown size={16} color="#a1a1aa" />
                  </TouchableOpacity>

                  {priorityPickerOpen && (
                    <View style={styles.dropdownMenu}>
                      {PRIORITIES.map((p) => (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.dropdownMenuItem,
                            detailPriority === p && styles.dropdownMenuItemActive,
                          ]}
                          onPress={() => {
                            setDetailPriority(p);
                            setPriorityPickerOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownMenuItemText,
                              detailPriority === p && styles.dropdownMenuItemTextActive,
                            ]}
                          >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Group Card */}
                <View style={[styles.cardBlock, { flex: 1, zIndex: groupPickerOpen ? 999 : 1 }]}>
                  <View style={styles.cardHeaderRow}>
                    <List size={14} color="#3b82f6" style={{ marginRight: 6 }} />
                    <Text style={[styles.cardHeaderLabel, { color: '#3b82f6' }]}>GROUP</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => {
                      setGroupPickerOpen(!groupPickerOpen);
                      setPriorityPickerOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownBtnText} numberOfLines={1}>
                      {groups.find((g) => g.id === detailGroupId)?.name || 'Current Tasks'}
                    </Text>
                    <ChevronDown size={16} color="#a1a1aa" />
                  </TouchableOpacity>

                  {groupPickerOpen && (
                    <View style={styles.dropdownMenu}>
                      {groups.map((g) => (
                        <TouchableOpacity
                          key={g.id}
                          style={[
                            styles.dropdownMenuItem,
                            detailGroupId === g.id && styles.dropdownMenuItemActive,
                          ]}
                          onPress={() => {
                            setDetailGroupId(g.id);
                            setGroupPickerOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownMenuItemText,
                              detailGroupId === g.id && styles.dropdownMenuItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {g.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Card 2: FOCUS SESSIONS */}
              <View style={styles.cardBlock}>
                <View style={styles.cardHeaderRow}>
                  <Timer size={14} color="#10b981" style={{ marginRight: 6 }} />
                  <Text style={[styles.cardHeaderLabel, { color: '#10b981' }]}>FOCUS SESSIONS</Text>
                </View>
                <View style={styles.gridRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputSubLabel}>Estimated</Text>
                    <TextInput
                      style={styles.cardInput}
                      keyboardType="numeric"
                      value={detailPomoEst}
                      onChangeText={(val) => setDetailPomoEst(val.replace(/[^0-9]/g, ''))}
                      placeholder="1"
                      placeholderTextColor="#71717a"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputSubLabel}>Completed</Text>
                    <TextInput
                      style={styles.cardInput}
                      keyboardType="numeric"
                      value={detailPomoComp}
                      onChangeText={(val) => setDetailPomoComp(val.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      placeholderTextColor="#71717a"
                    />
                  </View>
                </View>

                {/* Progress Bar */}
                {(() => {
                  const est = Math.max(1, parseInt(detailPomoEst, 10) || 1);
                  const comp = Math.max(0, parseInt(detailPomoComp, 10) || 0);
                  const pct = Math.min(100, Math.round((comp / est) * 100));
                  return (
                    <View style={{ marginTop: 14 }}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{pct}% Completed</Text>
                    </View>
                  );
                })()}
              </View>

              {/* Card 3: DEADLINE */}
              <View style={styles.cardBlock}>
                <View style={styles.cardHeaderRow}>
                  <Calendar size={14} color="#8b5cf6" style={{ marginRight: 6 }} />
                  <Text style={[styles.cardHeaderLabel, { color: '#8b5cf6' }]}>DEADLINE</Text>
                </View>
                {(() => {
                  const { dateStr, timeStr } = formatDeadlineDisplay(detailDeadline);
                  return (
                    <View style={styles.gridRow}>
                      <TouchableOpacity
                        style={[styles.iconInputBox, { flex: 1 }]}
                        onPress={() => {
                          setDatePickerInitialMode('date');
                          setDatePickerModalOpen(true);
                        }}
                      >
                        <Calendar size={14} color="#a78bfa" style={{ marginRight: 8 }} />
                        <Text style={{ color: detailDeadline ? '#ffffff' : '#71717a', fontSize: 13, flex: 1 }}>
                          {dateStr}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconInputBox, { flex: 1 }]}
                        onPress={() => {
                          setDatePickerInitialMode('time');
                          setDatePickerModalOpen(true);
                        }}
                      >
                        <Text style={{ color: detailDeadline ? '#ffffff' : '#71717a', fontSize: 13, flex: 1, textAlign: 'right' }}>
                          {timeStr}
                        </Text>
                        <Clock size={14} color="#38bdf8" style={{ marginLeft: 8 }} />
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>

              {/* Card 4: NOTES */}
              <View style={styles.cardBlock}>
                <View style={styles.cardHeaderRow}>
                  <FileText size={14} color="#f59e0b" style={{ marginRight: 6 }} />
                  <Text style={[styles.cardHeaderLabel, { color: '#f59e0b' }]}>NOTES</Text>
                </View>
                <TextInput
                  style={styles.notesArea}
                  multiline
                  numberOfLines={3}
                  placeholder="Add notes or details for this task..."
                  placeholderTextColor="#71717a"
                  value={detailNotes}
                  onChangeText={setDetailNotes}
                />
              </View>

              {/* Card 5: SUBTASKS */}
              <View style={styles.cardBlock}>
                <View style={styles.cardHeaderBetween}>
                  <View style={styles.cardHeaderRow}>
                    <CheckSquare size={14} color="#14b8a6" style={{ marginRight: 6 }} />
                    <Text style={[styles.cardHeaderLabel, { color: '#14b8a6' }]}>SUBTASKS</Text>
                  </View>
                  <View style={styles.badgeSmall}>
                    <Text style={styles.badgeSmallText}>
                      {activeDetailTodo?.subtasks?.filter((s) => s.completed).length || 0}/
                      {activeDetailTodo?.subtasks?.length || 0}
                    </Text>
                  </View>
                </View>

                {/* Subtask list */}
                {activeDetailTodo?.subtasks && activeDetailTodo.subtasks.length > 0 && (
                  <View style={{ gap: 8, marginVertical: 6 }}>
                    {activeDetailTodo.subtasks.map((subtask) => (
                      <View key={subtask.id} style={styles.subtaskRowItem}>
                        <TouchableOpacity onPress={() => toggleSubtask(activeDetailTodo.id, subtask.id)}>
                          {subtask.completed ? (
                            <CheckSquare size={16} color="#10b981" />
                          ) : (
                            <Square size={16} color="#71717a" />
                          )}
                        </TouchableOpacity>
                        <Text
                          style={[
                            styles.subtaskTextItem,
                            subtask.completed && styles.subtaskTextDone,
                          ]}
                        >
                          {subtask.text}
                        </Text>
                        <TouchableOpacity onPress={() => deleteSubtask(activeDetailTodo.id, subtask.id)}>
                          <Trash2 size={14} color="#71717a" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Subtask add input */}
                <View style={styles.subtaskInputContainer}>
                  <TextInput
                    style={styles.subtaskInputField}
                    placeholder="Add a subtask..."
                    placeholderTextColor="#71717a"
                    value={newSubtaskText}
                    onChangeText={setNewSubtaskText}
                    onSubmitEditing={handleAddDetailSubtask}
                  />
                </View>
              </View>

              {/* Footer Actions */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.deleteTaskBtn}
                  onPress={() => {
                    if (activeDetailTodo) deleteTodo(activeDetailTodo.id);
                    setDetailTodo(null);
                  }}
                >
                  <Trash2 size={16} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteTaskText}>Delete Task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveTaskBtn}
                  onPress={handleSaveDetail}
                >
                  <Text style={styles.saveTaskText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date & Time Picker Modal */}
      <DatePickerModal
        visible={datePickerModalOpen}
        onClose={() => setDatePickerModalOpen(false)}
        value={detailDeadline}
        onChange={(newVal) => setDetailDeadline(newVal)}
        initialMode={datePickerInitialMode}
      />

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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#0c0c0e',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 4,
  },
  detailTitleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 8,
    paddingVertical: 4,
  },
  detailContent: {
    gap: 12,
    paddingBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardBlock: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    position: 'relative',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dropdownBtn: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 68,
    left: 14,
    right: 14,
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  dropdownMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  dropdownMenuItemActive: {
    backgroundColor: '#3f3f46',
  },
  dropdownMenuItemText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
  },
  dropdownMenuItemTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputSubLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardInput: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardDisplayBox: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  cardDisplayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    backgroundColor: '#27272a',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#10b981',
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 6,
  },
  iconInputBox: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconInputText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  notesArea: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  badgeSmall: {
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeSmallText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  subtaskRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  subtaskTextItem: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  subtaskTextDone: {
    textDecorationLine: 'line-through',
    color: '#71717a',
  },
  subtaskInputContainer: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginTop: 4,
  },
  subtaskInputField: {
    color: '#ffffff',
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 4,
  },
  deleteTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  deleteTaskText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  saveTaskBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveTaskText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
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
