import React, { createContext, useContext } from 'react';
import { Colors } from '@/constants/theme';

export type ThemeMode = 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  activeScheme: 'dark';
  colors: typeof Colors.dark;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode: ThemeMode = 'dark';
  const activeScheme: 'dark' = 'dark';
  const colors = Colors.dark;

  const setThemeMode = () => {};
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        activeScheme,
        colors,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeMode: 'dark' as ThemeMode,
      setThemeMode: () => {},
      activeScheme: 'dark' as const,
      colors: Colors.dark,
      toggleTheme: () => {},
    };
  }
  return context;
}
