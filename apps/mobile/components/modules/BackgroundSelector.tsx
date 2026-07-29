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
  previewColors: [string, string];
}[] = [
  { id: 'dark', name: 'Monochrome Dark', desc: 'Minimalist clean theme', previewColors: ['#09090b', '#18181b'] },
  { id: 'gradient', name: 'Soft Gradient', desc: 'Subtle ambient contrast', previewColors: ['#09090b', '#27272a'] },
  { id: 'mountain', name: 'Mountain Mist', desc: 'Cool slate blue tones', previewColors: ['#0f172a', '#1e293b'] },
  { id: 'library', name: 'Quiet Library', desc: 'Warm espresso wood tones', previewColors: ['#1c1917', '#292524'] },
  { id: 'cafe', name: 'Cozy Cafe', desc: 'Warm mocha bronze tones', previewColors: ['#181512', '#26221d'] },
  { id: 'anime-room', name: 'Lo-Fi Room', desc: 'Twilight violet dusk tones', previewColors: ['#130f1e', '#211936'] },
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
