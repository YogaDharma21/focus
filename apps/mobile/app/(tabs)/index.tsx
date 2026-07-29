import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { FocusTimer } from '@/components/modules/FocusTimer';
import { useAppStore } from '@/lib/store';

export default function FocusScreen() {
  const { setView } = useAppStore();

  useEffect(() => {
    setView('FOCUS');
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <FocusTimer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
});
