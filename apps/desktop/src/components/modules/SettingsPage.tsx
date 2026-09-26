import React, { useEffect, useState, useRef } from 'react';
import {
  Settings, Clock, Palette, Volume2, Volume1, VolumeX, Trash2, BellRing,
  Info, Github, ExternalLink, Check, Download,
  Upload, ShieldAlert, Monitor, Pin, Database, Music
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';
import iconUrl from '../../../public/icon.png';

export const SettingsPage: React.FC = () => {
  const {
    theme,
    setTheme,
    soundEffectEnabled,
    setSoundEffectEnabled,
    soundEffectVolume,
    setSoundEffectVolume,
    volume,
    setVolume,
    mediaType,
    autoPauseOnExternalAudio,
    setAutoPauseOnExternalAudio,
    autoPauseFadeDuration,
    setAutoPauseFadeDuration,
    isAlwaysOnTop,
    setAlwaysOnTop,
    autoStartBreak,
    setAutoStartBreak,
    autoStartFlow,
    setAutoStartFlow,
    todos,
    sessions,
    groups
  } = useDesktopStore();

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [externalAudioSupported, setExternalAudioSupported] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    electron.getExternalAudioState().then((s) => {
      if (!cancelled && s) setExternalAudioSupported(s.supported !== false);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
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

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {feedbackMessage && (
        <div className="fixed top-12 right-6 z-50 animate-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-medium border shadow-2xl flex items-center gap-2 backdrop-blur-md pointer-events-auto ${
              feedbackMessage.type === 'success'
                ? 'bg-secondary/95 text-foreground border-border shadow-black/50'
                : 'bg-secondary/95 text-rose-300 border-rose-500/40 shadow-rose-950/30'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3.5 mb-8 pb-6 border-b border-border">
        <div className="w-11 h-11 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground shadow-inner">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">Configure timer intervals, themes, sound effects, and workspace preferences.</p>
        </div>
      </div>

      <div className="space-y-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-secondary border border-border text-muted-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground tracking-tight">Timer & Focus</h2>
                <p className="text-[11px] text-muted-foreground">Flow mode: open-ended stopwatch with smart break calculation.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              role="switch"
              aria-checked={autoStartBreak ?? true}
              onClick={() => setAutoStartBreak(!(autoStartBreak ?? true))}
              className="flex items-center justify-between p-4 rounded-2xl bg-secondary/70 border border-border hover:border-border cursor-pointer transition-all shadow-sm group"
            >
              <div className="space-y-1 pr-4">
                <span className="text-xs font-semibold text-foreground block">
                  Auto-start Break
                </span>
                <span className="text-[11px] text-muted-foreground block leading-tight">
                  Start break countdown automatically
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                (autoStartBreak ?? true) ? 'bg-primary' : 'bg-muted'
              }`}>
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 ${
                  (autoStartBreak ?? true) ? 'translate-x-5 bg-primary-foreground shadow-sm' : 'translate-x-0 bg-muted-foreground'
                }`} />
              </div>
            </div>

            <div
              role="switch"
              aria-checked={autoStartFlow ?? true}
              onClick={() => setAutoStartFlow(!(autoStartFlow ?? true))}
              className="flex items-center justify-between p-4 rounded-2xl bg-secondary/70 border border-border hover:border-border cursor-pointer transition-all shadow-sm group"
            >
              <div className="space-y-1 pr-4">
                <span className="text-xs font-semibold text-foreground block">
                  Auto-start Flow Timer
                </span>
                <span className="text-[11px] text-muted-foreground block leading-tight">
                  Start next flow session when break ends
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                (autoStartFlow ?? true) ? 'bg-primary' : 'bg-muted'
              }`}>
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 ${
                  (autoStartFlow ?? true) ? 'translate-x-5 bg-primary-foreground shadow-sm' : 'translate-x-0 bg-muted-foreground'
                }`} />
              </div>
            </div>
          </div>
        </section>
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-secondary border border-border text-muted-foreground">
              <Palette className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Appearance</h2>
              <p className="text-[11px] text-muted-foreground">Switch between light and dark mode.</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary border border-border">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-foreground block">Theme</span>
              <span className="text-[11px] text-muted-foreground block leading-tight">Choose your preferred color scheme.</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setTheme("light"); showFeedback("Switched to light mode"); }}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  theme === "light"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Light
              </button>
              <button
                onClick={() => { setTheme("dark"); showFeedback("Switched to dark mode"); }}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  theme === "dark"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-secondary border border-border text-muted-foreground">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Sound & Notifications</h2>
              <p className="text-[11px] text-muted-foreground">Configure session chime alerts, test audio feedback, and ambient levels.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-secondary/70 border border-border rounded-2xl p-5 space-y-4 shadow-sm">
              <div
                role="switch"
                aria-checked={soundEffectEnabled}
                onClick={() => setSoundEffectEnabled(!soundEffectEnabled)}
                className="flex items-center justify-between cursor-pointer group"
              >
                <div className="space-y-1 pr-4">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-2 group-hover:text-foreground">
                    <BellRing className="w-3.5 h-3.5 text-muted-foreground" />
                    Session Chimes (SFX)
                  </span>
                  <span className="text-[11px] text-muted-foreground block leading-tight">
                    Play pleasant audio tone when work or break interval finishes.
                  </span>
                </div>
                <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                  soundEffectEnabled ? 'bg-primary' : 'bg-muted'
                }`}>
                  <div className={`w-5 h-5 rounded-full transition-transform duration-200 ${
                    soundEffectEnabled ? 'translate-x-5 bg-primary-foreground shadow-sm' : 'translate-x-0 bg-muted-foreground'
                  }`} />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    {soundEffectVolume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : soundEffectVolume < 0.5 ? (
                      <Volume1 className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    Chime Volume
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {Math.round((soundEffectVolume ?? 0.8) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  disabled={!soundEffectEnabled}
                  value={soundEffectVolume ?? 0.8}
                  onChange={(e) => setSoundEffectVolume(Number(e.target.value))}
                  className="w-full h-2 bg-background rounded-lg accent-primary cursor-pointer disabled:opacity-40"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={playTestSound}
                  disabled={!soundEffectEnabled}
                  className="w-full sm:w-auto px-4 py-2 bg-background hover:bg-secondary border border-border hover:border-border text-foreground hover:text-foreground rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
                >
                  <Volume1 className="w-3.5 h-3.5 text-muted-foreground" />
                  Play Test Chime
                </button>
              </div>
            </div>

            <div className="bg-secondary/70 border border-border rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">Ambient Music Volume</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Master audio level for built-in Lo-Fi tracks and external stream playback.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Player Volume</span>
                  <span className="font-mono font-semibold text-foreground">
                    {Math.round((volume ?? 0.8) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume ?? 0.8}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-background rounded-lg accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/60 border border-border text-[11px]">
                <span className="text-muted-foreground">Default Audio Source</span>
                <span className="font-mono font-semibold text-muted-foreground uppercase bg-secondary px-2 py-0.5 rounded border border-border">
                  {mediaType}
                </span>
              </div>

              <div className="space-y-3 pt-3 border-t border-border/60">
                <div
                  role="switch"
                  aria-checked={autoPauseOnExternalAudio}
                  onClick={() => setAutoPauseOnExternalAudio(!autoPauseOnExternalAudio)}
                  className={`flex items-center justify-between cursor-pointer group ${!externalAudioSupported ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="space-y-1 pr-4">
                    <span className="text-xs font-semibold text-foreground">
                      Auto-Pause on Audio
                    </span>
                    <span className="text-[11px] text-muted-foreground block leading-tight">
                      {externalAudioSupported
                        ? 'Fade music out when other apps play audio, fade back in when they stop.'
                        : 'External audio detection is unavailable on this system.'}
                    </span>
                  </div>
                  <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                    autoPauseOnExternalAudio ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <div className={`w-5 h-5 rounded-full transition-transform duration-200 ${
                      autoPauseOnExternalAudio ? 'translate-x-5 bg-primary-foreground shadow-sm' : 'translate-x-0 bg-muted-foreground'
                    }`} />
                  </div>
                </div>

                {autoPauseOnExternalAudio && externalAudioSupported && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Resume Fade Speed</span>
                      <span className="font-mono font-semibold text-foreground">
                        {(autoPauseFadeDuration ?? 2) === 0 ? 'Instant (0s)' : `${autoPauseFadeDuration ?? 2}s`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={0.5}
                      value={autoPauseFadeDuration ?? 2}
                      onChange={(e) => setAutoPauseFadeDuration(Number(e.target.value))}
                      className="w-full h-2 bg-background rounded-lg accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>0s (Instant)</span>
                      <span>2.5s</span>
                      <span>5s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-secondary border border-border text-muted-foreground">
              <Monitor className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">System & Window Preferences</h2>
              <p className="text-[11px] text-muted-foreground">Window management and desktop notification triggers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              role="switch"
              aria-checked={isAlwaysOnTop}
              onClick={toggleAlwaysOnTop}
              className="flex items-center justify-between p-4 rounded-2xl bg-secondary/70 border border-border hover:border-border cursor-pointer transition-all shadow-sm group"
            >
              <div className="space-y-1 pr-4">
                <span className="text-xs font-semibold text-foreground flex items-center gap-2 group-hover:text-foreground">
                  <Pin className="w-3.5 h-3.5 text-muted-foreground" />
                  Always On Top (Float Mode)
                </span>
                <span className="text-[11px] text-muted-foreground block leading-tight">
                  Keep Focus window positioned on top of other desktop windows while working.
                </span>
              </div>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                isAlwaysOnTop ? 'bg-primary' : 'bg-muted'
              }`}>
                <div className={`w-5 h-5 rounded-full transition-transform duration-200 ${
                  isAlwaysOnTop ? 'translate-x-5 bg-primary-foreground shadow-sm' : 'translate-x-0 bg-muted-foreground'
                }`} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/70 border border-border flex items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-foreground block">Desktop Notifications</span>
                <span className="text-[11px] text-muted-foreground block leading-tight">
                  Trigger system native notification toasts when sessions conclude.
                </span>
                {notificationStatus && (
                  <span className="text-[10px] text-muted-foreground font-mono block mt-1">{notificationStatus}</span>
                )}
              </div>
              <button
                onClick={testDesktopNotification}
                className="px-3 py-1.5 bg-background hover:bg-secondary border border-border hover:border-border text-foreground hover:text-foreground rounded-xl text-xs font-medium whitespace-nowrap transition-all shadow-sm"
              >
                Test Notification
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-secondary border border-border text-muted-foreground">
              <Database className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">Data, Storage & Backup</h2>
              <p className="text-[11px] text-muted-foreground">View real-time storage stats, export JSON backups, or safely restore data.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-secondary/70 border border-border text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Focus Sessions</span>
              <span className="text-lg font-bold font-mono text-foreground">{sessions?.length || 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-secondary/70 border border-border text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Active Tasks</span>
              <span className="text-lg font-bold font-mono text-foreground">{todos?.length || 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-secondary/70 border border-border text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Task Folders</span>
              <span className="text-lg font-bold font-mono text-foreground">{groups?.length || 0}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-secondary/70 border border-border space-y-3 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-xs font-bold text-foreground">Export Backup</h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Download a full JSON archive containing all tasks, completed sessions, and custom preferences.
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="w-full px-4 py-2.5 bg-background hover:bg-secondary border border-border hover:border-border text-foreground rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                Download JSON Backup
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/70 border border-border space-y-3 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-xs font-bold text-foreground">Restore Backup</h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Restore workspace data from a previously downloaded JSON backup file.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2.5 bg-background hover:bg-secondary border border-border hover:border-border text-foreground rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                Select File to Restore
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Danger Zone</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
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

        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-secondary border border-border text-muted-foreground">
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">About Focus Desktop</h2>
              <p className="text-[11px] text-muted-foreground">Application architecture, release information, and open source repository.</p>
            </div>
          </div>

          <div className="bg-secondary/70 border border-border rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <img src={iconUrl} className="w-10 h-10 rounded-xl object-contain shadow-md" alt="Focus" />
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Focus Desktop
                  <span className="px-2 py-0.5 rounded-full bg-secondary border border-border text-[10px] font-mono text-muted-foreground">
                    v0.0.1
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">Minimalist, High-Performance Productivity Suite</p>
              </div>
            </div>

<p className="text-xs text-foreground leading-relaxed bg-secondary/60 p-4 rounded-xl border border-border">
              Focus Desktop is engineered for deep flow state work. Featuring open-ended Flow timers with intelligent break sequencing, hierarchical task management, daily streak analytics, and embedded Lo-Fi audio stream support.
            </p>

            <div className="pt-3 border-t border-border flex flex-col sm:flex-row gap-3">
              <a
                href="https://github.com/YogaDharma21/focus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:bg-secondary text-xs text-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Github className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">GitHub Repository</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </section>
      </div>

      {showResetModal && (
        <div
          onClick={() => setShowResetModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-secondary border border-border rounded-2xl shadow-2xl p-6 space-y-4 text-foreground select-none animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Confirm Data Reset</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-foreground leading-relaxed bg-secondary/60 p-3.5 rounded-xl border border-border">
              All tasks, subtasks, focus logs, and custom presets will be permanently cleared from local storage.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] text-muted-foreground block">
                Type <span className="font-mono text-rose-400 font-bold">RESET</span> below to confirm:
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
