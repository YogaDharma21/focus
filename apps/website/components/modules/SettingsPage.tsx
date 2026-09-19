"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Settings, Volume1, Github, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";

export function SettingsPage() {
    const soundEnabled = useAppStore((s) => s.soundEnabled ?? true);
    const setSoundEnabled = useAppStore((s) => s.setSoundEnabled);
    const musicEnabled = useAppStore((s) => s.musicEnabled ?? true);
    const setMusicEnabled = useAppStore((s) => s.setMusicEnabled);
    const musicVolume = useAppStore((s) => s.musicVolume ?? 60);
    const setMusicVolume = useAppStore((s) => s.setMusicVolume);
    const soundEffectEnabled = useAppStore((s) => s.soundEffectEnabled);
    const setSoundEffectEnabled = useAppStore((s) => s.setSoundEffectEnabled);
    const soundEffectVolume = useAppStore((s) => s.soundEffectVolume);
    const setSoundEffectVolume = useAppStore((s) => s.setSoundEffectVolume);
    const resetAllData = useAppStore((s) => s.resetAllData);
    const autoStartBreak = useAppStore((s) => s.autoStartBreak ?? true);
    const setAutoStartBreak = useAppStore((s) => s.setAutoStartBreak);
    const autoStartFlow = useAppStore((s) => s.autoStartFlow ?? true);
    const setAutoStartFlow = useAppStore((s) => s.setAutoStartFlow);
    const { theme, setTheme } = useTheme();

    const playTestSoundEffect = () => {
        if (!soundEnabled || !soundEffectEnabled) return;
        try {
            const audio = new Audio("/soundeffect.mp3");
            audio.volume = (soundEffectVolume ?? 80) / 100;
            audio.play().catch(() => {});
        } catch {
            // ignore
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2 text-foreground">
                <Settings className="w-5 h-5" />
                <h1 className="text-xl font-bold tracking-tight">Settings</h1>
            </div>

            {/* Appearance Section */}
            <div className="p-4 rounded-xl border flex flex-col gap-3 bg-background/40 border-border">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Appearance</span>
                <div className="flex items-center gap-2">
                    {(["light", "dark"] as const).map((mode) => {
                        const isActive = theme === mode;
                        return (
                            <button
                                key={mode}
                                onClick={() => setTheme(mode)}
                                className={cn(
                                    "flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                                    isActive
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-card/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                {mode === "light" ? "Light" : "Dark"}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Timer Section */}
            <div className="p-4 rounded-xl border flex flex-col gap-3 bg-background/40 border-border">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Timer</span>

                <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-card/60 border-border">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">Auto-start Break</span>
                        <span className="text-[10px] text-muted-foreground">Start break countdown automatically</span>
                    </div>
                    <Switch
                        checked={autoStartBreak}
                        onCheckedChange={setAutoStartBreak}
                    />
                </div>

                <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-card/60 border-border">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">Auto-start Flow Timer</span>
                        <span className="text-[10px] text-muted-foreground">Start next flow session when break ends</span>
                    </div>
                    <Switch
                        checked={autoStartFlow}
                        onCheckedChange={setAutoStartFlow}
                    />
                </div>
            </div>

            {/* Sound Section */}
            <div className="p-4 rounded-xl border flex flex-col gap-3 bg-background/40 border-border">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Sound</span>

                {/* Master Sound Toggle */}
                <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-card/60 border-border">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">Sound</span>
                        <span className="text-[10px] text-muted-foreground">Enable or disable all sound</span>
                    </div>
                    <Switch
                        checked={soundEnabled}
                        onCheckedChange={setSoundEnabled}
                    />
                </div>

                {/* Music Subsection */}
                <div className={cn("flex flex-col gap-2 transition-opacity", !soundEnabled && "opacity-50")}>
                    <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Music</span>

                    <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-card/60 border-border">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">Music</span>
                            <span className="text-[10px] text-muted-foreground">Enable or disable background music</span>
                        </div>
                        <Switch
                            disabled={!soundEnabled}
                            checked={soundEnabled && musicEnabled}
                            onCheckedChange={setMusicEnabled}
                        />
                    </div>

                    {soundEnabled && musicEnabled && (
                        <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-card/60 border-border">
                            <div className="flex flex-col w-full gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">Music Volume</span>
                                    <span className="font-mono text-xs text-foreground">{musicVolume}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={musicVolume}
                                    onChange={(e) => setMusicVolume(parseInt(e.target.value, 10))}
                                    className="w-full h-1 rounded bg-secondary accent-current cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sound Effects Subsection */}
                <div className={cn("flex flex-col gap-2 pt-1 border-t border-border/80 transition-opacity", !soundEnabled && "opacity-50")}>
                    <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sound Effects</span>

                    <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-card/60 border-border">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">Sound Effects</span>
                            <span className="text-[10px] text-muted-foreground">Enable or disable timer sound effects</span>
                        </div>
                        <Switch
                            disabled={!soundEnabled}
                            checked={soundEnabled && soundEffectEnabled}
                            onCheckedChange={setSoundEffectEnabled}
                        />
                    </div>

                    {soundEnabled && soundEffectEnabled && (
                        <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-card/60 border-border">
                            <div className="flex flex-col w-full gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">Sound Effects Volume</span>
                                    <span className="font-mono text-xs text-foreground">{soundEffectVolume}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={soundEffectVolume ?? 80}
                                    onChange={(e) => setSoundEffectVolume(parseInt(e.target.value, 10))}
                                    className="w-full h-1 rounded bg-secondary accent-current cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={playTestSoundEffect}
                        disabled={!soundEnabled || !soundEffectEnabled}
                        className={cn(
                            "w-full py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2",
                            soundEnabled && soundEffectEnabled
                                ? "border-border bg-secondary text-foreground hover:bg-accent cursor-pointer"
                                : "border-border/50 bg-card/30 text-muted-foreground cursor-not-allowed opacity-50"
                        )}
                    >
                        <Volume1 className="w-4 h-4" />
                        Test Sound Effect
                    </button>
                </div>
            </div>

            {/* Data Section */}
            <div className="p-4 rounded-xl border flex flex-col gap-3 bg-background/40 border-border">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Data</span>
                <button
                    onClick={() => {
                        if (window.confirm("Are you sure you want to reset all data to defaults? This action cannot be undone.")) {
                            resetAllData();
                        }
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs border border-red-900/50 bg-red-950/20 text-red-500 hover:bg-red-950/50 hover:text-red-400 transition-all cursor-pointer"
                >
                    Reset All Data
                </button>
            </div>

            {/* About Section */}
            <div className="p-4 rounded-xl border flex flex-col gap-3 bg-background/40 border-border">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">About</span>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-card/60 border border-border rounded-xl px-4 py-3">
                        <span className="font-medium text-foreground">Version</span>
                        <span className="font-mono text-muted-foreground">v0.0.1</span>
                    </div>

                    <div className="bg-card/60 border border-border rounded-xl p-3.5 text-muted-foreground leading-relaxed">
                        Focus is a minimalist, monochrome productivity suite designed to keep you in flow state. Features a count-up flow timer, task management with subtasks, productivity analytics, and ambient audio.
                    </div>

                    <a
                        href="https://github.com/YogaDharma21/focus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between border border-border bg-card/60 hover:bg-secondary text-foreground transition-all cursor-pointer"
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
