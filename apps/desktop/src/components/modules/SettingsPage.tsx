import React from 'react';
import { Settings, Clock, Palette, Volume2, Trash2, BellRing, Volume1, Info, Github, ExternalLink, Sparkles } from 'lucide-react';
import { useDesktopStore, BackgroundType } from '../../lib/store';

export const SettingsPage: React.FC = () => {
  const {
    pomodoroSettings,
    setPomodoroSettings,
    isActive,
    timerState,
    setTimeLeft,
    background,
    setBackground,
    soundEffectEnabled,
    setSoundEffectEnabled,
    soundEffectVolume,
    setSoundEffectVolume
  } = useDesktopStore();

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

  const playTestSound = () => {
    const audio = new Audio('./soundeffect.mp3');
    audio.volume = soundEffectVolume ?? 0.8;
    audio.play().catch(e => console.warn("Audio play failed:", e));
  };

  const resetAllData = () => {
    if (window.confirm("Are you sure you want to completely reset all your data? This will clear tasks, notes, sessions, and settings. This cannot be undone.")) {
      localStorage.removeItem("focus-desktop-storage-v1");
      window.location.reload();
    }
  };

  const backgrounds: { id: BackgroundType; label: string }[] = [
    { id: "dark", label: "Dark Modern" },
    { id: "mountain", label: "Mountain Mist" },
    { id: "library", label: "Cozy Library" },
    { id: "cafe", label: "Lo-Fi Cafe" },
    { id: "anime-room", label: "Anime Room" },
  ];

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 pb-20 animate-in fade-in duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm">
          <Settings className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timer Section */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Timer</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Work Duration (Minutes)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={pomodoroSettings.work}
                onChange={(e) => handleTimerSettingChange({ work: Number(e.target.value) || 25 })}
                className="w-full shadcn-input px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Short Break (Minutes)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={pomodoroSettings.break}
                onChange={(e) => handleTimerSettingChange({ break: Number(e.target.value) || 5 })}
                className="w-full shadcn-input px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Long Break (Minutes)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={pomodoroSettings.longBreak || 15}
                onChange={(e) => handleTimerSettingChange({ longBreak: Number(e.target.value) || 15 })}
                className="w-full shadcn-input px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-500"
              />
            </div>
            
            <div 
              className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 mt-2 cursor-pointer transition-colors hover:bg-zinc-900"
              onClick={() => handleTimerSettingChange({ autoStartBreak: !pomodoroSettings.autoStartBreak })}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-200 block">Auto-start Break</span>
                <span className="text-[10px] text-zinc-500">Launch break timer immediately after work</span>
              </div>
              <div className={`w-10 h-[22px] rounded-full p-[3px] transition-colors duration-200 shrink-0 ml-4 ${pomodoroSettings.autoStartBreak ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${pomodoroSettings.autoStartBreak ? 'translate-x-[18px] bg-zinc-900' : 'translate-x-0 bg-zinc-400'}`} />
              </div>
            </div>

            <div 
              className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 mt-1 cursor-pointer transition-colors hover:bg-zinc-900"
              onClick={() => handleTimerSettingChange({ autoStartTimer: !pomodoroSettings.autoStartTimer })}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-200 block">Auto-start Timer</span>
                <span className="text-[10px] text-zinc-500">Launch focus timer immediately after break</span>
              </div>
              <div className={`w-10 h-[22px] rounded-full p-[3px] transition-colors duration-200 shrink-0 ml-4 ${pomodoroSettings.autoStartTimer ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${pomodoroSettings.autoStartTimer ? 'translate-x-[18px] bg-zinc-900' : 'translate-x-0 bg-zinc-400'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Appearance Section */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Appearance</h2>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Background Theme</label>
              <div className="flex flex-col gap-1.5">
                {backgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setBackground(bg.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      background === bg.id
                        ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700 shadow-sm"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound Section */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Sound</h2>
            </div>
            
            <div 
              className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800/80 rounded-xl px-4 py-3 cursor-pointer transition-colors hover:bg-zinc-900"
              onClick={() => setSoundEffectEnabled(!soundEffectEnabled)}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <BellRing className="w-3.5 h-3.5 text-zinc-400" />
                  SFX Enabled
                </span>
                <span className="text-[10px] text-zinc-500">Play sounds on session complete</span>
              </div>
              <div className={`w-10 h-[22px] rounded-full p-[3px] transition-colors duration-200 shrink-0 ml-4 ${soundEffectEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${soundEffectEnabled ? 'translate-x-[18px] bg-white' : 'translate-x-0 bg-zinc-400'}`} />
              </div>
            </div>

            <div className="px-1 space-y-2 pt-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                <span>SFX Volume</span>
                <span>{Math.round((soundEffectVolume ?? 0.8) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={soundEffectVolume ?? 0.8}
                onChange={(e) => setSoundEffectVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg accent-zinc-300 cursor-pointer"
              />
              <div className="pt-3">
                <button
                  onClick={playTestSound}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                >
                  <Volume1 className="w-3.5 h-3.5" />
                  Test SFX
                </button>
              </div>
            </div>
          </div>

          {/* Data Section */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Data</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Permanently delete all your tasks, journals, mood notes, and custom settings. This action cannot be reversed.
            </p>
            <button
              onClick={resetAllData}
              className="w-full px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Reset All Data
            </button>
          </div>

          {/* About Section */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">About</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                <span className="font-semibold text-zinc-200">Version</span>
                <span className="font-mono text-zinc-400">v0.0.1</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-zinc-400 leading-relaxed">
                A minimalist, high-performance desktop productivity suite designed to keep you in flow state. Features flexible Pomodoro and Flow timers, smart break calculation, task management with subtasks, streak and distraction analytics, mood reflections, and ambient music.
              </div>

              <a
                href="https://github.com/YogaDharma21/focus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 hover:bg-zinc-800/60 text-zinc-200 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Github className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium">GitHub Repository</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
