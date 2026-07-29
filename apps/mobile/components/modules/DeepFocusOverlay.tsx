import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Play, Pause, X, Focus } from 'lucide-react-native';

export function DeepFocusOverlay() {
  const { colors } = useTheme();
  const {
    deepFocusMode,
    setDeepFocusMode,
    timeLeft,
    isActive,
    setIsActive,
    timerMode,
    timerState,
    sessionName,
  } = useAppStore();

  if (!deepFocusMode) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={deepFocusMode} animationType="fade" transparent={false}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.exitBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setDeepFocusMode(false)}
        >
          <X size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.headerBadge}>
            <Focus size={18} color={colors.textMuted} />
            <Text style={[styles.modeLabel, { color: colors.textMuted }]}>
              Deep Focus Mode • {timerMode === 'POMODORO' ? (timerState === 'WORK' ? 'Work' : 'Break') : 'Stopwatch'}
            </Text>
          </View>

          <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(timeLeft)}</Text>

          {sessionName ? (
            <Text style={[styles.sessionText, { color: colors.textMuted }]}>{sessionName}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
            onPress={() => setIsActive(!isActive)}
          >
            {isActive ? (
              <Pause size={28} color={colors.primaryForeground} />
            ) : (
              <Play size={28} color={colors.primaryForeground} style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>
        </View>
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
    top: 50,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
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
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
});
