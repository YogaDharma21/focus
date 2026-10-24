import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { playCompletionSound } from '@/lib/sound';
import { VolumeSlider } from '@/components/ui/VolumeSlider';
import { Play, Pause, X, AlertTriangle, CheckCircle2, Plus, Music, RotateCcw, ShieldCheck } from 'lucide-react-native';
import { isBlockingRequired } from '@/lib/shield';

const DISTRACTION_CATEGORIES = [
  'Social Media',
  'Notification',
  'Thought',
  'Break',
  'Other',
];

export function DeepFocusOverlay() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    deepFocusMode,
    setDeepFocusMode,
    timeLeft,
    setTimeLeft,
    timerState,
    setTimerState,
    isActive,
    setIsActive,
    addSession,
    addDistraction,
    isMusicPlaying,
    setIsMusicPlaying,
    soundEnabled,
    musicEnabled,
    musicVolume,
    setMusicVolume,
    autoStartBreak,
    autoStartFlow,
    shield,
  } = useAppStore();

  const [distractionModalOpen, setDistractionModalOpen] = useState(false);
  const [musicModalOpen, setMusicModalOpen] = useState(false);
  const shieldEnforcing = isBlockingRequired(shield.enabled, isActive, timerState);

  if (!deepFocusMode) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSession = () => {
    playCompletionSound();
    setIsActive(false);

    if (timerState === 'BREAK') {
      setTimeLeft(0);
      setTimerState('FLOW');
      setIsActive(autoStartFlow ?? true);
      setDeepFocusMode(autoStartFlow ?? true);
      return;
    }

    const flowDuration = timeLeft;
    if (flowDuration > 0) {
      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: flowDuration,
        mode: 'STOPWATCH',
      });
    }

    const breakSeconds = Math.floor(flowDuration / 5);
    if (breakSeconds > 0) {
      setTimeLeft(breakSeconds);
      setTimerState('BREAK');
      setIsActive(autoStartBreak ?? true);
    } else {
      setTimeLeft(0);
      setTimerState('FLOW');
    }
    setDeepFocusMode(false);
  };

  return (
    <Modal visible={deepFocusMode} animationType="fade" transparent={false}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Top Left Lofi-Beats Music Pill */}
        {soundEnabled && musicEnabled && (
          <TouchableOpacity
            style={[
              styles.musicPillBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                top: Math.max(insets.top + 12, 40),
              },
            ]}
            onPress={() => setMusicModalOpen(true)}
            activeOpacity={0.7}
          >
            <Music size={16} color={isMusicPlaying ? colors.text : colors.mutedText} />
            <Text style={[styles.musicPillText, { color: isMusicPlaying ? colors.text : colors.mutedText }]}>
              Lofi-Beats
            </Text>
            {isMusicPlaying ? (
              <View style={[styles.activeDot, { backgroundColor: colors.text }]} />
            ) : null}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.exitBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              top: Math.max(insets.top + 12, 40),
            },
          ]}
          onPress={() => setDeepFocusMode(false)}
          activeOpacity={0.7}
        >
          <X size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(timeLeft)}</Text>
          {shieldEnforcing ? (
            <View style={[styles.shieldPill, { backgroundColor: colors.card, borderColor: colors.emerald }]}>
              <ShieldCheck size={12} color={colors.emerald} />
              <Text style={[styles.shieldPillText, { color: colors.mutedText }]}>Shield enforcing</Text>
            </View>
          ) : null}

          {/* Deep Focus Controls Row */}
          <View style={styles.controlsRow}>
            {/* Log Distraction Button */}
            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
                !isActive && { opacity: 0.5 },
              ]}
              onPress={() => setDistractionModalOpen(true)}
              disabled={!isActive}
              activeOpacity={0.7}
            >
              <AlertTriangle size={22} color={colors.text} />
            </TouchableOpacity>

            {/* Play / Pause Main Button */}
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.text }]}
              onPress={() => setIsActive(!isActive)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <Pause size={32} color={colors.background} />
              ) : (
                <Play size={32} color={colors.background} fill={colors.background} style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            {/* Complete Session Button */}
            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
                !isActive && { opacity: 0.5 },
              ]}
              onPress={handleCompleteSession}
              disabled={!isActive}
              activeOpacity={0.7}
            >
              <CheckCircle2 size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ambient Music Control Modal */}
        <Modal visible={musicModalOpen} transparent animationType="fade" onRequestClose={() => setMusicModalOpen(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setMusicModalOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Lofi-Beats</Text>
              <Text style={[styles.modalSub, { color: colors.mutedText }]}>
                Control background ambient audio while focusing.
              </Text>
              
              <View style={{ gap: 12, marginVertical: 16 }}>
                <TouchableOpacity
                  style={[
                    styles.distractionItem,
                    { backgroundColor: isMusicPlaying ? colors.card : colors.muted, borderColor: isMusicPlaying ? colors.mutedText : colors.border },
                  ]}
                  onPress={() => {
                    if (soundEnabled && musicEnabled) setIsMusicPlaying(!isMusicPlaying);
                  }}
                  disabled={!soundEnabled || !musicEnabled}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>
                    {isMusicPlaying ? 'Pause Lofi Audio' : 'Play Lofi Audio'}
                  </Text>
                  {isMusicPlaying ? (
                    <Pause size={18} color={colors.text} />
                  ) : (
                    <Play size={18} color={colors.mutedText} />
                  )}
                </TouchableOpacity>

                <Text style={{ color: colors.mutedText, fontSize: 13, marginTop: 4 }}>
                  Volume: {Math.round(musicVolume * 100)}%
                </Text>
                <VolumeSlider
                  value={musicVolume}
                  onValueChange={setMusicVolume}
                  disabled={!soundEnabled || !musicEnabled}
                />
              </View>

              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: colors.muted }]}
                onPress={() => setMusicModalOpen(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Distraction Logger Modal */}
        <Modal visible={distractionModalOpen} transparent animationType="fade" onRequestClose={() => setDistractionModalOpen(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDistractionModalOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Log Distraction</Text>
              <Text style={[styles.modalSub, { color: colors.mutedText }]}>
                What got you off track? Stay conscious of interruption patterns.
              </Text>
              <View style={{ gap: 8, marginVertical: 12 }}>
                {DISTRACTION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.distractionItem, { backgroundColor: colors.muted, borderColor: colors.border }]}
                    onPress={() => {
                      addDistraction(cat);
                      setDistractionModalOpen(false);
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{cat}</Text>
                    <Plus size={16} color={colors.mutedText} />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: colors.muted }]}
                onPress={() => setDistractionModalOpen(false)}
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  exitBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  musicPillBtn: {
    position: 'absolute',
    left: 20,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  musicPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  content: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 76,
    fontWeight: '800',
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
  },
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
  },
  shieldPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 48,
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  secondaryActionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  distractionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  closeModalBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
});
