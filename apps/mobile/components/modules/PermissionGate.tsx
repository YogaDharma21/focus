import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import {
  openAccessibilitySettings,
  openBatteryOptimizationSettings,
  openOverlaySettings,
  openUsageAccessSettings,
  type NativeShieldStatus,
} from '@/lib/shieldService';
import { Shield, ShieldCheck, ChevronRight } from 'lucide-react-native';

interface GateRow {
  key: string;
  title: string;
  subtitle: string;
  granted: boolean;
  onGrant: () => Promise<void>;
}

export function PermissionGate({
  status,
  urlBlocking,
  onRefresh,
  onContinue,
  onSkipUrlBlocking,
}: {
  status: NativeShieldStatus;
  urlBlocking: boolean;
  onRefresh: () => void;
  onContinue: () => void;
  onSkipUrlBlocking: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const rows: GateRow[] = [
    {
      key: 'usage',
      title: 'Usage access',
      subtitle: 'Detect which app is open during Flow',
      granted: status.hasUsageAccess,
      onGrant: openUsageAccessSettings,
    },
    {
      key: 'overlay',
      title: 'Display over other apps',
      subtitle: 'Show the blocking screen',
      granted: status.canDrawOverlays,
      onGrant: openOverlaySettings,
    },
    {
      key: 'battery',
      title: 'Ignore battery limits',
      subtitle: 'Keep the watcher alive in background',
      granted: status.ignoringBatteryOptimizations,
      onGrant: openBatteryOptimizationSettings,
    },
  ];
  if (urlBlocking) {
    rows.push({
      key: 'accessibility',
      title: 'Accessibility access',
      subtitle: 'Catch blocked sites in browser address bars',
      granted: status.accessibilityEnabled,
      onGrant: openAccessibilitySettings,
    });
  }

  const doneCount = rows.filter((r) => r.granted).length;
  const complete = doneCount === rows.length;
  const onlyAccessibilityMissing =
    urlBlocking && !status.accessibilityEnabled && doneCount === rows.length - 1;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 16) + 24,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        },
      ]}
    >
      <View style={styles.header}>
        <Shield size={32} color={colors.text} />
        <Text style={[styles.title, { color: colors.text }]}>Before you focus</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {complete
            ? 'All set. Shield is ready to enforce.'
            : `Grant ${rows.length - doneCount} more permission${rows.length - doneCount === 1 ? '' : 's'} to enter.`}
        </Text>
      </View>

      <View style={styles.list}>
        {rows.map((row) => (
          <View
            key={row.key}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: row.granted ? '#22c55e' : colors.mutedText },
              ]}
            />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{row.title}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedText }]}>{row.subtitle}</Text>
            </View>
            {row.granted ? (
              <ShieldCheck size={20} color="#22c55e" />
            ) : (
              <TouchableOpacity
                style={[styles.grantBtn, { backgroundColor: colors.primary }]}
                onPress={() => void row.onGrant().finally(onRefresh)}
                activeOpacity={0.8}
              >
                <Text style={[styles.grantBtnText, { color: colors.primaryText }]}>Grant</Text>
                <ChevronRight size={14} color={colors.primaryText} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.continueBtn,
          { backgroundColor: colors.primary, opacity: complete ? 1 : 0.4 },
        ]}
        onPress={onContinue}
        disabled={!complete}
        activeOpacity={0.8}
      >
        <Text style={[styles.continueText, { color: colors.primaryText }]}>Continue to Focus</Text>
      </TouchableOpacity>

      {onlyAccessibilityMissing ? (
        <TouchableOpacity onPress={onSkipUrlBlocking} activeOpacity={0.7} style={styles.skipRow}>
          <Text style={[styles.skipText, { color: colors.mutedText }]}>
            Continue without website blocking
          </Text>
        </TouchableOpacity>
      ) : null}

      <Text style={[styles.hint, { color: colors.mutedText }]}>
        If a system toggle is greyed out (Restricted setting), open App info for Focus, allow
        restricted settings from the menu, then come back. On Xiaomi/MIUI also enable Autostart
        for Focus.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  list: {
    gap: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  grantBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  continueBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
  },
  skipRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  hint: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 20,
  },
});
