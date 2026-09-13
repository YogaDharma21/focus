import { useTheme } from '../context/ThemeContext';

export function useColorScheme() {
  const { themeMode } = useTheme();
  return themeMode;
}
