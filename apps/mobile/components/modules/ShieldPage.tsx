import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { isBlockingRequired } from '@/lib/shield';
import { Shield, ShieldCheck, ShieldAlert, Plus, X, Globe, Smartphone, Info } from 'lucide-react-native';

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
    soundEnabled,
    musicEnabled,
  } = useAppStore();

  const [listTab, setListTab] = useState<'blocked' | 'allowed'>('blocked');
  const [siteInput, setSiteInput] = useState('');
  const [appInput, setAppInput] = useState('');

  const enforcing = isBlockingRequired(shield.enabled, isActive, timerState);
  const miniPlayerVisible = soundEnabled && musicEnabled;

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
                style={[styles.listRow, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Text style={[styles.listText, { color: colors.text }]}>{site}</Text>
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
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Smartphone size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Apps</Text>
        </View>
        <Text style={[styles.noteText, { color: colors.mutedText }]}>
          Stored only in Expo Go. Real app blocking needs an Android dev build (Phase 1).
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
              <View
                key={app}
                style={[styles.listRow, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Text style={[styles.listText, { color: colors.text }]}>{app}</Text>
                <TouchableOpacity onPress={() => removeBlockedApp(app)} hitSlop={8}>
                  <X size={16} color={colors.mutedText} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Info size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Limits in Expo Go</Text>
        </View>
        <Text style={[styles.noteText, { color: colors.mutedText }]}>
          Shield guards links opened inside Focus and nudges you when you leave during Flow. It cannot block Chrome
          or other apps from Expo Go - that needs native permissions and a cloud-built dev client.
        </Text>
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
});
