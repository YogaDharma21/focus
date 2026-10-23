import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { getInstalledApps, type InstalledShieldApp } from '@/modules/shield';
import { getApplicationIconAsync } from 'expo-intent-launcher';
import { Shield, ShieldCheck, ShieldAlert, Plus, X, Globe, Smartphone, Lock, Check, Search } from 'lucide-react-native';

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
    if (appIconCache.has(packageName)) return;
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
    return (
      <Image
        source={{ uri: iconUri }}
        style={{ width: size, height: size, borderRadius: 10 }}
        resizeMode="cover"
      />
    );
  }

  const initial = (label || packageName || '?').trim().charAt(0).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: colors.muted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: size * 0.45 }}>{initial}</Text>
    </View>
  );
}

function SiteIcon({ domain, colors }: { domain: string; colors: ThemeColors }) {
  const [failed, setFailed] = useState(false);
  const cleanDomain = domain.replace(/^https?:\/\//i, '').split('/')[0].trim();
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`;

  if (failed) {
    const initial = cleanDomain.charAt(0).toUpperCase() || 'W';
    return (
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: faviconUrl }}
      style={{ width: 32, height: 32, borderRadius: 8 }}
      onError={() => setFailed(true)}
      resizeMode="cover"
    />
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
    <View
      style={[
        styles.listRow,
        styles.listRowWithIcon,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <ShieldAppIcon packageName={packageName} label={label} colors={colors} size={36} />
      <View style={styles.appRowMeta}>
        <Text style={[styles.listText, { color: colors.text }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.appPkgText, { color: colors.mutedText }]} numberOfLines={1}>
          {packageName}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={8}>
        <X size={16} color={colors.mutedText} />
      </TouchableOpacity>
    </View>
  );
}

function InstalledAppRow({
  app,
  blocked,
  colors,
  onToggle,
}: {
  app: InstalledShieldApp;
  blocked: boolean;
  colors: ThemeColors;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.pickerAppRow,
        { backgroundColor: colors.muted, borderColor: blocked ? colors.primary : colors.border },
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <ShieldAppIcon packageName={app.packageName} label={app.label} colors={colors} size={36} />
      <View style={styles.appRowMeta}>
        <Text style={[styles.pickerAppName, { color: colors.text }]} numberOfLines={1}>
          {app.label}
        </Text>
        <Text style={[styles.pickerAppPkg, { color: colors.mutedText }]} numberOfLines={1}>
          {app.packageName}
        </Text>
      </View>
      <View
        style={[
          styles.pickerCheck,
          {
            backgroundColor: blocked ? colors.primary : 'transparent',
            borderColor: blocked ? colors.primary : colors.border,
          },
        ]}
      >
        {blocked ? <Check size={14} color={colors.primaryText} strokeWidth={3} /> : null}
      </View>
    </TouchableOpacity>
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
  const [nativeStatus, setNativeStatus] = useState<NativeShieldStatus | null>(() =>
    getNativeShieldStatus(),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledShieldApp[]>([]);
  const [appSearch, setAppSearch] = useState('');
  const [installedLabels, setInstalledLabels] = useState<Record<string, string>>(() => {
    if (Platform.OS !== 'android') return {};
    try {
      const labels: Record<string, string> = {};
      for (const app of getInstalledApps()) labels[app.packageName] = app.label;
      return labels;
    } catch {
      // Installed list unavailable (e.g. Expo Go): fall back to package names.
      return {};
    }
  });

  const enforcing = isBlockingRequired(shield.enabled, isActive, timerState);
  const setupDoneCount = [
    nativeStatus?.hasUsageAccess,
    nativeStatus?.canDrawOverlays,
    nativeStatus?.ignoringBatteryOptimizations,
    nativeStatus?.accessibilityEnabled,
  ].filter(Boolean).length;

  const refreshNativeStatus = useCallback(() => setNativeStatus(getNativeShieldStatus()), []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refreshNativeStatus();
    });
    return () => sub.remove();
  }, [refreshNativeStatus]);

  const handleAddSite = () => {
    const value = siteInput.trim();
    if (!value) return;
    if (listTab === 'blocked') addBlockedSite(value);
    else addAllowedSite(value);
    setSiteInput('');
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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── STATUS CARD (matching reference squircle card style) ── */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statusCardHeader}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusIconCircle,
                { backgroundColor: enforcing ? '#22c55e20' : colors.muted },
              ]}
            >
              {shield.enabled ? (
                <ShieldCheck size={22} color={enforcing ? '#22c55e' : colors.text} />
              ) : (
                <ShieldAlert size={22} color={colors.mutedText} />
              )}
            </View>
            <View>
              <Text style={[styles.statusHeroTitle, { color: colors.text }]}>
                {shield.enabled ? (enforcing ? 'Shield Enforcing' : 'Shield Armed') : 'Shield Inactive'}
              </Text>
              <Text style={[styles.statusHeroSub, { color: colors.mutedText }]}>
                {enforcing
                  ? 'Zero distractions allowed right now'
                  : 'Activates during active Flow sessions'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.switchTrack,
              { backgroundColor: shield.enabled ? '#ffffff' : colors.muted },
            ]}
            onPress={() => setShieldEnabled(!shield.enabled)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.switchThumb,
                {
                  backgroundColor: shield.enabled ? '#0a0b0e' : colors.mutedText,
                  transform: [{ translateX: shield.enabled ? 18 : 2 }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── WEBSITES SECTION ── */}
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
                borderColor: listTab === 'blocked' ? colors.text : colors.border,
              },
            ]}
            onPress={() => setListTab('blocked')}
          >
            <Text
              style={[
                styles.tabText,
                { color: listTab === 'blocked' ? colors.text : colors.mutedText },
              ]}
            >
              Blocked ({shield.blockedSites.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                backgroundColor: listTab === 'allowed' ? colors.muted : 'transparent',
                borderColor: listTab === 'allowed' ? colors.text : colors.border,
              },
            ]}
            onPress={() => setListTab('allowed')}
          >
            <Text
              style={[
                styles.tabText,
                { color: listTab === 'allowed' ? colors.text : colors.mutedText },
              ]}
            >
              Allowed ({shield.allowedSites.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.muted, borderColor: colors.border, color: colors.text },
            ]}
            placeholder={listTab === 'blocked' ? 'Block domain (twitter.com)...' : 'Allow domain...'}
            placeholderTextColor={colors.mutedText}
            value={siteInput}
            onChangeText={setSiteInput}
            onSubmitEditing={handleAddSite}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.text }]}
            onPress={handleAddSite}
            activeOpacity={0.8}
          >
            <Plus size={18} color={colors.background} />
          </TouchableOpacity>
        </View>

        {sites.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedText }]}>
            {listTab === 'blocked' ? 'No blocked sites yet.' : 'No allowed overrides.'}
          </Text>
        ) : (
          <View style={styles.list}>
            {sites.map((site) => (
              <View
                key={site}
                style={[
                  styles.listRow,
                  styles.listRowWithIcon,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
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
                Catches blocked domains in browser address bars.
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.switchTrack,
              { backgroundColor: shield.urlBlocking ? '#ffffff' : colors.card },
            ]}
          >
            <View
              style={[
                styles.switchThumb,
                {
                  backgroundColor: shield.urlBlocking ? '#0a0b0e' : colors.mutedText,
                  transform: [{ translateX: shield.urlBlocking ? 18 : 2 }],
                },
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── APPS SECTION ── */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Smartphone size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Apps</Text>
        </View>
        <Text style={[styles.noteText, { color: colors.mutedText }]}>
          These apps are blocked while a Flow session is active.
        </Text>

        <TouchableOpacity
          style={[
            styles.browseBtn,
            styles.browseBtnTop,
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
              <Text style={[styles.permBtnText, { color: colors.text }]}>Overlay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => void openBatteryOptimizationSettings().finally(refreshNativeStatus)}
              activeOpacity={0.7}
            >
              <Text style={[styles.permBtnText, { color: colors.text }]}>Battery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => void openAccessibilitySettings().finally(refreshNativeStatus)}
              activeOpacity={0.7}
            >
              <Text style={[styles.permBtnText, { color: colors.text }]}>Accessibility</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
          <View style={styles.pickerHeader}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Installed apps</Text>
            <TouchableOpacity
              style={[styles.pickerDoneBtn, { backgroundColor: colors.text }]}
              onPress={() => setPickerOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pickerDoneText, { color: colors.background }]}>Done</Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 160,
    gap: 14,
  },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  statusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusHeroTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusHeroSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  urlToggleRow: {
    marginTop: 4,
  },
  toggleText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
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
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
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
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  listRowWithIcon: {
    gap: 12,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  appRowMeta: {
    flex: 1,
    gap: 2,
  },
  appPkgText: {
    fontSize: 11,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  browseBtnTop: {
    marginTop: 4,
  },
  browseBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subNoteText: {
    fontSize: 11,
    lineHeight: 16,
  },
  statusList: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 13,
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  permRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  permBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  permBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickerContainer: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  pickerDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pickerDoneText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  pickerList: {
    gap: 8,
    paddingBottom: 40,
  },
  pickerAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  pickerAppName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerAppPkg: {
    fontSize: 11,
  },
  pickerCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
