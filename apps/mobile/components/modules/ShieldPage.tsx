import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { normalizeSite } from '@/lib/shield';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Globe,
  Smartphone,
  CheckCircle2,
} from 'lucide-react-native';

type ListTab = 'blocked' | 'allowed' | 'apps';

export function ShieldPage() {
  const { colors } = useTheme();
  const {
    shield,
    setShieldEnabled,
    addBlockedSite,
    removeBlockedSite,
    addAllowedSite,
    removeAllowedSite,
    addBlockedApp,
    removeBlockedApp,
    isActive,
    timerState,
  } = useAppStore();

  const [listTab, setListTab] = useState<ListTab>('blocked');
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);

  const activeShield = shield ?? {
    enabled: true,
    blockedSites: [],
    allowedSites: [],
    blockedApps: [],
  };

  const blockingNow = activeShield.enabled && isActive && timerState === 'FLOW';

  const placeholder =
    listTab === 'blocked'
      ? 'Block domain (e.g. twitter.com)...'
      : listTab === 'allowed'
        ? 'Allow domain (e.g. music.youtube.com)...'
        : 'Block app (e.g. Instagram or com.example.app)...';

  const submitLabel = listTab === 'allowed' ? 'Allow' : 'Block';

  const handleSubmit = () => {
    if (!input.trim()) return;
    if (listTab === 'blocked') {
      const clean = normalizeSite(input);
      if (clean) addBlockedSite(clean);
    } else if (listTab === 'allowed') {
      const clean = normalizeSite(input);
      if (clean) addAllowedSite(clean);
    } else {
      const clean = input.trim().toLowerCase();
      if (clean) addBlockedApp(clean);
    }
    setInput('');
  };

  const renderSiteRow = (site: string, onRemove: (site: string) => void) => (
    <View
      key={site}
      style={[styles.row, { backgroundColor: colors.muted, borderColor: colors.border }]}
    >
      <View style={styles.rowLeft}>
        <Globe size={14} color={colors.mutedText} />
        <Text style={[styles.rowText, { color: colors.text }]} numberOfLines={1}>
          {site}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onRemove(site)} style={styles.deleteBtn} activeOpacity={0.7}>
        <Trash2 size={14} color={colors.mutedText} />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Shield size={24} color={colors.text} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shield</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            {activeShield.enabled ? (
              <ShieldCheck size={20} color={colors.text} />
            ) : (
              <ShieldAlert size={20} color={colors.mutedText} />
            )}
            <View>
              <Text style={[styles.statusTitle, { color: colors.text }]}>Site Blocker Shield</Text>
              <Text style={[styles.statusSub, { color: colors.mutedText }]}>
                {!activeShield.enabled
                  ? 'Shield currently OFF'
                  : blockingNow
                    ? 'Active during this Flow session'
                    : 'Paused (activates during Flow sessions)'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.enableBtn,
              {
                backgroundColor: activeShield.enabled ? colors.primary : colors.muted,
                borderColor: activeShield.enabled ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setShieldEnabled(!activeShield.enabled)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.enableBtnText,
                { color: activeShield.enabled ? colors.primaryText : colors.text },
              ]}
            >
              {activeShield.enabled ? 'ENABLED' : 'ENABLE'}
            </Text>
          </TouchableOpacity>
        </View>

        {blockingNow && (
          <View
            style={[
              styles.activeBanner,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <CheckCircle2 size={14} color={colors.text} />
            <Text style={[styles.activeBannerText, { color: colors.text }]}>
              Shield is blocking {activeShield.blockedSites.length} site
              {activeShield.blockedSites.length === 1 ? '' : 's'}
              {activeShield.blockedApps.length > 0
                ? ` and watching ${activeShield.blockedApps.length} app${activeShield.blockedApps.length === 1 ? '' : 's'}`
                : ''}
              {' '}right now.
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                borderColor: focused ? colors.text : colors.border,
                color: colors.text,
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedText}
            value={input}
            onChangeText={setInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={[styles.addBtnText, { color: colors.primaryText }]}>{submitLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              listTab === 'blocked' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setListTab('blocked')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: listTab === 'blocked' ? colors.primaryText : colors.mutedText },
              ]}
            >
              Blocked ({activeShield.blockedSites.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              listTab === 'allowed' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setListTab('allowed')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: listTab === 'allowed' ? colors.primaryText : colors.mutedText },
              ]}
            >
              Allowed ({activeShield.allowedSites.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, listTab === 'apps' && { backgroundColor: colors.primary }]}
            onPress={() => setListTab('apps')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: listTab === 'apps' ? colors.primaryText : colors.mutedText },
              ]}
            >
              Apps ({activeShield.blockedApps.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {listTab === 'blocked' &&
            (activeShield.blockedSites.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                No blocked domains yet. Add distracting sites above.
              </Text>
            ) : (
              activeShield.blockedSites.map((site) => renderSiteRow(site, removeBlockedSite))
            ))}

          {listTab === 'allowed' &&
            (activeShield.allowedSites.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                No allowed domains yet. Allowed domains always bypass the Shield.
              </Text>
            ) : (
              activeShield.allowedSites.map((site) => renderSiteRow(site, removeAllowedSite))
            ))}

          {listTab === 'apps' && (
            <>
              <Text style={[styles.hintText, { color: colors.mutedText }]}>
                Mobile OS sandboxes prevent true cross-app blocking from JavaScript. Listed apps
                are guarded inside Focus, reminded during Deep Focus, and logged as distractions
                when you report opening one. Full enforcement needs a native Screen Time (iOS) /
                Usage Access (Android) module in a development build.
              </Text>
              {activeShield.blockedApps.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                  No blocked apps yet.
                </Text>
              ) : (
                activeShield.blockedApps.map((app) => (
                  <View
                    key={app}
                    style={[styles.row, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  >
                    <View style={styles.rowLeft}>
                      <Smartphone size={14} color={colors.mutedText} />
                      <Text style={[styles.rowText, { color: colors.text }]} numberOfLines={1}>
                        {app}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeBlockedApp(app)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color={colors.mutedText} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </View>
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
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusSub: {
    fontSize: 11,
    marginTop: 2,
  },
  enableBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  enableBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  activeBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
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
    fontSize: 13,
  },
  addBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rowText: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
});
