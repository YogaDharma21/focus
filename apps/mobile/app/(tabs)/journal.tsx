import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatsJournal } from '@/components/modules/StatsJournal';
import { useAppStore } from '@/lib/store';

export default function JournalScreen() {
  const { setView } = useAppStore();

  useEffect(() => {
    setView('JOURNAL');
  }, []);

  return (
    <View style={styles.container}>
      <StatsJournal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 70,
  },
});
