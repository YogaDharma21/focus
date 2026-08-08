import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAppStore, MoodNote } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Smile, Send, Trash2, Calendar } from 'lucide-react-native';

const MOOD_OPTIONS = [
  { emoji: '🚀', label: 'Energetic' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '😐', label: 'Calm' },
  { emoji: '😫', label: 'Tired' },
  { emoji: '🤯', label: 'Stressed' },
];

export function MoodNotes() {
  const { colors } = useTheme();
  const { moodNotes, addMoodNote, deleteMoodNote } = useAppStore();

  const [selectedMood, setSelectedMood] = useState('😊');
  const [noteText, setNoteText] = useState('');
  const [isNoteFocused, setIsNoteFocused] = useState(false);

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const note: MoodNote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood: selectedMood,
      text: noteText.trim(),
    };
    addMoodNote(note);
    setNoteText('');
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Create Note Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>How are you feeling right now?</Text>

        {/* Mood Selector Row */}
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((m) => {
            const active = selectedMood === m.emoji;
            return (
              <TouchableOpacity
                key={m.emoji}
                style={[
                  styles.moodBtn,
                  {
                    backgroundColor: active ? colors.primary : colors.inputBg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedMood(m.emoji)}
                activeOpacity={0.8}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    { color: active ? colors.primaryForeground : colors.textMuted },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Note Input */}
        <TextInput
          style={[
            styles.noteInput,
            { color: colors.text, backgroundColor: colors.inputBg, borderColor: isNoteFocused ? colors.text : colors.border },
          ]}
          placeholder="Write down any thoughts, mindset updates, or session notes..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          value={noteText}
          onChangeText={setNoteText}
          onFocus={() => setIsNoteFocused(true)}
          onBlur={() => setIsNoteFocused(false)}
        />

        <TouchableOpacity
          style={[
            styles.saveBtn,
            {
              backgroundColor: noteText.trim() ? colors.primary : colors.border,
            },
          ]}
          onPress={handleSaveNote}
          disabled={!noteText.trim()}
          activeOpacity={0.8}
        >
          <Send size={16} color={noteText.trim() ? colors.primaryForeground : colors.textMuted} />
          <Text
            style={[
              styles.saveBtnText,
              { color: noteText.trim() ? colors.primaryForeground : colors.textMuted },
            ]}
          >
            Log Mood Note
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mood History Section */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.historyHeaderRow}>
          <Smile size={18} color={colors.text} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Past Journal Entries</Text>
        </View>

        {moodNotes.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No mood notes logged yet. Take a moment to log your state!
          </Text>
        ) : (
          <View style={styles.notesList}>
            {moodNotes.slice().reverse().map((item) => (
              <View
                key={item.id}
                style={[
                  styles.noteItem,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <View style={styles.noteTopRow}>
                  <View style={styles.noteMoodBadge}>
                    <Text style={styles.noteEmoji}>{item.mood}</Text>
                    <Text style={[styles.noteDate, { color: colors.textMuted }]}>
                      {formatDate(item.date)}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => deleteMoodNote(item.id)}>
                    <Trash2 size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.noteContent, { color: colors.text }]}>{item.text}</Text>
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 14,
  },
  moodBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  noteInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    marginVertical: 4,
  },
  notesList: {
    gap: 10,
  },
  noteItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  noteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteEmoji: {
    fontSize: 18,
  },
  noteDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
  },
});
