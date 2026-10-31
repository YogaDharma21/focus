import { registerAutoplayUnlock, playSynthesizedChime } from '@focus/utils';
import { useDesktopStore } from './store';
import { electron } from './electron';

registerAutoplayUnlock();

export const playCompletionSound = (
  forcePlay = false,
  notification?: { title: string; body: string }
) => {
  const { soundEffectEnabled, soundEffectVolume } = useDesktopStore.getState();
  if (!soundEffectEnabled && !forcePlay) return;

  const vol = typeof soundEffectVolume === 'number' ? soundEffectVolume : 0.8;

  const handleFallback = (err: unknown) => {
    console.warn('Completion sound effect failed, falling back to Web Audio chime:', err);
    playSynthesizedChime(vol);
    if (notification) {
      electron.showNotification(notification.title, notification.body);
    }
  };

  try {
    const audio = new Audio('./soundeffect.mp3');
    audio.volume = vol;
    audio.play().catch(handleFallback);
  } catch (e) {
    handleFallback(e);
  }
};

export const playTestCompletionSound = () => {
  playCompletionSound(true);
};
