import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Radius } from '@/constants/theme';
import { playCompletionSound } from '@/lib/sound';
import { VolumeSlider } from '@/components/ui/VolumeSlider';
import { Play, Pause, X, AlertTriangle, CheckCircle2, Plus, Music, RotateCcw } from 'lucide-react-native';

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
    isActive,
    setIsActive,
    sessionName,
    addSession,
    addDistraction,
    selectedTodoId,
    todos,
    isMusicPlaying,
    setIsMusicPlaying,
    musicVolume,
    setMusicVolume,
  } = useAppStore();

  const [distractionModalOpen, setDistractionModalOpen] = useState(false);
  const [musicModalOpen, setMusicModalOpen] = useState(false);

  if (!deepFocusMode) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSession = () => {
    playCompletionSound();
    setIsActive(false);

    const flowDuration = timeLeft;
    if (flowDuration > 0) {
      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: flowDuration,
        mode: 'STOPWATCH',
      });
    }
    setTimeLeft(0);
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
        <TouchableOpacity
          style={[
            styles.musicPillBtn,
            {
              backgroundColor: isMusicPlaying ? colors.card : 'rgba(255, 255, 255, 0.05)',
              borderColor: isMusicPlaying ? colors.mutedText : colors.border,
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
        >
          <X size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(timeLeft)}</Text>

          {(() => {
            const selectedTodo = todos.find((t) => t.id === selectedTodoId);
            const displayTitle = selectedTodo ? selectedTodo.text : sessionName;
            return displayTitle ? (
              <Text style={[styles.sessionText, { color: colors.mutedText }]}>{displayTitle}</Text>
            ) : null;
          })()}

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
              <AlertTriangle size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Play / Pause Main Button */}
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsActive(!isActive)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <Pause size={32} color={colors.primaryText} />
              ) : (
                <Play size={32} color={colors.primaryText} fill={colors.primaryText} style={{ marginLeft: 3 }} />
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
              <CheckCircle2 size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ambient Music Control Modal */}
        <Modal visible={musicModalOpen} transparent animationType="fade" onRequestClose={() => setMusicModalOpen(false)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setMusicModalOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Lofi-Beats</Text>
              <Text style={[styles.modalSub, { color: colors.mutedText }]}>
                Control Lofi-Beats audio while in Deep Focus mode.
              </Text>
              
              <View style={{ gap: 12, marginVertical: 16 }}>
                <TouchableOpacity
                  style={[
                    styles.distractionItem,
                    { backgroundColor: isMusicPlaying ? colors.card : colors.muted, borderColor: isMusicPlaying ? colors.mutedText : colors.border },
                  ]}
                  onPress={() => setIsMusicPlaying(!isMusicPlaying)}
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
                />
              </View>

              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: colors.border }]}
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
                    <Text style={{ color: colors.text, fontWeight: '500' }}>{cat}</Text>
                    <Plus size={16} color={colors.mutedText} />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: colors.border }]}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  musicPillBtn: {
    position: 'absolute',
    left: 20,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
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
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -3,
  },
  sessionText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 40,
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: Radius.base,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  secondaryActionBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.base,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.base,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 10,
  },
  distractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  closeModalBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
