import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
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
  } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const bottomOffset = 56 + Math.max(insets.bottom, 0) + 12;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playSound = async (url: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      console.log('Error loading audio:', error);
    }
  };

  const togglePlay = async () => {
    if (!soundRef.current) {
      const track = localPlaylist[currentTrackIndex] || localPlaylist[0];
      if (track) {
        await playSound(track.url);
      }
      return;
    }

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const selectTrack = async (index: number) => {
    setCurrentTrackIndex(index);
    const track = localPlaylist[index];
    if (track) {
      setMediaUrl('LOCAL', track.url);
      await playSound(track.url);
    }
  };

  const currentTrack = localPlaylist[currentTrackIndex] || localPlaylist[0];

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
            <Text style={[styles.miniSub, { color: colors.textMuted }]}>
              {currentTrack?.artist || 'Focus App'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: colors.primary }]}
          onPress={togglePlay}
          activeOpacity={0.8}
        >
          {isPlaying ? (
            <Pause size={16} color={colors.primaryForeground} />
          ) : (
            <Play size={16} color={colors.primaryForeground} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setMediaPlayerOpen(!mediaPlayerOpen)}
        >
          {mediaPlayerOpen ? (
            <ChevronDown size={20} color={colors.textMuted} />
          ) : (
            <ChevronUp size={20} color={colors.textMuted} />
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
                          backgroundColor: active ? colors.border : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => selectTrack(i)}
                      activeOpacity={0.7}
                    >
                      <Music size={18} color={active ? colors.text : colors.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.trackName, { color: colors.text }]}>
                          {track.title}
                        </Text>
                        <Text style={[styles.trackArtist, { color: colors.textMuted }]}>
                          {track.artist}
                        </Text>
                      </View>
                      {active && isPlaying && <Volume2 size={16} color={colors.text} />}
                    </TouchableOpacity>
                  );
                })}
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
    bottom: 56,
    left: 12,
    right: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 5,
  },
  miniBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  miniSub: {
    fontSize: 11,
    marginTop: 1,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  expandBtn: {
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    gap: 16,
  },
  trackList: {
    gap: 10,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
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
});
