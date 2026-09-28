import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { useAppStore } from '@/lib/store';
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
  Focus,
  Clock,
  Coffee,
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
    timerState,
    timeLeft,
    setTimeLeft,
    isActive,
    setIsActive,
    setTimerState,
    addSession,
    addDistraction,
    setDeepFocusMode,
    autoStartBreak,
  } = useAppStore();

  const [distractionModalOpen, setDistractionModalOpen] = useState(false);

  const toggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (nextActive) {
      setDeepFocusMode(true);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    if (timeLeft > 0) {
      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: timeLeft,
        mode: 'STOPWATCH',
      });
    }
    setTimeLeft(0);
    setTimerState('FLOW');
  };

  const handleCompleteSession = () => {
    playCompletionSound();
    setIsActive(false);

    const flowDuration = timeLeft;
    if (flowDuration > 0) {
      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: flowDuration,
        mode: 'STOPWATCH',
      });
    }

    const breakSeconds = Math.floor(flowDuration / 5);
    if (breakSeconds > 0) {
      setTimeLeft(breakSeconds);
      setTimerState('BREAK');
      setIsActive(autoStartBreak ?? true);
    } else {
      setTimeLeft(0);
      setTimerState('FLOW');
    }
    setDeepFocusMode(false);
  };



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Timer Content Container (No Card Box) */}
      <View style={styles.timerContent}>
        <View
          style={[
            styles.modePill,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          {timerState === 'BREAK' ? (
            <Coffee size={12} color={colors.mutedText} />
          ) : (
            <Clock size={12} color={colors.mutedText} />
          )}
          <Text style={[styles.modePillText, { color: colors.mutedText }]}>
            {timerState === 'BREAK' ? 'Break' : 'Flow'}
          </Text>
        </View>
        <Text style={[styles.timeDisplay, { color: colors.text }]}>
          {formatTime(timeLeft)}
        </Text>

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
              <Pause size={24} color={colors.primaryText} />
            ) : (
              <Play size={24} color={colors.primaryText} fill={colors.primaryText} style={{ marginLeft: 2 }} />
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

          {/* 5. Deep Focus Mode Button */}
          <TouchableOpacity
            style={[styles.secondaryActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setDeepFocusMode(true)}
            activeOpacity={0.7}
          >
            <Focus size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Distraction Logger Modal */}
      <Modal visible={distractionModalOpen} transparent animationType="fade" onRequestClose={() => setDistractionModalOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDistractionModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Log Distraction</Text>
            <Text style={[styles.modalSub, { color: colors.mutedText }]}>
              What got you off track? Stay conscious of interruption patterns.
            </Text>
            <View style={{ gap: 8, marginVertical: 12 }}>
              {DISTRACTION_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.distractionItem, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => {
                    addDistraction(cat);
                    setDistractionModalOpen(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '500' }}>{cat}</Text>
                  <Plus size={16} color={colors.mutedText} />
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
  timerContent: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: 88,
    fontWeight: '800',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    marginVertical: 12,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'center',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
