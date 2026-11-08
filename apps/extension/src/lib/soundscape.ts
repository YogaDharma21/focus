import type { SoundscapePreset } from "@focus/types";
import { DEFAULT_CHANNELS } from "@focus/utils";

export { DEFAULT_CHANNELS };

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: "deepFocus",
    name: "Deep Focus",
    channels: { brownnoise: 55, binauralAlpha: 35 },
  },
  {
    id: "focusRain",
    name: "Focus Rain",
    channels: { rain: 65, brownnoise: 35 },
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
    id: "reset",
    name: "Off",
    channels: {},
  },
];
