import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Plus,
  Tag,
  Flame,
  CheckCircle2,
  Settings,
  Trash2,
} from 'lucide-react-native';

const DISTRACTION_CATEGORIES = [
  'Social Media',
  'Notification',
  'Thought',
  'Break',
  'Other',
];

export function FocusTimer() {
  const { colors } = useTheme();
  const {
    timerMode,
    setTimerMode,
    timerState,
    setTimerState,
    timeLeft,
    setTimeLeft,
    isActive,
    setIsActive,
    sessionName,
    setSessionName,
    todos,
    selectedTodoId,
    setSelectedTodoId,
    addSession,
    addDistraction,
    pomodoroSettings,
    setPomodoroSettings,
    resetAllData,
  } = useAppStore();

  const [distractionModalOpen, setDistractionModalOpen] = useState(false);
  const [todoPickerOpen, setTodoPickerOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Settings inputs
  const [workInput, setWorkInput] = useState(pomodoroSettings.work.toString());
  const [breakInput, setBreakInput] = useState(pomodoroSettings.break.toString());
  const [autoBreak, setAutoBreak] = useState(pomodoroSettings.autoStartBreak);

  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        if (timerMode === 'POMODORO') {
          setTimeLeft(timeLeft > 0 ? timeLeft - 1 : 0);
          if (timeLeft <= 1) {
            setIsActive(false);
            if (timerState === 'WORK') {
              addSession({
                id: Date.now().toString(),
                date: new Date().toISOString(),
                duration: pomodoroSettings.work * 60,
                mode: 'POMODORO',
              });
              setTimerState('BREAK');
              setTimeLeft(pomodoroSettings.break * 60);
              if (pomodoroSettings.autoStartBreak) {
                setIsActive(true);
              }
            } else {
              setTimerState('WORK');
              setTimeLeft(pomodoroSettings.work * 60);
            }
          }
        } else {
          // Flow Mode (Stopwatch)
          setTimeLeft(timeLeft + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, timerMode, timerState, pomodoroSettings, addSession, setIsActive, setTimeLeft, setTimerState]);

  const toggleTimer = () => {
    setIsActive(!isActive);
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
    setIsActive(false);
    let sessionDuration = 0;
    if (timerMode === 'POMODORO') {
      sessionDuration = (pomodoroSettings.work * 60) - timeLeft;
      if (sessionDuration <= 0) sessionDuration = pomodoroSettings.work * 60;
    } else {
      sessionDuration = timeLeft;
    }

    if (sessionDuration > 0) {
      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: sessionDuration,
        mode: timerMode,
      });
    }

    if (timerMode === 'POMODORO') {
      setTimerState('WORK');
      setTimeLeft(pomodoroSettings.work * 60);
    } else {
      setTimeLeft(0);
    }
  };

  const handleSaveSettings = () => {
    const w = parseInt(workInput, 10) || 25;
    const b = parseInt(breakInput, 10) || 5;
    setPomodoroSettings({ work: w, break: b, autoStartBreak: autoBreak });
    if (!isActive && timerMode === 'POMODORO') {
      setTimeLeft(timerState === 'WORK' ? w * 60 : b * 60);
    }
    setSettingsModalOpen(false);
  };

  const handleConfirmResetData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all tasks, history, mood notes, and app settings? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            resetAllData();
            setSettingsModalOpen(false);
          },
        },
      ]
    );
  };

  const handleModeSwitch = (mode: 'POMODORO' | 'STOPWATCH') => {
    if (mode === timerMode) return;
    setIsActive(false);
    setTimerMode(mode);
    if (mode === 'POMODORO') {
      setTimerState('WORK');
      setTimeLeft(pomodoroSettings.work * 60);
    } else {
      setTimeLeft(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedTodo = todos.find((t) => t.id === selectedTodoId);

  return (
    <View style={styles.container}>
      {/* Mode Switcher */}
      <View style={[styles.modeBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            timerMode === 'POMODORO' && { backgroundColor: colors.primary },
          ]}
          onPress={() => handleModeSwitch('POMODORO')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeText,
              { color: timerMode === 'POMODORO' ? colors.primaryForeground : colors.text },
            ]}
          >
            Pomodoro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeBtn,
            timerMode === 'STOPWATCH' && { backgroundColor: colors.primary },
          ]}
          onPress={() => handleModeSwitch('STOPWATCH')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeText,
              { color: timerMode === 'STOPWATCH' ? colors.primaryForeground : colors.text },
            ]}
          >
            Flow Mode
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timer Circle Card */}
      <View
        style={[
          styles.timerCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: colors.border }]}>
          {timerMode === 'POMODORO' ? (
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {timerState === 'WORK' ? 'Work Session' : 'Break Time'}
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Flame size={14} color={colors.text} />
              <Text style={[styles.badgeText, { color: colors.text }]}>
                Flow Mode (Stopwatch)
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.timeDisplay, { color: colors.text }]}>
          {formatTime(timeLeft)}
        </Text>

        {/* Input for session name */}
        <TextInput
          style={[
            styles.sessionInput,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg },
          ]}
          placeholder="What are you focusing on?"
          placeholderTextColor={colors.textMuted}
          value={sessionName}
          onChangeText={setSessionName}
        />

        {/* Task Tag Button */}
        <TouchableOpacity
          style={[styles.taskTagBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
          onPress={() => setTodoPickerOpen(true)}
        >
          <Tag size={14} color={colors.textMuted} />
          <Text style={[styles.taskTagText, { color: selectedTodo ? colors.text : colors.textMuted }]} numberOfLines={1}>
            {selectedTodo ? selectedTodo.text : 'Link to a task'}
          </Text>
        </TouchableOpacity>

        {/* 5 Control Buttons Row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.secondaryActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleCompleteSession}
            activeOpacity={0.7}
          >
            <CheckCircle2 size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={resetTimer}
            activeOpacity={0.7}
          >
            <RotateCcw size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mainActionBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={toggleTimer}
            activeOpacity={0.8}
          >
            {isActive ? (
              <Pause size={24} color={colors.primaryForeground} />
            ) : (
              <Play size={24} color={colors.primaryForeground} style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setDistractionModalOpen(true)}
            activeOpacity={0.7}
          >
            <AlertTriangle size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              setWorkInput(pomodoroSettings.work.toString());
              setBreakInput(pomodoroSettings.break.toString());
              setAutoBreak(pomodoroSettings.autoStartBreak);
              setSettingsModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <Settings size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal visible={settingsModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Timer & App Settings</Text>

            {/* Pomodoro Duration Controls */}
            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Pomodoro Work Time (mins)</Text>
              <TextInput
                style={[styles.settingInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                keyboardType="numeric"
                value={workInput}
                onChangeText={setWorkInput}
              />
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Break Time (mins)</Text>
              <TextInput
                style={[styles.settingInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                keyboardType="numeric"
                value={breakInput}
                onChangeText={setBreakInput}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Auto-start Break</Text>
              <Switch
                value={autoBreak}
                onValueChange={setAutoBreak}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveSettingsBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveSettings}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Save Timer Settings</Text>
            </TouchableOpacity>

            {/* Reset App Data Section */}
            <View style={[styles.resetSection, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.dangerResetBtn}
                onPress={handleConfirmResetData}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={styles.dangerResetText}>Reset All App Data</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.border, marginTop: 12 }]}
              onPress={() => setSettingsModalOpen(false)}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Todo Selector Modal */}
      <Modal visible={todoPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Task for Session</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity
                style={[styles.todoOption, !selectedTodoId && { backgroundColor: colors.border }]}
                onPress={() => {
                  setSelectedTodoId(null);
                  setTodoPickerOpen(false);
                }}
              >
                <Text style={{ color: colors.text }}>None (Standalone Session)</Text>
              </TouchableOpacity>
              {todos.map((todo) => (
                <TouchableOpacity
                  key={todo.id}
                  style={[styles.todoOption, selectedTodoId === todo.id && { backgroundColor: colors.border }]}
                  onPress={() => {
                    setSelectedTodoId(todo.id);
                    setSessionName(todo.text);
                    setTodoPickerOpen(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '500' }}>{todo.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.border }]}
              onPress={() => setTodoPickerOpen(false)}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Distraction Logger Modal */}
      <Modal visible={distractionModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          </View>
        </View>
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
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timerCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timeDisplay: {
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: -2,
    marginVertical: 12,
  },
  sessionInput: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  taskTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
    marginBottom: 20,
  },
  taskTagText: {
    fontSize: 13,
    flex: 1,
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
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  secondaryActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    borderRadius: 20,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
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
});
