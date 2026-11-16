import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useAppStore, Session } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Fonts } from '@/constants/theme';
import { ActivityDotGrid } from '@/components/ui/ActivityDotGrid';
import { CircularProgress } from '@/components/ui/CircularProgress';
import {
  Clock,
  Flame,
  Activity,
  TrendingUp,
  SlidersHorizontal,
  BarChart2,
} from 'lucide-react-native';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function StatsJournal() {
  const { colors } = useTheme();
  const { sessions, distractions } = useAppStore();

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
      setRemainingTimeStr(`${hours}h ${mins}m remaining`);
    };

    updateDayProgress();
    const interval = setInterval(updateDayProgress, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculations
  const now = new Date();
  const curY = now.getFullYear();
  const curM = String(now.getMonth() + 1).padStart(2, '0');
  const curD = String(now.getDate()).padStart(2, '0');
  const todayLocalStr = `${curY}-${curM}-${curD}`;

  const minutesToday = Math.round(
    sessions
      .filter((s) => {
        if (!s || !s.date) return false;
        const d = new Date(s.date);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      })
      .reduce((acc, s) => acc + s.duration, 0) / 60
  );

  // Streak Calculation
  const calculateStreak = (sessionList: Session[]) => {
    if (!sessionList || sessionList.length === 0) return { current: 0, best: 0 };
    const dates = Array.from(
      new Set(
        sessionList
          .filter((s) => s && s.date)
          .map((s) => {
            const d = new Date(s.date);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          })
      )
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

    const yDate = new Date(now.getTime() - 86400000);
    const yy = yDate.getFullYear();
    const ym = String(yDate.getMonth() + 1).padStart(2, '0');
    const yday = String(yDate.getDate()).padStart(2, '0');
    const yesterday = `${yy}-${ym}-${yday}`;
    const lastDate = dates[dates.length - 1];

    let current = 0;
    if (lastDate === todayLocalStr || lastDate === yesterday) {
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
  const currentDayIdx = now.getDay();
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
    if (!s || !s.date) return;
    const sessionDate = new Date(s.date);
    if (sessionDate >= sunday && sessionDate <= saturday) {
      const dayName = DAYS_OF_WEEK[sessionDate.getDay()];
      const mins = Math.round(s.duration / 60);
      weeklyMinutes[dayName] = (weeklyMinutes[dayName] || 0) + mins;
    }
  });

  const totalWeeklyMins = Object.values(weeklyMinutes).reduce((a, b) => a + b, 0);
  const maxWeeklyMins = Math.max(60, ...Object.values(weeklyMinutes));

  const monoFont = Fonts?.mono?.web || Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── ROW 1: 2 STAT METRIC CARDS (matching Image 1 row 1) ── */}
      <View style={styles.row2Cols}>
        {/* Minutes Today */}
        <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTopRow}>
            <CircularProgress
              size={48}
              strokeWidth={3.5}
              progress={Math.min(minutesToday / 120, 1) || 0.3}
              label={minutesToday > 0 ? '✓' : '1'}
              trackColor={colors.border}
              progressColor={colors.text}
              textColor={colors.text}
            />
            <SlidersHorizontal size={15} color={colors.mutedText} />
          </View>
          <View style={styles.cardBottomCol}>
            <View style={styles.bigStatRow}>
              <Text style={[styles.bigStatNum, { color: colors.text }]}>
                {minutesToday}
              </Text>
              <Text style={[styles.bigStatUnit, { color: colors.mutedText }]}>
                min
              </Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Focus today
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.mutedText }]}>
              {sessions.length} sessions logged
            </Text>
          </View>
        </View>

        {/* Current Streak */}
        <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTopRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
              <Flame size={18} color={colors.text} />
            </View>
            <SlidersHorizontal size={15} color={colors.mutedText} />
          </View>
          <View style={styles.cardBottomCol}>
            <View style={styles.bigStatRow}>
              <Text style={[styles.bigStatNum, { color: colors.text }]}>
                {streak.current}
              </Text>
              <Text style={[styles.bigStatUnit, { color: colors.mutedText }]}>
                days
              </Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Streak record
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.mutedText }]}>
              Best: {streak.best} days
            </Text>
          </View>
        </View>
      </View>

      {/* ── ROW 2: FULL WIDTH CARD WITH 3-MONTH HEATMAP & DAY PROGRESS ── */}
      <View style={[styles.fullCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityDotGrid sessions={sessions} />

        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

        {/* Day progress bottom bar */}
        <View style={styles.dayProgressRow}>
          <View style={styles.progressTextRow}>
            <Text style={[styles.routineTitle, { color: colors.text }]}>
              Day progress
            </Text>
            <Text style={[styles.percentBadge, { color: colors.text }]}>
              {dayProgressPercent}%
            </Text>
          </View>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.text, width: `${dayProgressPercent}%` }]} />
          </View>
          <Text style={[styles.routineSubtext, { color: colors.mutedText }]}>
            {remainingTimeStr}
          </Text>
        </View>
      </View>

      {/* ── ROW 3: WEEKLY FOCUS VOLUME CARD (matching 'Volume lifted 3.200 lbs') ── */}
      <View style={[styles.fullCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.volumeHeaderRow}>
          <View>
            <Text style={[styles.volumeTitle, { color: colors.text }]}>
              Volume lifted
            </Text>
            <Text style={[styles.volumeSubtext, { color: colors.mutedText }]}>
              Last 7 days · {totalWeeklyMins} mins total
            </Text>
          </View>
          <View style={styles.bigStatRow}>
            <Text style={[styles.volumeNum, { color: colors.text }]}>
              {(totalWeeklyMins / 60).toFixed(1)}k
            </Text>
            <Text style={[styles.volumeUnit, { color: colors.mutedText }]}>
              lbs
            </Text>
          </View>
        </View>

        {/* Weekly distribution bars */}
        <View style={styles.chartContainer}>
          {DAYS_OF_WEEK.map((day) => {
            const minsLogged = weeklyMinutes[day] || 0;
            const barHeight = minsLogged > 0
              ? Math.min(48, Math.max(14, Math.round((minsLogged / maxWeeklyMins) * 48)))
              : 5;

            return (
              <View key={day} style={styles.chartColumn}>
                <Text style={[styles.chartValueText, { color: minsLogged > 0 ? colors.text : colors.mutedText }]}>
                  {minsLogged > 0 ? `${minsLogged}m` : ''}
                </Text>
                <View style={[styles.barWrapper, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: barHeight,
                        backgroundColor: minsLogged > 0 ? colors.text : colors.mutedText,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartDayLabel, { color: colors.mutedText }]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── ROW 4: DISTRACTION ANALYSIS ── */}
      <View style={[styles.fullCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.distractionHeaderRow}>
          <Text style={[styles.volumeTitle, { color: colors.text }]}>
            Distraction analysis
          </Text>
          <Text style={[styles.volumeSubtext, { color: colors.mutedText }]}>
            {totalDistractions} total logged
          </Text>
        </View>

        {totalDistractions === 0 ? (
          <Text style={[styles.emptyNotice, { color: colors.mutedText }]}>
            No distractions recorded yet. Clean focus!
          </Text>
        ) : (
          <View style={styles.categoryList}>
            {Object.entries(distractionCategoryCounts).map(([cat, count]) => {
              const percent = Math.round((count / totalDistractions) * 100);
              return (
                <View key={cat} style={styles.distractionRow}>
                  <View style={styles.distractionLabelRow}>
                    <Text style={[styles.catName, { color: colors.text }]}>{cat}</Text>
                    <Text style={[styles.catCount, { color: colors.mutedText }]}>
                      {count} ({percent}%)
                    </Text>
                  </View>
                  <View style={[styles.trackBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.fillBar, { backgroundColor: colors.text, width: `${percent}%` }]} />
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 160,
    gap: 14,
  },
  row2Cols: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  halfCard: {
    flex: 1,
    minHeight: 140,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottomCol: {
    gap: 2,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  bigStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  bigStatNum: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  bigStatUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullCard: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  cardDivider: {
    height: 1,
    width: '100%',
    opacity: 0.6,
  },
  dayProgressRow: {
    gap: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentBadge: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  routineSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  volumeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  volumeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  volumeSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  volumeNum: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  volumeUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingTop: 10,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  chartValueText: {
    fontSize: 10,
    fontWeight: '600',
    height: 14,
    fontVariant: ['tabular-nums'],
  },
  barWrapper: {
    width: 14,
    height: 48,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: 7,
  },
  chartDayLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  distractionHeaderRow: {
    gap: 2,
  },
  emptyNotice: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  categoryList: {
    gap: 12,
  },
  distractionRow: {
    gap: 6,
  },
  distractionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catCount: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    borderRadius: 3,
  },
});
