import { useDesktopStore } from './store';

export const playCompletionSound = () => {
  const { soundEffectEnabled } = useDesktopStore.getState();
  if (!soundEffectEnabled) return;
  try {
    const audio = new Audio('./soundeffect.mp3');
    audio.play().catch((err) => {
      console.warn("Completion sound effect failed to play:", err);
    });
  } catch (e) {
    console.warn("Completion sound creation failed:", e);
  }
};
