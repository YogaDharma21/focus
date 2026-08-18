import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, StyleSheet, Animated } from 'react-native';
import { useAppStore, BackgroundType } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Settings, Clock, Palette, Volume2, Trash2 } from 'lucide-react-native';
import { playCompletionSound } from '@/lib/sound';

interface CustomToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
}

function CustomToggleSwitch({ value, onToggle }: CustomToggleSwitchProps) {
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
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={styles.switchTouchable}
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

export function SettingsPage() {
  const { colors } = useTheme();
  
  const {
    pomodoroSettings,
    setPomodoroSettings,
    background,
    setBackground,
    soundEffectEnabled,
    setSoundEffectEnabled,
    soundEffectVolume,
    setSoundEffectVolume,
    resetAllData,
  } = useAppStore();

  const [workInput, setWorkInput] = useState(pomodoroSettings.work.toString());
  const [breakInput, setBreakInput] = useState(pomodoroSettings.break.toString());
  const [longBreakInput, setLongBreakInput] = useState((pomodoroSettings.longBreak || 15).toString());
  
  const [isWorkFocused, setIsWorkFocused] = useState(false);
  const [isBreakFocused, setIsBreakFocused] = useState(false);
  const [isLongBreakFocused, setIsLongBreakFocused] = useState(false);

  const handleSavePomodoroSettings = () => {
    const w = parseInt(workInput, 10) || 25;
    const b = parseInt(breakInput, 10) || 5;
    const lb = parseInt(longBreakInput, 10) || 15;
    setPomodoroSettings({ work: w, break: b, longBreak: lb });
  };

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

  const themes: { id: BackgroundType; name: string }[] = [
    { id: 'dark', name: 'Dark' },
    { id: 'gradient', name: 'Gradient' },
    { id: 'mountain', name: 'Mountain' },
    { id: 'library', name: 'Library' },
    { id: 'cafe', name: 'Cafe' },
    { id: 'anime-room', name: 'Anime Room' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Settings size={24} color={colors.text} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Timer Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Clock size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Timer</Text>
        </View>

        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Pomodoro Work Time (mins)</Text>
          <TextInput
            style={[
              styles.settingInput,
              { color: colors.text, borderColor: isWorkFocused ? colors.text : colors.border, backgroundColor: colors.inputBg },
            ]}
            keyboardType="number-pad"
            value={workInput}
            onChangeText={setWorkInput}
            onFocus={() => setIsWorkFocused(true)}
            onBlur={() => {
              setIsWorkFocused(false);
              handleSavePomodoroSettings();
            }}
          />
        </View>

        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Short Break Time (mins)</Text>
          <TextInput
            style={[
              styles.settingInput,
              { color: colors.text, borderColor: isBreakFocused ? colors.text : colors.border, backgroundColor: colors.inputBg },
            ]}
            keyboardType="number-pad"
            value={breakInput}
            onChangeText={setBreakInput}
            onFocus={() => setIsBreakFocused(true)}
            onBlur={() => {
              setIsBreakFocused(false);
              handleSavePomodoroSettings();
            }}
          />
        </View>

        <View style={styles.settingGroup}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Long Break Time (mins)</Text>
          <TextInput
            style={[
              styles.settingInput,
              { color: colors.text, borderColor: isLongBreakFocused ? colors.text : colors.border, backgroundColor: colors.inputBg },
            ]}
            keyboardType="number-pad"
            value={longBreakInput}
            onChangeText={setLongBreakInput}
            onFocus={() => setIsLongBreakFocused(true)}
            onBlur={() => {
              setIsLongBreakFocused(false);
              handleSavePomodoroSettings();
            }}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.autoStartCard,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setPomodoroSettings({ autoStartBreak: !pomodoroSettings.autoStartBreak })}
          activeOpacity={0.7}
        >
          <View style={styles.autoStartTextContainer}>
            <Text style={[styles.autoStartTitle, { color: colors.text }]}>Auto-start Break</Text>
            <Text style={[styles.autoStartSubtitle, { color: colors.textMuted }]}>
              Launch break timer immediately after work
            </Text>
          </View>
          <CustomToggleSwitch value={pomodoroSettings.autoStartBreak} onToggle={() => setPomodoroSettings({ autoStartBreak: !pomodoroSettings.autoStartBreak })} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.autoStartCard,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setPomodoroSettings({ autoStartTimer: !pomodoroSettings.autoStartTimer })}
          activeOpacity={0.7}
        >
          <View style={styles.autoStartTextContainer}>
            <Text style={[styles.autoStartTitle, { color: colors.text }]}>Auto-start Timer</Text>
            <Text style={[styles.autoStartSubtitle, { color: colors.textMuted }]}>
              Launch focus timer immediately after break
            </Text>
          </View>
          <CustomToggleSwitch value={pomodoroSettings.autoStartTimer} onToggle={() => setPomodoroSettings({ autoStartTimer: !pomodoroSettings.autoStartTimer })} />
        </TouchableOpacity>
      </View>

      {/* Appearance Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Palette size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        </View>
        
        <View style={styles.themeGrid}>
          {themes.map((theme) => {
            const isActive = background === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: isActive ? '#27272a' : '#141414',
                    borderColor: isActive ? '#fafafa' : '#27272a',
                  },
                ]}
                onPress={() => setBackground(theme.id)}
              >
                <Text style={[styles.themeButtonText, { color: isActive ? '#fafafa' : '#a1a1aa' }]}>
                  {theme.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Sound Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Volume2 size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sound</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.autoStartCard,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setSoundEffectEnabled(!soundEffectEnabled)}
          activeOpacity={0.7}
        >
          <View style={styles.autoStartTextContainer}>
            <Text style={[styles.autoStartTitle, { color: colors.text }]}>SFX Enabled</Text>
            <Text style={[styles.autoStartSubtitle, { color: colors.textMuted }]}>
              Play sound effects on timer completion
            </Text>
          </View>
          <CustomToggleSwitch value={soundEffectEnabled} onToggle={() => setSoundEffectEnabled(!soundEffectEnabled)} />
        </TouchableOpacity>

        <View style={styles.volumeGroup}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>SFX Volume</Text>
          <View style={styles.volumeBarRow}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => (
              <TouchableOpacity
                key={v}
                style={[
                  styles.volumeStepBtn,
                  {
                    backgroundColor: (soundEffectVolume ?? 0.8) >= v ? colors.text : colors.inputBg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSoundEffectVolume(v)}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.testSoundBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
          onPress={() => playCompletionSound()}
        >
          <Volume2 size={16} color={colors.text} />
          <Text style={[styles.testSoundText, { color: colors.text }]}>Test Sound</Text>
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
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingGroup: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  settingInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  autoStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  autoStartTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  autoStartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  autoStartSubtitle: {
    fontSize: 12,
  },
  switchTouchable: {
    padding: 4,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeButton: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  volumeGroup: {
    marginBottom: 16,
    marginTop: 8,
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
});
