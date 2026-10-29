import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTheme } from '@/context/ThemeContext';
import { Header } from '@/components/Header';
import { FloatingTabBar, FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_GAP } from '@/components/FloatingTabBar';
import { MediaPlayer } from '@/components/modules/MediaPlayer';
import { DeepFocusOverlay } from '@/components/modules/DeepFocusOverlay';
import { DynamicIslandTimer } from '@/components/modules/DynamicIslandTimer';
import { ActiveSessionCard } from '@/components/modules/ActiveSessionCard';
import { LayoutGrid, Calendar, Shield, SlidersHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from '@/lib/store';
import { drainShieldViolations, syncShieldService } from '@/lib/shieldService';
import { playCompletionSound } from '@/lib/sound';

export default function TabLayout() {
  const { colors, themeMode } = useTheme();
  const insets = useSafeAreaInsets();

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
      // Wall-clock delta so backgrounded time is caught up on return instead of frozen.
      let lastTick = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.max(1, Math.round((now - lastTick) / 1000));
        lastTick = now;
        setTimeLeft((prev) => {
          if (timerState === 'BREAK') {
            const next = prev - delta;
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
          return prev + delta;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, setTimeLeft, timerState, setTimerState, setIsActive, setDeepFocusMode, autoStartFlow]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        drainShieldViolations();
      }
      syncShieldService();
    });
    return () => sub.remove();
  }, []);

  React.useEffect(() => {
    syncShieldService();
    const interval = setInterval(() => {
      syncShieldService();
    }, 60000);
    const unsub = useAppStore.subscribe((state, prev) => {
      if (
        state.shield !== prev.shield ||
        state.isActive !== prev.isActive ||
        state.timerState !== prev.timerState
      ) {
        syncShieldService();
      }
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);

  const floatingBottomPadding = Math.max(insets.bottom, 6) + FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_GAP + 6;

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
              title: 'Focus',
              tabBarIcon: ({ color }) => <LayoutGrid size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="journal"
            options={{
              title: 'Stats',
              tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
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
              tabBarIcon: ({ color }) => <SlidersHorizontal size={22} color={color} />,
            }}
          />
        </Tabs>

        {/* Floating Active In-Progress Session Card (matching Image 2) */}
        {isActive && !deepFocusMode && (
          <View
            style={[
              styles.floatingActiveCardWrapper,
              { bottom: floatingBottomPadding },
            ]}
          >
            <ActiveSessionCard />
          </View>
        )}
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
  floatingActiveCardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 90,
  },
});
