import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/Header';
import { BackgroundDisplay } from '@/components/modules/BackgroundDisplay';
import { MediaPlayer } from '@/components/modules/MediaPlayer';
import { DeepFocusOverlay } from '@/components/modules/DeepFocusOverlay';
import { DynamicIslandTimer } from '@/components/modules/DynamicIslandTimer';
import { Clock, ListCheck, BarChart2, Settings } from 'lucide-react-native';

import { useAppStore } from '@/lib/store';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const {
    isActive,
    setTimeLeft,
    setIsActive,
    deepFocusMode,
    setDeepFocusMode,
    addSession,
    setIsMusicPlaying,
  } = useAppStore();

  const prevActiveRef = React.useRef(isActive);

  React.useEffect(() => {
    if (isActive && !prevActiveRef.current && !deepFocusMode) {
      setDeepFocusMode(true);
    }
    prevActiveRef.current = isActive;
  }, [isActive, deepFocusMode, setDeepFocusMode]);

  React.useEffect(() => {
    if (isActive) {
      setIsMusicPlaying(true);
    } else {
      setIsMusicPlaying(false);
    }
  }, [isActive, setIsMusicPlaying]);

  React.useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, setTimeLeft]);

  const bottomInset = Math.max(insets.bottom, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundDisplay />
      <Header />
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
