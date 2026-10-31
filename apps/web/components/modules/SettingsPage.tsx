"use client";

import { useAppStore } from "@/lib/store";
import {
    cn,
    downloadFile,
    sessionsToCsv,
    sessionsToMarkdown,
    validateBackupJson,
} from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
    Settings,
    Volume1,
    Volume2,
    Github,
    ExternalLink,
    Timer,
    Palette,
    Database,
    Info,
    Upload,
    Download,
    FileSpreadsheet,
    FileText,
    Check,
    AlertCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useRef } from "react";

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
    const breakRatio = useAppStore((s) => s.breakRatio ?? "1/5");
    const setBreakRatio = useAppStore((s) => s.setBreakRatio);
    const sessions = useAppStore((s) => s.sessions || []);
    const distractions = useAppStore((s) => s.distractions || []);
    const { theme, setTheme } = useTheme();

    const [isDragging, setIsDragging] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showFeedback = (text: string, type: "success" | "error" = "success") => {
        setStatusMessage({ text, type });
        setTimeout(() => {
            setStatusMessage(null);
        }, 3500);
    };

    const handleExportJson = () => {
        try {
            const raw = localStorage.getItem("focus-app-storage-v2");
            const payload = raw ? JSON.parse(raw) : { state: { sessions, distractions }, version: 0 };
            const dateStr = new Date().toISOString().slice(0, 10);
            downloadFile(
                JSON.stringify(payload, null, 2),
                `focus-backup-${dateStr}.json`,
                "application/json"
            );
            showFeedback("Backup exported successfully.");
        } catch (err) {
            console.error("Export JSON error:", err);
            showFeedback("Failed to export JSON backup.", "error");
        }
    };

    const handleExportCsv = () => {
        try {
            if (!sessions || sessions.length === 0) {
                showFeedback("No sessions to export.", "error");
                return;
            }
            const csv = sessionsToCsv(sessions);
            const dateStr = new Date().toISOString().slice(0, 10);
            downloadFile(csv, `focus-sessions-${dateStr}.csv`, "text/csv;charset=utf-8");
            showFeedback("Sessions exported to CSV.");
        } catch (err) {
            console.error("Export CSV error:", err);
            showFeedback("Failed to export CSV.", "error");
        }
    };

    const handleExportMarkdown = () => {
        try {
            const md = sessionsToMarkdown(sessions, distractions);
            const dateStr = new Date().toISOString().slice(0, 10);
            downloadFile(md, `focus-summary-${dateStr}.md`, "text/markdown;charset=utf-8");
            showFeedback("Summary exported to Markdown.");
        } catch (err) {
            console.error("Export Markdown error:", err);
            showFeedback("Failed to export Markdown summary.", "error");
        }
    };

    const processImportFile = (file: File) => {
        if (!file.name.endsWith(".json")) {
            showFeedback("Please select a valid .json backup file.", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const result = validateBackupJson(content);
                if (!result.isValid || !result.data) {
                    showFeedback(result.error || "Invalid backup file structure.", "error");
                    return;
                }

                const currentRaw = localStorage.getItem("focus-app-storage-v2");
                const current = currentRaw ? JSON.parse(currentRaw) : { state: {}, version: 0 };
                const nextState = {
                    ...current.state,
                    ...result.data,
                    isActive: false,
                    timeLeft: 0,
                    timerState: "FLOW",
                };

                localStorage.setItem(
                    "focus-app-storage-v2",
                    JSON.stringify({
                        state: nextState,
                        version: current.version ?? 0,
                    })
                );

                showFeedback("Data restored successfully. Reloading workspace...");
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            } catch (err) {
                console.error("Import error:", err);
                showFeedback("Failed to restore backup file.", "error");
            }
        };
        reader.readAsText(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processImportFile(file);
        }
        e.target.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processImportFile(file);
        }
    };

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
            <Card className="p-5 bg-card border border-border flex flex-col gap-3 rounded-[24px]">
                <div className="flex items-center gap-2">
                    <Palette className="w-[18px] h-[18px] text-foreground" />
                    <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">Appearance</h3>
                </div>
                <div className="flex items-center gap-2">
                    {(["light", "dark"] as const).map((mode) => {
                        const isActive = theme === mode;
                        return (
                            <button
                                key={mode}
                                onClick={() => setTheme(mode)}
                                className={cn(
                                    "flex-1 px-3 py-2.5 rounded-[10px] text-xs font-medium transition-all duration-300 ease-out active:scale-95 border cursor-pointer",
                                    isActive
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-surface-inset text-muted-foreground border-transparent hover:bg-surface hover:text-foreground"
                                )}
                            >
                                {mode === "light" ? "Light" : "Dark"}
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* Timer Section */}
            <Card className="p-5 bg-card border border-border flex flex-col gap-3 rounded-[24px]">
                <div className="flex items-center gap-2">
                    <Timer className="w-[18px] h-[18px] text-foreground" />
                    <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">Timer</h3>
                </div>

                <div className="flex flex-col gap-2 rounded-[16px] px-4 py-3 bg-surface-inset">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">Break Ratio</span>
                        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                            {breakRatio === "1/3" ? "33% of flow" : breakRatio === "1/4" ? "25% of flow" : "20% of flow"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        {(["1/5", "1/4", "1/3"] as const).map((ratio) => {
                            const isActive = breakRatio === ratio;
                            return (
                                <button
                                    key={ratio}
                                    type="button"
                                    onClick={() => setBreakRatio(ratio)}
                                    className={cn(
                                        "flex-1 px-3 py-2 rounded-[10px] text-xs font-medium transition-all border cursor-pointer tabular-nums",
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-surface text-muted-foreground border-transparent hover:text-foreground"
                                    )}
                                >
                                    {ratio}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-[16px] px-4 py-3 bg-surface-inset">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">Auto-start Break</span>
                        <span className="text-[11px] text-muted-foreground">Start break countdown automatically</span>
                    </div>
                    <Switch
                        checked={autoStartBreak}
                        onCheckedChange={setAutoStartBreak}
                    />
                </div>

                <div className="flex items-center justify-between rounded-[16px] px-4 py-3 bg-surface-inset">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">Auto-start Flow Timer</span>
                        <span className="text-[11px] text-muted-foreground">Start next flow session when break ends</span>
                    </div>
                    <Switch
                        checked={autoStartFlow}
                        onCheckedChange={setAutoStartFlow}
                    />
                </div>
            </Card>

            {/* Sound Section */}
            <Card className="p-5 bg-card border border-border flex flex-col gap-3 rounded-[24px]">
                <div className="flex items-center gap-2">
                    <Volume2 className="w-[18px] h-[18px] text-foreground" />
                    <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">Sound</h3>
                </div>

                {/* Master Sound Toggle */}
                <div className="flex items-center justify-between rounded-[16px] px-4 py-3 bg-surface-inset">
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">Sound</span>
                        <span className="text-[11px] text-muted-foreground">Enable or disable all sound</span>
                    </div>
                    <Switch
                        checked={soundEnabled}
                        onCheckedChange={setSoundEnabled}
                    />
                </div>

                {/* Music Subsection */}
                <div className={cn("flex flex-col gap-2 transition-opacity", !soundEnabled && "opacity-50")}>
                    <span className="px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Music</span>

                    <div className="flex items-center justify-between rounded-[16px] px-4 py-3 bg-surface-inset">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">Music</span>
                            <span className="text-[11px] text-muted-foreground">Enable or disable background music</span>
                        </div>
                        <Switch
                            disabled={!soundEnabled}
                            checked={soundEnabled && musicEnabled}
                            onCheckedChange={setMusicEnabled}
                        />
                    </div>

                    {soundEnabled && musicEnabled && (
                        <div className="flex items-center justify-between rounded-[16px] px-4 py-3 bg-surface-inset">
                            <div className="flex flex-col w-full gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-foreground">Music Volume</span>
                                    <span className="font-mono text-xs tabular-nums text-foreground">{musicVolume}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={musicVolume}
                                    onChange={(e) => setMusicVolume(parseInt(e.target.value, 10))}
                                    className="w-full h-1.5 rounded-full bg-surface-inset accent-foreground cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sound Effects Subsection */}
                <div className={cn("flex flex-col gap-2 pt-1 border-t border-border-subtle transition-opacity", !soundEnabled && "opacity-50")}>
                    <span className="px-1 text-[10px] font-medium text-muted-foreground uppercase tracking-[0.16em]">Sound Effects</span>

                    <div className="flex items-center justify-between rounded-[16px] px-4 py-3 bg-surface-inset">
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">Sound Effects</span>
                            <span className="text-[11px] text-muted-foreground">Enable or disable timer sound effects</span>
                        </div>
                        <Switch
                            disabled={!soundEnabled}
                            checked={soundEnabled && soundEffectEnabled}
                            onCheckedChange={setSoundEffectEnabled}
                        />
                    </div>

                    {soundEnabled && soundEffectEnabled && (
                        <div className="flex items-center justify-between rounded-[16px] px-4 py-3 bg-surface-inset">
                            <div className="flex flex-col w-full gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-foreground">Sound Effects Volume</span>
                                    <span className="font-mono text-xs tabular-nums text-foreground">{soundEffectVolume}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={soundEffectVolume ?? 80}
                                    onChange={(e) => setSoundEffectVolume(parseInt(e.target.value, 10))}
                                    className="w-full h-1.5 rounded-full bg-surface-inset accent-foreground cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={playTestSoundEffect}
                        disabled={!soundEnabled || !soundEffectEnabled}
                        className={cn(
                            "w-full py-2.5 rounded-[12px] font-medium text-xs border transition-all duration-300 ease-out flex items-center justify-center gap-2",
                            soundEnabled && soundEffectEnabled
                                ? "border-border bg-surface text-foreground hover:bg-surface/80 cursor-pointer active:scale-95"
                                : "border-border/50 bg-surface-inset text-muted-foreground cursor-not-allowed opacity-50"
                        )}
                    >
                        <Volume1 className="w-4 h-4" />
                        Test Sound Effect
                    </button>
                </div>
            </Card>

            {/* Data Hub Section */}
            <Card className="p-5 bg-card border border-border flex flex-col gap-4 rounded-[24px]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="w-[18px] h-[18px] text-foreground" />
                        <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">Data Hub</h3>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                        {sessions.length} sessions
                    </span>
                </div>
                {/* Import Dropzone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "p-4 rounded-[16px] border border-dashed transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center",
                        isDragging
                            ? "border-primary bg-surface text-foreground"
                            : "border-border bg-surface-inset hover:bg-surface text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Upload className="w-5 h-5 mb-0.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Import JSON Backup</span>
                    <span className="text-[11px] text-muted-foreground">
                        Drop JSON backup file here or click to browse
                    </span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileInput}
                        className="hidden"
                    />
                </div>

                {/* Export Buttons */}
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        Export Records
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={handleExportJson}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] text-xs font-medium bg-surface-inset border border-border hover:bg-surface text-foreground transition-all cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5 text-muted-foreground" />
                            JSON
                        </button>
                        <button
                            onClick={handleExportCsv}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] text-xs font-medium bg-surface-inset border border-border hover:bg-surface text-foreground transition-all cursor-pointer"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />
                            CSV
                        </button>
                        <button
                            onClick={handleExportMarkdown}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] text-xs font-medium bg-surface-inset border border-border hover:bg-surface text-foreground transition-all cursor-pointer"
                        >
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                            Markdown
                        </button>
                    </div>
                </div>

                {/* Status Feedback */}
                {statusMessage && (
                    <div
                        className={cn(
                            "px-3 py-2 rounded-[10px] text-xs border font-medium flex items-center gap-2",
                            statusMessage.type === "success"
                                ? "bg-surface-inset text-foreground border-border"
                                : "bg-destructive/15 text-destructive border-destructive/30"
                        )}
                    >
                        {statusMessage.type === "success" ? (
                            <Check className="w-3.5 h-3.5 text-foreground" />
                        ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                        )}
                        <span>{statusMessage.text}</span>
                    </div>
                )}

                {/* Reset All Data (Danger) */}
                <div className="pt-2 border-t border-border">
                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to reset all data to defaults? This action cannot be undone.")) {
                                resetAllData();
                            }
                        }}
                        className="w-full py-2.5 rounded-[10px] font-medium text-xs border border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25 transition-all cursor-pointer"
                    >
                        Reset All Data
                    </button>
                </div>
            </Card>

            {/* About Section */}
            <Card className="p-5 bg-card border border-border flex flex-col gap-3 rounded-[24px]">
                <div className="flex items-center gap-2">
                    <Info className="w-[18px] h-[18px] text-foreground" />
                    <h3 className="text-[15px] font-medium tracking-[-0.015em] text-foreground">About</h3>
                </div>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-surface-inset rounded-[16px] px-4 py-3">
                        <span className="font-medium text-foreground">Version</span>
                        <span className="font-mono text-muted-foreground tabular-nums">v0.0.1</span>
                    </div>

                    <div className="bg-surface-inset rounded-[16px] p-3.5 text-muted-foreground leading-relaxed">
                        Focus is a minimalist, monochrome productivity suite designed to keep you in flow state. Features a count-up flow timer, productivity analytics, and ambient audio.
                    </div>

                    <a
                        href="https://github.com/YogaDharma21/focus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 rounded-[12px] font-medium text-xs flex items-center justify-between border border-border bg-surface hover:bg-surface/80 text-foreground transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Github className="w-4 h-4" />
                            <span>GitHub Repository</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                </div>
            </Card>
        </div>
    );
}
