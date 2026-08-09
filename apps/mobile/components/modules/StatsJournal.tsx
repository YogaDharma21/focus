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
  Activity,
  ListFilter,
  Target,
} from 'lucide-react-native';

export function StatsJournal() {
  const { colors } = useTheme();
  const { sessions, distractions, todos } = useAppStore();

  const [dayProgressPercent, setDayProgressPercent] = useState(0);
  const [remainingTimeStr, setRemainingTimeStr] = useState('');

  useEffect(() => {
    const updateDayProgress = () => {
      const now = new Date();
      const secondsElapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const percent = Math.round((secondsElapsed / 86400) * 100);
      setDayProgressPercent(percent);

      const secondsRemaining = 86400 - secondsElapsed;
      const hours = Math.floor(secondsRemaining / 3600);
      const mins = Math.floor((secondsRemaining % 3600) / 60);
      setRemainingTimeStr(`${hours}h ${mins}m remaining today`);
    };

    updateDayProgress();
    const interval = setInterval(updateDayProgress, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const minutesToday = Math.round(
    sessions
      .filter((s) => s.date.slice(0, 10) === todayStr)
      .reduce((acc, s) => acc + s.duration, 0) / 60
  );

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
      {/* 1. Day Progress Card (Full Width) */}
      <View style={[styles.fullCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderBetween}>
          <View style={styles.iconTitleRow}>
            <View style={[styles.iconBadge, { backgroundColor: colors.border }]}>
              <Clock size={16} color={colors.text} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Day Progress</Text>
          </View>
          <Text style={[styles.headerPercentText, { color: colors.text }]}>{dayProgressPercent}%</Text>
        </View>

        <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBarFill, { backgroundColor: colors.text, width: `${dayProgressPercent}%` }]} />
        </View>

        <Text style={[styles.subtext, { color: colors.textMuted }]}>{remainingTimeStr}</Text>
      </View>

      {/* 2. 3-Grid Cards Row */}
      <View style={styles.grid3Row}>
        {/* Minutes Today */}
        <View style={[styles.grid3Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconBadgeSquare, { backgroundColor: colors.border }]}>
            <Activity size={18} color={colors.text} />
          </View>
          <Text style={[styles.largeNumValue, { color: colors.text }]}>{minutesToday}</Text>
          <Text style={[styles.grid3Label, { color: colors.textMuted }]}>MINUTES TODAY</Text>
        </View>

        {/* Tasks Today */}
        <View style={[styles.grid3Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconBadgeSquare, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
            <CheckCircle2 size={18} color="#22c55e" />
          </View>
          <Text style={[styles.largeNumValue, { color: colors.text }]}>{tasksTodayFinished}</Text>
          <Text style={[styles.grid3Label, { color: colors.textMuted }]}>TASKS TODAY</Text>
        </View>

        {/* Pending Tasks */}
        <View style={[styles.grid3Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconBadgeSquare, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <ListFilter size={18} color="#3b82f6" />
          </View>
          <Text style={[styles.largeNumValue, { color: colors.text }]}>{pendingTasksCount}</Text>
          <Text style={[styles.grid3Label, { color: colors.textMuted }]}>PENDING TASKS</Text>
        </View>
      </View>

      {/* 3. 2-Grid Cards Row */}
      <View style={styles.grid2Row}>
        {/* Longest Streak Card */}
        <View style={[styles.grid2Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.iconTitleRow}>
            <View style={[styles.iconBadgeSquare, { backgroundColor: 'rgba(249, 115, 22, 0.15)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.4)' }]}>
              <Flame size={18} color="#f97316" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Longest Streak</Text>
          </View>

          <View style={styles.streakRowsContainer}>
            <View style={styles.streakRow}>
              <Text style={[styles.streakLabel, { color: colors.textMuted }]}>Current</Text>
              <Text style={[styles.streakValue, { color: colors.text }]}>{streak.current} Days</Text>
            </View>
            <View style={styles.streakRow}>
              <Text style={[styles.streakLabel, { color: colors.textMuted }]}>Best</Text>
              <Text style={[styles.streakValue, { color: colors.text }]}>{streak.best} Days</Text>
            </View>
          </View>
        </View>

        {/* Completion Rate Card */}
        <View style={[styles.grid2Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.iconTitleRow}>
            <View style={[styles.iconBadgeSquare, { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.4)' }]}>
              <Target size={18} color="#22c55e" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Completion Rate</Text>
          </View>

          <Text style={[styles.bigPercentText, { color: colors.text }]}>{completionRate}%</Text>

          <View style={styles.iconSubtextRow}>
            <CheckCircle2 size={13} color="#22c55e" />
            <Text style={[styles.subtext, { color: colors.textMuted }]}>Tasks Finished</Text>
          </View>
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

      {/* Focus History */}
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
  fullCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerPercentText: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  grid3Row: {
    flexDirection: 'row',
    gap: 10,
  },
  grid3Card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconBadgeSquare: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeNumValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  grid3Label: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  grid2Row: {
    flexDirection: 'row',
    gap: 10,
  },
  grid2Card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  streakRowsContainer: {
    gap: 8,
    marginTop: 10,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  streakValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  bigPercentText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  iconSubtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
