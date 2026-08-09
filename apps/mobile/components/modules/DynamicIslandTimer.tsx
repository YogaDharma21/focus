import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { playCompletionSound } from '@/lib/sound';
import {
  Play,
  Pause,
  Timer,
  Coffee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from 'lucide-react-native';

const DISTRACTION_CATEGORIES = [
  'Social Media',
  'Notification',
  'Thought',
  'Break',
  'Other',
];

export function DynamicIslandTimer() {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [distractionModalOpen, setDistractionModalOpen] = useState(false);

  const {
    currentView,
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
    selectedTodoId,
    addSession,
    addDistraction,
    pomodoroSettings,
    incrementTodoSession,
  } = useAppStore();

  if (currentView === 'FOCUS') {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
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

  const handleCompleteSession = () => {
    playCompletionSound();
    setIsActive(false);

    if (timerMode === 'STOPWATCH') {
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
        const breakSeconds = Math.max(Math.floor(flowDuration / 5), 1);
        setPreviousMode('STOPWATCH');
        setTimerMode('POMODORO');
        setTimerState('BREAK');
        setTimeLeft(breakSeconds);
        if (pomodoroSettings.autoStartBreak) {
          setIsActive(true);
        }
      } else {
        setTimeLeft(0);
      }
    } else if (timerMode === 'POMODORO' && timerState === 'WORK') {
      let sessionDuration = pomodoroSettings.work * 60 - timeLeft;
      if (sessionDuration <= 0) sessionDuration = pomodoroSettings.work * 60;

      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: sessionDuration,
        mode: 'POMODORO',
      });
      if (selectedTodoId) {
        incrementTodoSession(selectedTodoId);
      }
      setPreviousMode('POMODORO');
      setTimerState('BREAK');
      setTimeLeft(pomodoroSettings.break * 60);
      if (pomodoroSettings.autoStartBreak) {
        setIsActive(true);
      }
    } else if (timerMode === 'POMODORO' && timerState === 'BREAK') {
      if (previousMode === 'STOPWATCH') {
        setTimerMode('STOPWATCH');
        setTimerState('WORK');
        setTimeLeft(0);
      } else {
        setTimerMode('POMODORO');
        setTimerState('WORK');
        setTimeLeft(pomodoroSettings.work * 60);
      }
    }
  };

  const isWorkActive = timerMode === 'POMODORO' && timerState === 'WORK';
  const isBreakActive = timerMode === 'POMODORO' && timerState === 'BREAK';
  const isFlowActive = timerMode === 'STOPWATCH';

  const getModeTitle = () => {
    if (timerMode === 'POMODORO') {
      return timerState === 'WORK' ? 'Pomodoro' : 'Break';
    }
    return 'Flow';
  };

  return (
    <View style={styles.outerContainer}>
      {/* Top Header Pill */}
      <TouchableOpacity
        style={[
          styles.pill,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <Timer size={16} color={colors.text} />
        <Text style={[styles.pillTime, { color: colors.text }]}>
          {formatTime(timeLeft)}
        </Text>
      </TouchableOpacity>

      {/* Expanded Control Card */}
      {isExpanded && (
        <View
          style={[
            styles.controlCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Card Top Row: Title + Time */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitleRow}>
              <Timer size={18} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {getModeTitle()}
              </Text>
            </View>
            <Text style={[styles.cardTime, { color: colors.text }]}>
              {formatTime(timeLeft)}
            </Text>
          </View>

          {/* Mode Selector Row */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                isWorkActive
                  ? { backgroundColor: colors.text }
                  : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={selectPomodoroWork}
              activeOpacity={0.8}
            >
              <Timer
                size={14}
                color={isWorkActive ? colors.background : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: isWorkActive ? colors.background : colors.textMuted },
                ]}
              >
                Pomodoro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                isBreakActive
                  ? { backgroundColor: colors.text }
                  : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={selectPomodoroBreak}
              activeOpacity={0.8}
            >
              <Coffee
                size={14}
                color={isBreakActive ? colors.background : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: isBreakActive ? colors.background : colors.textMuted },
                ]}
              >
                Break
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                isFlowActive
                  ? { backgroundColor: colors.text }
                  : { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={selectFlow}
              activeOpacity={0.8}
            >
              <Clock
                size={14}
                color={isFlowActive ? colors.background : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: isFlowActive ? colors.background : colors.textMuted },
                ]}
              >
                Flow
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            {/* Complete Session Button */}
            <TouchableOpacity
              style={[
                styles.completeBtn,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
              ]}
              onPress={handleCompleteSession}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={16} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>
                Complete
              </Text>
            </TouchableOpacity>

            {/* Distraction Alert Button */}
            <TouchableOpacity
              style={[
                styles.distractionBtn,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
              ]}
              onPress={() => setDistractionModalOpen(true)}
              activeOpacity={0.8}
            >
              <AlertTriangle size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Start / Pause Button */}
            <TouchableOpacity
              style={[
                styles.startBtn,
                { backgroundColor: colors.text },
              ]}
              onPress={toggleTimer}
              activeOpacity={0.8}
            >
              {isActive ? (
                <>
                  <Pause size={16} color={colors.background} />
                  <Text style={[styles.startBtnText, { color: colors.background }]}>
                    Pause
                  </Text>
                </>
              ) : (
                <>
                  <Play
                    size={16}
                    color={colors.background}
                    style={{ marginLeft: 2 }}
                  />
                  <Text style={[styles.startBtnText, { color: colors.background }]}>
                    Start
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Distraction Logger Modal */}
      <Modal
        visible={distractionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDistractionModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDistractionModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Log Distraction
            </Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              What got you off track? Stay conscious of interruption patterns.
            </Text>
            <View style={{ gap: 8, marginVertical: 12 }}>
              {DISTRACTION_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.distractionItem,
                    { backgroundColor: colors.inputBg, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    addDistraction(cat);
                    setDistractionModalOpen(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '500' }}>
                    {cat}
                  </Text>
                  <Plus size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.border }]}
              onPress={() => setDistractionModalOpen(false)}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pillTime: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  controlCard: {
    width: '92%',
    maxWidth: 360,
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardTime: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  distractionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  distractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  closeModalBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});

