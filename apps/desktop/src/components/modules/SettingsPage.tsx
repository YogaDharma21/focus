import React, { useState, useRef } from 'react';
import {
  Settings, Clock, Palette, Volume2, Volume1, VolumeX, Trash2, BellRing,
  Info, Github, ExternalLink, Check, RotateCcw, Download,
  Upload, ShieldAlert, Monitor, Pin, Database, Plus, Minus, Music
} from 'lucide-react';
import { useDesktopStore, BackgroundType } from '../../lib/store';
import { electron } from '../../lib/electron';
import iconUrl from '../../../public/icon.png';

interface ThemeOption {
  id: BackgroundType;
  name: string;
  description: string;
  swatches: string[];
}

const THEMES: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Dark Modern',
    description: 'Deep zinc obsidian tone for maximum focus and clean minimalism',
    swatches: ['#09090b', '#18181b', '#27272a', '#e4e4e7']
  },
  {
    id: 'mountain',
    name: 'Mountain Mist',
    description: 'Cool atmospheric slate with deep midnight indigo vibes',
    swatches: ['#0a0e17', '#1e293b', '#38bdf8', '#e0f2fe']
  },
  {
    id: 'library',
    name: 'Cozy Library',
    description: 'Warm dark mahogany and amber evening glow for reading sessions',
    swatches: ['#120e0b', '#451a03', '#f59e0b', '#fef3c7']
  },
  {
    id: 'cafe',
    name: 'Lo-Fi Cafe',
    description: 'Espresso undertones and warm lounge ambience for steady work',
    swatches: ['#140f12', '#4a044e', '#ec4899', '#fdf2f8']
  },
  {
    id: 'anime-room',
    name: 'Anime Room',
    description: 'Midnight lavender vaporwave glow inspired by late-night study streams',
    swatches: ['#0d0a14', '#3b0764', '#a855f7', '#f3e8ff']
  },
];

const TIMER_PRESETS = {
  work: [15, 25, 30, 45, 50, 60, 90],
  break: [3, 5, 10, 15],
  longBreak: [10, 15, 20, 30],
};

export const SettingsPage: React.FC = () => {
  const {
    pomodoroSettings,
    setPomodoroSettings,
    pomodoroCount,
    resetPomodoroCount,
    isActive,
    timerState,
    setTimeLeft,
    background,
    setBackground,
    soundEffectEnabled,
    setSoundEffectEnabled,
    soundEffectVolume,
    setSoundEffectVolume,
    volume,
    setVolume,
    mediaType,
    isAlwaysOnTop,
    setAlwaysOnTop,
    todos,
    sessions,
    moodNotes,
    groups
  } = useDesktopStore();

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show temporary toast/feedback notification
  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  const handleTimerSettingChange = (updates: Partial<typeof pomodoroSettings>) => {
    setPomodoroSettings(updates);

    // Update timeLeft if timer is not active and mode matches the setting changed
    if (!isActive) {
      if (updates.work !== undefined && timerState === 'WORK') {
        setTimeLeft(updates.work * 60);
      } else if (updates.break !== undefined && timerState === 'BREAK') {
        setTimeLeft(updates.break * 60);
      }
    }
  };

  const handleWorkDurationStep = (delta: number) => {
    const nextVal = Math.min(180, Math.max(1, (pomodoroSettings.work || 25) + delta));
    handleTimerSettingChange({ work: nextVal });
  };

  const handleBreakDurationStep = (delta: number) => {
    const nextVal = Math.min(60, Math.max(1, (pomodoroSettings.break || 5) + delta));
    handleTimerSettingChange({ break: nextVal });
  };

  const handleLongBreakDurationStep = (delta: number) => {
    const nextVal = Math.min(90, Math.max(1, (pomodoroSettings.longBreak || 15) + delta));
    handleTimerSettingChange({ longBreak: nextVal });
  };

  const playTestSound = () => {
    const audio = new Audio('./soundeffect.mp3');
    audio.volume = soundEffectVolume ?? 0.8;
    audio.play().then(() => {
      showFeedback('Sound chime played successfully.');
    }).catch(e => {
      console.warn('Audio play failed:', e);
      showFeedback('Unable to play audio preview in current environment.', 'error');
    });
  };

  const testDesktopNotification = () => {
    electron.showNotification(
      'Focus Desktop',
      'This is a sample desktop notification from your Focus preferences.'
    );
    setNotificationStatus('Notification sent to desktop.');
    setTimeout(() => setNotificationStatus(null), 3000);
  };

  const toggleAlwaysOnTop = () => {
    const next = !isAlwaysOnTop;
    electron.setAlwaysOnTop(next);
    setAlwaysOnTop(next);
    showFeedback(next ? 'Window pinned Always on Top.' : 'Window unpinned.');
  };

  // Export full JSON workspace backup
  const handleExportData = () => {
    try {
      const fullState = localStorage.getItem('focus-desktop-storage-v1');
      if (!fullState) {
        showFeedback('No stored data found to export.', 'error');
        return;
      }

      const parsed = JSON.parse(fullState);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(parsed, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `focus-desktop-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showFeedback('Backup exported successfully.');
    } catch (err) {
      console.error('Export error:', err);
      showFeedback('Failed to export data backup.', 'error');
    }
  };

  // Import JSON workspace backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Basic validation: state wrapper from zustand persist or raw state object
        const stateToSave = parsed.state ? parsed : { state: parsed, version: 1 };
        localStorage.setItem('focus-desktop-storage-v1', JSON.stringify(stateToSave));
        showFeedback('Data restored successfully. Reloading workspace...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err) {
        console.error('Import error:', err);
        showFeedback('Invalid JSON backup file. Please verify file format.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetConfirmed = () => {
    if (resetConfirmText.toLowerCase() !== 'reset') return;
    localStorage.removeItem('focus-desktop-storage-v1');
    setShowResetModal(false);
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-24 animate-in fade-in duration-200 select-none">
      {/* Hidden file input for backup restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Floating Feedback Notification (Positioned at top-right to avoid MediaPlayer overlap) */}
      {feedbackMessage && (
        <div className="fixed top-12 right-6 z-50 animate-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-medium border shadow-2xl flex items-center gap-2 backdrop-blur-md pointer-events-auto ${
              feedbackMessage.type === 'success'
                ? 'bg-zinc-900/95 text-zinc-100 border-zinc-700 shadow-black/50'
                : 'bg-zinc-900/95 text-rose-300 border-rose-500/40 shadow-rose-950/30'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-zinc-300" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex items-center gap-3.5 mb-8 pb-6 border-b border-zinc-800/80">
        <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-inner">
          <Settings className="w-5 h-5 text-zinc-300" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">Settings</h1>
          <p className="text-xs text-zinc-400">Configure timer intervals, themes, sound effects, and workspace preferences.</p>
        </div>
      </div>

      {/* Settings Sections Container */}
      <div className="space-y-10">
        {/* ========================================================================= */}
        {/* 1. TIMER & FOCUS SECTION                                                 */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                <Clock className="w-4 h-4 text-zinc-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">Timer & Focus Durations</h2>
                <p className="text-[11px] text-zinc-400">Configure Pomodoro work cycles, break durations, and sequencing.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Work Duration Card */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-zinc-700/80 transition-colors shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-200">Work Duration</span>
                  <span className="text-xs font-mono font-semibold text-zinc-100 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-md">
                    {pomodoroSettings.work} min
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">Focus interval length before trigger break.</p>
              </div>

              {/* Stepper + Input */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleWorkDurationStep(-5)}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Decrease by 5 mins"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={pomodoroSettings.work}
                  onChange={(e) => handleTimerSettingChange({ work: Number(e.target.value) || 25 })}
                  className="w-full text-center py-1.5 text-xs font-mono font-bold bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={() => handleWorkDurationStep(5)}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Increase by 5 mins"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-800/60">
                <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mr-1">Presets:</span>
                {TIMER_PRESETS.work.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleTimerSettingChange({ work: p })}
                    className={`text-[10px] px-2 py-1 rounded-md font-mono transition-all ${
                      pomodoroSettings.work === p
                        ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {p}m
                  </button>
                ))}
              </div>
            </div>

            {/* Short Break Card */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-zinc-700/80 transition-colors shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-200">Short Break</span>
                  <span className="text-xs font-mono font-semibold text-zinc-100 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-md">
                    {pomodoroSettings.break} min
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">Quick rest duration after single focus session.</p>
              </div>

              {/* Stepper + Input */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBreakDurationStep(-1)}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Decrease by 1 min"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={pomodoroSettings.break}
                  onChange={(e) => handleTimerSettingChange({ break: Number(e.target.value) || 5 })}
                  className="w-full text-center py-1.5 text-xs font-mono font-bold bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={() => handleBreakDurationStep(1)}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Increase by 1 min"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-800/60">
                <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mr-1">Presets:</span>
                {TIMER_PRESETS.break.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleTimerSettingChange({ break: p })}
                    className={`text-[10px] px-2 py-1 rounded-md font-mono transition-all ${
                      pomodoroSettings.break === p
                        ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {p}m
                  </button>
                ))}
              </div>
            </div>

            {/* Long Break Card */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-zinc-700/80 transition-colors shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-200">Long Break</span>
                  <span className="text-xs font-mono font-semibold text-zinc-100 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-md">
                    {pomodoroSettings.longBreak || 15} min
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">Extended recovery after 4 completed focus rounds.</p>
              </div>

              {/* Stepper + Input */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLongBreakDurationStep(-5)}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Decrease by 5 mins"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={pomodoroSettings.longBreak || 15}
                  onChange={(e) => handleTimerSettingChange({ longBreak: Number(e.target.value) || 15 })}
                  className="w-full text-center py-1.5 text-xs font-mono font-bold bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={() => handleLongBreakDurationStep(5)}
                  className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  title="Increase by 5 mins"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-800/60">
                <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mr-1">Presets:</span>
                {TIMER_PRESETS.longBreak.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleTimerSettingChange({ longBreak: p })}
                    className={`text-[10px] px-2 py-1 rounded-md font-mono transition-all ${
                      (pomodoroSettings.longBreak || 15) === p
                        ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {p}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Automation & Sequence Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Auto-start Break Switch */}
            <div
              role="switch"
              aria-checked={pomodoroSettings.autoStartBreak}
              onClick={() => handleTimerSettingChange({ autoStartBreak: !pomodoroSettings.autoStartBreak })}
              className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700/80 cursor-pointer transition-all shadow-sm group"
            >
              <div className="space-y-1 pr-4">
                <span className="text-xs font-semibold text-zinc-200 block group-hover:text-white transition-colors">
                  Auto-start Breaks
                </span>
                <span className="text-[11px] text-zinc-400 block leading-tight">
                  Immediately launch break countdown when focus interval concludes.
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                pomodoroSettings.autoStartBreak ? 'bg-zinc-200' : 'bg-zinc-700'
              }`}>
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 ${
                  pomodoroSettings.autoStartBreak ? 'translate-x-5 bg-zinc-900 shadow-sm' : 'translate-x-0 bg-zinc-400'
                }`} />
              </div>
            </div>

            {/* Auto-start Focus Timer Switch */}
            <div
              role="switch"
              aria-checked={pomodoroSettings.autoStartTimer}
              onClick={() => handleTimerSettingChange({ autoStartTimer: !pomodoroSettings.autoStartTimer })}
              className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700/80 cursor-pointer transition-all shadow-sm group"
            >
              <div className="space-y-1 pr-4">
                <span className="text-xs font-semibold text-zinc-200 block group-hover:text-white transition-colors">
                  Auto-start Focus Rounds
                </span>
                <span className="text-[11px] text-zinc-400 block leading-tight">
                  Automatically commence the next focus block when break time is up.
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                pomodoroSettings.autoStartTimer ? 'bg-zinc-200' : 'bg-zinc-700'
              }`}>
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 ${
                  pomodoroSettings.autoStartTimer ? 'translate-x-5 bg-zinc-900 shadow-sm' : 'translate-x-0 bg-zinc-400'
                }`} />
              </div>
            </div>
          </div>

          {/* Pomodoro Session Counter Status Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300">
                <RotateCcw className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block">Current Pomodoro Cycle Count</span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {pomodoroCount || 0} completed session{(pomodoroCount || 0) === 1 ? '' : 's'} recorded today
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                resetPomodoroCount();
                showFeedback('Session counter reset to 0.');
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all shadow-sm"
            >
              Reset Counter
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. APPEARANCE & THEMES SECTION (COLORS PERMITTED HERE)                     */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Palette className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">Appearance & Workspace Themes</h2>
              <p className="text-[11px] text-zinc-400">Select an ambient background mood designed for long study and work sessions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {THEMES.map((theme) => {
              const isSelected = background === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    setBackground(theme.id);
                    showFeedback(`Theme changed to ${theme.name}`);
                  }}
                  className={`relative p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 border-zinc-400 shadow-md ring-1 ring-zinc-400/40'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900/90 hover:border-zinc-700'
                  }`}
                >
                  {/* Active Selected Check Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    {/* Theme Visual Palette Swatch Preview */}
                    <div className="flex items-center gap-1.5 mb-3 p-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 w-fit">
                      {theme.swatches.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-md shadow-sm border border-black/30"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <h3 className="text-xs font-bold text-zinc-100 tracking-tight mb-1">{theme.name}</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{theme.description}</p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      {isSelected ? 'Active Theme' : 'Click to Apply'}
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: theme.swatches[2] || '#71717a' }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. SOUND & AUDIO SECTION                                                 */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Volume2 className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">Sound & Notifications</h2>
              <p className="text-[11px] text-zinc-400">Configure session chime alerts, test audio feedback, and ambient levels.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sound Effects Card */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 space-y-4 shadow-sm">
              <div
                role="switch"
                aria-checked={soundEffectEnabled}
                onClick={() => setSoundEffectEnabled(!soundEffectEnabled)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="space-y-1 pr-4">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 group-hover:text-white">
                    <BellRing className="w-3.5 h-3.5 text-zinc-400" />
                    Session Chimes (SFX)
                  </span>
                  <span className="text-[11px] text-zinc-400 block leading-tight">
                    Play pleasant audio tone when work or break interval finishes.
                  </span>
                </div>
                <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                  soundEffectEnabled ? 'bg-zinc-200' : 'bg-zinc-700'
                }`}>
                  <div className={`w-5 h-5 rounded-full transition-transform duration-200 ${
                    soundEffectEnabled ? 'translate-x-5 bg-zinc-900 shadow-sm' : 'translate-x-0 bg-zinc-400'
                  }`} />
                </div>
              </div>

              {/* SFX Volume Slider */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                    {soundEffectVolume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                    ) : soundEffectVolume < 0.5 ? (
                      <Volume1 className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
                    )}
                    Chime Volume
                  </span>
                  <span className="font-mono font-semibold text-zinc-200">
                    {Math.round((soundEffectVolume ?? 0.8) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!soundEffectEnabled}
                  value={soundEffectVolume ?? 0.8}
                  onChange={(e) => setSoundEffectVolume(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-950 rounded-lg accent-zinc-200 cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Test SFX Button */}
              <div className="pt-2">
                <button
                  onClick={playTestSound}
                  disabled={!soundEffectEnabled}
                  className="w-full sm:w-auto px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
                >
                  <Volume1 className="w-3.5 h-3.5 text-zinc-400" />
                  Play Test Chime
                </button>
              </div>
            </div>

            {/* Master Music & Media Audio Card */}
            <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-zinc-300" />
                  <span className="text-xs font-semibold text-zinc-200">Ambient Music Volume</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Master audio level for built-in Lo-Fi tracks and external stream playback.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Player Volume</span>
                  <span className="font-mono font-semibold text-zinc-200">
                    {Math.round((volume ?? 0.8) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume ?? 0.8}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-950 rounded-lg accent-zinc-200 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px]">
                <span className="text-zinc-400">Default Audio Source</span>
                <span className="font-mono font-semibold text-zinc-300 uppercase bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                  {mediaType}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. SYSTEM & WINDOW SECTION                                               */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Monitor className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">System & Window Preferences</h2>
              <p className="text-[11px] text-zinc-400">Window management and desktop notification triggers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Window Pinning Switch */}
            <div
              role="switch"
              aria-checked={isAlwaysOnTop}
              onClick={toggleAlwaysOnTop}
              className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700/80 cursor-pointer transition-all shadow-sm group"
            >
              <div className="space-y-1 pr-4">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 group-hover:text-white">
                  <Pin className="w-3.5 h-3.5 text-zinc-400" />
                  Always On Top (Float Mode)
                </span>
                <span className="text-[11px] text-zinc-400 block leading-tight">
                  Keep Focus window positioned on top of other desktop windows while working.
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                isAlwaysOnTop ? 'bg-zinc-200' : 'bg-zinc-700'
              }`}>
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 ${
                  isAlwaysOnTop ? 'translate-x-5 bg-zinc-900 shadow-sm' : 'translate-x-0 bg-zinc-400'
                }`} />
              </div>
            </div>

            {/* Desktop System Notification Test */}
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 flex items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-200 block">Desktop Notifications</span>
                <span className="text-[11px] text-zinc-400 block leading-tight">
                  Trigger system native notification toasts when sessions conclude.
                </span>
                {notificationStatus && (
                  <span className="text-[10px] text-zinc-400 font-mono block mt-1">{notificationStatus}</span>
                )}
              </div>
              <button
                onClick={testDesktopNotification}
                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-medium whitespace-nowrap transition-all shadow-sm"
              >
                Test Notification
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. DATA & STORAGE SECTION (DANGER ZONE COLORS PERMITTED HERE)             */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Database className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">Data, Storage & Backup</h2>
              <p className="text-[11px] text-zinc-400">View real-time storage stats, export JSON backups, or safely restore data.</p>
            </div>
          </div>

          {/* Real-time Storage Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 text-center">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Focus Sessions</span>
              <span className="text-lg font-bold font-mono text-zinc-100">{sessions?.length || 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 text-center">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Active Tasks</span>
              <span className="text-lg font-bold font-mono text-zinc-100">{todos?.length || 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 text-center">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Mood Journals</span>
              <span className="text-lg font-bold font-mono text-zinc-100">{moodNotes?.length || 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 text-center">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Task Folders</span>
              <span className="text-lg font-bold font-mono text-zinc-100">{groups?.length || 0}</span>
            </div>
          </div>

          {/* Backup Export / Restore Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-3 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-zinc-300" />
                  <h3 className="text-xs font-bold text-zinc-200">Export Backup</h3>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Download a full JSON archive containing all tasks, completed sessions, notes, and custom preferences.
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="w-full px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-100 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                Download JSON Backup
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-3 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Upload className="w-4 h-4 text-zinc-300" />
                  <h3 className="text-xs font-bold text-zinc-200">Restore Backup</h3>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Restore workspace data from a previously downloaded JSON backup file.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-100 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-zinc-400" />
                Select File to Restore
              </button>
            </div>
          </div>

          {/* Danger Zone: Reset All Data (Color Permitted Here) */}
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Danger Zone</h3>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Permanently purge all tasks, distraction logs, focus history, and custom settings. This operation is irreversible.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setResetConfirmText('');
                  setShowResetModal(true);
                }}
                className="px-4 py-2.5 bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-2 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset All Workspace Data
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. ABOUT & INFORMATION SECTION                                           */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Info className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">About Focus Desktop</h2>
              <p className="text-[11px] text-zinc-400">Application architecture, release information, and open source repository.</p>
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <img src={iconUrl} className="w-10 h-10 rounded-xl object-contain shadow-md" alt="Focus" />
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  Focus Desktop
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
                    v0.0.1
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">Minimalist, High-Performance Productivity Suite</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
              Focus Desktop is engineered for deep flow state work. Featuring customizable Pomodoro and stopwatch flow timers, intelligent break sequencing, hierarchical task management, daily streak analytics, mood journaling, and embedded Lo-Fi audio stream support.
            </p>

            {/* Links */}
            <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row gap-3">
              <a
                href="https://github.com/YogaDharma21/focus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Github className="w-4 h-4 text-zinc-300" />
                  <span className="font-medium">GitHub Repository</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* RESET CONFIRMATION MODAL (DANGER ZONE - COLOR PERMITTED)                  */}
      {/* ========================================================================= */}
      {showResetModal && (
        <div
          onClick={() => setShowResetModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 text-zinc-100 select-none animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Confirm Data Reset</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
              All tasks, subtasks, focus logs, mood reflections, and custom presets will be permanently cleared from local storage.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 block">
                Type <span className="font-mono text-rose-400 font-bold">RESET</span> below to confirm:
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={resetConfirmText.toLowerCase() !== 'reset'}
                onClick={handleResetConfirmed}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600 text-white transition-all shadow-md active:scale-95"
              >
                Permanently Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



