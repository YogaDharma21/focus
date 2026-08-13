import { useDesktopStore } from './store';

export const playCompletionSound = (forcePlay = false) => {
  const { soundEffectEnabled, soundEffectVolume } = useDesktopStore.getState();
  if (!soundEffectEnabled && !forcePlay) return;
  try {
    const audio = new Audio('./soundeffect.mp3');
    audio.volume = typeof soundEffectVolume === 'number' ? soundEffectVolume : 0.8;
    audio.play().catch((err) => {
      console.warn("Completion sound effect failed to play:", err);
    });
  } catch (e) {
    console.warn("Completion sound creation failed:", e);
  }
};

export const playTestCompletionSound = () => {
  playCompletionSound(true);
};
