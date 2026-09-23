import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, Animated } from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { openGuardedUrl } from '@/lib/shieldGuard';
import { Settings, Palette, Volume2, Trash2, Info, ExternalLink, Timer } from 'lucide-react-native';
import { VolumeSlider } from '@/components/ui/VolumeSlider';
import { playCompletionSound } from '@/lib/sound';

interface CustomToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function CustomToggleSwitch({ value, onToggle, disabled = false }: CustomToggleSwitchProps) {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 21],
  });

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#3f3f46', '#ffffff'],
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9ca3af', '#09090b'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={disabled ? undefined : onToggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[styles.switchTouchable, disabled && styles.disabledControl]}
    >
      <Animated.View
        style={[
          styles.switchTrack,
          {
            backgroundColor: trackColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.switchThumb,
            {
              backgroundColor: thumbColor,
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

function SettingToggleRow({
  title,
  subtitle,
  value,
  onToggle,
  disabled = false,
  colors,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
  colors: { text: string; mutedText: string; muted: string; border: string };
}) {
  return (
    <TouchableOpacity
      style={[
        styles.autoStartCard,
        {
          backgroundColor: colors.muted,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={disabled ? undefined : onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.autoStartTextContainer}>
        <Text style={[styles.autoStartTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.autoStartSubtitle, { color: colors.mutedText }]}>{subtitle}</Text>
      </View>
      <CustomToggleSwitch value={value} onToggle={onToggle} disabled={disabled} />
    </TouchableOpacity>
  );
}

export function SettingsPage() {
  const { colors, themeMode, setThemeMode } = useTheme();
  
  const {
    soundEnabled,
    setSoundEnabled,
    musicEnabled,
    setMusicEnabled,
    musicVolume,
    setMusicVolume,
    soundEffectEnabled,
    setSoundEffectEnabled,
    soundEffectVolume,
    setSoundEffectVolume,
    autoStartBreak,
    setAutoStartBreak,
    autoStartFlow,
    setAutoStartFlow,
    resetAllData,
  } = useAppStore();

  const handleConfirmResetData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset all app data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => resetAllData(),
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color={colors.text} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Appearance Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Palette size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        </View>
        
        <View style={styles.themeGrid}>
          <TouchableOpacity
            style={[
              styles.themeButton,
              {
                backgroundColor: themeMode === 'light' ? colors.muted : colors.muted,
                borderColor: themeMode === 'light' ? colors.text : colors.border,
              },
            ]}
            onPress={() => setThemeMode('light')}
          >
            <Text style={[styles.themeButtonText, { color: themeMode === 'light' ? colors.text : colors.mutedText }]}>
              Light
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeButton,
              {
                backgroundColor: themeMode === 'dark' ? colors.muted : colors.muted,
                borderColor: themeMode === 'dark' ? colors.text : colors.border,
              },
            ]}
            onPress={() => setThemeMode('dark')}
          >
            <Text style={[styles.themeButtonText, { color: themeMode === 'dark' ? colors.text : colors.mutedText }]}>
              Dark
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Timer Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Timer size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Timer</Text>
        </View>

        <SettingToggleRow
          title="Auto-start Break"
          subtitle="Start break countdown automatically"
          value={autoStartBreak ?? true}
          onToggle={() => setAutoStartBreak(!(autoStartBreak ?? true))}
          colors={colors}
        />

        <SettingToggleRow
          title="Auto-start Flow Timer"
          subtitle="Start next flow session when break ends"
          value={autoStartFlow ?? true}
          onToggle={() => setAutoStartFlow(!(autoStartFlow ?? true))}
          colors={colors}
        />
      </View>

      {/* Sound Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Volume2 size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sound</Text>
        </View>

        <SettingToggleRow
          title="Sound"
          subtitle="Enable or disable all sound"
          value={soundEnabled}
          onToggle={() => setSoundEnabled(!soundEnabled)}
          colors={colors}
        />

        <Text style={[styles.subsectionTitle, { color: colors.mutedText }]}>Music</Text>
        <SettingToggleRow
          title="Music"
          subtitle="Enable or disable background music"
          value={musicEnabled && soundEnabled}
          onToggle={() => setMusicEnabled(!musicEnabled)}
          disabled={!soundEnabled}
          colors={colors}
        />

        {soundEnabled && musicEnabled && (
          <View style={styles.volumeGroup}>
            <View style={styles.volumeHeader}>
              <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 0 }]}>Music Volume</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedText }}>
                {Math.round((musicVolume ?? 0.8) * 100)}%
              </Text>
            </View>
            <VolumeSlider value={musicVolume ?? 0.8} onValueChange={setMusicVolume} />
          </View>
        )}

        <Text style={[styles.subsectionTitle, styles.subsectionDivider, { color: colors.mutedText, borderTopColor: colors.border }]}>Sound Effects</Text>
        <SettingToggleRow
          title="Sound Effects"
          subtitle="Enable or disable timer sound effects"
          value={soundEffectEnabled && soundEnabled}
          onToggle={() => setSoundEffectEnabled(!soundEffectEnabled)}
          disabled={!soundEnabled}
          colors={colors}
        />

        {soundEnabled && soundEffectEnabled && (
          <View style={styles.volumeGroup}>
            <View style={styles.volumeHeader}>
              <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 0 }]}>Sound Effects Volume</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedText }}>
                {Math.round((soundEffectVolume ?? 0.8) * 100)}%
              </Text>
            </View>
            <VolumeSlider value={soundEffectVolume ?? 0.8} onValueChange={setSoundEffectVolume} />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.testSoundBtn,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              opacity: soundEnabled && soundEffectEnabled ? 1 : 0.45,
            },
          ]}
          onPress={playCompletionSound}
          disabled={!soundEnabled || !soundEffectEnabled}
          activeOpacity={0.7}
        >
          <Volume2 size={16} color={soundEnabled && soundEffectEnabled ? colors.text : colors.mutedText} />
          <Text style={[styles.testSoundText, { color: soundEnabled && soundEffectEnabled ? colors.text : colors.mutedText }]}>Test Sound Effect</Text>
        </TouchableOpacity>
      </View>

      {/* Data Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Trash2 size={18} color="#ef4444" />
          <Text style={[styles.sectionTitle, { color: "#ef4444" }]}>Data</Text>
        </View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleConfirmResetData}
          activeOpacity={0.8}
        >
          <Text style={styles.resetBtnText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Info size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        </View>

        <View style={styles.aboutGroup}>
          <View style={[styles.aboutRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.aboutLabel, { color: colors.text }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: colors.mutedText }]}>v0.0.1</Text>
          </View>

          <View style={[styles.aboutCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.aboutDescription, { color: colors.mutedText }]}>
              A minimalist productivity suite designed to keep you in flow state. Features a flow timer, task management with subtasks, productivity analytics, and ambient audio.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.aboutLinkRow, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={() => void openGuardedUrl('https://github.com/YogaDharma21/focus')}
            activeOpacity={0.7}
          >
            <Text style={[styles.aboutLinkLabel, { color: colors.text }]}>GitHub Repository</Text>
            <ExternalLink size={16} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  settingGroup: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  settingInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  autoStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  autoStartTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  autoStartTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  autoStartSubtitle: {
    fontSize: 11,
  },
  switchTouchable: {
    padding: 2,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  volumeGroup: {
    marginBottom: 16,
    marginTop: 8,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subsectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 2,
  },
  subsectionDivider: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  disabledControl: {
    opacity: 0.5,
  },
  volumeBarRow: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeStepBtn: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  testSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  testSoundText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  aboutGroup: {
    gap: 10,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  aboutLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  aboutValue: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  aboutCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  aboutDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  aboutLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  aboutLinkLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
