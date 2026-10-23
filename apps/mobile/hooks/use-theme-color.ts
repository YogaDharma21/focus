import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type ColorKey = keyof typeof Colors.dark;

export function useThemeColor(
  propsOrColorName: { light?: string; dark?: string } | ColorKey,
  colorName?: ColorKey,
): string {
  const { themeMode } = useTheme();
  const colors = themeMode === 'dark' ? Colors.dark : Colors.light;

  if (typeof propsOrColorName === 'string') {
    return colors[propsOrColorName];
  }

  const props = propsOrColorName;
  const targetKey = colorName || 'text';

  if (themeMode === 'dark' && props?.dark) {
    return props.dark;
  }
  if (themeMode === 'light' && props?.light) {
    return props.light;
  }

  return colors[targetKey];
}
