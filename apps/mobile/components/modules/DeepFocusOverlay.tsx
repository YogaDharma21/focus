import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Play, Pause, X, Focus, AlertTriangle, CheckCircle2, Plus } from 'lucide-react-native';

const DISTRACTION_CATEGORIES = [
  'Social Media',
  'Notification',
  'Thought',
  'Break',
  'Other',
];

export function DeepFocusOverlay() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    deepFocusMode,
    setDeepFocusMode,
    timeLeft,
    setTimeLeft,
    isActive,
    setIsActive,
    timerMode,
    setTimerMode,
    timerState,
    setTimerState,
    previousMode,
    setPreviousMode,
    sessionName,
    addSession,
    addDistraction,
    pomodoroSettings,
  } = useAppStore();

  const [distractionModalOpen, setDistractionModalOpen] = useState(false);

  if (!deepFocusMode) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSession = () => {
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
      let sessionDuration = (pomodoroSettings.work * 60) - timeLeft;
      if (sessionDuration <= 0) sessionDuration = pomodoroSettings.work * 60;

      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: sessionDuration,
        mode: 'POMODORO',
      });
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

  return (
    <Modal visible={deepFocusMode} animationType="fade" transparent={false}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.exitBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              top: Math.max(insets.top + 12, 40),
            },
          ]}
          onPress={() => setDeepFocusMode(false)}
        >
          <X size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.headerBadge}>
            <Focus size={18} color={colors.textMuted} />
            <Text style={[styles.modeLabel, { color: colors.textMuted }]}>
              Deep Focus Mode • {timerMode === 'POMODORO' ? (timerState === 'WORK' ? 'Work' : 'Break') : 'Flow Mode'}
            </Text>
          </View>

          <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(timeLeft)}</Text>

          {sessionName ? (
            <Text style={[styles.sessionText, { color: colors.textMuted }]}>{sessionName}</Text>
          ) : null}

          {/* Deep Focus Controls Row */}
          <View style={styles.controlsRow}>
            {/* Log Distraction Button */}
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setDistractionModalOpen(true)}
              activeOpacity={0.7}
            >
              <AlertTriangle size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Play / Pause Main Button */}
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsActive(!isActive)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <Pause size={32} color={colors.primaryForeground} />
              ) : (
                <Play size={32} color={colors.primaryForeground} style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            {/* Complete Session Button */}
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleCompleteSession}
              activeOpacity={0.7}
            >
              <CheckCircle2 size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  exitBtn: {
    position: 'absolute',
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timerText: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -3,
  },
  sessionText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 40,
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  secondaryActionBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
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
