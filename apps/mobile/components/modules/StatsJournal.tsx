import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Clock, CheckCircle2, AlertTriangle, Calendar, Award } from 'lucide-react-native';

export function StatsJournal() {
  const { colors } = useTheme();
  const { sessions, distractions } = useAppStore();

  const totalFocusSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
  const totalFocusHours = (totalFocusSeconds / 3600).toFixed(1);
  const totalSessions = sessions.length;
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
      {/* Overview Stats Cards Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Clock size={20} color={colors.text} />
          <Text style={[styles.statValue, { color: colors.text }]}>{totalFocusHours}h</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Focus Time</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CheckCircle2 size={20} color={colors.text} />
          <Text style={[styles.statValue, { color: colors.text }]}>{totalSessions}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Sessions Completed</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AlertTriangle size={20} color={colors.text} />
          <Text style={[styles.statValue, { color: colors.text }]}>{totalDistractions}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Distractions Logged</Text>
        </View>
      </View>

      {/* Distraction Breakdown */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Distraction Categories</Text>
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
    gap: 16,
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
    padding: 14,
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
    marginBottom: 8,
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
