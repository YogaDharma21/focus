import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MoodTracker } from '@/components/modules/MoodTracker';
import { useAppStore } from '@/lib/store';

export default function NotesScreen() {
  const { setView } = useAppStore();

  useEffect(() => {
    setView('NOTES');
  }, []);

  return (
    <View style={styles.container}>
      <MoodTracker />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 70,
  },
});
