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

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

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
              title: 'Notes',
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
