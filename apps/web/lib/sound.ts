import {
  registerAutoplayUnlock,
  playSynthesizedChime,
  showNotificationToast,
  requestNotificationPermission,
} from "@focus/utils";
import { useAppStore } from "./store";

export { registerAutoplayUnlock, requestNotificationPermission, showNotificationToast };

export const playCompletionSound = (options?: {
  forcePlay?: boolean;
  notification?: { title: string; body: string };
}) => {
  registerAutoplayUnlock();
  const { soundEnabled, soundEffectEnabled, soundEffectVolume } = useAppStore.getState();
  if ((!soundEnabled || !soundEffectEnabled) && !options?.forcePlay) return;

  const vol = (soundEffectVolume ?? 80) / 100;

  const triggerNotification = () => {
    if (options?.notification) {
      showNotificationToast(options.notification.title, options.notification.body);
    }
  };

  const handleFallback = (err: unknown) => {
    console.warn("Completion sound effect failed, falling back to Web Audio chime:", err);
    playSynthesizedChime(vol);
    triggerNotification();
  };

  try {
    const audio = new Audio("/soundeffect.mp3");
    audio.volume = vol;
    audio.play()
      .then(() => {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
          triggerNotification();
        }
      })
      .catch(handleFallback);
  } catch (e) {
    handleFallback(e);
  }
};
