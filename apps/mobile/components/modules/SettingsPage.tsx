import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, Animated } from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Settings, Palette, Volume2, Trash2, Info, ExternalLink, Timer, SlidersHorizontal } from 'lucide-react-native';
import { VolumeSlider } from '@/components/ui/VolumeSlider';
import { playCompletionSound } from '@/lib/sound';
import { openShieldCheckedUrl } from '@/lib/links';

interface CustomToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function CustomToggleSwitch({ value, onToggle, disabled = false }: CustomToggleSwitchProps) {
  const { colors } = useTheme();
  const [animatedValue] = useState(() => new Animated.Value(value ? 1 : 0));

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
    outputRange: [colors.muted, colors.primary],
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.mutedText, colors.primaryText],
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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
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
                backgroundColor: themeMode === 'light' ? colors.text : colors.muted,
                borderColor: themeMode === 'light' ? colors.text : colors.border,
              },
            ]}
            onPress={() => setThemeMode('light')}
          >
            <Text style={[styles.themeButtonText, { color: themeMode === 'light' ? colors.background : colors.mutedText }]}>
              Light
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeButton,
              {
                backgroundColor: themeMode === 'dark' ? colors.text : colors.muted,
                borderColor: themeMode === 'dark' ? colors.text : colors.border,
              },
            ]}
            onPress={() => setThemeMode('dark')}
          >
            <Text style={[styles.themeButtonText, { color: themeMode === 'dark' ? colors.background : colors.mutedText }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sound & Music</Text>
        </View>

        <SettingToggleRow
          title="Sound"
          subtitle="Enable or disable all sound"
          value={soundEnabled}
          onToggle={() => setSoundEnabled(!soundEnabled)}
          colors={colors}
        />

        <SettingToggleRow
          title="Music"
          subtitle="Enable or disable background ambient music"
          value={musicEnabled && soundEnabled}
          onToggle={() => setMusicEnabled(!musicEnabled)}
          disabled={!soundEnabled}
          colors={colors}
        />

        {soundEnabled && musicEnabled && (
          <View style={styles.volumeGroup}>
            <View style={styles.volumeHeader}>
              <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 0 }]}>Music Volume</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedText, fontVariant: ['tabular-nums'] }}>
                {Math.round((musicVolume ?? 0.8) * 100)}%
              </Text>
            </View>
            <VolumeSlider value={musicVolume ?? 0.8} onValueChange={setMusicVolume} />
          </View>
        )}

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
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedText, fontVariant: ['tabular-nums'] }}>
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
          <Trash2 size={18} color={colors.destructive} />
          <Text style={[styles.sectionTitle, { color: colors.destructive }]}>Data</Text>
        </View>

        <TouchableOpacity
          style={[styles.resetBtn, { backgroundColor: colors.crimsonBg, borderColor: colors.destructive }]}
          onPress={handleConfirmResetData}
          activeOpacity={0.8}
        >
          <Text style={[styles.resetBtnText, { color: colors.destructive }]}>Reset All Data</Text>
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
              A minimalist productivity suite designed to keep you in flow state. Features a flow timer, productivity analytics, and ambient audio.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.aboutLinkRow, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={() => void openShieldCheckedUrl('https://github.com/YogaDharma21/focus')}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 160,
    gap: 14,
  },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  autoStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  autoStartTextContainer: {
    flex: 1,
    marginRight: 10,
    gap: 2,
  },
  autoStartTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  autoStartSubtitle: {
    fontSize: 12,
  },
  switchTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
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
  disabledControl: {
    opacity: 0.5,
  },
  volumeGroup: {
    gap: 8,
    paddingTop: 4,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  testSoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  testSoundText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resetBtn: {
    backgroundColor: '#ef444415',
    borderColor: '#ef444430',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  aboutGroup: {
    gap: 8,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  aboutLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  aboutValue: {
    fontSize: 13,
  },
  aboutCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  aboutDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  aboutLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  aboutLinkLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
