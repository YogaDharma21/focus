import { Audio } from 'expo-av';
import { useAppStore } from './store';

export async function playCompletionSound(forcePlay = false) {
  try {
    const state = useAppStore.getState();
    const soundEffectEnabled = state.soundEffectEnabled ?? true;
    const soundEffectVolume = state.soundEffectVolume ?? 0.8;

    if (!soundEffectEnabled && !forcePlay) return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/soundeffect.mp3'),
      { shouldPlay: true, volume: soundEffectVolume }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log('Error playing completion sound:', error);
  }
}

export async function playTestCompletionSound() {
  await playCompletionSound(true);
}
