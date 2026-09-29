import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ShieldPage } from '@/components/modules/ShieldPage';
import { useAppStore } from '@/lib/store';

export default function ShieldScreen() {
  const { setView, soundEnabled, musicEnabled } = useAppStore();

  useEffect(() => {
    setView('SHIELD');
  }, [setView]);

  const miniPlayerVisible = soundEnabled && musicEnabled;

  return (
    <View style={[styles.container, { paddingBottom: miniPlayerVisible ? 160 : 104 }]}>
      <ShieldPage />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
