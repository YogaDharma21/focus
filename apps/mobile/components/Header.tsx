import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAppStore } from '@/lib/store';
import { playCompletionSound } from '@/lib/sound';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  ChevronDown,
  Check,
  ListTodo,
  X,
} from 'lucide-react-native';

interface HeaderProps {
  onOpenBackgrounds?: () => void;
  onOpenInfo?: () => void;
}

const DISTRACTION_CATEGORIES = [
  'Social Media',
  'Notification',
  'Thought',
  'Break',
  'Other',
];

export function Header({ onOpenBackgrounds, onOpenInfo }: HeaderProps = {}) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { setDeepFocusMode } = useAppStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [distractionModalOpen, setDistractionModalOpen] = useState(false);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);

  const {
    currentView,
    timeLeft,
    setTimeLeft,
    isActive,
    setIsActive,
    setTimerState,
    selectedTodoId,
    setSelectedTodoId,
    sessionName,
    setSessionName,
    todos,
    addSession,
    addDistraction,
    autoStartBreak,
  } = useAppStore();

  const isTimerScreen =
    !pathname || pathname === '/' || pathname.endsWith('index') || currentView === 'FOCUS';



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (nextActive) {
      setDeepFocusMode(true);
    }
  };

  const handleCompleteSession = () => {
    playCompletionSound();
    setIsActive(false);

    const flowDuration = timeLeft;
    if (flowDuration > 0) {
      addSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        duration: flowDuration,
        mode: 'STOPWATCH',
      });
    }
    const breakSeconds = Math.floor(flowDuration / 5);
    if (breakSeconds > 0) {
      setTimeLeft(breakSeconds);
      setTimerState('BREAK');
      setIsActive(autoStartBreak ?? true);
    } else {
      setTimeLeft(0);
      setTimerState('FLOW');
    }
    setDeepFocusMode(false);
  };

  const renderModeIcon = (size: number, color: string) => {
    return <Clock size={size} color={color} />;
  };

  return (
    <View style={styles.headerWrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.text }]}>Focus</Text>
        </View>

        {/* Center Pill - Only shown on non-timer tabs */}
        {!isTimerScreen && (
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.8}
          >
            {renderModeIcon(14, colors.text)}
            <Text style={[styles.pillTime, { color: colors.text }]}>
              {formatTime(timeLeft)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded Floating Control Card Popover */}
      {!isTimerScreen && isExpanded && (
        <View
          style={[
            styles.controlCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              top: Math.max(insets.top + 8, 16) + 46,
            },
          ]}
        >
          {/* Card Top Row: Time + Task Selector */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitleRow}>
              {renderModeIcon(18, colors.text)}
              <Text style={[styles.cardTime, { color: colors.text }]}>
                {formatTime(timeLeft)}
              </Text>
              {isActive && <View style={[styles.activeDot, { backgroundColor: colors.text }]} />}
            </View>
            <TouchableOpacity
              style={[styles.taskSelectorBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => setTaskPickerOpen(true)}
              activeOpacity={0.8}
              accessibilityLabel="Select or switch focus task"
            >
              {!selectedTodoId && !sessionName && <ListTodo size={14} color={colors.mutedText} />}
              <Text style={[styles.taskSelectorText, { color: colors.text }]} numberOfLines={1}>
                {todos.find((todo) => todo.id === selectedTodoId)?.text || sessionName || 'Select task'}
              </Text>
              <ChevronDown size={14} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={[
                styles.actionPillBtn,
                { backgroundColor: colors.muted, borderColor: colors.border, opacity: !isActive ? 0.5 : 1 },
              ]}
              onPress={handleCompleteSession}
              disabled={!isActive}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={14} color={isActive ? colors.text : colors.mutedText} />
              <Text style={[styles.actionBtnText, { color: isActive ? colors.text : colors.mutedText }]}>
                Complete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.distractionBtn,
                { backgroundColor: colors.muted, borderColor: colors.border, opacity: !isActive ? 0.5 : 1 },
              ]}
              onPress={() => setDistractionModalOpen(true)}
              disabled={!isActive}
              activeOpacity={0.8}
            >
              <AlertTriangle size={16} color={colors.mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionPillBtn, { backgroundColor: colors.text }]}
              onPress={toggleTimer}
              activeOpacity={0.8}
            >
              {isActive ? (
                <>
                  <Pause size={16} color={colors.background} />
                  <Text style={[styles.startBtnText, { color: colors.background }]}>
                    Pause
                  </Text>
                </>
              ) : (
                <>
                  <Play size={16} color={colors.background} fill={colors.background} style={{ marginLeft: 2 }} />
                  <Text style={[styles.startBtnText, { color: colors.background }]}>
                    Start
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Floating Task Picker */}
      <Modal
        visible={taskPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTaskPickerOpen(false)}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setTaskPickerOpen(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={styles.taskPickerHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select task</Text>
              <TouchableOpacity onPress={() => setTaskPickerOpen(false)} style={styles.closeBtn}>
                <X size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.taskOption, { backgroundColor: !selectedTodoId && !sessionName ? colors.border : colors.muted, borderColor: colors.border }]}
              onPress={() => {
                setSelectedTodoId(null);
                setSessionName('');
                setTaskPickerOpen(false);
              }}
            >
              <View style={styles.taskOptionLeft}>
                <Plus size={16} color={colors.text} />
                <Text style={[styles.taskOptionText, { color: colors.text }]}>Custom focus</Text>
              </View>
              {!selectedTodoId && !sessionName && <Check size={16} color={colors.text} />}
            </TouchableOpacity>

            {todos.filter((todo) => !todo.completed).map((todo) => {
              const isSelected = selectedTodoId === todo.id;
              return (
                <TouchableOpacity
                  key={todo.id}
                  style={[styles.taskOption, { backgroundColor: isSelected ? colors.border : colors.muted, borderColor: colors.border }]}
                  onPress={() => {
                    setSelectedTodoId(todo.id);
                    setSessionName(todo.text);
                    setTaskPickerOpen(false);
                  }}
                >
                  <View style={styles.taskOptionLeft}>
                    <ListTodo size={16} color={colors.text} />
                    <Text style={[styles.taskOptionText, { color: colors.text }]} numberOfLines={1}>{todo.text}</Text>
                  </View>
                  {isSelected && <Check size={16} color={colors.text} />}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Distraction Logger Modal */}
      <Modal
        visible={distractionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDistractionModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDistractionModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Log Distraction
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedText }]}>
              What got you off track? Stay conscious of interruption patterns.
            </Text>
            <View style={{ gap: 8, marginVertical: 12 }}>
              {DISTRACTION_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.distractionItem,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                  onPress={() => {
                    addDistraction(cat);
                    setDistractionModalOpen(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '500' }}>
                    {cat}
                  </Text>
                  <Plus size={16} color={colors.mutedText} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.border }]}
              onPress={() => setDistractionModalOpen(false)}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    zIndex: 100,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillTime: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    zIndex: 1000,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardTime: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  taskSelectorBtn: {
    maxWidth: 190,
    minWidth: 118,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  taskSelectorText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  distractionBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  distractionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  closeModalBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  taskPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  taskOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  taskOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  taskOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});

