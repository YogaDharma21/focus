import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MoodNotes } from '@/components/modules/MoodNotes';
import { useAppStore } from '@/lib/store';

export default function NotesScreen() {
  const { setView } = useAppStore();

  useEffect(() => {
    setView('NOTES');
  }, []);

  return (
    <View style={styles.container}>
      <MoodNotes />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 70,
  },
});
