import React, { useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { FocusTimer } from '@/components/modules/FocusTimer';
import { useAppStore } from '@/lib/store';

export default function FocusScreen() {
  const { setView } = useAppStore();

  useEffect(() => {
    setView('FOCUS');
  }, [setView]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <FocusTimer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 160,
  },
});
