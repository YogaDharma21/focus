import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAppStore } from '@/lib/store';
import { SlidersHorizontal, Plus, AlertTriangle, X, Play, RotateCcw } from 'lucide-react-native';

interface HeaderProps {
  onOpenBackgrounds?: () => void;
  onOpenInfo?: () => void;
}

const DISTRACTION_CATEGORIES = [
  'Social Media',
  'Notification',
  'Thought',
  'Break',
  'Other',
];

export function Header({ onOpenBackgrounds, onOpenInfo }: HeaderProps = {}) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [distractionModalOpen, setDistractionModalOpen] = useState(false);
  const [quickActionModalOpen, setQuickActionModalOpen] = useState(false);

  const {
    timeLeft,
    setTimeLeft,
    isActive,
    setIsActive,
    setTimerState,
    addDistraction,
    setDeepFocusMode,
  } = useAppStore();

  const getScreenTitle = () => {
    if (!pathname || pathname === '/' || pathname.endsWith('index')) return 'Focus';
    if (pathname.includes('journal')) return 'Stats';
    if (pathname.includes('shield')) return 'Shield';
    if (pathname.includes('settings')) return 'Settings';
    return 'Focus';
  };

  const handleStartQuickSession = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setTimerState('FLOW');
    setIsActive(true);
    setDeepFocusMode(true);
    setQuickActionModalOpen(false);
  };

  return (
    <View style={styles.headerWrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: Math.max(insets.top + 6, 16),
          },
        ]}
      >
        {/* Screen Title matching reference screenshot typography */}
        <Text style={[styles.title, { color: colors.text }]}>
          {getScreenTitle()}
        </Text>

        {/* Top Right Action Icons matching reference */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.iconCircleBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setDistractionModalOpen(true)}
            activeOpacity={0.7}
            accessibilityLabel="Filter and options"
          >
            <SlidersHorizontal size={17} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconCircleBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setQuickActionModalOpen(true)}
            activeOpacity={0.7}
            accessibilityLabel="Add focus session"
          >
            <Plus size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Action / Preset Modal */}
      <Modal
        visible={quickActionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickActionModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setQuickActionModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Quick Focus Session
              </Text>
              <TouchableOpacity onPress={() => setQuickActionModalOpen(false)}>
                <X size={20} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.mutedText }]}>
              Pick a quick sprint or start a free-flowing session.
            </Text>

            <View style={{ gap: 10, marginVertical: 14 }}>
              {[
                { title: 'Continuous Flow', desc: 'Stopwatch flow with auto-breaks', mins: 0 },
                { title: 'Quick Sprint', desc: '15 minutes quick burst', mins: 15 },
                { title: 'Deep Session', desc: '25 minutes focused work', mins: 25 },
                { title: 'Hyper Focus', desc: '50 minutes sustained flow', mins: 50 },
              ].map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={[
                    styles.presetRow,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => handleStartQuickSession(item.mins)}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.presetTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.presetDesc, { color: colors.mutedText }]}>
                      {item.desc}
                    </Text>
                  </View>
                  <Play size={16} color={colors.text} fill={colors.text} />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconTitle}>
                <AlertTriangle size={18} color={colors.text} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Log Distraction
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDistractionModalOpen(false)}>
                <X size={20} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.mutedText }]}>
              What got you off track? Stay conscious of interruption patterns.
            </Text>

            <View style={{ gap: 8, marginVertical: 14 }}>
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
                  <Text style={[styles.distractionText, { color: colors.text }]}>
                    {cat}
                  </Text>
                  <Plus size={16} color={colors.mutedText} />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  presetTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  presetDesc: {
    fontSize: 12,
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
  distractionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
