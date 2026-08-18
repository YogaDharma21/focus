import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/Header';
import { BackgroundDisplay } from '@/components/modules/BackgroundDisplay';
import { InfoModal } from '@/components/modules/InfoModal';
import { MediaPlayer } from '@/components/modules/MediaPlayer';
import { DeepFocusOverlay } from '@/components/modules/DeepFocusOverlay';
import { DynamicIslandTimer } from '@/components/modules/DynamicIslandTimer';
import { Clock, ListCheck, BarChart2, Smile, Settings } from 'lucide-react-native';

import { useAppStore } from '@/lib/store';
import { playCompletionSound } from '@/lib/sound';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const {
    isActive,
    setTimeLeft,
    setIsActive,
    timerMode,
    setTimerMode,
    timerState,
    setTimerState,
    setPreviousMode,
    deepFocusMode,
    setDeepFocusMode,
    addSession,
    incrementTodoSession,
    setIsMusicPlaying,
  } = useAppStore();

  const prevActiveRef = React.useRef(isActive);
  const prevTimerRef = React.useRef({ isActive, timerMode, timerState });

  React.useEffect(() => {
    const isWorkOrFlow = timerMode === 'STOPWATCH' || (timerMode === 'POMODORO' && timerState === 'WORK');
    if (isActive && !prevActiveRef.current && isWorkOrFlow && !deepFocusMode) {
      setDeepFocusMode(true);
    }
    prevActiveRef.current = isActive;
  }, [isActive, timerMode, timerState, deepFocusMode, setDeepFocusMode]);

  React.useEffect(() => {
    const prev = prevTimerRef.current;
    const isRunningFocus = isActive && (
      (timerMode === 'POMODORO' && timerState === 'WORK') ||
      timerMode === 'STOPWATCH'
    );
    const wasRunningFocus = prev.isActive && (
      (prev.timerMode === 'POMODORO' && prev.timerState === 'WORK') ||
      prev.timerMode === 'STOPWATCH'
    );

    if (isRunningFocus && (!wasRunningFocus || prev.timerState === 'BREAK')) {
      setIsMusicPlaying(true);
    } else if (!isRunningFocus && (wasRunningFocus || timerState === 'BREAK')) {
      setIsMusicPlaying(false);
    }

    prevTimerRef.current = { isActive, timerMode, timerState };
  }, [isActive, timerMode, timerState, setIsMusicPlaying]);

  React.useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        const state = useAppStore.getState();
        if (state.timerMode === 'POMODORO') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              playCompletionSound();
              setIsActive(false);
              if (state.timerState === 'WORK') {
                const nextCount = (state.pomodoroCount || 0) + 1;
                state.setPomodoroCount(nextCount);
                const isLongBreak = nextCount % 4 === 0;
                const breakDuration = isLongBreak
                  ? (state.pomodoroSettings.longBreak || 15) * 60
                  : (state.pomodoroSettings.break || 5) * 60;

                addSession({
                  id: Date.now().toString(),
                  date: new Date().toISOString(),
                  duration: state.pomodoroSettings.work * 60,
                  mode: 'POMODORO',
                });
                if (state.selectedTodoId) {
                  incrementTodoSession(state.selectedTodoId);
                }
                setPreviousMode('POMODORO');
                setTimerState('BREAK');
                setTimeLeft(breakDuration);
                if (state.pomodoroSettings.autoStartBreak) {
                  setIsActive(true);
                }
                setDeepFocusMode(false);
              } else {
                if (state.previousMode === 'STOPWATCH') {
                  setTimerMode('STOPWATCH');
                  setTimerState('WORK');
                  setTimeLeft(0);
                } else {
                  setTimerMode('POMODORO');
                  setTimerState('WORK');
                  setTimeLeft(state.pomodoroSettings.work * 60);
                }
                if (state.pomodoroSettings.autoStartTimer) {
                  setIsActive(true);
                  setDeepFocusMode(true);
                } else {
                  setDeepFocusMode(false);
                }
              }
              return 0;
            }
            return prev - 1;
          });
        } else {
          // Flow Mode (Stopwatch)
          setTimeLeft((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, setIsActive, setTimeLeft, setTimerMode, setTimerState, setPreviousMode, setDeepFocusMode, addSession, incrementTodoSession]);

  const bottomInset = Math.max(insets.bottom, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundDisplay />
      <Header
        onOpenBackgrounds={() => {}}
        onOpenInfo={() => setInfoModalOpen(true)}
      />
      <DynamicIslandTimer />

      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: 'transparent' },
            tabBarStyle: {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              height: 56 + bottomInset,
              paddingBottom: 6 + bottomInset,
              paddingTop: 6,
            },
            tabBarActiveTintColor: colors.tint,
            tabBarInactiveTintColor: colors.tabIconDefault,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Timer',
              tabBarIcon: ({ color }) => <Clock size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="tasks"
            options={{
              title: 'Tasks',
              tabBarIcon: ({ color }) => <ListCheck size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="journal"
            options={{
              title: 'Stats',
              tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="notes"
            options={{
              title: 'Mood',
              tabBarIcon: ({ color }) => <Smile size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
            }}
          />
        </Tabs>
      </View>

      <MediaPlayer />
      <DeepFocusOverlay />
      <InfoModal visible={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
