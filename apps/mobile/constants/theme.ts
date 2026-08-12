import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#09090b',
    card: '#18181b',
    cardBorder: '#27272a',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    primary: '#fafafa',
    primaryForeground: '#09090b',
    border: '#27272a',
    icon: '#a1a1aa',
    tint: '#ffffff',
    tabIconDefault: '#71717a',
    tabIconSelected: '#ffffff',
    inputBg: '#09090b',
  },
  dark: {
    background: '#09090b',
    card: '#18181b',
    cardBorder: '#27272a',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    primary: '#fafafa',
    primaryForeground: '#09090b',
    border: '#27272a',
    icon: '#a1a1aa',
    tint: '#ffffff',
    tabIconDefault: '#71717a',
    tabIconSelected: '#ffffff',
    inputBg: '#09090b',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Radius = {
  rem: '0.625rem',
  base: 10, // 0.625rem = 10px
  sm: 6,
  md: 10,
  lg: 10,
  xl: 10,
  card: 10,
  modal: 10,
  button: 10,
  full: 9999,
};
