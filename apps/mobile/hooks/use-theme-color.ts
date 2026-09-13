import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type ColorKey = keyof typeof Colors.dark;

export function useThemeColor(
  colorName: ColorKey,
  lightColor?: string,
  darkColor?: string,
): string {
  const { themeMode } = useTheme();
  const colors = themeMode === 'dark' ? Colors.dark : Colors.light;
  
  if (themeMode === 'dark' && darkColor) {
    return darkColor;
  }
  if (themeMode === 'light' && lightColor) {
    return lightColor;
  }
  
  return colors[colorName];
}
