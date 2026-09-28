import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatsJournal } from '@/components/modules/StatsJournal';
import { useAppStore } from '@/lib/store';

export default function JournalScreen() {
  const { setView, soundEnabled, musicEnabled } = useAppStore();

  useEffect(() => {
    setView('JOURNAL');
  }, []);

  const miniPlayerVisible = soundEnabled && musicEnabled;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: miniPlayerVisible ? 160 : 104 },
      ]}
    >
      <StatsJournal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
