import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, AppState, Platform, Modal, Image } from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { isBlockingRequired } from '@/lib/shield';
import {
  getNativeShieldStatus,
  openAccessibilitySettings,
  openAppDetailsSettings,
  openBatteryOptimizationSettings,
  openOverlaySettings,
  openUsageAccessSettings,
  type NativeShieldStatus,
} from '@/lib/shieldService';
import { getInstalledApps, type InstalledShieldApp } from 'focus-shield';
import { getApplicationIconAsync } from 'expo-intent-launcher';
import { Shield, ShieldCheck, ShieldAlert, Plus, X, Globe, Smartphone, Lock, Info, Check, Search } from 'lucide-react-native';

type ThemeColors = {
  text: string;
  mutedText: string;
  muted: string;
  border: string;
  primary: string;
  primaryText: string;
};

const appIconCache = new Map<string, string | null>();

function ShieldAppIcon({
  packageName,
  label,
  colors,
  size = 36,
}: {
  packageName: string;
  label: string;
  colors: ThemeColors;
  size?: number;
}) {
  const [iconUri, setIconUri] = useState<string | null>(() => appIconCache.get(packageName) ?? null);

  useEffect(() => {
    if (appIconCache.has(packageName)) {
      setIconUri(appIconCache.get(packageName) ?? null);
      return;
    }
    let cancelled = false;
    getApplicationIconAsync(packageName)
      .then((uri) => {
        appIconCache.set(packageName, uri || null);
        if (!cancelled && uri) setIconUri(uri);
      })
      .catch(() => {
        appIconCache.set(packageName, null);
      });
    return () => {
      cancelled = true;
    };
  }, [packageName]);

  if (iconUri) {
    return <Image source={{ uri: iconUri }} style={{ width: size, height: size, borderRadius: size / 4 }} />;
  }
  return (
    <View
      style={[
        styles.appIconFallback,
        { backgroundColor: colors.border, width: size, height: size, borderRadius: size / 4 },
      ]}
    >
      <Text style={[styles.appIconFallbackText, { color: colors.mutedText }]}>
        {(label || packageName).charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function SiteIcon({ domain, colors }: { domain: string; colors: ThemeColors }) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <Image
        source={{ uri: `https://www.google.com/s2/favicons?domain=${domain}&sz=64` }}
        style={styles.siteIcon}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={[styles.siteIcon, styles.siteIconFallback, { backgroundColor: colors.border }]}>
      <Text style={[styles.appIconFallbackText, { color: colors.mutedText }]}>
        {domain.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function InstalledAppRow({
  app,
  blocked,
  onToggle,
  colors,
}: {
  app: InstalledShieldApp;
  blocked: boolean;
  onToggle: () => void;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity
      style={[styles.appRow, { backgroundColor: colors.muted, borderColor: colors.border }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <ShieldAppIcon packageName={app.packageName} label={app.label} colors={colors} />
      <View style={styles.appRowText}>
        <Text style={[styles.appRowLabel, { color: colors.text }]} numberOfLines={1}>
          {app.label}
        </Text>
        <Text style={[styles.appRowPkg, { color: colors.mutedText }]} numberOfLines={1}>
          {app.packageName}
        </Text>
      </View>
      <View
        style={[
          styles.appCheck,
          {
            backgroundColor: blocked ? colors.primary : 'transparent',
            borderColor: blocked ? colors.primary : colors.mutedText,
          },
        ]}
      >
        {blocked ? <Check size={14} color={colors.primaryText} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function BlockedAppRow({
  packageName,
  label,
  colors,
  onRemove,
}: {
  packageName: string;
  label: string;
  colors: ThemeColors;
  onRemove: () => void;
}) {
  return (
    <View style={[styles.listRow, styles.listRowWithIcon, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <ShieldAppIcon packageName={packageName} label={label} colors={colors} size={32} />
      <Text style={[styles.listText, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
      <TouchableOpacity onPress={onRemove} hitSlop={8}>
        <X size={16} color={colors.mutedText} />
      </TouchableOpacity>
    </View>
  );
}

export function ShieldPage() {
  const { colors } = useTheme();
  const {
    shield,
    setShieldEnabled,
    setUrlBlocking,
    addBlockedSite,
    removeBlockedSite,
    addAllowedSite,
    removeAllowedSite,
    addBlockedApp,
    removeBlockedApp,
    isActive,
    timerState,
    soundEnabled,
    musicEnabled,
  } = useAppStore();

  const [listTab, setListTab] = useState<'blocked' | 'allowed'>('blocked');
  const [siteInput, setSiteInput] = useState('');
  const [appInput, setAppInput] = useState('');
  const [nativeStatus, setNativeStatus] = useState<NativeShieldStatus | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledShieldApp[]>([]);
  const [appSearch, setAppSearch] = useState('');
  const [installedLabels, setInstalledLabels] = useState<Record<string, string>>({});

  const enforcing = isBlockingRequired(shield.enabled, isActive, timerState);
  const miniPlayerVisible = soundEnabled && musicEnabled;
  const setupDoneCount = [
    nativeStatus?.hasUsageAccess,
    nativeStatus?.canDrawOverlays,
    nativeStatus?.ignoringBatteryOptimizations,
    nativeStatus?.accessibilityEnabled,
  ].filter(Boolean).length;

  const refreshNativeStatus = () => setNativeStatus(getNativeShieldStatus());

  useEffect(() => {
    refreshNativeStatus();
    if (Platform.OS === 'android') {
      try {
        const labels: Record<string, string> = {};
        for (const app of getInstalledApps()) labels[app.packageName] = app.label;
        setInstalledLabels(labels);
      } catch {
        // Installed list unavailable (e.g. Expo Go): fall back to package names.
      }
    }
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refreshNativeStatus();
    });
    return () => sub.remove();
  }, []);

  const handleAddSite = () => {
    const value = siteInput.trim();
    if (!value) return;
    if (listTab === 'blocked') addBlockedSite(value);
    else addAllowedSite(value);
    setSiteInput('');
  };

  const handleAddApp = () => {
    const value = appInput.trim();
    if (!value) return;
    addBlockedApp(value);
    setAppInput('');
  };

  const sites = listTab === 'blocked' ? shield.blockedSites : shield.allowedSites;

  const openAppPicker = () => {
    setInstalledApps(getInstalledApps());
    setAppSearch('');
    setPickerOpen(true);
  };

  const filteredApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    if (!q) return installedApps;
    return installedApps.filter(
      (a) => a.label.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q),
    );
  }, [installedApps, appSearch]);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: miniPlayerVisible ? 160 : 100 }]}>
      <View style={styles.header}>
        <Shield size={24} color={colors.text} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shield</Text>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: colors.muted,
              borderColor: enforcing ? '#22c55e' : colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: enforcing ? '#22c55e' : shield.enabled ? '#eab308' : colors.mutedText },
            ]}
          />
          <Text style={[styles.statusText, { color: colors.mutedText }]}>
            {enforcing ? 'Enforcing' : shield.enabled ? 'On' : 'Off'}
          </Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.toggleRow, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={() => setShieldEnabled(!shield.enabled)}
          activeOpacity={0.7}
        >
          <View style={styles.toggleText}>
            {shield.enabled ? (
              <ShieldCheck size={20} color={colors.text} />
            ) : (
              <ShieldAlert size={20} color={colors.mutedText} />
            )}
            <View style={styles.toggleCopy}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>
                {shield.enabled ? 'Shield enabled' : 'Shield disabled'}
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.mutedText }]}>
                {enforcing
                  ? 'Blocking in-app links during this Flow session.'
                  : 'Enforces only while a Flow session is active.'}
              </Text>
            </View>
          </View>
          <View style={[styles.switch, { backgroundColor: shield.enabled ? '#ffffff' : '#3f3f46' }]}>
            <View style={[styles.thumb, { marginLeft: shield.enabled ? 21 : 3 }]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Globe size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Websites</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                backgroundColor: listTab === 'blocked' ? colors.muted : 'transparent',
                borderColor: colors.border,
              },
            ]}
            onPress={() => setListTab('blocked')}
          >
            <Text style={[styles.tabText, { color: colors.text }]}>Blocked ({shield.blockedSites.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                backgroundColor: listTab === 'allowed' ? colors.muted : 'transparent',
                borderColor: colors.border,
              },
            ]}
            onPress={() => setListTab('allowed')}
          >
            <Text style={[styles.tabText, { color: colors.text }]}>Allowed ({shield.allowedSites.length})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.muted, borderColor: colors.border, color: colors.text },
            ]}
            placeholder={listTab === 'blocked' ? 'Block domain (e.g. twitter.com)...' : 'Allow domain (e.g. music.youtube.com)...'}
            placeholderTextColor={colors.mutedText}
            value={siteInput}
            onChangeText={setSiteInput}
            onSubmitEditing={handleAddSite}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handleAddSite}
            activeOpacity={0.8}
          >
            <Plus size={18} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {sites.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>
            {listTab === 'blocked' ? 'No blocked sites yet.' : 'No allowed overrides. Allowed always wins over blocked.'}
          </Text>
        ) : (
          <View style={styles.list}>
            {sites.map((site) => (
              <View
                key={site}
                style={[styles.listRow, styles.listRowWithIcon, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <SiteIcon domain={site} colors={colors} />
                <Text style={[styles.listText, { color: colors.text }]} numberOfLines={1}>
                  {site}
                </Text>
                <TouchableOpacity
                  onPress={() => (listTab === 'blocked' ? removeBlockedSite(site) : removeAllowedSite(site))}
                  hitSlop={8}
                >
                  <X size={16} color={colors.mutedText} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.toggleRow, styles.urlToggleRow, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={() => setUrlBlocking(!shield.urlBlocking)}
          activeOpacity={0.7}
        >
          <View style={styles.toggleText}>
            <Globe size={18} color={shield.urlBlocking ? colors.text : colors.mutedText} />
            <View style={styles.toggleCopy}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Block sites in browsers</Text>
              <Text style={[styles.toggleSubtitle, { color: colors.mutedText }]}>
                Uses accessibility access to catch blocked domains in browser address bars.
              </Text>
            </View>
          </View>
          <View style={[styles.switch, { backgroundColor: shield.urlBlocking ? '#ffffff' : '#3f3f46' }]}>
            <View style={[styles.thumb, { marginLeft: shield.urlBlocking ? 21 : 3 }]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Smartphone size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Apps</Text>
        </View>
        <Text style={[styles.noteText, { color: colors.mutedText }]}>
          Enforced by the on-device blocking service in dev builds; stored only while running in Expo Go.
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.muted, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="App package (e.g. com.instagram.android)..."
            placeholderTextColor={colors.mutedText}
            value={appInput}
            onChangeText={setAppInput}
            onSubmitEditing={handleAddApp}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handleAddApp}
            activeOpacity={0.8}
          >
            <Plus size={18} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {shield.blockedApps.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>No blocked apps yet.</Text>
        ) : (
          <View style={styles.list}>
            {shield.blockedApps.map((app) => (
              <BlockedAppRow
                key={app}
                packageName={app}
                label={installedLabels[app] ?? app}
                colors={colors}
                onRemove={() => removeBlockedApp(app)}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.browseBtn,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              opacity: nativeStatus?.supported ? 1 : 0.5,
            },
          ]}
          onPress={openAppPicker}
          disabled={!nativeStatus?.supported}
          activeOpacity={0.7}
        >
          <Search size={16} color={colors.text} />
          <Text style={[styles.browseBtnText, { color: colors.text }]}>Browse installed apps</Text>
        </TouchableOpacity>
        {!nativeStatus?.supported ? (
          <Text style={[styles.subNoteText, { color: colors.mutedText }]}>
            Needs the dev build to read the installed app list.
          </Text>
        ) : null}
      </View>

      {Platform.OS === 'android' ? (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Lock size={18} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Device blocking</Text>
          </View>
          <Text style={[styles.noteText, { color: colors.mutedText }]}>
            {nativeStatus?.expoGo
              ? 'Expo Go cannot run the blocking service. Cloud-build the dev client to enable it.'
              : setupDoneCount === 4
                ? 'Setup complete. The service enforces while a Flow session is active.'
                : `Setup ${setupDoneCount}/4. Grant every item below before your first blocked session.`}
          </Text>

          <View style={styles.statusList}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Build</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {nativeStatus?.expoGo ? 'Expo Go (JS only)' : 'Dev / production build'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Native module</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: nativeStatus?.supported ? '#22c55e' : colors.mutedText },
                ]}
              >
                {nativeStatus?.supported ? 'Available' : 'Missing'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Usage access</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: nativeStatus?.hasUsageAccess ? '#22c55e' : colors.mutedText },
                ]}
              >
                {nativeStatus?.hasUsageAccess ? 'Granted' : 'Not granted'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Overlay permission</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: nativeStatus?.canDrawOverlays ? '#22c55e' : colors.mutedText },
                ]}
              >
                {nativeStatus?.canDrawOverlays ? 'Granted' : 'Not granted'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Service</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: nativeStatus?.serviceRunning ? '#22c55e' : colors.mutedText },
                ]}
              >
                {nativeStatus?.serviceRunning ? 'Running' : 'Stopped'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Battery limits</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: nativeStatus?.ignoringBatteryOptimizations ? '#22c55e' : colors.mutedText },
                ]}
              >
                {nativeStatus?.ignoringBatteryOptimizations ? 'Unrestricted' : 'Restricted'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Accessibility</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: nativeStatus?.accessibilityEnabled ? '#22c55e' : colors.mutedText },
                ]}
              >
                {nativeStatus?.accessibilityEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.mutedText }]}>Notifications</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: nativeStatus?.notificationsEnabled ? '#22c55e' : colors.mutedText },
                ]}
              >
                {nativeStatus?.notificationsEnabled ? 'On' : 'Off'}
              </Text>
            </View>
          </View>

          <View style={styles.permRow}>
            <TouchableOpacity
              style={[styles.permBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => void openUsageAccessSettings().finally(refreshNativeStatus)}
              activeOpacity={0.7}
            >
              <Text style={[styles.permBtnText, { color: colors.text }]}>Usage access</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => void openOverlaySettings().finally(refreshNativeStatus)}
              activeOpacity={0.7}
            >
              <Text style={[styles.permBtnText, { color: colors.text }]}>Overlay permission</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => void openBatteryOptimizationSettings().finally(refreshNativeStatus)}
              activeOpacity={0.7}
            >
              <Text style={[styles.permBtnText, { color: colors.text }]}>Battery: no limits</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => void openAccessibilitySettings().finally(refreshNativeStatus)}
              activeOpacity={0.7}
            >
              <Text style={[styles.permBtnText, { color: colors.text }]}>Accessibility</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => void openAppDetailsSettings().finally(refreshNativeStatus)}
              activeOpacity={0.7}
            >
              <Text style={[styles.permBtnText, { color: colors.text }]}>App settings</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.subNoteText, { color: colors.mutedText }]}>
            On Xiaomi/MIUI also enable Autostart for Focus in system settings, or the service is killed in
            background. If the accessibility toggle is greyed out (Restricted setting), open App info
            for Focus, tap the menu, allow restricted settings, then come back here.
          </Text>
        </View>
      ) : null}

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Info size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Limits in Expo Go</Text>
        </View>
        <Text style={[styles.noteText, { color: colors.mutedText }]}>
          In-app links are always guarded. Other apps are blocked by the service above (dev build +
          grants required). Browser address bars are covered when Block sites in browsers is on and
          accessibility access is granted.
        </Text>
      </View>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Installed apps</Text>
            <TouchableOpacity
              style={[styles.pickerDoneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setPickerOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pickerDoneText, { color: colors.primaryText }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.pickerSearchRow,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <Search size={16} color={colors.mutedText} />
            <TextInput
              style={[styles.pickerSearchInput, { color: colors.text }]}
              placeholder="Search apps..."
              placeholderTextColor={colors.mutedText}
              value={appSearch}
              onChangeText={setAppSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <ScrollView contentContainerStyle={styles.pickerList}>
            {filteredApps.map((app) => {
              const blocked = shield.blockedApps.includes(app.packageName);
              return (
                <InstalledAppRow
                  key={app.packageName}
                  app={app}
                  blocked={blocked}
                  colors={colors}
                  onToggle={() =>
                    blocked ? removeBlockedApp(app.packageName) : addBlockedApp(app.packageName)
                  }
                />
              );
            })}
            {filteredApps.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>No apps found.</Text>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  urlToggleRow: {
    marginTop: 12,
  },
  toggleText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#09090b',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addBtn: {
    width: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  listRowWithIcon: {
    justifyContent: 'flex-start',
    gap: 10,
  },
  siteIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  siteIconFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  statusList: {
    gap: 8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 12,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  permRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permBtn: {
    flexGrow: 1,
    flexBasis: '45%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  permBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subNoteText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  browseBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  appIconFallback: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconFallbackText: {
    fontSize: 16,
    fontWeight: '700',
  },
  appRowText: {
    flex: 1,
  },
  appRowLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  appRowPkg: {
    fontSize: 11,
    marginTop: 2,
  },
  appCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 56,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  pickerDoneBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pickerDoneText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  pickerList: {
    paddingBottom: 40,
  },
});
