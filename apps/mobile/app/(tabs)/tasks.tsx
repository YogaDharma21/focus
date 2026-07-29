import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TodoList } from '@/components/modules/TodoList';
import { useAppStore } from '@/lib/store';

export default function TasksScreen() {
  const { setView } = useAppStore();

  useEffect(() => {
    setView('TODO');
  }, []);

  return (
    <View style={styles.container}>
      <TodoList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 70,
  },
});
