import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore, BackgroundType } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';

export function BackgroundDisplay() {
  const { background } = useAppStore();
  const { colors, activeScheme } = useTheme();

  const getGradientColors = (bg: BackgroundType): [string, string, ...string[]] => {
    const isDark = activeScheme === 'dark';

    switch (bg) {
      case 'gradient':
        return isDark
          ? ['#09090b', '#1c1917', '#09090b']
          : ['#ffffff', '#f4f4f5', '#e4e4e7'];
      case 'mountain':
        return isDark
          ? ['#0f172a', '#1e293b', '#09090b']
          : ['#f8fafc', '#e2e8f0', '#cbd5e1'];
      case 'library':
        return isDark
          ? ['#1c1917', '#292524', '#09090b']
          : ['#fafaf9', '#f5f5f4', '#e7e5e4'];
      case 'cafe':
        return isDark
          ? ['#181512', '#26221d', '#09090b']
          : ['#fdfbf7', '#f7f2ea', '#eae0d5'];
      case 'anime-room':
        return isDark
          ? ['#130f1e', '#211936', '#09090b']
          : ['#faf7fd', '#f0e8fa', '#e1d4f5'];
      case 'dark':
      default:
        return isDark
          ? ['#09090b', '#09090b']
          : ['#ffffff', '#ffffff'];
    }
  };

  const gradientColors = getGradientColors(background);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
