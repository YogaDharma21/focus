import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAppStore } from '@/lib/store';
import { ArrowUp, Play, Pause } from 'lucide-react-native';

export function ActiveSessionCard() {
  const { colors } = useTheme();
  const {
    timeLeft,
    isActive,
    timerState,
    setIsActive,
    setDeepFocusMode,
  } = useAppStore();

  const formattedTime = (() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  })();

  const sessionStatusText = isActive
    ? timerState === 'BREAK'
      ? 'Break · In progress'
      : 'Flow focus · In progress'
    : 'Ready · Tap to focus';

  const handleOpenDeepFocus = () => {
    if (!isActive) {
      setIsActive(true);
    }
    setDeepFocusMode(true);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleOpenDeepFocus}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top drag handle indicator */}
      <View style={styles.handleContainer}>
        <View style={[styles.handleBar, { backgroundColor: colors.mutedText }]} />
      </View>

      <View style={styles.contentRow}>
        <View style={styles.infoCol}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {formattedTime}
          </Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: colors.mutedText }]}>
              {sessionStatusText}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenDeepFocus}
          style={[styles.arrowButton, { backgroundColor: colors.muted }]}
        >
          {isActive ? (
            <ArrowUp size={22} color={colors.text} strokeWidth={2.5} />
          ) : (
            <Play size={20} color={colors.text} fill={colors.text} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  timeText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
