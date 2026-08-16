import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useAppStore } from './store';

const soundSource = require('../assets/soundeffect.mp3');

export async function playCompletionSound(forcePlay = false) {
  try {
    const state = useAppStore.getState();
    const soundEffectEnabled = state.soundEffectEnabled ?? true;
    const soundEffectVolume = state.soundEffectVolume ?? 0.8;

    if (!soundEffectEnabled && !forcePlay) return;

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });

    const player = createAudioPlayer(soundSource);
    player.volume = soundEffectVolume;
    player.loop = false;

    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        subscription.remove();
        player.remove();
      }
    });

    player.play();
  } catch (error) {
    console.log('Error playing completion sound:', error);
  }
}

export async function playTestCompletionSound() {
  await playCompletionSound(true);
}

