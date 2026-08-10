import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAppStore, MoodNote } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Smile, Meh, Moon, Frown, Zap, Sparkles, Trash2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';

export type MoodType = 'amazing' | 'ok' | 'tired' | 'sad' | 'stressed';

export interface MoodConfig {
  key: MoodType;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: any }>;
  bg: string;
  text: string;
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
  amazing: {
    key: 'amazing',
    label: 'Amazing',
    icon: Smile,
    bg: '#ffffff',
    text: '#09090b',
  },
  ok: {
    key: 'ok',
    label: 'OK',
    icon: Meh,
    bg: '#cbd5e1',
    text: '#09090b',
  },
  tired: {
    key: 'tired',
    label: 'Tired',
    icon: Moon,
    bg: '#64748b',
    text: '#ffffff',
  },
  sad: {
    key: 'sad',
    label: 'Sad',
    icon: Frown,
    bg: '#334155',
    text: '#ffffff',
  },
  stressed: {
    key: 'stressed',
    label: 'Stressed',
    icon: Zap,
    bg: '#1e293b',
    text: '#ffffff',
  },
};

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function normalizeMoodKey(rawMood: string | undefined): MoodType | null {
  if (!rawMood) return null;
  if (rawMood === 'amazing' || rawMood === '😊' || rawMood === '🤩' || rawMood === 'Happy' || rawMood === 'Excited') return 'amazing';
  if (rawMood === 'ok' || rawMood === '🙂' || rawMood === '😐' || rawMood === 'Okay') return 'ok';
  if (rawMood === 'tired' || rawMood === '😴' || rawMood === 'Tired') return 'tired';
  if (rawMood === 'sad' || rawMood === '😔' || rawMood === 'Sad') return 'sad';
  if (rawMood === 'stressed' || rawMood === '😤' || rawMood === 'Stressed') return 'stressed';
  return null;
}

function getDaysInMonth(year: number, monthZeroBased: number): number {
  return new Date(year, monthZeroBased + 1, 0).getDate();
}

function formatDateShort(dateKey: string) {
  try {
    const parts = dateKey.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateKey;
  }
}

interface GridCellProps {
  dateKey: string;
  moodKey: MoodType | null;
  isSelectedCell: boolean;
  isCellToday: boolean;
  isValidDay: boolean;
  inputBg: string;
  borderColor: string;
  primaryColor: string;
  onPress: (dateKey: string) => void;
}

const GridCell = React.memo(function GridCell({
  dateKey,
  moodKey,
  isSelectedCell,
  isCellToday,
  isValidDay,
  inputBg,
  borderColor,
  primaryColor,
  onPress,
}: GridCellProps) {
  if (!isValidDay) {
    return <View style={[styles.gridCell, styles.invalidCell]} />;
  }

  const cfg = moodKey ? MOOD_CONFIGS[moodKey] : null;

  return (
    <Pressable
      style={[
        styles.gridCell,
        cfg
          ? { backgroundColor: cfg.bg }
          : { backgroundColor: inputBg, borderColor, borderWidth: 0.5 },
        isSelectedCell && { borderColor: '#ffffff', borderWidth: 2 },
        isCellToday && !isSelectedCell && { borderColor: primaryColor, borderWidth: 1.5 },
      ]}
      onPress={() => onPress(dateKey)}
    />
  );
});

interface YearlyMoodGridProps {
  selectedYear: number;
  selectedDateKey: string;
  todayYear: number;
  todayMonth: number;
  todayDate: number;
  moodNotesMap: Record<string, MoodNote>;
  inputBg: string;
  borderColor: string;
  textMutedColor: string;
  primaryColor: string;
  onCellPress: (dateKey: string) => void;
}

const DAYS_1_TO_31 = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS_0_TO_11 = Array.from({ length: 12 }, (_, i) => i);

const YearlyMoodGrid = React.memo(function YearlyMoodGrid({
  selectedYear,
  selectedDateKey,
  todayYear,
  todayMonth,
  todayDate,
  moodNotesMap,
  inputBg,
  borderColor,
  textMutedColor,
  primaryColor,
  onCellPress,
}: YearlyMoodGridProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gridScrollView}>
      <View style={styles.gridContainer}>
        {/* Header Row J F M A M J J A S O N D */}
        <View style={styles.monthHeaderRow}>
          <View style={styles.dayLabelCell} />
          {MONTH_LABELS.map((m, idx) => (
            <Text key={idx} style={[styles.monthHeaderCell, { color: textMutedColor }]}>
              {m}
            </Text>
          ))}
        </View>

        {/* Rows 1..31 */}
        {DAYS_1_TO_31.map((dayNum) => (
          <View key={dayNum} style={styles.dayRow}>
            <Text style={[styles.dayLabelCell, { color: textMutedColor }]}>
              {dayNum < 10 ? `0${dayNum}` : dayNum}
            </Text>

            {MONTHS_0_TO_11.map((monthIdx) => {
              const monthDaysCount = getDaysInMonth(selectedYear, monthIdx);
              const isValidDay = dayNum <= monthDaysCount;

              const monthStr = (monthIdx + 1).toString().padStart(2, '0');
              const dayStr = dayNum.toString().padStart(2, '0');
              const dateKey = `${selectedYear}-${monthStr}-${dayStr}`;

              const noteObj = moodNotesMap[dateKey];
              const moodKey = normalizeMoodKey(noteObj?.mood);

              const isSelectedCell = selectedDateKey === dateKey;
              const isCellToday =
                selectedYear === todayYear &&
                monthIdx === todayMonth &&
                dayNum === todayDate;

              return (
                <GridCell
                  key={monthIdx}
                  dateKey={dateKey}
                  moodKey={moodKey}
                  isSelectedCell={isSelectedCell}
                  isCellToday={isCellToday}
                  isValidDay={isValidDay}
                  inputBg={inputBg}
                  borderColor={borderColor}
                  primaryColor={primaryColor}
                  onPress={onCellPress}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
});

export function MoodTracker() {
  const { colors } = useTheme();
  const { moodNotes, setMoodForDate, cycleMoodForDate, deleteMoodNote } = useAppStore();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayStr);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [descriptionText, setDescriptionText] = useState('');
  const [isNoteFocused, setIsNoteFocused] = useState(false);

  const lastTapRef = useRef<{ dateKey: string; timestamp: number } | null>(null);

  // Fast O(1) lookup map for mood notes
  const moodNotesMap = useMemo(() => {
    const map: Record<string, MoodNote> = {};
    if (moodNotes && moodNotes.length > 0) {
      for (let i = 0; i < moodNotes.length; i++) {
        const n = moodNotes[i];
        if (n?.date) {
          map[n.date.slice(0, 10)] = n;
        }
      }
    }
    return map;
  }, [moodNotes]);

  const selectedDateNote = moodNotesMap[selectedDateKey];
  const currentSelectedMoodKey = normalizeMoodKey(selectedDateNote?.mood);

  useEffect(() => {
    setSelectedMood(currentSelectedMoodKey);
    setDescriptionText(selectedDateNote?.text || '');
  }, [selectedDateKey, currentSelectedMoodKey, selectedDateNote?.text]);

  const handleSaveMood = useCallback(() => {
    const moodToSave = selectedMood || currentSelectedMoodKey || 'amazing';
    setMoodForDate(selectedDateKey, moodToSave, descriptionText.trim());
  }, [selectedMood, currentSelectedMoodKey, setMoodForDate, selectedDateKey, descriptionText]);

  const isTodaySelected = selectedDateKey === todayStr;

  const handleCellPress = useCallback(
    (dateKey: string) => {
      const now = Date.now();
      if (
        lastTapRef.current &&
        lastTapRef.current.dateKey === dateKey &&
        now - lastTapRef.current.timestamp < 350
      ) {
        // Double tap detected -> cycle mood
        cycleMoodForDate(dateKey);
        lastTapRef.current = null;
      } else {
        // Single tap -> select date
        setSelectedDateKey(dateKey);
        lastTapRef.current = { dateKey, timestamp: now };
      }
    },
    [cycleMoodForDate]
  );

  const activeDateKey = selectedDateKey;
  const activeNoteObj = moodNotesMap[activeDateKey];
  const activeMoodKey = normalizeMoodKey(activeNoteObj?.mood);
  const activeFormattedDate = formatDateShort(activeDateKey);

  const stats = useMemo(() => {
    const counts: Record<MoodType, number> = {
      amazing: 0,
      ok: 0,
      tired: 0,
      sad: 0,
      stressed: 0,
    };

    if (moodNotes) {
      moodNotes.forEach((n) => {
        const year = parseInt(n.date.slice(0, 4), 10);
        if (year === selectedYear) {
          const key = normalizeMoodKey(n.mood);
          if (key) {
            counts[key]++;
          }
        }
      });
    }

    return counts;
  }, [moodNotes, selectedYear]);

  const totalTrackedDays = useMemo(
    () => Object.values(stats).reduce((a, b) => a + b, 0),
    [stats]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Inspector & Log Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleWithIcon}>
            <View style={[styles.iconBox, { backgroundColor: colors.inputBg, borderColor: colors.border, borderWidth: 1 }]}>
              <Smile size={16} color={colors.text} />
            </div>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Log Mood {isTodaySelected ? '(Today)' : ''}
            </Text>
          </View>

          <View style={styles.headerRightRow}>
            <View style={[styles.dateBadge, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.dateBadgeText, { color: colors.textMuted }]}>
                {formatDateShort(selectedDateKey)}
              </Text>
            </View>

            {!isTodaySelected && (
              <TouchableOpacity
                style={[styles.todayBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSelectedDateKey(todayStr);
                  setSelectedYear(today.getFullYear());
                }}
              >
                <Text style={[styles.todayBtnText, { color: colors.primaryForeground }]}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 5 Mood Selector Buttons */}
        <View style={styles.moodRow}>
          {(Object.keys(MOOD_CONFIGS) as MoodType[]).map((key) => {
            const cfg = MOOD_CONFIGS[key];
            const isSelected = selectedMood === key;
            const Icon = cfg.icon;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.moodBtn,
                  isSelected
                    ? { backgroundColor: cfg.bg, borderColor: cfg.bg }
                    : { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
                onPress={() => setSelectedMood(key)}
                activeOpacity={0.8}
              >
                <Icon size={20} color={isSelected ? cfg.text : colors.text} style={{ marginBottom: 4 }} />
                <Text
                  style={[
                    styles.moodLabel,
                    { color: isSelected ? cfg.text : colors.textMuted },
                  ]}
                >
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description Text Input */}
        <TextInput
          style={[
            styles.noteInput,
            { color: colors.text, backgroundColor: colors.inputBg, borderColor: isNoteFocused ? colors.text : colors.border },
          ]}
          placeholder="Optional reflection: What made you feel this way?"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={2}
          value={descriptionText}
          onChangeText={setDescriptionText}
          onFocus={() => setIsNoteFocused(true)}
          onBlur={() => setIsNoteFocused(false)}
        />

        <View style={styles.saveRow}>
          {selectedDateNote ? (
            <View style={styles.loggedInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.loggedText, { color: colors.textMuted }]}>
                  Logged: {MOOD_CONFIGS[currentSelectedMoodKey || 'amazing'].label}
                </Text>
                {(() => {
                  const Icon = MOOD_CONFIGS[currentSelectedMoodKey || 'amazing'].icon;
                  return <Icon size={14} color={colors.textMuted} />;
                })()}
              </View>
              <TouchableOpacity onPress={() => {
                deleteMoodNote(selectedDateNote.id);
                setSelectedMood(null);
                setDescriptionText('');
              }}>
                <Trash2 size={14} color="#f43f5e" />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.loggedText, { color: colors.textMuted }]}>No mood logged for date</Text>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSaveMood}
            activeOpacity={0.8}
          >
            <Sparkles size={14} color={colors.primaryForeground} />
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Mood</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Yearly Pixel Grid Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.gridHeaderRow}>
          <View style={styles.titleWithIcon}>
            <View style={[styles.iconBox, { backgroundColor: colors.inputBg, borderColor: colors.border, borderWidth: 1 }]}>
              <Calendar size={16} color={colors.text} />
            </div>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Yearly Mood Grid</Text>
          </View>

          <View style={styles.yearNavRow}>
            <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)} style={styles.navBtn}>
              <ChevronLeft size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.yearText, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              {selectedYear}
            </Text>
            <TouchableOpacity onPress={() => setSelectedYear((y) => y + 1)} style={styles.navBtn}>
              <ChevronRight size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.gridHint, { color: colors.textMuted }]}>
          1 tap: select date | 2 taps: cycle mood
        </Text>

        {/* 12 Months x 31 Days Grid */}
        <YearlyMoodGrid
          selectedYear={selectedYear}
          selectedDateKey={selectedDateKey}
          todayYear={today.getFullYear()}
          todayMonth={today.getMonth()}
          todayDate={today.getDate()}
          moodNotesMap={moodNotesMap}
          inputBg={colors.inputBg}
          borderColor={colors.border}
          textMutedColor={colors.textMuted}
          primaryColor={colors.primary}
          onCellPress={handleCellPress}
        />

        {/* Selected Date Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Text style={[styles.infoBannerTitle, { color: colors.text }]}>
            {activeFormattedDate}:
          </Text>
          {activeMoodKey ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {(() => {
                const cfg = MOOD_CONFIGS[activeMoodKey];
                const Icon = cfg.icon;
                const activeColor = cfg.bg === '#ffffff' ? '#38bdf8' : cfg.bg;
                return (
                  <>
                    <Icon size={16} color={activeColor} />
                    <Text style={[styles.infoBannerMood, { color: activeColor }]}>
                      {cfg.label}
                    </Text>
                  </>
                );
              })()}
            </View>
          ) : (
            <Text style={[styles.infoBannerEmpty, { color: colors.textMuted }]}>No mood logged</Text>
          )}
          {activeNoteObj?.text && (
            <Text style={[styles.infoBannerText, { color: colors.textMuted }]} numberOfLines={1}>
              {`"${activeNoteObj.text}"`}
            </Text>
          )}
        </View>

        {/* Legend Row */}
        <View style={styles.legendRow}>
          {(Object.keys(MOOD_CONFIGS) as MoodType[]).map((key) => {
            const cfg = MOOD_CONFIGS[key];
            return (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: cfg.bg }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>
                  {cfg.label} ({stats[key]})
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.totalText, { color: colors.textMuted }]}>
          Total tracked days: <Text style={{ color: colors.text, fontWeight: '700' }}>{totalTrackedDays}</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  todayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  moodBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  noteInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loggedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loggedText: {
    fontSize: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  yearNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    padding: 4,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  gridHint: {
    fontSize: 11,
    marginBottom: 10,
  },
  gridScrollView: {
    marginBottom: 12,
  },
  gridContainer: {
    paddingRight: 10,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  monthHeaderCell: {
    width: 22,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    marginHorizontal: 1,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  dayLabelCell: {
    width: 22,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'right',
    marginRight: 4,
  },
  gridCell: {
    width: 20,
    height: 20,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  invalidCell: {
    opacity: 0.1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoBannerMood: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoBannerEmpty: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  infoBannerText: {
    fontSize: 12,
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
  },
  totalText: {
    fontSize: 11,
  },
});
