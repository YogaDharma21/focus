import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { VolumeSlider } from '@/components/ui/VolumeSlider';
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_BOTTOM_GAP,
} from '@/components/FloatingTabBar';
import { Play, Pause, Music, Volume2, X, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function MediaPlayer() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    mediaPlayerOpen,
    setMediaPlayerOpen,
    localPlaylist,
    setMediaUrl,
    isMusicPlaying,
    setIsMusicPlaying,
    soundEnabled,
    musicEnabled,
    musicVolume,
    setMusicVolume,
  } = useAppStore();

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const soundRef = useRef<AudioPlayer | null>(null);

  const bottomOffset =
    Math.max(insets.bottom, 6) +
    FLOATING_TAB_BAR_BOTTOM_GAP +
    FLOATING_TAB_BAR_HEIGHT +
    12;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
        soundRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback(async (url: string) => {
    try {
      if (!soundEnabled || !musicEnabled) return;
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      });
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
        soundRef.current = null;
      }
      const source = url && url.startsWith('http')
        ? { uri: url }
        : require('@/assets/music1.mp3');

      const player = createAudioPlayer(source);
      player.volume = musicVolume;
      player.loop = true;
      player.play();
      soundRef.current = player;
      setIsMusicPlaying(true);
    } catch {
      // Audio playback error handling
    }
  }, [musicVolume, soundEnabled, musicEnabled, setIsMusicPlaying]);

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    const track = localPlaylist[index];
    if (track) {
      setMediaUrl('LOCAL', track.url);
      if (isMusicPlaying) {
        playSound(track.url);
      }
    }
  };

  const togglePlay = () => {
    if (isMusicPlaying) {
      if (soundRef.current) {
        soundRef.current.pause();
      }
      setIsMusicPlaying(false);
    } else {
      const track = localPlaylist[currentTrackIndex];
      if (track) {
        playSound(track.url);
      }
    }
  };

  const changeVolume = (val: number) => {
    setMusicVolume(val);
    if (soundRef.current) {
      soundRef.current.volume = val;
    }
  };

  const currentTrack = localPlaylist[currentTrackIndex];

  if (!soundEnabled || !musicEnabled) return null;

  return (
    <>
      {/* Floating Bottom Bar Mini Player */}
      <View
        style={[
          styles.miniBar,
          { backgroundColor: colors.card, borderColor: colors.border, bottom: bottomOffset },
        ]}
      >
        <TouchableOpacity
          style={styles.miniBarLeft}
          onPress={() => setMediaPlayerOpen(!mediaPlayerOpen)}
          activeOpacity={0.8}
        >
          <Music size={18} color={colors.text} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={1}>
              {currentTrack?.title || 'Sound Player'}
            </Text>
            {!!currentTrack?.artist && (
              <Text style={[styles.miniSub, { color: colors.mutedText }]}>
                {currentTrack.artist}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: colors.text }]}
          onPress={togglePlay}
          activeOpacity={0.8}
        >
          {isMusicPlaying ? (
            <Pause size={16} color={colors.background} />
          ) : (
            <Play size={16} color={colors.background} fill={colors.background} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setMediaPlayerOpen(!mediaPlayerOpen)}
        >
          {mediaPlayerOpen ? (
            <ChevronDown size={20} color={colors.mutedText} />
          ) : (
            <ChevronUp size={20} color={colors.mutedText} />
          )}
        </TouchableOpacity>
      </View>

      {/* Full Modal Drawer Player */}
      <Modal visible={mediaPlayerOpen} transparent animationType="slide" onRequestClose={() => setMediaPlayerOpen(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setMediaPlayerOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={[styles.modalHeader, { borderColor: colors.border }]}>
              <View style={styles.modalTitleRow}>
                <Volume2 size={20} color={colors.text} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Sound Player</Text>
              </View>
              <TouchableOpacity onPress={() => setMediaPlayerOpen(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.trackList}>
                {localPlaylist.map((track, i) => {
                  const active = currentTrackIndex === i;
                  return (
                    <TouchableOpacity
                      key={track.id}
                      style={[
                        styles.trackRow,
                        {
                          backgroundColor: active ? colors.border : colors.muted,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => selectTrack(i)}
                      activeOpacity={0.7}
                    >
                      <Music size={18} color={active ? colors.text : colors.mutedText} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.trackName, { color: colors.text }]}>
                          {track.title}
                        </Text>
                        {!!track.artist && (
                          <Text style={[styles.trackArtist, { color: colors.mutedText }]}>
                            {track.artist}
                          </Text>
                        )}
                      </View>
                      {active && isMusicPlaying && <Volume2 size={16} color={colors.text} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Music Volume Section */}
              <View style={[styles.volumeSection, { borderColor: colors.border }]}>
                <View style={styles.volumeHeader}>
                  <Volume2 size={16} color={colors.mutedText} />
                  <Text style={[styles.volumeText, { color: colors.mutedText }]}>
                    Music Volume ({Math.round(musicVolume * 100)}%)
                  </Text>
                </View>
                <VolumeSlider
                  value={musicVolume}
                  onValueChange={changeVolume}
                />
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  miniBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  miniBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  miniSub: {
    fontSize: 12,
    marginTop: 1,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  expandBtn: {
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  trackList: {
    gap: 10,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
  },
  trackArtist: {
    fontSize: 12,
    marginTop: 2,
  },
  volumeSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
