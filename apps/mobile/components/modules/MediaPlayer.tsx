import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { Play, Pause, Music, Volume2, ExternalLink, X, ChevronUp, ChevronDown } from 'lucide-react-native';

export function MediaPlayer() {
  const { colors } = useTheme();
  const {
    mediaPlayerOpen,
    setMediaPlayerOpen,
    mediaType,
    setMediaType,
    youtubeUrl,
    spotifyUrl,
    localPlaylist,
    localUrl,
    setMediaUrl,
  } = useAppStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

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
    if (mediaType !== 'LOCAL') {
      const targetUrl = mediaType === 'YOUTUBE' ? youtubeUrl : spotifyUrl;
      if (targetUrl) {
        Linking.openURL(targetUrl).catch(() => {});
      }
      return;
    }

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
          { backgroundColor: colors.card, borderColor: colors.border },
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
              {mediaType === 'LOCAL'
                ? currentTrack?.title || 'Ambient Music'
                : mediaType === 'YOUTUBE'
                ? 'YouTube Focus Stream'
                : 'Spotify Focus Playlist'}
            </Text>
            <Text style={[styles.miniSub, { color: colors.textMuted }]}>
              {mediaType === 'LOCAL' ? currentTrack?.artist || 'Focus App' : mediaType}
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

      {/* Full Modal Player */}
      <Modal visible={mediaPlayerOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderColor: colors.border }]}>
              <View style={styles.modalTitleRow}>
                <Volume2 size={20} color={colors.text} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Ambient Sound Player</Text>
              </View>
              <TouchableOpacity onPress={() => setMediaPlayerOpen(false)}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Service Tabs */}
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor: mediaType === 'LOCAL' ? colors.primary : colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setMediaType('LOCAL')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: mediaType === 'LOCAL' ? colors.primaryForeground : colors.text },
                    ]}
                  >
                    Local Audio
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor: mediaType === 'YOUTUBE' ? colors.primary : colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setMediaType('YOUTUBE')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: mediaType === 'YOUTUBE' ? colors.primaryForeground : colors.text },
                    ]}
                  >
                    YouTube
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor: mediaType === 'SPOTIFY' ? colors.primary : colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setMediaType('SPOTIFY')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: mediaType === 'SPOTIFY' ? colors.primaryForeground : colors.text },
                    ]}
                  >
                    Spotify
                  </Text>
                </TouchableOpacity>
              </View>

              {mediaType === 'LOCAL' ? (
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
              ) : (
                <View style={styles.externalBox}>
                  <Text style={[styles.externalTitle, { color: colors.text }]}>
                    External {mediaType} Stream
                  </Text>
                  <Text style={[styles.externalSub, { color: colors.textMuted }]}>
                    Tap below to open your preferred {mediaType} focus playlist.
                  </Text>
                  <TouchableOpacity
                    style={[styles.openLinkBtn, { backgroundColor: colors.primary }]}
                    onPress={togglePlay}
                  >
                    <ExternalLink size={16} color={colors.primaryForeground} />
                    <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>
                      Open {mediaType}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
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
  externalBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  externalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  externalSub: {
    fontSize: 13,
    textAlign: 'center',
  },
  openLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
});
