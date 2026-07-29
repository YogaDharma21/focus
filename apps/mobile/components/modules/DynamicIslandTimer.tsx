import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Play, Pause, Clock } from 'lucide-react-native';

export function DynamicIslandTimer() {
  const { colors } = useTheme();
  const { currentView, isActive, setIsActive, timeLeft, timerMode, timerState, setView } =
    useAppStore();

  if (currentView === 'FOCUS' || !isActive) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.primary, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.bannerInfo}
        onPress={() => setView('FOCUS')}
        activeOpacity={0.8}
      >
        <Clock size={16} color={colors.primaryForeground} />
        <Text style={[styles.bannerTitle, { color: colors.primaryForeground }]}>
          {timerMode === 'POMODORO' ? (timerState === 'WORK' ? 'Work' : 'Break') : 'Stopwatch'}
        </Text>
        <Text style={[styles.bannerTime, { color: colors.primaryForeground }]}>
          {formatTime(timeLeft)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toggleBtn, { backgroundColor: colors.background }]}
        onPress={() => setIsActive(!isActive)}
      >
        {isActive ? (
          <Pause size={14} color={colors.text} />
        ) : (
          <Play size={14} color={colors.text} style={{ marginLeft: 1 }} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  bannerTime: {
    fontSize: 15,
    fontWeight: '800',
  },
  toggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
