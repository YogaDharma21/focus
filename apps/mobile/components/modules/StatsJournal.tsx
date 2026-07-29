import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppStore, Session } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Flame,
  PieChart,
  ListCheck,
  CheckSquare,
} from 'lucide-react-native';

export function StatsJournal() {
  const { colors } = useTheme();
  const { sessions, distractions, todos } = useAppStore();

  const [dayProgressPercent, setDayProgressPercent] = useState(0);

  useEffect(() => {
    const updateDayProgress = () => {
      const now = new Date();
      const secondsElapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      setDayProgressPercent(Math.round((secondsElapsed / 86400) * 100));
    };

    updateDayProgress();
    const interval = setInterval(updateDayProgress, 60000);
    return () => clearInterval(interval);
  }, []);

  // Stats Calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const tasksTodayFinished = todos.filter(
    (t) => t.completed && (t.completedAt ? t.completedAt.slice(0, 10) === todayStr : true)
  ).length;
  const pendingTasksCount = todos.filter((t) => !t.completed).length;

  const totalTasksCount = todos.length;
  const completedTasksCount = todos.filter((t) => t.completed).length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Streak Calculation
  const calculateStreak = (sessionList: Session[]) => {
    if (!sessionList || sessionList.length === 0) return { current: 0, best: 0 };
    const dates = Array.from(
      new Set(sessionList.map((s) => s.date.slice(0, 10)))
    ).sort();

    if (dates.length === 0) return { current: 0, best: 0 };

    let best = 1;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > best) best = tempStreak;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastDate = dates[dates.length - 1];

    let current = 0;
    if (lastDate === today || lastDate === yesterday) {
      current = tempStreak;
    }

    return { current, best: Math.max(best, current) };
  };

  const streak = calculateStreak(sessions);
  const totalDistractions = distractions.length;

  const distractionCategoryCounts = distractions.reduce((acc: Record<string, number>, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {});

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top 3 Stat Cards */}
      <View style={styles.statsGrid}>
        {/* 1. Day Progress */}
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Clock size={20} color={colors.text} />
          <Text style={[styles.statValue, { color: colors.text }]}>{dayProgressPercent}%</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Day Progress</Text>
        </View>

        {/* 2. Tasks Today Finished */}
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CheckCircle2 size={20} color={colors.text} />
          <Text style={[styles.statValue, { color: colors.text }]}>{tasksTodayFinished}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Tasks Today (Done)</Text>
        </View>

        {/* 3. Pending Tasks */}
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ListCheck size={20} color={colors.text} />
          <Text style={[styles.statValue, { color: colors.text }]}>{pendingTasksCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending Tasks</Text>
        </View>
      </View>

      {/* Row 2: Longest Streak & Completion Rate */}
      <View style={styles.secondaryGrid}>
        {/* Streak Card */}
        <View style={[styles.bigStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Flame size={18} color={colors.text} />
            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Streak</Text>
          </View>
          <View style={styles.streakValuesRow}>
            <View style={styles.streakSubCol}>
              <Text style={[styles.streakNum, { color: colors.text }]}>{streak.current}d</Text>
              <Text style={[styles.streakSubLabel, { color: colors.textMuted }]}>Current</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.streakSubCol}>
              <Text style={[styles.streakNum, { color: colors.text }]}>{streak.best}d</Text>
              <Text style={[styles.streakSubLabel, { color: colors.textMuted }]}>Best</Text>
            </View>
          </View>
        </View>

        {/* Completion Rate Card */}
        <View style={[styles.bigStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <PieChart size={18} color={colors.text} />
            <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Completion Rate</Text>
          </View>
          <Text style={[styles.rateValue, { color: colors.text }]}>{completionRate}%</Text>
          <Text style={[styles.rateSub, { color: colors.textMuted }]}>
            {completedTasksCount} of {totalTasksCount} tasks complete
          </Text>
        </View>
      </View>

      {/* Distraction Breakdown */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <AlertTriangle size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Distractions ({totalDistractions})</Text>
        </View>
        {Object.keys(distractionCategoryCounts).length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No distractions recorded yet. Great focus!
          </Text>
        ) : (
          <View style={styles.categoryList}>
            {Object.entries(distractionCategoryCounts).map(([cat, count]) => (
              <View key={cat} style={[styles.categoryRow, { borderColor: colors.border }]}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{cat}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: colors.border }]}>
                  <Text style={[styles.categoryCount, { color: colors.text }]}>{count} times</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Session History */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Calendar size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Focus History</Text>
        </View>

        {sessions.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No completed sessions yet. Start the timer to log your focus!
          </Text>
        ) : (
          <View style={styles.historyList}>
            {sessions.slice().reverse().map((session) => (
              <View key={session.id} style={[styles.historyRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyDate, { color: colors.text }]}>
                    {formatDate(session.date)}
                  </Text>
                  <Text style={[styles.historyMode, { color: colors.textMuted }]}>
                    {session.mode === 'STOPWATCH' ? 'Flow Mode' : 'Pomodoro'}
                  </Text>
                </View>
                <Text style={[styles.historyDuration, { color: colors.text }]}>
                  {Math.round(session.duration / 60)} mins
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  bigStatCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  streakValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  streakSubCol: {
    alignItems: 'center',
  },
  streakNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  streakSubLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
  },
  rateValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  rateSub: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    marginVertical: 6,
  },
  categoryList: {
    gap: 8,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    gap: 8,
    marginTop: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyMode: {
    fontSize: 12,
    marginTop: 2,
  },
  historyDuration: {
    fontSize: 14,
    fontWeight: '700',
  },
});
