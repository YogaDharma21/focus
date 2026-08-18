import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useAppStore, TodoItem } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Radius } from '@/constants/theme';
import { playCompletionSound } from '@/lib/sound';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Settings,
  Trash2,
  CheckSquare,
  Square,
  ListCheck,
  ListTodo,
  Pencil,
  Check,
  X,
  ChevronDown,
  FileText,
  Timer,
  Coffee,
  Clock,
} from 'lucide-react-native';

const DISTRACTION_CATEGORIES = [
  'Social Media',
  'Notification',
  'Thought',
  'Break',
  'Other',
];

interface CustomToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
}

function CustomToggleSwitch({ value, onToggle }: CustomToggleSwitchProps) {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 21],
  });

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#3f3f46', '#ffffff'],
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9ca3af', '#09090b'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={styles.switchTouchable}
    >
      <Animated.View
        style={[
          styles.switchTrack,
          {
            backgroundColor: trackColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.switchThumb,
            {
              backgroundColor: thumbColor,
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export function FocusTimer() {
  const { colors } = useTheme();
  const {
    timerMode,
    setTimerMode,
    timerState,
    setTimerState,
    previousMode,
    setPreviousMode,
    timeLeft,
    setTimeLeft,
    isActive,
    setIsActive,
    sessionName,
    setSessionName,
    todos,
    selectedTodoId,
    setSelectedTodoId,
    addTodo,
    updateTodo,
    addSession,
    addDistraction,
    pomodoroSettings,
    setPomodoroSettings,
    pomodoroCount,
    setPomodoroCount,
    resetPomodoroCount,
    resetAllData,
    toggleSubtask,
    incrementTodoSession,
    setDeepFocusMode,
  } = useAppStore();

  const [distractionModalOpen, setDistractionModalOpen] = useState(false);
  const [todoPickerOpen, setTodoPickerOpen] = useState(false);

  const [isSessionFocused, setIsSessionFocused] = useState(false);



  const handleCustomFocusSubmit = () => {
    if (!sessionName.trim()) return;
    const taskText = sessionName.trim();
    const newTaskId = Date.now().toString();

    const newTodo: TodoItem = {
      id: newTaskId,
      text: taskText,
      completed: false,
      priority: 'medium',
      groupId: 'current',
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      subtasks: [],
    };

    addTodo(newTodo);
    setSelectedTodoId(newTaskId);
    setSessionName(taskText);
  };

  const toggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    const isWorkOrFlow = timerMode === 'STOPWATCH' || (timerMode === 'POMODORO' && timerState === 'WORK');
    if (nextActive && isWorkOrFlow) {
      setDeepFocusMode(true);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    if (timerMode === 'POMODORO') {
      const time =
        timerState === 'WORK'
          ? pomodoroSettings.work * 60
          : pomodoroSettings.break * 60;
      setTimeLeft(time);
    } else {
      if (timeLeft > 0) {
        addSession({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          duration: timeLeft,
          mode: 'STOPWATCH',
        });
      }
      setTimeLeft(0);
    }
  };

  const handleCompleteSession = () => {
    playCompletionSound();
    setIsActive(false);

    if (timerMode === 'STOPWATCH') {
      // Flow Mode Session Completed
      const flowDuration = timeLeft;
      if (flowDuration > 0) {
        addSession({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          duration: flowDuration,
          mode: 'STOPWATCH',
        });
        if (selectedTodoId) {
          incrementTodoSession(selectedTodoId);
        }
        // Divide elapsed Flow duration by 5 for break (min 1 second)
        const breakSeconds = Math.max(Math.floor(flowDuration / 5), 1);
        setPreviousMode('STOPWATCH');
        setTimerMode('POMODORO');
        setTimerState('BREAK');
        setTimeLeft(breakSeconds);
        if (pomodoroSettings.autoStartBreak) {
          setIsActive(true);
        }
        setDeepFocusMode(false);
      } else {
        setTimeLeft(0);
      }
    } else if (timerMode === 'POMODORO' && timerState === 'WORK') {
      // Pomodoro Work Session Completed
      let sessionDuration = (pomodoroSettings.work * 60) - timeLeft;
      if (sessionDuration <= 0) sessionDuration = pomodoroSettings.work * 60;
      const nextCount = (pomodoroCount || 0) + 1;
      setPomodoroCount(nextCount);

      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: sessionDuration,
        mode: 'POMODORO',
      });
      if (selectedTodoId) {
        incrementTodoSession(selectedTodoId);
      }
      const isLongBreak = nextCount % 4 === 0;
      const breakDuration = isLongBreak
        ? (pomodoroSettings.longBreak || 15) * 60
        : (pomodoroSettings.break || 5) * 60;

      setPreviousMode('POMODORO');
      setTimerState('BREAK');
      setTimeLeft(breakDuration);
      if (pomodoroSettings.autoStartBreak) {
        setIsActive(true);
      }
      setDeepFocusMode(false);
    } else if (timerMode === 'POMODORO' && timerState === 'BREAK') {
      // Break Completed -> return to previous mode (Flow or Pomodoro Work)
      if (previousMode === 'STOPWATCH') {
        setTimerMode('STOPWATCH');
        setTimerState('WORK');
        setTimeLeft(0);
      } else {
        setTimerMode('POMODORO');
        setTimerState('WORK');
        setTimeLeft(pomodoroSettings.work * 60);
      }
      if (pomodoroSettings.autoStartTimer) {
        setIsActive(true);
        setDeepFocusMode(true);
      } else {
        setDeepFocusMode(false);
      }
    }
  };



  const selectPomodoroWork = () => {
    setIsActive(false);
    setTimerMode('POMODORO');
    setTimerState('WORK');
    setPreviousMode('POMODORO');
    setTimeLeft(pomodoroSettings.work * 60);
  };

  const selectPomodoroBreak = () => {
    setIsActive(false);
    setPreviousMode(timerMode === 'STOPWATCH' ? 'STOPWATCH' : 'POMODORO');
    setTimerMode('POMODORO');
    setTimerState('BREAK');
    setTimeLeft(pomodoroSettings.break * 60);
  };

  const selectFlow = () => {
    setIsActive(false);
    setTimerMode('STOPWATCH');
    setTimerState('WORK');
    setPreviousMode('STOPWATCH');
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedTodo = todos.find((t) => t.id === selectedTodoId);
  const isWorkActive = timerMode === 'POMODORO' && timerState === 'WORK';
  const isBreakActive = timerMode === 'POMODORO' && timerState === 'BREAK';
  const isFlowActive = timerMode === 'STOPWATCH';

  const progressValue =
    timerMode === 'POMODORO'
      ? timerState === 'WORK'
        ? Math.min(
            100,
            Math.max(
              0,
              (((pomodoroSettings.work || 25) * 60 - timeLeft) /
                ((pomodoroSettings.work || 25) * 60)) *
                100
            )
          )
        : Math.min(
            100,
            Math.max(
              0,
              (((pomodoroSettings.break || 5) * 60 - timeLeft) /
                ((pomodoroSettings.break || 5) * 60)) *
                100
            )
          )
      : 100;


  return (
    <View style={styles.container}>
      {/* 3-Option Mode Switcher */}
      <View style={[styles.modeBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            isWorkActive && { backgroundColor: colors.primary },
          ]}
          onPress={selectPomodoroWork}
          activeOpacity={0.8}
        >
          <Timer
            size={14}
            color={isWorkActive ? colors.primaryForeground : colors.textMuted}
          />
          <Text
            style={[
              styles.modeText,
              { color: isWorkActive ? colors.primaryForeground : colors.textMuted },
            ]}
          >
            Pomodoro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeBtn,
            isBreakActive && { backgroundColor: colors.primary },
          ]}
          onPress={selectPomodoroBreak}
          activeOpacity={0.8}
        >
          <Coffee
            size={14}
            color={isBreakActive ? colors.primaryForeground : colors.textMuted}
          />
          <Text
            style={[
              styles.modeText,
              { color: isBreakActive ? colors.primaryForeground : colors.textMuted },
            ]}
          >
            Break
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeBtn,
            isFlowActive && { backgroundColor: colors.primary },
          ]}
          onPress={selectFlow}
          activeOpacity={0.8}
        >
          <Clock
            size={14}
            color={isFlowActive ? colors.primaryForeground : colors.textMuted}
          />
          <Text
            style={[
              styles.modeText,
              { color: isFlowActive ? colors.primaryForeground : colors.textMuted },
            ]}
          >
            Flow
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timer Content Container (No Card Box) */}
      <View style={styles.timerContent}>
        {/* Pomodoro Cycle & Progress Indicator */}
        {timerMode === 'POMODORO' && previousMode !== 'STOPWATCH' && (
          <View style={[styles.cycleIndicatorContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cycleDotsRow}>
              {[0, 1, 2, 3].map((index) => {
                const currentCycleStep = (pomodoroCount || 0) % 4;
                const isCompleted = index < currentCycleStep;
                const isCurrent = index === currentCycleStep && timerState === 'WORK';
                return (
                  <View
                    key={index}
                    style={[
                      styles.cycleDot,
                      {
                        backgroundColor: isCompleted
                          ? colors.text
                          : isCurrent
                          ? colors.text
                          : colors.border,
                        opacity: isCompleted ? 1 : isCurrent ? 0.7 : 0.4,
                      },
                    ]}
                  />
                );
              })}
            </View>
            <Text style={[styles.cycleText, { color: colors.text }]}>
              {timerState === 'BREAK'
                ? ((pomodoroCount || 0) % 4 === 0 && (pomodoroCount || 0) > 0
                    ? `Long Break (${pomodoroSettings.longBreak || 15}m)`
                    : `Short Break (${pomodoroSettings.break || 5}m)`)
                : `Pomodoro ${((pomodoroCount || 0) % 4) + 1} of 4`}
            </Text>
            {(pomodoroCount || 0) % 4 !== 0 && (
              <TouchableOpacity
                onPress={resetPomodoroCount}
                style={styles.cycleResetBtn}
                activeOpacity={0.7}
                accessibilityLabel="Reset pomodoro count to 1 of 4"
              >
                <RotateCcw size={11} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={[styles.timeDisplay, { color: colors.text }]}>
          {formatTime(timeLeft)}
        </Text>

        {/* Session Goal / Selected Task Bar */}
        {selectedTodo ? (
          /* Task Selected (Locked Mode - Matches Reference Image) */
          <TouchableOpacity
            style={[
              styles.selectedTaskCardContainer,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setTodoPickerOpen(true)}
            activeOpacity={0.8}
            accessibilityLabel="Click to select another task or custom focus"
          >
            <View style={styles.selectedTaskCardMain}>
              <ListTodo size={16} color={colors.text} />
              <Text style={[styles.selectedTaskCardText, { color: colors.text }]} numberOfLines={1}>
                {selectedTodo.text}
              </Text>
            </View>
            <ChevronDown size={14} color={colors.textMuted} style={{ opacity: 0.7 }} />
          </TouchableOpacity>
        ) : (
          /* Custom Focus Mode (Editable Input Bar) */
          <View
            style={[
              styles.sessionGoalContainer,
              {
                backgroundColor: colors.inputBg,
                borderColor: isSessionFocused ? colors.text : colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.sessionGoalInput,
                { color: colors.text },
              ]}
              placeholder="Session Goal (Press Enter)..."
              placeholderTextColor={colors.textMuted}
              value={sessionName}
              onChangeText={setSessionName}
              onFocus={() => setIsSessionFocused(true)}
              onBlur={() => setIsSessionFocused(false)}
              onSubmitEditing={handleCustomFocusSubmit}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.taskPickerBtn}
              onPress={() => setTodoPickerOpen(true)}
              activeOpacity={0.7}
              accessibilityLabel="Select from your tasks"
            >
              <ListTodo size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}


        {/* Selected Task Subtasks Checklist */}
        {selectedTodo && selectedTodo.subtasks && selectedTodo.subtasks.length > 0 && (
          <View style={[styles.subtaskFocusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.subtaskFocusHeader}>
              <View style={styles.subtaskFocusHeaderLeft}>
                <ListCheck size={14} color={colors.textMuted} />
                <Text style={[styles.subtaskFocusTitle, { color: colors.textMuted }]}>
                  SUBTASKS
                </Text>
              </View>
              <Text style={[styles.subtaskFocusCounter, { color: colors.textMuted }]}>
                {selectedTodo.subtasks.filter((s) => s.completed).length} / {selectedTodo.subtasks.length}
              </Text>
            </View>

            <View style={styles.subtaskFocusList}>
              {selectedTodo.subtasks.map((subtask) => (
                <TouchableOpacity
                  key={subtask.id}
                  style={styles.subtaskFocusItem}
                  onPress={() => toggleSubtask(selectedTodo.id, subtask.id)}
                  activeOpacity={0.7}
                >
                  {subtask.completed ? (
                    <CheckSquare size={16} color={colors.text} />
                  ) : (
                    <Square size={16} color={colors.textMuted} />
                  )}
                  <Text
                    style={[
                      styles.subtaskFocusText,
                      { color: colors.text },
                      subtask.completed && styles.subtaskCompletedText,
                    ]}
                  >
                    {subtask.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Selected Task Notes */}
        {selectedTodo && selectedTodo.notes && selectedTodo.notes.trim().length > 0 && (
          <View style={[styles.subtaskFocusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.subtaskFocusHeaderLeft}>
              <FileText size={14} color={colors.textMuted} />
              <Text style={[styles.subtaskFocusTitle, { color: colors.textMuted }]}>
                TASK NOTES
              </Text>
            </View>
            <Text style={[styles.taskNotesText, { color: colors.text }]}>
              {selectedTodo.notes}
            </Text>
          </View>
        )}

        {/* Timer Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${progressValue}%` },
              ]}
            />
          </View>
        </View>

        {/* Controls Bar */}
        <View style={styles.controlsRow}>
          {/* 1. Reset Button */}
          <TouchableOpacity
            style={[styles.secondaryActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={resetTimer}
            activeOpacity={0.7}
          >
            <RotateCcw size={18} color={colors.text} />
          </TouchableOpacity>

          {/* 2. Distraction Alert Button */}
          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: !isActive ? 0.4 : 1,
              },
            ]}
            onPress={() => setDistractionModalOpen(true)}
            disabled={!isActive}
            activeOpacity={0.7}
          >
            <AlertTriangle size={18} color={colors.text} />
          </TouchableOpacity>

          {/* 3. Main Play/Pause Button */}
          <TouchableOpacity
            style={[styles.mainActionBtn, { backgroundColor: colors.primary }]}
            onPress={toggleTimer}
            activeOpacity={0.8}
          >
            {isActive ? (
              <Pause size={24} color={colors.primaryForeground} />
            ) : (
              <Play size={24} color={colors.primaryForeground} fill={colors.primaryForeground} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          {/* 4. Complete Session Button */}
          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: !isActive ? 0.4 : 1,
              },
            ]}
            onPress={handleCompleteSession}
            disabled={!isActive}
            activeOpacity={0.7}
          >
            <CheckCircle2 size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Todo Selector Modal (Matches Reference Popover Image) */}
      <Modal visible={todoPickerOpen} transparent animationType="fade" onRequestClose={() => setTodoPickerOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setTodoPickerOpen(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.taskPickerModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            {/* Top Header */}
            <View style={styles.taskPickerHeader}>
              <Text style={[styles.taskPickerSectionTitle, { color: colors.textMuted }]}>FOCUS TOPIC</Text>
              <TouchableOpacity onPress={() => setTodoPickerOpen(false)} style={styles.closeBtn} accessibilityLabel="Close">
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Custom Focus Item */}
            <TouchableOpacity
              style={[
                styles.customFocusOption,
                {
                  backgroundColor: !selectedTodoId ? (colors.border || '#27272a') : colors.inputBg,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                setSelectedTodoId(null);
                setSessionName('');
                setTodoPickerOpen(false);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.customFocusLeft}>
                <Pencil size={18} color={colors.text} style={{ marginTop: 2 }} />
                <View style={styles.customFocusTextCol}>
                  <Text style={[styles.customFocusTitle, { color: colors.text }]}>Custom Focus</Text>
                  <Text style={[styles.customFocusSub, { color: colors.textMuted }]}>Type custom goal</Text>
                </View>
              </View>
              {!selectedTodoId && <Check size={18} color={colors.text} />}
            </TouchableOpacity>

            {/* My Tasks Section Header */}
            <Text style={[styles.taskPickerSectionTitle, { color: colors.textMuted, marginTop: 14, marginBottom: 8 }]}>
              MY TASKS
            </Text>

            {/* Tasks List */}
            <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ gap: 6 }}>
              {todos.filter((t) => !t.completed).length === 0 ? (
                <Text style={[styles.emptyTasksText, { color: colors.textMuted }]}>No pending tasks</Text>
              ) : (
                todos
                  .filter((t) => !t.completed)
                  .map((todo) => {
                    const isSelected = selectedTodoId === todo.id;
                    return (
                      <TouchableOpacity
                        key={todo.id}
                        style={[
                          styles.taskPickerOption,
                          {
                            backgroundColor: isSelected ? (colors.border || '#27272a') : colors.inputBg,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => {
                          setSelectedTodoId(todo.id);
                          setSessionName(todo.text);
                          setTodoPickerOpen(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.taskOptionLeft}>
                          <ListTodo size={16} color={colors.text} />
                          <Text
                            style={[
                              styles.taskOptionText,
                              { color: colors.text, fontWeight: isSelected ? '700' : '500' },
                            ]}
                            numberOfLines={1}
                          >
                            {todo.text}
                          </Text>
                        </View>
                        {isSelected && <Check size={16} color={colors.text} />}
                      </TouchableOpacity>
                    );
                  })
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Distraction Logger Modal */}
      <Modal visible={distractionModalOpen} transparent animationType="fade" onRequestClose={() => setDistractionModalOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDistractionModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Log Distraction</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              What got you off track? Stay conscious of interruption patterns.
            </Text>
            <View style={{ gap: 8, marginVertical: 12 }}>
              {DISTRACTION_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.distractionItem, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => {
                    addDistraction(cat);
                    setDistractionModalOpen(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '500' }}>{cat}</Text>
                  <Plus size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.border }]}
              onPress={() => setDistractionModalOpen(false)}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modeBar: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    borderRadius: Radius.base,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  timerContent: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  cycleIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  cycleDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cycleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cycleText: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timeDisplay: {
    fontSize: 88,
    fontWeight: '800',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    marginVertical: 12,
  },
  selectedTaskCardContainer: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.base,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 10,
  },
  selectedTaskCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '90%',
  },
  selectedTaskCardText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sessionGoalContainer: {
    width: '100%',
    height: 46,
    borderRadius: Radius.base,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 8,
    marginBottom: 10,
  },
  sessionGoalInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  taskPickerBtn: {
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtaskFocusCard: {
    width: '100%',
    borderRadius: Radius.base,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  subtaskFocusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subtaskFocusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtaskFocusTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subtaskFocusCounter: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtaskFocusList: {
    gap: 8,
  },
  subtaskFocusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  subtaskFocusText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  subtaskCompletedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  progressContainer: {
    width: '100%',
    marginVertical: 14,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  mainActionBtn: {
    width: 60,
    height: 60,
    borderRadius: Radius.base,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  secondaryActionBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.base,
    borderWidth: 1,
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
    maxWidth: 360,
    borderRadius: Radius.base,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 10,
  },
  settingGroup: {
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  autoStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.base,
    borderWidth: 1,
    marginVertical: 4,
  },
  autoStartTextContainer: {
    flex: 1,
    marginRight: 10,
    gap: 2,
  },
  autoStartTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  autoStartSubtitle: {
    fontSize: 10,
    lineHeight: 14,
  },
  switchTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  saveSettingsBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  resetSection: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 14,
    alignItems: 'center',
  },
  dangerResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  dangerResetText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  todoOption: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  taskPickerModalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  taskPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  closeBtn: {
    padding: 4,
  },
  taskPickerSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  customFocusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  customFocusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customFocusTextCol: {
    flexDirection: 'column',
  },
  customFocusTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  customFocusSub: {
    fontSize: 11,
    marginTop: 1,
  },
  taskPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  taskOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  taskOptionText: {
    fontSize: 14,
    flex: 1,
  },
  emptyTasksText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  distractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  closeModalBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  taskNotesText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 4,
  },
  cycleResetBtn: {
    padding: 2,
    marginLeft: 2,
  },
  cycleResetModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cycleResetModalBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
