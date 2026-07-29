import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, ShieldCheck, Zap, Clock, ListCheck, BarChart2, Smile } from 'lucide-react-native';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InfoModal({ visible, onClose }: InfoModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.header, { borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>About Focus App</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.desc, { color: colors.textMuted }]}>
              Focus is a clean, distraction-free productivity app designed to keep you in the flow.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Clock size={20} color={colors.text} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Focus Timer</Text>
                  <Text style={[styles.featureSub, { color: colors.textMuted }]}>
                    Pomodoro & Stopwatch modes with session tags and distraction logging.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <ListCheck size={20} color={colors.text} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Tasks & Subtasks</Text>
                  <Text style={[styles.featureSub, { color: colors.textMuted }]}>
                    Organize your workflow with priority badges, groups, and subtasks.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <BarChart2 size={20} color={colors.text} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Stats & Journal</Text>
                  <Text style={[styles.featureSub, { color: colors.textMuted }]}>
                    Track your total focus hours, completed sessions, and distraction history.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Smile size={20} color={colors.text} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Mood Notes</Text>
                  <Text style={[styles.featureSub, { color: colors.textMuted }]}>
                    Log your energy levels, mindset, and reflection notes during work.
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.versionBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <ShieldCheck size={16} color={colors.textMuted} />
              <Text style={[styles.versionText, { color: colors.textMuted }]}>
                Version 1.0.0 • Offline Ready & Synchronized
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 18,
    gap: 16,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  featureSub: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  versionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
