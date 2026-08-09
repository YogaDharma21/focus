import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore, BackgroundType } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { X, Check } from 'lucide-react-native';

interface BackgroundSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const BACKGROUND_OPTIONS: {
  id: BackgroundType;
  name: string;
  desc: string;
  previewColors: [string, string, ...string[]];
}[] = [
  { id: 'dark', name: 'Dark (Default)', desc: 'Minimalist solid dark theme', previewColors: ['#0a0a0f', '#0a0a0f'] },
  { id: 'gradient', name: 'Gradient', desc: 'Purple & blue ambient glow', previewColors: ['#0f0c29', '#302b63', '#24243e'] },
  { id: 'mountain', name: 'Mountain', desc: 'Cool slate blue mountain curves', previewColors: ['#0f172a', '#1e293b', '#0f172a'] },
  { id: 'library', name: 'Library', desc: 'Warm espresso wood & bookshelf', previewColors: ['#1a1510', '#2c2416', '#1a1510'] },
  { id: 'cafe', name: 'Cafe', desc: 'Warm mocha amber & window light', previewColors: ['#1a1410', '#2c1f14', '#1a1410'] },
  { id: 'anime-room', name: 'Anime Room', desc: 'Twilight violet & sunset window', previewColors: ['#1a1a2e', '#16213e', '#0f3460'] },
];

export function BackgroundSelector({ visible, onClose }: BackgroundSelectorProps) {
  const { background, setBackground } = useAppStore();
  const { colors } = useTheme();

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
            <Text style={[styles.title, { color: colors.text }]}>Choose Background Theme</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {BACKGROUND_OPTIONS.map((item) => {
              const selected = background === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.item,
                    {
                      backgroundColor: selected ? colors.border : colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setBackground(item.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={item.previewColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.previewDot}
                  />
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                  </View>
                  {selected && <Check size={18} color={colors.text} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
    maxWidth: 400,
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
  list: {
    padding: 16,
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  itemTextCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
