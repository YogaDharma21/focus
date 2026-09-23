import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useAppStore } from '@/lib/store';
import { useShieldGateStore } from '@/lib/shieldGuard';
import { useTheme } from '@/context/ThemeContext';
import { Radius } from '@/constants/theme';
import { ShieldAlert, Pause, Timer } from 'lucide-react-native';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ShieldBlockedModal() {
  const { colors } = useTheme();
  const { blockedTarget, clearBlocked } = useShieldGateStore();
  const { timeLeft, setIsActive, setShieldEnabled } = useAppStore();

  const visible = blockedTarget !== null;

  const handlePauseTimer = () => {
    setIsActive(false);
    clearBlocked();
  };

  const handleDisableShield = () => {
    setShieldEnabled(false);
    clearBlocked();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={clearBlocked}>
      <View style={styles.backdrop}>
        <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <ShieldAlert size={28} color={colors.primaryText} />
          </View>

          <Text style={[styles.eyebrow, { color: colors.mutedText }]}>Focus Shield Blocked</Text>
          <Text style={[styles.domain, { color: colors.text }]} numberOfLines={2}>
            {blockedTarget?.display ?? 'Blocked'}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedText }]}>
            {blockedTarget?.kind === 'app'
              ? 'This app is on your Shield block list during your active Focus session.'
              : 'This domain is blocked during your active Focus session.'}
          </Text>

          <View style={[styles.timerCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Timer size={20} color={colors.text} />
            <View>
              <Text style={[styles.timerLabel, { color: colors.mutedText }]}>Session Time</Text>
              <Text style={[styles.timerValue, { color: colors.text }]}>{formatTime(timeLeft)}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handlePauseTimer}
              activeOpacity={0.8}
            >
              <Pause size={14} color={colors.primaryText} />
              <Text style={[styles.primaryBtnText, { color: colors.primaryText }]}>Pause Timer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={handleDisableShield}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Disable Shield</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={clearBlocked} activeOpacity={0.7}>
              <Text style={[styles.ghostBtnText, { color: colors.mutedText }]}>Keep Focusing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  domain: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  timerCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.base,
    borderWidth: 1,
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    width: '100%',
    gap: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.base,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 13,
    borderRadius: Radius.base,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ghostBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
