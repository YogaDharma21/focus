import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Calendar, Clock, X, Check, Trash2 } from 'lucide-react-native';
import RNDateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: string; // e.g. "YYYY-MM-DD HH:mm" or "YYYY-MM-DD" or ""
  onChange: (newValue: string) => void;
  initialMode?: 'date' | 'time';
}

// Helper to format YYYY-MM-DD string cleanly
const formatDateISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format HH:mm string cleanly
const formatTimeISO = (d: Date): string => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Friendly display helper
export const formatDeadlineDisplay = (deadline: string): { dateStr: string; timeStr: string } => {
  if (!deadline || !deadline.trim()) {
    return { dateStr: 'No date set', timeStr: 'No time set' };
  }
  const parts = deadline.trim().split(' ');
  const rawDate = parts[0];
  const rawTime = parts[1];

  let dateStr = rawDate || 'No date set';
  if (rawDate && rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = rawDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateStr = dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  let timeStr = 'No time set';
  if (rawTime) {
    const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      timeStr = `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    } else {
      timeStr = rawTime;
    }
  }

  return { dateStr, timeStr };
};

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  value,
  onChange,
  initialMode = 'date',
}) => {
  const [activeTab, setActiveTab] = useState<'date' | 'time'>(initialMode);
  
  // Extract initial date and time
  const parts = (value || '').trim().split(' ');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(parts[0] || formatDateISO(new Date()));
  const [selectedTimeStr, setSelectedTimeStr] = useState<string>(parts[1] || '18:00');

  // Native datetimepicker state
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [nativePickerMode, setNativePickerMode] = useState<'date' | 'time'>('date');

  useEffect(() => {
    if (visible) {
      setActiveTab(initialMode);
      const currentParts = (value || '').trim().split(' ');
      setSelectedDateStr(currentParts[0] || formatDateISO(new Date()));
      setSelectedTimeStr(currentParts[1] || '18:00');
    }
  }, [visible, value, initialMode]);

  // Construct current JS Date object for picker component
  const getCurrentDateObj = (): Date => {
    let dateObj = new Date();
    if (selectedDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      dateObj.setFullYear(y, m - 1, d);
    }
    if (selectedTimeStr.match(/^\d{1,2}:\d{2}$/)) {
      const [h, min] = selectedTimeStr.split(':').map(Number);
      dateObj.setHours(h, min, 0, 0);
    }
    return dateObj;
  };

  const handleApply = () => {
    if (!selectedDateStr) {
      onChange('');
    } else {
      const finalVal = selectedTimeStr ? `${selectedDateStr} ${selectedTimeStr}` : selectedDateStr;
      onChange(finalVal);
    }
    onClose();
  };

  const handleClear = () => {
    onChange('');
    onClose();
  };

  // Date Quick Presets
  const setPresetToday = () => {
    setSelectedDateStr(formatDateISO(new Date()));
  };

  const setPresetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDateStr(formatDateISO(tomorrow));
  };

  const setPresetNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setSelectedDateStr(formatDateISO(nextWeek));
  };

  // Time Quick Presets
  const timePresets = [
    { label: 'Morning', time: '09:00', icon: '🌅' },
    { label: 'Afternoon', time: '13:00', icon: '☀️' },
    { label: 'Evening', time: '18:00', icon: '🌆' },
    { label: 'Night', time: '21:00', icon: '🌙' },
    { label: 'End of Day', time: '23:59', icon: '⏰' },
  ];

  const handleNativeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowNativePicker(false);
    }
    if (date) {
      if (nativePickerMode === 'date') {
        setSelectedDateStr(formatDateISO(date));
      } else {
        setSelectedTimeStr(formatTimeISO(date));
      }
    }
  };

  const openNativePicker = (mode: 'date' | 'time') => {
    setNativePickerMode(mode);
    setShowNativePicker(true);
  };

  const formattedDisplay = formatDeadlineDisplay(
    selectedDateStr ? `${selectedDateStr} ${selectedTimeStr}` : ''
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Calendar size={18} color="#8b5cf6" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Set Deadline</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Current Selection Display Badge */}
          <View style={styles.previewContainer}>
            <View style={styles.previewBadge}>
              <Calendar size={14} color="#a78bfa" style={{ marginRight: 6 }} />
              <Text style={styles.previewText}>{formattedDisplay.dateStr}</Text>
            </View>
            <View style={styles.previewBadge}>
              <Clock size={14} color="#38bdf8" style={{ marginRight: 6 }} />
              <Text style={styles.previewText}>{formattedDisplay.timeStr}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'date' && styles.activeTabItem]}
              onPress={() => setActiveTab('date')}
            >
              <Calendar size={14} color={activeTab === 'date' ? '#ffffff' : '#71717a'} />
              <Text style={[styles.tabText, activeTab === 'date' && styles.activeTabText]}>
                Date
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'time' && styles.activeTabItem]}
              onPress={() => setActiveTab('time')}
            >
              <Clock size={14} color={activeTab === 'time' ? '#ffffff' : '#71717a'} />
              <Text style={[styles.tabText, activeTab === 'time' && styles.activeTabText]}>
                Time
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentBody} keyboardShouldPersistTaps="handled">
            {activeTab === 'date' ? (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>QUICK DATE PRESETS</Text>
                <View style={styles.presetRow}>
                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      selectedDateStr === formatDateISO(new Date()) && styles.activePresetChip,
                    ]}
                    onPress={setPresetToday}
                  >
                    <Text style={styles.presetChipText}>Today</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.presetChip,
                      selectedDateStr ===
                        formatDateISO(new Date(Date.now() + 86400000)) &&
                        styles.activePresetChip,
                    ]}
                    onPress={setPresetTomorrow}
                  >
                    <Text style={styles.presetChipText}>Tomorrow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.presetChip]}
                    onPress={setPresetNextWeek}
                  >
                    <Text style={styles.presetChipText}>Next Week</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>CUSTOM DATE</Text>

                {Platform.OS === 'web' ? (
                  <View style={styles.webInputContainer}>
                    <input
                      type="date"
                      value={selectedDateStr}
                      onChange={(e) => setSelectedDateStr(e.target.value)}
                      style={{
                        backgroundColor: '#27272a',
                        color: '#ffffff',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        width: '100%',
                        outline: 'none',
                        colorScheme: 'dark',
                      }}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    onPress={() => openNativePicker('date')}
                  >
                    <Calendar size={16} color="#8b5cf6" style={{ marginRight: 10 }} />
                    <Text style={styles.pickerTriggerText}>{selectedDateStr || 'Select Date'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>QUICK TIME PRESETS</Text>
                <View style={styles.timeGrid}>
                  {timePresets.map((preset) => {
                    const isSelected = selectedTimeStr === preset.time;
                    return (
                      <TouchableOpacity
                        key={preset.time}
                        style={[styles.timeChip, isSelected && styles.activeTimeChip]}
                        onPress={() => setSelectedTimeStr(preset.time)}
                      >
                        <Text style={{ marginRight: 6 }}>{preset.icon}</Text>
                        <Text style={[styles.timeChipText, isSelected && styles.activeTimeChipText]}>
                          {preset.label}
                        </Text>
                        <Text style={styles.timeSubtext}>{preset.time}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>CUSTOM TIME</Text>

                {Platform.OS === 'web' ? (
                  <View style={styles.webInputContainer}>
                    <input
                      type="time"
                      value={selectedTimeStr}
                      onChange={(e) => setSelectedTimeStr(e.target.value)}
                      style={{
                        backgroundColor: '#27272a',
                        color: '#ffffff',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        width: '100%',
                        outline: 'none',
                        colorScheme: 'dark',
                      }}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    onPress={() => openNativePicker('time')}
                  >
                    <Clock size={16} color="#38bdf8" style={{ marginRight: 10 }} />
                    <Text style={styles.pickerTriggerText}>{selectedTimeStr || 'Select Time'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Native Picker Modal on iOS/Android */}
            {Platform.OS !== 'web' && showNativePicker && (
              <View style={{ marginVertical: 10, alignItems: 'center' }}>
                <RNDateTimePicker
                  value={getCurrentDateObj()}
                  mode={nativePickerMode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleNativeChange}
                  themeVariant="dark"
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.iosDoneBtn}
                    onPress={() => setShowNativePicker(false)}
                  >
                    <Text style={styles.iosDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Trash2 size={15} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                <Check size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.applyBtnText}>Save Deadline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: '#18181b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  previewBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  previewText: {
    color: '#f4f4f5',
    fontSize: 13,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTabItem: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  contentBody: {
    maxHeight: 280,
  },
  sectionContainer: {
    paddingVertical: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  activePresetChip: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  presetChipText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  webInputContainer: {
    marginTop: 4,
  },
  pickerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerTriggerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  activeTimeChip: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  timeChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  activeTimeChipText: {
    color: '#ffffff',
  },
  timeSubtext: {
    color: '#9ca3af',
    fontSize: 10,
  },
  iosDoneBtn: {
    marginTop: 8,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
  },
  iosDoneText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#27272a',
  },
  cancelBtnText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#8b5cf6',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default DatePickerModal;
