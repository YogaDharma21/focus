import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/Header';
import { BackgroundDisplay } from '@/components/modules/BackgroundDisplay';
import { BackgroundSelector } from '@/components/modules/BackgroundSelector';
import { InfoModal } from '@/components/modules/InfoModal';
import { MediaPlayer } from '@/components/modules/MediaPlayer';
import { DeepFocusOverlay } from '@/components/modules/DeepFocusOverlay';
import { DynamicIslandTimer } from '@/components/modules/DynamicIslandTimer';
import { Clock, ListCheck, BarChart2, Smile } from 'lucide-react-native';

import { useAppStore } from '@/lib/store';
import { playCompletionSound } from '@/lib/sound';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const {
    isActive,
    setTimeLeft,
    setIsActive,
    setTimerState,
    setTimerMode,
    setPreviousMode,
    addSession,
    incrementTodoSession,
  } = useAppStore();

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
                setTimeLeft(state.pomodoroSettings.break * 60);
                if (state.pomodoroSettings.autoStartBreak) {
                  setIsActive(true);
                }
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
  }, [isActive, setIsActive, setTimeLeft, setTimerMode, setTimerState, setPreviousMode, addSession, incrementTodoSession]);

  const bottomInset = Math.max(insets.bottom, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundDisplay />
      <Header
        onOpenBackgrounds={() => setBgModalOpen(true)}
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
              title: 'Focus',
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
        </Tabs>
      </View>

      <MediaPlayer />
      <DeepFocusOverlay />
      <BackgroundSelector visible={bgModalOpen} onClose={() => setBgModalOpen(false)} />
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
