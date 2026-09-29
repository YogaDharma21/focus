import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState } from 'react-native';
import 'react-native-reanimated';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { PermissionGate } from '@/components/modules/PermissionGate';
import { getNativeShieldStatus, isNativeShieldSupported, type NativeShieldStatus } from '@/lib/shieldService';
import { useAppStore } from '@/lib/store';

function RootLayoutContent() {
  const { themeMode } = useTheme();
  const [gate, setGate] = React.useState<'checking' | 'gate' | 'app'>('checking');
  const [status, setStatus] = React.useState<NativeShieldStatus | null>(null);

  const refreshGate = React.useCallback(() => {
    if (!isNativeShieldSupported()) {
      setGate('app');
      return;
    }
    const next = getNativeShieldStatus();
    setStatus(next);
    const needAccessibility = useAppStore.getState().shield.urlBlocking;
    const ok =
      next.hasUsageAccess &&
      next.canDrawOverlays &&
      next.ignoringBatteryOptimizations &&
      (!needAccessibility || next.accessibilityEnabled);
    setGate(ok ? 'app' : 'gate');
  }, []);

  React.useEffect(() => {
    refreshGate();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshGate();
    });
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.shield.urlBlocking !== prev.shield.urlBlocking) refreshGate();
    });
    return () => {
      sub.remove();
      unsub();
    };
  }, [refreshGate]);

  if (gate === 'checking') return null;

  if (gate === 'gate' && status) {
    return (
      <>
        <PermissionGate
          status={status}
          urlBlocking={useAppStore.getState().shield.urlBlocking}
          onRefresh={refreshGate}
          onContinue={() => setGate('app')}
          onSkipUrlBlocking={() => useAppStore.getState().setUrlBlocking(false)}
        />
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      </>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
