"use client";

import { useAppStore, BackgroundType } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Clock, Palette, Volume2, Trash2, Info, Github, ExternalLink } from "lucide-react";

export function SettingsPage() {
    const pomodoroSettings = useAppStore((s) => s.pomodoroSettings);
    const setPomodoroSettings = useAppStore((s) => s.setPomodoroSettings);
    const timerMode = useAppStore((s) => s.timerMode);
    const timerState = useAppStore((s) => s.timerState);
    const setTimeLeft = useAppStore((s) => s.setTimeLeft);
    const pomodoroCount = useAppStore((s) => s.pomodoroCount);
    const background = useAppStore((s) => s.background);
    const setBackground = useAppStore((s) => s.setBackground);
    const soundEffectEnabled = useAppStore((s) => s.soundEffectEnabled);
    const setSoundEffectEnabled = useAppStore((s) => s.setSoundEffectEnabled);
    const soundEffectVolume = useAppStore((s) => s.soundEffectVolume);
    const setSoundEffectVolume = useAppStore((s) => s.setSoundEffectVolume);
    const resetAllData = useAppStore((s) => s.resetAllData);
    const isActive = useAppStore((s) => s.isActive);

    const handleTimerSettingChange = (updates: Partial<{ work: number; break: number; longBreak: number }>) => {
        setPomodoroSettings(updates);
        const nextSettings = { ...pomodoroSettings, ...updates };
        if (!isActive) {
            if (timerMode === "POMODORO") {
                if (timerState === "WORK") {
                    setTimeLeft(nextSettings.work * 60);
                } else if (timerState === "BREAK") {
                    const isLongBreak = (pomodoroCount || 0) % 4 === 0 && (pomodoroCount || 0) > 0;
                    setTimeLeft(isLongBreak ? (nextSettings.longBreak || 15) * 60 : nextSettings.break * 60);
                }
            }
        }
    };

    const backgrounds: { label: string; value: BackgroundType }[] = [
        { label: "Dark", value: "dark" },
        { label: "Gradient", value: "gradient" },
        { label: "Mountain", value: "mountain" },
        { label: "Library", value: "library" },
        { label: "Cafe", value: "cafe" },
        { label: "Anime Room", value: "anime-room" },
    ];

    const playTestSoundEffect = () => {
        try {
            const audio = new Audio("/soundeffect.mp3");
            audio.volume = (soundEffectVolume ?? 80) / 100;
            audio.play().catch(() => {});
        } catch {
            // ignore
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center gap-2 mb-6 text-foreground">
                <Settings className="w-6 h-6" />
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            </div>

            {/* Timer Section */}
            <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-[var(--radius)] p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Clock className="w-4 h-4" />
                    <h2>Timer</h2>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                    <Label className="font-medium">Work Duration (min)</Label>
                    <Input
                        type="number"
                        min={1}
                        max={120}
                        value={pomodoroSettings.work}
                        onChange={(e) => handleTimerSettingChange({ work: parseInt(e.target.value) || 25 })}
                        className="w-20 bg-background/50 border-none text-center"
                    />
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                    <Label className="font-medium">Short Break (min)</Label>
                    <Input
                        type="number"
                        min={1}
                        max={60}
                        value={pomodoroSettings.break}
                        onChange={(e) => handleTimerSettingChange({ break: parseInt(e.target.value) || 5 })}
                        className="w-20 bg-background/50 border-none text-center"
                    />
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                    <Label className="font-medium">Long Break (min)</Label>
                    <Input
                        type="number"
                        min={1}
                        max={60}
                        value={pomodoroSettings.longBreak || 15}
                        onChange={(e) => handleTimerSettingChange({ longBreak: parseInt(e.target.value) || 15 })}
                        className="w-20 bg-background/50 border-none text-center"
                    />
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                    <Label className="font-medium">Auto-start Break</Label>
                    <Switch
                        checked={pomodoroSettings.autoStartBreak}
                        onCheckedChange={(checked) => setPomodoroSettings({ autoStartBreak: checked })}
                    />
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                    <Label className="font-medium">Auto-start Timer</Label>
                    <Switch
                        checked={pomodoroSettings.autoStartTimer}
                        onCheckedChange={(checked) => setPomodoroSettings({ autoStartTimer: checked })}
                    />
                </div>
            </div>

            {/* Appearance Section */}
            <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-[var(--radius)] p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Palette className="w-4 h-4" />
                    <h2>Appearance</h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {backgrounds.map((bg) => (
                        <button
                            key={bg.value}
                            onClick={() => setBackground(bg.value)}
                            className={cn(
                                "p-3 rounded-[var(--radius)] text-sm font-medium transition-all",
                                background === bg.value
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-secondary/30 hover:bg-secondary/50 text-foreground"
                            )}
                        >
                            {bg.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sound Section */}
            <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-[var(--radius)] p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Volume2 className="w-4 h-4" />
                    <h2>Sound</h2>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                    <Label className="font-medium">Sound Effect Enabled</Label>
                    <Switch
                        checked={soundEffectEnabled}
                        onCheckedChange={setSoundEffectEnabled}
                    />
                </div>

                <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                    <div className="space-y-1">
                        <Label className="font-medium">Sound Effect Volume</Label>
                        <p className="text-xs text-muted-foreground">{soundEffectVolume}%</p>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={soundEffectVolume ?? 80}
                        onChange={(e) => setSoundEffectVolume(parseInt(e.target.value))}
                        className="w-32 sm:w-48"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={playTestSoundEffect} className="gap-2">
                        <Volume2 className="w-4 h-4" />
                        Test Sound
                    </Button>
                </div>
            </div>

            {/* Data Section */}
            <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-[var(--radius)] p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Trash2 className="w-4 h-4" />
                    <h2>Data</h2>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                    <div className="space-y-1">
                        <Label className="font-medium text-destructive">Reset All Data</Label>
                        <p className="text-xs text-muted-foreground">
                            Permanently delete all tasks, notes, sessions, and settings.
                        </p>
                    </div>
                    <Button 
                        variant="destructive" 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to reset all data to defaults? This action cannot be undone.")) {
                                resetAllData();
                            }
                        }}
                    >
                        Reset
                    </Button>
                </div>
            </div>
            {/* About Section */}
            <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-[var(--radius)] p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Info className="w-4 h-4" />
                    <h2>About</h2>
                </div>
                
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                        <span className="font-medium">Version</span>
                        <span className="text-xs font-mono text-muted-foreground">v0.0.1</span>
                    </div>

                    <div className="p-3 rounded-[var(--radius)] bg-secondary/20 text-xs text-muted-foreground leading-relaxed">
                        A minimalist productivity suite designed to keep you in flow state. Features Pomodoro and Flow timers, task management with subtasks, productivity analytics, mood reflections, and ambient audio.
                    </div>

                    <a
                        href="https://github.com/YogaDharma21/focus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20 hover:bg-secondary/40 transition-colors text-xs font-medium text-foreground"
                    >
                        <div className="flex items-center gap-2">
                            <Github className="w-4 h-4" />
                            <span>GitHub Repository</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                </div>
            </div>
        </div>
    );
}
