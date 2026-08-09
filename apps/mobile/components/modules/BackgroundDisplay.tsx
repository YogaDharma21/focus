import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore, BackgroundType } from '@/lib/store';

export function BackgroundDisplay() {
  const { background } = useAppStore();

  const getGradientColors = (bg: BackgroundType): [string, string, ...string[]] => {
    switch (bg) {
      case 'gradient':
        return ['#09090b', '#1c1917', '#09090b'];
      case 'mountain':
        return ['#0f172a', '#1e293b', '#09090b'];
      case 'library':
        return ['#1c1917', '#292524', '#09090b'];
      case 'cafe':
        return ['#181512', '#26221d', '#09090b'];
      case 'anime-room':
        return ['#130f1e', '#211936', '#09090b'];
      case 'dark':
      default:
        return ['#09090b', '#09090b'];
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
