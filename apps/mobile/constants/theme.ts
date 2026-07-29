import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#ffffff',
    card: '#f4f4f5',
    cardBorder: '#e4e4e7',
    text: '#09090b',
    textMuted: '#71717a',
    primary: '#18181b',
    primaryForeground: '#fafafa',
    border: '#e4e4e7',
    icon: '#71717a',
    tint: '#09090b',
    tabIconDefault: '#a1a1aa',
    tabIconSelected: '#09090b',
    inputBg: '#ffffff',
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
