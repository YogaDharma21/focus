import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore, TaskItem, TaskPriority } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';
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
  Clock,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const monoFontFamily = Platform.select({
  ios: Fonts.mono.ios,
  android: Fonts.mono.android,
  web: Fonts.mono.web,
  default: Fonts.mono.android,
});

const getTodayISO = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getTomorrowISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getFutureISO = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDateConcise = (iso?: string): string => {
  if (!iso) return '';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return iso;
  const [y, m, d] = parts;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (target.getTime() === today.getTime()) return 'Today';
  if (target.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (target.getTime() === yesterday.getTime()) return 'Yesterday';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[m - 1];
  if (y === now.getFullYear()) {
    return `${monthName} ${d}`;
  }
  return `${monthName} ${d}, ${y}`;
};

const formatMins = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getPriorityColors = (p: TaskPriority, colors: typeof Colors.dark) => {
  switch (p) {
    case 'urgent':
      return { text: colors.crimson, bg: colors.crimsonBg };
    case 'high':
      return { text: colors.amber, bg: colors.amberBg };
    case 'medium':
      return { text: colors.blue, bg: colors.blueBg };
    case 'low':
      return { text: colors.emerald, bg: colors.emeraldBg };
    default:
      return { text: colors.mutedText, bg: colors.surfaceInset };
  }
};

const getVelocityBadgeColors = (
  actual: number,
  est: number,
  completed: boolean,
  colors: typeof Colors.dark
) => {
  if (actual > est) return { text: colors.crimson, bg: colors.crimsonBg };
  if (completed) return { text: colors.emerald, bg: colors.emeraldBg };
  if (actual >= est * 0.8) return { text: colors.amber, bg: colors.amberBg };
  return { text: colors.mutedText, bg: colors.surfaceInset };
};

export function TasksPage() {
  const { colors } = useTheme();
  const router = useRouter();

  const {
    tasks,
    sessions,
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
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState('');
  const [showMicroControls, setShowMicroControls] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const inputRef = useRef<TextInput>(null);

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
      deadline: selectedDeadline.trim() || undefined,
      estimatedMinutes:
        selectedDuration && selectedDuration > 0 ? selectedDuration : undefined,
    });
    setTitle('');
    setPriority('medium');
    setSelectedDuration(null);
    setSelectedDeadline('');
    setShowMicroControls(false);
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

  const hasActiveMicroControls =
    priority !== 'medium' ||
    selectedDuration !== null ||
    Boolean(selectedDeadline);

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
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: colors.surfaceInset },
              ]}
            >
              <CheckSquare size={13} color={colors.mutedText} />
            </View>
          </View>
          <Text
            style={[
              styles.metricValue,
              { color: colors.text, fontFamily: monoFontFamily },
            ]}
          >
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
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: colors.surfaceInset },
              ]}
            >
              <ListChecks size={13} color={colors.mutedText} />
            </View>
          </View>
          <Text
            style={[
              styles.metricValue,
              { color: colors.text, fontFamily: monoFontFamily },
            ]}
          >
            {completedCount}
          </Text>
        </View>
      </View>

      {/* Modern Inline Quick-Entry Card */}
      <View
        style={[
          styles.quickEntryCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Single-line inset input container */}
        <View
          style={[
            styles.singleLineInsetInputContainer,
            {
              backgroundColor: colors.surfaceInset,
              borderColor: isInputFocused ? colors.text : colors.borderSubtle,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            placeholder="Add a new task..."
            placeholderTextColor={colors.subtleText}
            value={title}
            onChangeText={setTitle}
            onFocus={() => {
              setIsInputFocused(true);
            }}
            onBlur={() => setIsInputFocused(false)}
            returnKeyType="done"
            onSubmitEditing={handleAddTask}
            style={[
              styles.quickInputText,
              {
                color: colors.text,
              },
            ]}
          />

          <View style={styles.quickInputControlsGroup}>
            {/* Options toggle button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic();
                setShowMicroControls((prev) => !prev);
              }}
              style={[
                styles.microOptionToggle,
                {
                  backgroundColor: showMicroControls
                    ? colors.surface
                    : 'transparent',
                  borderColor: hasActiveMicroControls
                    ? colors.amber
                    : colors.borderSubtle,
                },
              ]}
              accessibilityLabel="Toggle task options"
            >
              <SlidersHorizontal
                size={14}
                color={hasActiveMicroControls ? colors.amber : colors.mutedText}
              />
              {hasActiveMicroControls && (
                <View
                  style={[
                    styles.activeOptionDot,
                    { backgroundColor: colors.amber },
                  ]}
                />
              )}
            </TouchableOpacity>

            {/* Compact add icon button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleAddTask}
              disabled={!title.trim()}
              style={[
                styles.compactAddBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: title.trim() ? 1 : 0.4,
                },
              ]}
              accessibilityLabel="Add task"
            >
              <Plus size={16} color={colors.primaryText} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Expandable micro-controls */}
        {showMicroControls && (
          <View
            style={[
              styles.microControlsContainer,
              { borderTopColor: colors.borderSubtle },
            ]}
          >
            {/* Priority row with mineral badges */}
            <View style={styles.microGroup}>
              <Text
                style={[styles.microGroupLabel, { color: colors.mutedText }]}
              >
                PRIORITY
              </Text>
              <View style={styles.chipsRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p;
                  const pColors = getPriorityColors(p, colors);
                  return (
                    <TouchableOpacity
                      key={p}
                      activeOpacity={0.7}
                      onPress={() => {
                        triggerHaptic();
                        setPriority(p);
                      }}
                      style={[
                        styles.mineralChip,
                        {
                          backgroundColor: isSelected
                            ? pColors.bg
                            : colors.surfaceInset,
                          borderColor: isSelected
                            ? pColors.text
                            : colors.borderSubtle,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.mineralDot,
                          { backgroundColor: pColors.text },
                        ]}
                      />
                      <Text
                        style={[
                          styles.mineralChipText,
                          {
                            color: isSelected ? pColors.text : colors.mutedText,
                          },
                        ]}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Duration presets row */}
            <View style={styles.microGroup}>
              <Text
                style={[styles.microGroupLabel, { color: colors.mutedText }]}
              >
                DURATION
              </Text>
              <View style={styles.chipsRow}>
                {[15, 25, 45, 60].map((mins) => {
                  const isSelected = selectedDuration === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      activeOpacity={0.7}
                      onPress={() => {
                        triggerHaptic();
                        setSelectedDuration(isSelected ? null : mins);
                      }}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceInset,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.borderSubtle,
                        },
                      ]}
                    >
                      <Clock
                        size={11}
                        color={
                          isSelected ? colors.primaryText : colors.mutedText
                        }
                      />
                      <Text
                        style={[
                          styles.presetChipText,
                          {
                            color: isSelected
                              ? colors.primaryText
                              : colors.mutedText,
                            fontFamily: monoFontFamily,
                          },
                        ]}
                      >
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Deadline presets row */}
            <View style={styles.microGroup}>
              <Text
                style={[styles.microGroupLabel, { color: colors.mutedText }]}
              >
                DEADLINE
              </Text>
              <View style={styles.chipsRow}>
                {/* Today */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic();
                    const today = getTodayISO();
                    setSelectedDeadline(selectedDeadline === today ? '' : today);
                  }}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor:
                        selectedDeadline === getTodayISO()
                          ? colors.primary
                          : colors.surfaceInset,
                      borderColor:
                        selectedDeadline === getTodayISO()
                          ? colors.primary
                          : colors.borderSubtle,
                    },
                  ]}
                >
                  <Calendar
                    size={11}
                    color={
                      selectedDeadline === getTodayISO()
                        ? colors.primaryText
                        : colors.mutedText
                    }
                  />
                  <Text
                    style={[
                      styles.presetChipText,
                      {
                        color:
                          selectedDeadline === getTodayISO()
                            ? colors.primaryText
                            : colors.mutedText,
                      },
                    ]}
                  >
                    Today
                  </Text>
                </TouchableOpacity>

                {/* Tomorrow */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic();
                    const tomorrow = getTomorrowISO();
                    setSelectedDeadline(
                      selectedDeadline === tomorrow ? '' : tomorrow
                    );
                  }}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor:
                        selectedDeadline === getTomorrowISO()
                          ? colors.primary
                          : colors.surfaceInset,
                      borderColor:
                        selectedDeadline === getTomorrowISO()
                          ? colors.primary
                          : colors.borderSubtle,
                    },
                  ]}
                >
                  <Calendar
                    size={11}
                    color={
                      selectedDeadline === getTomorrowISO()
                        ? colors.primaryText
                        : colors.mutedText
                    }
                  />
                  <Text
                    style={[
                      styles.presetChipText,
                      {
                        color:
                          selectedDeadline === getTomorrowISO()
                            ? colors.primaryText
                            : colors.mutedText,
                      },
                    ]}
                  >
                    Tomorrow
                  </Text>
                </TouchableOpacity>

                {/* Custom Date Modal trigger */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic();
                    setCustomDateInput(selectedDeadline);
                    setShowDateModal(true);
                  }}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor:
                        selectedDeadline &&
                        selectedDeadline !== getTodayISO() &&
                        selectedDeadline !== getTomorrowISO()
                          ? colors.primary
                          : colors.surfaceInset,
                      borderColor:
                        selectedDeadline &&
                        selectedDeadline !== getTodayISO() &&
                        selectedDeadline !== getTomorrowISO()
                          ? colors.primary
                          : colors.borderSubtle,
                    },
                  ]}
                >
                  <Calendar
                    size={11}
                    color={
                      selectedDeadline &&
                      selectedDeadline !== getTodayISO() &&
                      selectedDeadline !== getTomorrowISO()
                        ? colors.primaryText
                        : colors.mutedText
                    }
                  />
                  <Text
                    style={[
                      styles.presetChipText,
                      {
                        color:
                          selectedDeadline &&
                          selectedDeadline !== getTodayISO() &&
                          selectedDeadline !== getTomorrowISO()
                            ? colors.primaryText
                            : colors.mutedText,
                      },
                    ]}
                  >
                    {selectedDeadline &&
                    selectedDeadline !== getTodayISO() &&
                    selectedDeadline !== getTomorrowISO()
                      ? formatDateConcise(selectedDeadline)
                      : 'Custom...'}
                  </Text>
                </TouchableOpacity>

                {/* Clear Deadline Button */}
                {selectedDeadline ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedDeadline('');
                    }}
                    style={[
                      styles.clearDeadlineBtn,
                      {
                        backgroundColor: colors.surfaceInset,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                    accessibilityLabel="Clear deadline"
                  >
                    <X size={12} color={colors.mutedText} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View
        style={[
          styles.filterRow,
          {
            backgroundColor: colors.surfaceInset,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        {(['all', 'active', 'completed'] as const).map((tab) => {
          const isActive = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.7}
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
            const pColors = getPriorityColors(task.priority || 'medium', colors);
            const subtasks = task.subtasks || [];
            const completedSubtasks = subtasks.filter((s) => s.completed).length;
            const taskSessions = (sessions || []).filter(
              (s) => s.taskId === task.id
            );
            const totalSeconds = taskSessions.reduce(
              (acc, s) => acc + (s.duration || 0),
              0
            );
            const actualMinutes = Math.round(totalSeconds / 60);
            const hasEstimate =
              typeof task.estimatedMinutes === 'number' &&
              task.estimatedMinutes > 0;
            const velocityColors = hasEstimate
              ? getVelocityBadgeColors(
                  actualMinutes,
                  task.estimatedMinutes!,
                  task.completed,
                  colors
                )
              : null;

            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: isFocusSelected
                      ? colors.surface
                      : colors.card,
                    borderColor: isFocusSelected
                      ? colors.text
                      : colors.border,
                  },
                ]}
              >
                <View style={styles.taskMainRow}>
                  {/* Complete checkbox */}
                  <TouchableOpacity
                    onPress={() => handleToggleTask(task.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.checkHit}
                    accessibilityLabel={
                      task.completed ? 'Mark incomplete' : 'Mark complete'
                    }
                  >
                    {task.completed ? (
                      <CheckSquare size={18} color={colors.emerald} />
                    ) : (
                      <Square size={18} color={colors.mutedText} />
                    )}
                  </TouchableOpacity>

                  {/* Task text and metadata */}
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: task.completed ? colors.mutedText : colors.text,
                          textDecorationLine: task.completed
                            ? 'line-through'
                            : 'none',
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
                            {
                              backgroundColor: pColors.bg,
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.chipDot,
                              { backgroundColor: pColors.text },
                            ]}
                          />
                          <Text
                            style={[styles.badgeText, { color: pColors.text }]}
                          >
                            {task.priority}
                          </Text>
                        </View>
                      )}

                      {task.deadline ? (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: colors.surfaceInset,
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          <Calendar size={10} color={colors.mutedText} />
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color: colors.mutedText,
                                fontFamily: monoFontFamily,
                              },
                            ]}
                          >
                            {formatDateConcise(task.deadline)}
                          </Text>
                        </View>
                      ) : null}

                      {hasEstimate && velocityColors && (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: velocityColors.bg,
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          <Clock size={10} color={velocityColors.text} />
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color: velocityColors.text,
                                fontFamily: monoFontFamily,
                              },
                            ]}
                          >
                            {formatMins(actualMinutes)} /{' '}
                            {formatMins(task.estimatedMinutes!)}
                          </Text>
                        </View>
                      )}

                      {!hasEstimate && actualMinutes > 0 && (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: colors.surfaceInset,
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          <Clock size={10} color={colors.mutedText} />
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color: colors.mutedText,
                                fontFamily: monoFontFamily,
                              },
                            ]}
                          >
                            {formatMins(actualMinutes)}
                          </Text>
                        </View>
                      )}

                      {isFocusSelected && (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: colors.emeraldBg,
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          <Target size={10} color={colors.emerald} />
                          <Text
                            style={[styles.badgeText, { color: colors.emerald }]}
                          >
                            Focus Active
                          </Text>
                        </View>
                      )}

                      {subtasks.length > 0 && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            setExpandedTaskId(isExpanded ? null : task.id)
                          }
                          style={[
                            styles.subtaskBadgeBtn,
                            {
                              backgroundColor: colors.surfaceInset,
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          <ListChecks size={10} color={colors.mutedText} />
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color: colors.mutedText,
                                fontFamily: monoFontFamily,
                              },
                            ]}
                          >
                            {completedSubtasks}/{subtasks.length}
                          </Text>
                          {isExpanded ? (
                            <ChevronUp size={10} color={colors.mutedText} />
                          ) : (
                            <ChevronDown size={10} color={colors.mutedText} />
                          )}
                        </TouchableOpacity>
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
                              ? colors.primary
                              : colors.surfaceInset,
                          },
                        ]}
                        accessibilityLabel="Focus on this task"
                      >
                        <Target
                          size={15}
                          color={
                            isFocusSelected
                              ? colors.primaryText
                              : colors.mutedText
                          }
                        />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() =>
                        setExpandedTaskId(isExpanded ? null : task.id)
                      }
                      activeOpacity={0.7}
                      style={[
                        styles.actionIconBtn,
                        {
                          backgroundColor: isExpanded
                            ? colors.surface
                            : colors.surfaceInset,
                        },
                      ]}
                      accessibilityLabel="Toggle subtasks"
                    >
                      <ListChecks
                        size={15}
                        color={isExpanded ? colors.text : colors.mutedText}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteTask(task.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.actionIconBtn,
                        { backgroundColor: colors.surfaceInset },
                      ]}
                      accessibilityLabel="Delete task"
                    >
                      <Trash2 size={14} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>

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
                    {subtasks.length === 0 ? (
                      <Text
                        style={[
                          styles.noSubtasksText,
                          { color: colors.subtleText },
                        ]}
                      >
                        No subtasks yet. Add one below.
                      </Text>
                    ) : (
                      subtasks.map((sub) => (
                        <View key={sub.id} style={styles.subtaskRow}>
                          <TouchableOpacity
                            onPress={() => {
                              triggerHaptic();
                              toggleSubtask(task.id, sub.id);
                            }}
                            style={styles.subtaskCheckHit}
                            activeOpacity={0.7}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            {sub.completed ? (
                              <CheckSquare size={14} color={colors.emerald} />
                            ) : (
                              <Square size={14} color={colors.mutedText} />
                            )}
                          </TouchableOpacity>

                          <Text
                            style={[
                              styles.subtaskText,
                              {
                                color: sub.completed
                                  ? colors.mutedText
                                  : colors.text,
                                textDecorationLine: sub.completed
                                  ? 'line-through'
                                  : 'none',
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
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Trash2 size={12} color={colors.mutedText} />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}

                    {/* Add subtask inline input */}
                    <View style={styles.addSubtaskRow}>
                      <TextInput
                        placeholder="Add subtask..."
                        placeholderTextColor={colors.subtleText}
                        value={subtaskInputs[task.id] || ''}
                        onChangeText={(txt) =>
                          setSubtaskInputs((prev) => ({
                            ...prev,
                            [task.id]: txt,
                          }))
                        }
                        onSubmitEditing={() => handleAddSubtask(task.id)}
                        returnKeyType="done"
                        style={[
                          styles.subtaskInput,
                          {
                            color: colors.text,
                            backgroundColor: colors.card,
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleAddSubtask(task.id)}
                        disabled={!(subtaskInputs[task.id] || '').trim()}
                        style={[
                          styles.subtaskAddBtn,
                          {
                            backgroundColor: colors.primary,
                            opacity: (subtaskInputs[task.id] || '').trim()
                              ? 1
                              : 0.35,
                          },
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

      {/* Custom Date Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDateModal(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Calendar size={16} color={colors.mutedText} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Set Deadline
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDateModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={16} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            {/* Date Preset Suggestions */}
            <View style={styles.modalPresetRow}>
              {[
                { label: 'Today', date: getTodayISO() },
                { label: 'Tomorrow', date: getTomorrowISO() },
                { label: '+3 Days', date: getFutureISO(3) },
                { label: 'Next Week', date: getFutureISO(7) },
              ].map((p) => {
                const isSelected = customDateInput === p.date;
                return (
                  <TouchableOpacity
                    key={p.label}
                    activeOpacity={0.7}
                    onPress={() => {
                      triggerHaptic();
                      setCustomDateInput(p.date);
                    }}
                    style={[
                      styles.modalPresetChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceInset,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalPresetText,
                        {
                          color: isSelected
                            ? colors.primaryText
                            : colors.mutedText,
                        },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Direct ISO Input */}
            <View style={styles.modalInputSection}>
              <Text
                style={[styles.modalInputLabel, { color: colors.mutedText }]}
              >
                DATE (YYYY-MM-DD)
              </Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.subtleText}
                value={customDateInput}
                onChangeText={setCustomDateInput}
                style={[
                  styles.modalTextInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceInset,
                    borderColor: colors.borderSubtle,
                    fontFamily: monoFontFamily,
                  },
                ]}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic();
                  setSelectedDeadline('');
                  setShowDateModal(false);
                }}
                style={[
                  styles.modalSecondaryBtn,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surfaceInset,
                  },
                ]}
              >
                <Text
                  style={[styles.modalBtnText, { color: colors.mutedText }]}
                >
                  Clear
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic();
                  if (customDateInput.trim()) {
                    setSelectedDeadline(customDateInput.trim());
                  }
                  setShowDateModal(false);
                }}
                style={[
                  styles.modalPrimaryBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[styles.modalBtnText, { color: colors.primaryText }]}
                >
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-between',
    minHeight: 80,
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
    letterSpacing: -0.6,
    marginTop: 4,
  },
  quickEntryCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 8,
  },
  singleLineInsetInputContainer: {
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickInputText: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  quickInputControlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  microOptionToggle: {
    padding: 7,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  activeOptionDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  compactAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microControlsContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 8,
  },
  microGroup: {
    gap: 4,
  },
  microGroupLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  mineralChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mineralDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mineralChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  clearDeadlineBtn: {
    padding: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterTabActive: {
    borderWidth: StyleSheet.hairlineWidth,
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
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  taskCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  checkHit: {
    paddingTop: 1,
    paddingRight: 2,
  },
  taskContent: {
    flex: 1,
    gap: 6,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    textTransform: 'capitalize',
  },
  subtaskBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionIconBtn: {
    padding: 7,
    borderRadius: 8,
  },
  subtasksContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 8,
  },
  noSubtasksText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  subtaskCheckHit: {
    padding: 2,
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
    gap: 6,
    marginTop: 4,
  },
  subtaskInput: {
    flex: 1,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  subtaskAddBtn: {
    padding: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalPresetText: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalInputSection: {
    gap: 6,
  },
  modalInputLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  modalTextInput: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  modalSecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalPrimaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
