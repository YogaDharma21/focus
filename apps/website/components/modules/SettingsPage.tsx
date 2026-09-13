"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Clock, Palette, Volume2, Trash2, Info, Github, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";

export function SettingsPage() {
    const soundEffectEnabled = useAppStore((s) => s.soundEffectEnabled);
    const setSoundEffectEnabled = useAppStore((s) => s.setSoundEffectEnabled);
    const soundEffectVolume = useAppStore((s) => s.soundEffectVolume);
    const setSoundEffectVolume = useAppStore((s) => s.setSoundEffectVolume);
    const resetAllData = useAppStore((s) => s.resetAllData);
    const { theme, setTheme } = useTheme();

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
            <div className="bg-card border border-border/50 rounded-[var(--radius)] p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Clock className="w-4 h-4" />
                    <h2>Timer</h2>
                </div>
                
                <div className="p-3 rounded-[var(--radius)] bg-secondary/20">
                    <p className="text-sm text-muted-foreground">Flow mode (count-up timer). Complete a session to get a suggested break.</p>
                </div>
            </div>

            {/* Appearance Section */}
            <div className="bg-card border border-border/50 rounded-[var(--radius)] p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Palette className="w-4 h-4" />
                    <h2>Appearance</h2>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                    <Label className="font-medium">Theme</Label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTheme("light")}
                            className={cn(
                                "px-4 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-all",
                                theme === "light"
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-secondary/30 hover:bg-secondary/50 text-foreground"
                            )}
                        >
                            Light
                        </button>
                        <button
                            onClick={() => setTheme("dark")}
                            className={cn(
                                "px-4 py-1.5 rounded-[var(--radius)] text-sm font-medium transition-all",
                                theme === "dark"
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-secondary/30 hover:bg-secondary/50 text-foreground"
                            )}
                        >
                            Dark
                        </button>
                    </div>
                </div>
            </div>

            {/* Sound Section */}
            <div className="bg-card border border-border/50 rounded-[var(--radius)] p-5 space-y-4 shadow-sm">
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
                        step="1"
                        disabled={!soundEffectEnabled}
                        value={soundEffectVolume ?? 80}
                        onChange={(e) => setSoundEffectVolume(parseInt(e.target.value))}
                        className="w-32 sm:w-48 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md disabled:opacity-40"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={playTestSoundEffect} disabled={!soundEffectEnabled} className="gap-2">
                        <Volume2 className="w-4 h-4" />
                        Test Sound
                    </Button>
                </div>
            </div>

            {/* Data Section */}
            <div className="bg-card border border-border/50 rounded-[var(--radius)] p-5 space-y-4 shadow-sm">
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
            <div className="bg-card border border-border/50 rounded-[var(--radius)] p-5 space-y-4 shadow-sm">
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
                        A minimalist productivity suite designed to keep you in flow state. Features a count-up flow timer, task management with subtasks, productivity analytics, and ambient audio.
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
