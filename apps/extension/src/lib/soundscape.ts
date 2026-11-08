import type { SoundscapePreset } from "@focus/types";
import { DEFAULT_CHANNELS } from "@focus/utils";

export { DEFAULT_CHANNELS };

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: "focusRain",
    name: "Focus Rain",
    channels: { rain: 65, brownnoise: 35 },
  },
  {
    id: "deepSpace",
    name: "Deep Space",
    channels: { brownnoise: 50, binauralAlpha: 40 },
  },
  {
    id: "cafeBuzz",
    name: "Cafe Buzz",
    channels: { cafe: 60, rain: 25 },
  },
  {
    id: "whiteCalm",
    name: "White Calm",
    channels: { whitenoise: 35, birds: 40 },
  },
  {
    id: "rainyNight",
    name: "Rain & Fire",
    channels: { rain: 60, campfire: 45 },
  },
  {
    id: "meditation",
    name: "Meditation",
    channels: { binauralTheta: 45, pinknoise: 30 },
  },
  {
    id: "reset",
    name: "Off",
    channels: {},
  },
];
