import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Code2, ExternalLink } from 'lucide-react-native';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
}

const GITHUB_REPO_URL = 'https://github.com/YogaDharma21/focus';

export function InfoModal({ visible, onClose }: InfoModalProps) {
  const { colors } = useTheme();

  const handleOpenGithub = () => {
    Linking.openURL(GITHUB_REPO_URL).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={[styles.header, { borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>About Focus App</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.desc, { color: colors.textMuted }]}>
              Focus is a clean, distraction-free productivity app designed to keep you in the flow with focus timers, task management, analytics, and mood reflections.
            </Text>

            <TouchableOpacity
              style={[styles.githubBtn, { backgroundColor: colors.primary }]}
              onPress={handleOpenGithub}
              activeOpacity={0.8}
            >
              <Code2 size={18} color={colors.primaryForeground} />
              <Text style={[styles.githubBtnText, { color: colors.primaryForeground }]}>
                View Project on GitHub
              </Text>
              <ExternalLink size={14} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
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
    padding: 20,
    gap: 18,
  },
  desc: {
    fontSize: 14,
    lineHeight: 22,
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  githubBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
