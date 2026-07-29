import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAppStore } from '@/lib/store';
import { Focus, Sun, Moon, Image as ImageIcon, Info } from 'lucide-react-native';

interface HeaderProps {
  onOpenBackgrounds: () => void;
  onOpenInfo: () => void;
}

export function Header({ onOpenBackgrounds, onOpenInfo }: HeaderProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, themeMode, toggleTheme } = useTheme();
  const { deepFocusMode, setDeepFocusMode } = useAppStore();

  const getTitle = () => {
    if (!pathname || pathname === '/' || pathname.includes('index')) {
      return 'Focus';
    }
    if (pathname.includes('tasks')) {
      return 'Tasks';
    }
    if (pathname.includes('journal')) {
      return 'Stats';
    }
    if (pathname.includes('notes')) {
      return 'Mood Notes';
    }
    return 'Focus';
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          paddingTop: Math.max(insets.top + 8, 16),
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: deepFocusMode ? colors.primary : colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setDeepFocusMode(!deepFocusMode)}
          activeOpacity={0.7}
        >
          <Focus size={18} color={deepFocusMode ? colors.primaryForeground : colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          {themeMode === 'dark' ? (
            <Moon size={18} color={colors.text} />
          ) : (
            <Sun size={18} color={colors.text} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={onOpenBackgrounds}
          activeOpacity={0.7}
        >
          <ImageIcon size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={onOpenInfo}
          activeOpacity={0.7}
        >
          <Info size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
