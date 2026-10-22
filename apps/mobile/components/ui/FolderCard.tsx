import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { SlidersHorizontal } from 'lucide-react-native';

interface FolderCardProps {
  title: string;
  subtitle: string;
  onPress?: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function FolderCard({
  title,
  subtitle,
  onPress,
  style,
  icon,
}: FolderCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top folder tab curve effect */}
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          {icon || <SlidersHorizontal size={15} color={colors.mutedText} />}
        </View>
        <View
          style={[
            styles.folderTabCutout,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        />
      </View>

      <View style={styles.bottomContent}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    minHeight: 135,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderTabCutout: {
    width: 44,
    height: 6,
    borderRadius: 999,
    opacity: 0.35,
  },
  bottomContent: {
    marginTop: 20,
    gap: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});
