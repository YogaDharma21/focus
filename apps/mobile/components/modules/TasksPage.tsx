import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore, TaskItem, TaskPriority } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
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
} from 'lucide-react-native';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function TasksPage() {
  const { colors } = useTheme();
  const router = useRouter();

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
  } = useAppStore();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});

  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddTask = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    triggerHaptic();
    addTask({
      text: trimmed,
      priority,
      deadline: deadline.trim() || undefined,
    });
    setTitle('');
    setDeadline('');
  };

  const handleToggleTask = (id: string) => {
    triggerHaptic();
    toggleTask(id);
  };

  const handleFocusTask = (task: TaskItem) => {
    if (task.completed) return;
    triggerHaptic();
    setSelectedTaskId(task.id);
    setView('FOCUS');
    router.navigate('/(tabs)');
  };

  const handleDeleteTask = (taskId: string) => {
    triggerHaptic();
    deleteTask(taskId);
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
  };

  const handleAddSubtask = (taskId: string) => {
    const text = (subtaskInputs[taskId] || '').trim();
    if (!text) return;
    triggerHaptic();
    addSubtask(taskId, text);
    setSubtaskInputs((prev) => ({ ...prev, [taskId]: '' }));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const getPriorityColors = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return { text: colors.crimson, bg: colors.crimsonBg };
      case 'high':
        return { text: colors.amber, bg: colors.amberBg };
      case 'medium':
        return { text: colors.blue, bg: colors.blueBg };
      case 'low':
      default:
        return { text: colors.mutedText, bg: colors.surfaceInset };
    }
  };

  return (
    <View style={styles.container}>
      {/* Metric Cards Row */}
      <View style={styles.metricsRow}>
        <View
          style={[
            styles.metricCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.mutedText }]}>
              ACTIVE TASKS
            </Text>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.surfaceInset }]}>
              <CheckSquare size={13} color={colors.mutedText} />
            </View>
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {activeCount}
          </Text>
        </View>

        <View
          style={[
            styles.metricCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.metricHeader}>
            <Text style={[styles.metricLabel, { color: colors.mutedText }]}>
              COMPLETED
            </Text>
            <View style={[styles.metricIconWrap, { backgroundColor: colors.surfaceInset }]}>
              <ListChecks size={13} color={colors.mutedText} />
            </View>
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {completedCount}
          </Text>
        </View>
      </View>

      {/* Add Task Card */}
      <View
        style={[
          styles.createCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TextInput
          placeholder="Add a new task..."
          placeholderTextColor={colors.mutedText}
          value={title}
          onChangeText={setTitle}
          style={[
            styles.titleInput,
            {
              color: colors.text,
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
            },
          ]}
        />

        <View style={styles.metaRow}>
          {/* Priority selector */}
          <View style={styles.prioritySelector}>
            {PRIORITIES.map((p) => {
              const isSelected = priority === p;
              const { text: pText, bg: pBg } = getPriorityColors(p);
              return (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.7}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityBtn,
                    {
                      backgroundColor: isSelected ? pBg : 'transparent',
                      borderColor: isSelected ? pText : colors.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityBtnText,
                      { color: isSelected ? pText : colors.mutedText },
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputActionRow}>
          <View style={styles.deadlineWrap}>
            <TextInput
              placeholder="Due date (optional)"
              placeholderTextColor={colors.mutedText}
              value={deadline}
              onChangeText={setDeadline}
              style={[
                styles.deadlineInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceInset,
                  borderColor: colors.border,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAddTask}
            disabled={!title.trim()}
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
                opacity: title.trim() ? 1 : 0.45,
              },
            ]}
          >
            <Plus size={16} color={colors.primaryText} />
            <Text style={[styles.addButtonText, { color: colors.primaryText }]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View
        style={[
          styles.filterRow,
          { backgroundColor: colors.surfaceInset, borderColor: colors.borderSubtle },
        ]}
      >
        {(['all', 'active', 'completed'] as const).map((tab) => {
          const isActive = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setFilter(tab)}
              style={[
                styles.filterTab,
                isActive && [
                  styles.filterTabActive,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ],
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: isActive ? colors.text : colors.mutedText },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Task List */}
      <View style={styles.taskList}>
        {filteredTasks.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <CheckSquare size={28} color={colors.mutedText} />
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>
              {filter === 'completed'
                ? 'No completed tasks yet'
                : filter === 'active'
                ? 'No active tasks'
                : 'No tasks created yet'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const isFocusSelected = selectedTaskId === task.id;
            const pColors = getPriorityColors(task.priority || 'medium');
            const subtasks = task.subtasks || [];
            const completedSubtasks = subtasks.filter((s) => s.completed).length;

            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isFocusSelected ? colors.emerald : colors.border,
                  },
                ]}
              >
                <View style={styles.taskMainRow}>
                  {/* Complete checkbox */}
                  <TouchableOpacity
                    onPress={() => handleToggleTask(task.id)}
                    activeOpacity={0.7}
                    style={styles.checkHit}
                  >
                    {task.completed ? (
                      <CheckSquare size={19} color={colors.emerald} />
                    ) : (
                      <Square size={19} color={colors.mutedText} />
                    )}
                  </TouchableOpacity>

                  {/* Task text and metadata */}
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: task.completed ? colors.mutedText : colors.text,
                          textDecorationLine: task.completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {task.text}
                    </Text>

                    <View style={styles.badgeRow}>
                      {task.priority && (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: pColors.bg },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: pColors.text }]}>
                            {task.priority}
                          </Text>
                        </View>
                      )}

                      {task.deadline ? (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: colors.surfaceInset },
                          ]}
                        >
                          <Calendar size={10} color={colors.mutedText} />
                          <Text style={[styles.badgeText, { color: colors.mutedText }]}>
                            {task.deadline}
                          </Text>
                        </View>
                      ) : null}

                      {isFocusSelected && (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: colors.emeraldBg },
                          ]}
                        >
                          <Target size={10} color={colors.emerald} />
                          <Text style={[styles.badgeText, { color: colors.emerald }]}>
                            Focus Active
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.taskActions}>
                    {!task.completed && (
                      <TouchableOpacity
                        onPress={() => handleFocusTask(task)}
                        activeOpacity={0.7}
                        style={[
                          styles.actionIconBtn,
                          {
                            backgroundColor: isFocusSelected
                              ? colors.emeraldBg
                              : colors.surfaceInset,
                          },
                        ]}
                        accessibilityLabel="Focus on this task"
                      >
                        <Target
                          size={15}
                          color={isFocusSelected ? colors.emerald : colors.mutedText}
                        />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() =>
                        setExpandedTaskId(isExpanded ? null : task.id)
                      }
                      activeOpacity={0.7}
                      style={[styles.actionIconBtn, { backgroundColor: colors.surfaceInset }]}
                    >
                      {isExpanded ? (
                        <ChevronUp size={15} color={colors.mutedText} />
                      ) : (
                        <ChevronDown size={15} color={colors.mutedText} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteTask(task.id)}
                      activeOpacity={0.7}
                      style={[styles.actionIconBtn, { backgroundColor: colors.surfaceInset }]}
                    >
                      <Trash2 size={14} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Subtask count preview if collapsed and has subtasks */}
                {!isExpanded && subtasks.length > 0 && (
                  <View style={styles.subtaskPreviewRow}>
                    <Text style={[styles.subtaskPreviewText, { color: colors.mutedText }]}>
                      {completedSubtasks} of {subtasks.length} subtasks done
                    </Text>
                  </View>
                )}

                {/* Expanded Subtasks */}
                {isExpanded && (
                  <View
                    style={[
                      styles.subtasksContainer,
                      {
                        borderTopColor: colors.borderSubtle,
                        backgroundColor: colors.surfaceInset,
                      },
                    ]}
                  >
                    {subtasks.map((sub) => (
                      <View key={sub.id} style={styles.subtaskRow}>
                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic();
                            toggleSubtask(task.id, sub.id);
                          }}
                          style={styles.subtaskCheckHit}
                          activeOpacity={0.7}
                        >
                          {sub.completed ? (
                            <CheckSquare size={15} color={colors.emerald} />
                          ) : (
                            <Square size={15} color={colors.mutedText} />
                          )}
                        </TouchableOpacity>

                        <Text
                          style={[
                            styles.subtaskText,
                            {
                              color: sub.completed ? colors.mutedText : colors.text,
                              textDecorationLine: sub.completed ? 'line-through' : 'none',
                            },
                          ]}
                        >
                          {sub.text}
                        </Text>

                        <TouchableOpacity
                          onPress={() => {
                            triggerHaptic();
                            deleteSubtask(task.id, sub.id);
                          }}
                          activeOpacity={0.7}
                          style={styles.subtaskDeleteHit}
                        >
                          <Trash2 size={12} color={colors.mutedText} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* Add subtask inline input */}
                    <View style={styles.addSubtaskRow}>
                      <TextInput
                        placeholder="Add subtask..."
                        placeholderTextColor={colors.mutedText}
                        value={subtaskInputs[task.id] || ''}
                        onChangeText={(txt) =>
                          setSubtaskInputs((prev) => ({ ...prev, [task.id]: txt }))
                        }
                        onSubmitEditing={() => handleAddSubtask(task.id)}
                        style={[
                          styles.subtaskInput,
                          {
                            color: colors.text,
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                      />
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleAddSubtask(task.id)}
                        style={[
                          styles.subtaskAddBtn,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Plus size={14} color={colors.primaryText} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 16,
    gap: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 84,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metricIconWrap: {
    padding: 5,
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  createCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  titleInput: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  priorityBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityBtnText: {
    fontSize: 11,
    fontWeight: '500',
  },
  inputActionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  deadlineWrap: {
    flex: 1,
  },
  deadlineInput: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterTabActive: {
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskList: {
    gap: 10,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  taskCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  checkHit: {
    padding: 4,
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBtn: {
    padding: 7,
    borderRadius: 8,
  },
  subtaskPreviewRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  subtaskPreviewText: {
    fontSize: 11,
  },
  subtasksContainer: {
    borderTopWidth: 1,
    padding: 12,
    gap: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  subtaskCheckHit: {
    padding: 3,
  },
  subtaskText: {
    flex: 1,
    fontSize: 12,
  },
  subtaskDeleteHit: {
    padding: 4,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  subtaskInput: {
    flex: 1,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  subtaskAddBtn: {
    padding: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
