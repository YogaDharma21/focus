import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useAppStore, Session } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { playCompletionSound } from '@/lib/sound';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { ActivityDotGrid } from '@/components/ui/ActivityDotGrid';
import { FolderCard } from '@/components/ui/FolderCard';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Target,
  X,
} from 'lucide-react-native';

const DISTRACTION_CATEGORIES = [
  'Social Media',
  'Notification',
  'Thought',
  'Break',
  'Other',
];

export function FocusTimer() {
  const { colors } = useTheme();
  const {
    timerState,
    timeLeft,
    setTimeLeft,
    isActive,
    setIsActive,
    setTimerState,
    addSession,
    addDistraction,
    setDeepFocusMode,
    autoStartBreak,
    autoStartFlow,
    sessions,
    shield,
    tasks,
    selectedTaskId,
    setSelectedTaskId,
  } = useAppStore();

  const activeTask = tasks.find((t) => t.id === selectedTaskId);
  const [distractionModalOpen, setDistractionModalOpen] = useState(false);
  const [cycleCount, setCycleCount] = useState(1);

  // Statistics calculation for cards
  const now = new Date();
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

  // Weekly total minutes calculation
  const currentDayIdx = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - currentDayIdx);
  weekStart.setHours(0, 0, 0, 0);

  const weeklyMinutes = Math.round(
    sessions
      .filter((s) => {
        if (!s || !s.date) return false;
        return new Date(s.date) >= weekStart;
      })
      .reduce((acc, s) => acc + s.duration, 0) / 60
  );
  const weeklyHours = (weeklyMinutes / 60).toFixed(1);

  const toggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (nextActive) {
      setDeepFocusMode(true);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(0);
    setTimerState('FLOW');
  };

  const handleCompleteSession = () => {
    playCompletionSound();
    setIsActive(false);

    if (timerState === 'BREAK') {
      setTimeLeft(0);
      setTimerState('FLOW');
      setIsActive(autoStartFlow ?? true);
      setDeepFocusMode(autoStartFlow ?? true);
      return;
    }

    const flowDuration = timeLeft;
    if (flowDuration > 0) {
      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: flowDuration,
        mode: 'STOPWATCH',
        taskId: activeTask?.id,
        taskName: activeTask?.text,
      });
      setCycleCount((prev) => prev + 1);
    }

    const breakSeconds = Math.floor(flowDuration / 5);
    if (breakSeconds > 0) {
      setTimeLeft(breakSeconds);
      setTimerState('BREAK');
      setIsActive(autoStartBreak ?? true);
    } else {
      setTimeLeft(0);
      setTimerState('FLOW');
    }
    setDeepFocusMode(false);
  };

  const handleStartPreset = (mins: number) => {
    setTimeLeft(mins * 60);
    setTimerState('FLOW');
    setIsActive(true);
    setDeepFocusMode(true);
  };

  return (
    <View style={styles.container}>
      {/* Active Task Link Banner */}
      {activeTask ? (
        <View
          style={[
            styles.taskStrip,
            { backgroundColor: colors.card, borderColor: colors.emerald },
          ]}
        >
          <View style={styles.taskStripLeft}>
            <View style={[styles.taskStripDot, { backgroundColor: colors.emeraldBg }]}>
              <Target size={13} color={colors.emerald} />
            </View>
            <View style={styles.taskStripInfo}>
              <Text style={[styles.taskStripTag, { color: colors.emerald }]}>FOCUS TASK</Text>
              <Text style={[styles.taskStripTitle, { color: colors.text }]} numberOfLines={1}>
                {activeTask.text}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedTaskId(null)}
            style={[styles.taskStripClose, { backgroundColor: colors.surfaceInset }]}
            activeOpacity={0.7}
            accessibilityLabel="Unlink task"
          >
            <X size={13} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── ROW 1: TWO HALF-WIDTH CARDS (matching Image 1) ── */}
      <View style={styles.row2Cols}>
        {/* Card 1 (Left): Flow Mode with Circular Ring */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleTimer}
          style={[
            styles.halfCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardTopRow}>
            <CircularProgress
              size={48}
              strokeWidth={3.5}
              progress={isActive ? 0.85 : 0.4}
              label={cycleCount}
              trackColor={colors.border}
              progressColor={colors.text}
              textColor={colors.text}
            />
            <TouchableOpacity
              onPress={() => setDeepFocusMode(true)}
              style={styles.iconHit}
            >
              <SlidersHorizontal size={15} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
          <View style={styles.cardBottomCol}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {timerState === 'BREAK' ? 'Smart break' : activeTask ? activeTask.text : 'Chest focus'}
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.mutedText }]}>
              {isActive ? 'Active flow' : 'Continuous'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card 2 (Right): Focus Today with Large Number Stat (matching Image 1 '190 lbs') */}
        <View
          style={[
            styles.halfCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={() => setDistractionModalOpen(true)}
              style={styles.iconHit}
            >
              <SlidersHorizontal size={15} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
          <View style={styles.cardBottomCol}>
            <View style={styles.bigStatRow}>
              <Text style={[styles.bigStatNum, { color: colors.text }]}>
                {minutesToday > 0 ? minutesToday : '0'}
              </Text>
              <Text style={[styles.bigStatUnit, { color: colors.mutedText }]}>
                min
              </Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Body weight
            </Text>
            <Text style={[styles.cardSubtext, { color: colors.mutedText }]}>
              {sessions.length > 0 ? 'Today logged' : '31 min ago'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── ROW 2: FULL-WIDTH CARD WITH 3-MONTH DOT HEATMAP & SESSION 2 (matching Image 1) ── */}
      <View
        style={[
          styles.fullCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Top: 3-Month Dot Matrix Heatmap */}
        <ActivityDotGrid sessions={sessions} />

        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

        {/* Bottom Section: Circular Ring 2 + Routine info */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleStartPreset(25)}
          style={styles.routineRow}
        >
          <View style={styles.routineLeft}>
            <CircularProgress
              size={46}
              strokeWidth={3.5}
              progress={0.65}
              label="2"
              trackColor={colors.border}
              progressColor={colors.text}
              textColor={colors.text}
            />
            <View style={styles.routineInfo}>
              <Text style={[styles.routineTitle, { color: colors.text }]}>
                Back + bicep + legs
              </Text>
              <Text style={[styles.routineSubtext, { color: colors.mutedText }]}>
                Mondays
              </Text>
            </View>
          </View>
          <SlidersHorizontal size={16} color={colors.mutedText} />
        </TouchableOpacity>
      </View>

      {/* ── ROW 3: VOLUME / STAT METRIC CARD (matching Image 1 'Volume lifted 3.200 lbs') ── */}
      <View
        style={[
          styles.volumeCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.volumeLeft}>
          <Text style={[styles.volumeTitle, { color: colors.text }]}>
            Volume lifted
          </Text>
          <Text style={[styles.volumeSubtext, { color: colors.mutedText }]}>
            Last 7 days
          </Text>
        </View>

        <View style={styles.volumeRight}>
          <View style={styles.bigStatRow}>
            <Text style={[styles.volumeNum, { color: colors.text }]}>
              {weeklyMinutes > 0 ? `${weeklyHours}k` : '3.200'}
            </Text>
            <Text style={[styles.volumeUnit, { color: colors.mutedText }]}>
              lbs
            </Text>
          </View>
          <SlidersHorizontal size={16} color={colors.mutedText} />
        </View>
      </View>

      {/* ── ROW 4: FOLDER-TAB CARDS (matching Image 2 'Summer', 'Routine') ── */}
      <View style={styles.row2Cols}>
        <FolderCard
          title="Summer"
          subtitle="No items"
          onPress={() => handleStartPreset(25)}
        />
        <FolderCard
          title="Routine"
          subtitle="4 items"
          onPress={() => handleStartPreset(50)}
        />
      </View>

      {/* ── ROW 5: WIDE CARD (matching Image 2 'Cardio 365 Every 4 days') ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleStartPreset(30)}
        style={[
          styles.cardioCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.cardioTitle, { color: colors.text }]}>
            Cardio 365
          </Text>
          <Text style={[styles.cardioSub, { color: colors.mutedText }]}>
            Every 4 days
          </Text>
        </View>

        <View style={styles.cardioRight}>
          <View style={[styles.badgeCircle, { backgroundColor: colors.muted }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>0</Text>
          </View>
          <SlidersHorizontal size={16} color={colors.mutedText} />
        </View>
      </TouchableOpacity>

      {/* ── ROW 6: EMPTY SLOT / ADD ROUTINE CARD (matching Image 1 bottom slot) ── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setDistractionModalOpen(true)}
        style={[
          styles.addRoutineCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Plus size={36} color={colors.mutedText} strokeWidth={1.8} />
      </TouchableOpacity>

      {/* Distraction Logger Modal */}
      <Modal
        visible={distractionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDistractionModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDistractionModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Log Distraction
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedText }]}>
              What got you off track? Stay conscious of interruption patterns.
            </Text>
            <View style={{ gap: 8, marginVertical: 12 }}>
              {DISTRACTION_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.distractionItem,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    addDistraction(cat);
                    setDistractionModalOpen(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{cat}</Text>
                  <Plus size={16} color={colors.mutedText} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.muted }]}
              onPress={() => setDistractionModalOpen(false)}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  taskStrip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  taskStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  taskStripDot: {
    padding: 6,
    borderRadius: 8,
  },
  taskStripInfo: {
    flex: 1,
    gap: 2,
  },
  taskStripTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  taskStripTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskStripClose: {
    padding: 6,
    borderRadius: 8,
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
    alignItems: 'flex-start',
  },
  iconHit: {
    padding: 4,
  },
  cardBottomCol: {
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
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
  routineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  routineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  routineInfo: {
    gap: 3,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  routineSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  volumeCard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  volumeLeft: {
    gap: 3,
  },
  volumeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  volumeSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  volumeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  volumeNum: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  volumeUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardioCard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardioTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardioSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardioRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  badgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  addRoutineCard: {
    width: '100%',
    height: 100,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  distractionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  closeModalBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
});
