import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useAppStore, Session } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/constants/theme';
import {
  Clock,
  CheckCircle2,
  BarChart2,
  Flame,
  Activity,
  ListFilter,
  Target,
  TrendingUp,
} from 'lucide-react-native';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

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

  // Weekly Focus Trend Calculation (Sunday to Saturday)
  const now = new Date();
  const currentDayIdx = now.getDay(); // 0 = Sun, 6 = Sat
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - currentDayIdx);
  sunday.setHours(0, 0, 0, 0);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  const weeklyMinutes: Record<string, number> = {
    Sun: 0,
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
  };

  sessions.forEach((s) => {
    const sessionDate = new Date(s.date);
    if (sessionDate >= sunday && sessionDate <= saturday) {
      const dayName = DAYS_OF_WEEK[sessionDate.getDay()];
      const mins = Math.round(s.duration / 60);
      weeklyMinutes[dayName] = (weeklyMinutes[dayName] || 0) + mins;
    }
  });

  const maxWeeklyMins = Math.max(60, ...Object.values(weeklyMinutes));

  const monoFont = Fonts?.mono || Platform.select({ ios: 'ui-monospace', default: 'monospace' });

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
            <View style={[styles.iconBadgeSmallSquare, { backgroundColor: 'rgba(249, 115, 22, 0.15)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.4)' }]}>
              <Flame size={15} color="#f97316" />
            </View>
            <Text style={[styles.cardTitleSmall, { color: colors.text }]}>Longest Streak</Text>
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
            <View style={[styles.iconBadgeSmallSquare, { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.4)' }]}>
              <Target size={15} color="#22c55e" />
            </View>
            <Text style={[styles.cardTitleSmall, { color: colors.text }]}>Completion Rate</Text>
          </View>

          <Text style={[styles.bigPercentText, { color: colors.text }]}>{completionRate}%</Text>

          <View style={styles.iconSubtextRow}>
            <CheckCircle2 size={13} color="#22c55e" />
            <Text style={[styles.subtext, { color: colors.textMuted }]}>Tasks Finished</Text>
          </View>
        </View>
      </View>

      {/* 4. FOCUS TREND Card */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.indigoIconBadge}>
            <TrendingUp size={18} color="#818cf8" />
          </View>
          <Text style={[styles.monoHeaderTitle, { color: colors.text, fontFamily: monoFont }]}>
            FOCUS TREND
          </Text>
        </View>

        <View style={styles.chartContainer}>
          {DAYS_OF_WEEK.map((day) => {
            const minsLogged = weeklyMinutes[day] || 0;
            const barHeight = minsLogged > 0
              ? Math.min(44, Math.max(14, Math.round((minsLogged / maxWeeklyMins) * 44)))
              : 4;

            return (
              <View key={day} style={styles.chartColumn}>
                <Text
                  style={[
                    styles.chartValueText,
                    {
                      color: minsLogged > 0 ? colors.text : colors.textMuted,
                      fontFamily: monoFont,
                    },
                  ]}
                >
                  {minsLogged}m
                </Text>
                <View style={styles.barWrapper}>
                  {minsLogged > 0 ? (
                    <View style={[styles.activeBar, { height: barHeight }]} />
                  ) : (
                    <View style={[styles.emptyBar, { backgroundColor: colors.border }]} />
                  )}
                </View>
                <Text style={[styles.chartDayLabel, { color: colors.text, fontFamily: monoFont }]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 5. DISTRACTION ANALYSIS Card */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.redIconBadge}>
            <BarChart2 size={18} color="#f43f5e" />
          </View>
          <Text style={[styles.monoHeaderTitle, { color: colors.text, fontFamily: monoFont }]}>
            DISTRACTION ANALYSIS
          </Text>
        </View>

        {totalDistractions === 0 ? (
          <Text style={[styles.monoEmptyText, { color: colors.textMuted, fontFamily: monoFont }]}>
            No distractions logged yet.
          </Text>
        ) : (
          <View style={styles.categoryList}>
            {Object.entries(distractionCategoryCounts).map(([cat, count]) => {
              const percent = Math.round((count / totalDistractions) * 100);
              return (
                <View key={cat} style={styles.distractionItemContainer}>
                  <View style={styles.distractionItemHeader}>
                    <Text style={[styles.categoryName, { color: colors.text, fontFamily: monoFont }]}>
                      {cat}
                    </Text>
                    <Text style={[styles.categoryCountText, { color: colors.textMuted, fontFamily: monoFont }]}>
                      {count} ({percent}%)
                    </Text>
                  </View>
                  <View style={[styles.distractionTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.distractionFill, { width: `${percent}%` }]} />
                  </View>
                </View>
              );
            })}
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
  cardTitleSmall: {
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
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
  iconBadgeSmallSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
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
    paddingVertical: 14,
    paddingHorizontal: 12,
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
  monoHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
    marginBottom: 4,
    height: 90,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartValueText: {
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  barWrapper: {
    height: 48,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
  },
  activeBar: {
    width: '85%',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  chartDayLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  redIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indigoIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monoEmptyText: {
    fontSize: 13.5,
    marginTop: 14,
  },
  categoryList: {
    gap: 10,
    marginTop: 14,
  },
  distractionItemContainer: {
    gap: 4,
  },
  distractionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryCountText: {
    fontSize: 12,
  },
  distractionTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distractionFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#f43f5e',
  },
});

