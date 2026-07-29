import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';

export function BackgroundDisplay() {
  const { background } = useAppStore();
  const { colors, activeScheme } = useTheme();

  const getBackgroundImage = () => {
    switch (background) {
      case 'mountain':
        return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80';
      case 'library':
        return 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80';
      case 'cafe':
        return 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80';
      case 'anime-room':
        return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';
      default:
        return null;
    }
  };

  const bgUrl = getBackgroundImage();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} pointerEvents="none">
      {background === 'gradient' && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: activeScheme === 'dark' ? '#18181b' : '#e4e4e7',
              opacity: 0.8,
            },
          ]}
        />
      )}

      {bgUrl && (
        <>
          <Image source={{ uri: bgUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: activeScheme === 'dark' ? '#09090b' : '#ffffff',
                opacity: activeScheme === 'dark' ? 0.75 : 0.85,
              },
            ]}
          />
        </>
      )}
    </View>
  );
}
