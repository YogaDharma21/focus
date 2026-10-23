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

function readShieldGate(): { gate: 'app' | 'gate'; status: NativeShieldStatus | null } {
  if (!isNativeShieldSupported()) {
    return { gate: 'app', status: null };
  }
  const next = getNativeShieldStatus();
  const needAccessibility = useAppStore.getState().shield.urlBlocking;
  const ok =
    next.hasUsageAccess &&
    next.canDrawOverlays &&
    next.ignoringBatteryOptimizations &&
    (!needAccessibility || next.accessibilityEnabled);
  return { gate: ok ? 'app' : 'gate', status: next };
}

function RootLayoutContent() {
  const { themeMode } = useTheme();
  const [gate, setGate] = React.useState(() => readShieldGate());

  const refreshGate = React.useCallback(() => {
    setGate(readShieldGate());
  }, []);

  React.useEffect(() => {
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

  if (gate.gate === 'gate' && gate.status) {
    return (
      <>
        <PermissionGate
          status={gate.status}
          urlBlocking={useAppStore.getState().shield.urlBlocking}
          onRefresh={refreshGate}
          onContinue={() => setGate((prev) => ({ ...prev, gate: 'app' }))}
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
