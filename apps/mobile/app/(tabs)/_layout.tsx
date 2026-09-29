import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/Header';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { MediaPlayer } from '@/components/modules/MediaPlayer';
import { DeepFocusOverlay } from '@/components/modules/DeepFocusOverlay';
import { DynamicIslandTimer } from '@/components/modules/DynamicIslandTimer';
import { Clock, BarChart2, Shield, Settings } from 'lucide-react-native';

import { useAppStore } from '@/lib/store';
import { isBlockingRequired } from '@/lib/shield';
import { playCompletionSound } from '@/lib/sound';

export default function TabLayout() {
  const { colors, themeMode } = useTheme();

  const {
    isActive,
    setTimeLeft,
    setIsActive,
    setTimerState,
    timerState,
    deepFocusMode,
    setDeepFocusMode,
    addSession,
    setIsMusicPlaying,
    soundEnabled,
    musicEnabled,
    autoStartFlow,
  } = useAppStore();

  const prevActiveRef = React.useRef(isActive);

  React.useEffect(() => {
    if (isActive && !prevActiveRef.current && !deepFocusMode) {
      setDeepFocusMode(true);
    }
    prevActiveRef.current = isActive;
  }, [isActive, deepFocusMode, setDeepFocusMode]);

  React.useEffect(() => {
    if (isActive && timerState === 'FLOW') {
      setIsMusicPlaying(soundEnabled && musicEnabled);
    } else {
      setIsMusicPlaying(false);
    }
  }, [isActive, timerState, musicEnabled, setIsMusicPlaying, soundEnabled]);

  React.useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (timerState === 'BREAK') {
            const next = prev - 1;
            if (next <= 0) {
              void playCompletionSound();
              setTimerState('FLOW');
              if (autoStartFlow ?? true) {
                setDeepFocusMode(true);
              } else {
                setIsActive(false);
              }
              return 0;
            }
            return next;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, setTimeLeft, timerState, setTimerState, setIsActive, setDeepFocusMode, autoStartFlow]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'background') return;
      const { shield, isActive: active, timerState: state, addDistraction } = useAppStore.getState();
      if (isBlockingRequired(shield.enabled, active, state)) {
        addDistraction('Left app during Flow');
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Header />
      <DynamicIslandTimer />

      <View style={styles.content}>
        <Tabs
          tabBar={(props: BottomTabBarProps) => <FloatingTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: 'transparent' },
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
            name="journal"
            options={{
              title: 'Stats',
              tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="shield"
            options={{
              title: 'Shield',
              tabBarIcon: ({ color }) => <Shield size={22} color={color} />,
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
