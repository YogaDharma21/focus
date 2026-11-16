import React, { useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { TasksPage } from '@/components/modules/TasksPage';
import { useAppStore } from '@/lib/store';

export default function TasksScreen() {
  const { setView } = useAppStore();

  useEffect(() => {
    setView('TASKS');
  }, [setView]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <TasksPage />
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
