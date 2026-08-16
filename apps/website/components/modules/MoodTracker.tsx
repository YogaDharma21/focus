"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Smile, Meh, Moon, Frown, Zap, ChevronLeft, ChevronRight, Sparkles, Trash2, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { format, isValid, getDaysInMonth } from "date-fns";
import { cn } from "@/lib/utils";

export type MoodType = "amazing" | "ok" | "tired" | "sad" | "stressed";

export interface MoodConfig {
    key: MoodType;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    ringClass: string;
    pillSelectedClass: string;
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
    amazing: {
        key: "amazing",
        label: "Amazing",
        icon: <Smile className="w-5 h-5" />,
        color: "#ffffff",
        bgClass: "bg-white hover:bg-slate-100",
        borderClass: "border-white",
        textClass: "text-white font-semibold",
        ringClass: "ring-white",
        pillSelectedClass: "bg-white text-slate-950 shadow-lg scale-105 border-white font-bold",
    },
    ok: {
        key: "ok",
        label: "OK",
        icon: <Meh className="w-5 h-5" />,
        color: "#cbd5e1",
        bgClass: "bg-slate-300 hover:bg-slate-200",
        borderClass: "border-slate-300",
        textClass: "text-slate-300 font-semibold",
        ringClass: "ring-slate-300",
        pillSelectedClass: "bg-slate-300 text-slate-950 shadow-lg scale-105 border-slate-300 font-bold",
    },
    tired: {
        key: "tired",
        label: "Tired",
        icon: <Moon className="w-5 h-5" />,
        color: "#64748b",
        bgClass: "bg-slate-500 hover:bg-slate-400",
        borderClass: "border-slate-500",
        textClass: "text-slate-400 font-semibold",
        ringClass: "ring-slate-400",
        pillSelectedClass: "bg-slate-500 text-white shadow-lg scale-105 border-slate-500 font-bold",
    },
    sad: {
        key: "sad",
        label: "Sad",
        icon: <Frown className="w-5 h-5" />,
        color: "#334155",
        bgClass: "bg-slate-700 hover:bg-slate-600",
        borderClass: "border-slate-700",
        textClass: "text-slate-300 font-semibold",
        ringClass: "ring-slate-600",
        pillSelectedClass: "bg-slate-700 text-white shadow-lg scale-105 border-slate-700 font-bold",
    },
    stressed: {
        key: "stressed",
        label: "Stressed",
        icon: <Zap className="w-5 h-5" />,
        color: "#1e293b",
        bgClass: "bg-slate-800 hover:bg-slate-700",
        borderClass: "border-slate-800",
        textClass: "text-slate-300 font-semibold",
        ringClass: "ring-slate-700",
        pillSelectedClass: "bg-slate-800 text-white shadow-lg scale-105 border-slate-800 font-bold",
    },
};

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const FULL_MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function normalizeMoodKey(rawMood: string | undefined): MoodType | null {
    if (!rawMood) return null;
    const lower = rawMood.toLowerCase();
    if (lower === "amazing" || lower === "great" || lower === "⚡" || rawMood === "Amazing" || rawMood === "😊" || rawMood === "🤩") return "amazing";
    if (lower === "ok" || lower === "good" || lower === "okay" || lower === "happy" || rawMood === "OK" || rawMood === "Okay" || rawMood === "🙂" || rawMood === "😐") return "ok";
    if (lower === "tired" || rawMood === "Tired" || rawMood === "😴") return "tired";
    if (lower === "sad" || rawMood === "Sad" || rawMood === "😔") return "sad";
    if (lower === "stressed" || rawMood === "Stressed" || rawMood === "😤") return "stressed";
    return null;
}

export function MoodTracker() {
    const { moodNotes, setMoodForDate, cycleMoodForDate, deleteMoodNote } =
        useAppStore(
            useShallow((s) => ({
                moodNotes: s.moodNotes,
                setMoodForDate: s.setMoodForDate,
                cycleMoodForDate: s.cycleMoodForDate,
                deleteMoodNote: s.deleteMoodNote,
            }))
        );
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    
    const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
    const [selectedDateKey, setSelectedDateKey] = useState<string>(todayStr);
    
    const initialNote = moodNotes.find((n) => n.date.slice(0, 10) === todayStr);
    const [selectedMood, setSelectedMood] = useState<MoodType | null>(() => normalizeMoodKey(initialNote?.mood));
    const [descriptionText, setDescriptionText] = useState(() => initialNote?.text || "");
    const [hoveredDateInfo, setHoveredDateInfo] = useState<{
        dateStr: string;
        formattedDate: string;
        moodKey: MoodType | null;
        text?: string;
    } | null>(null);

    // Get note for currently selected date
    const selectedDateNote = moodNotes.find((n) => n.date.slice(0, 10) === selectedDateKey);
    const currentSelectedMoodKey = normalizeMoodKey(selectedDateNote?.mood);

    const handleSelectDate = (dateStr: string) => {
        setSelectedDateKey(dateStr);
        const note = moodNotes.find((n) => n.date.slice(0, 10) === dateStr);
        setSelectedMood(normalizeMoodKey(note?.mood));
        setDescriptionText(note?.text || "");
    };

    const handleSaveMood = () => {
        const moodToSave = selectedMood || currentSelectedMoodKey || "amazing";
        setMoodForDate(selectedDateKey, moodToSave, descriptionText.trim());
    };

    const isTodaySelected = selectedDateKey === todayStr;

    const formatDateShort = (dateKey: string) => {
        try {
            const parts = dateKey.split("-").map(Number);
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            return format(dateObj, "MMM d, yyyy");
        } catch {
            return dateKey;
        }
    };

    const getFormattedSelectedDate = () => {
        try {
            const parts = selectedDateKey.split("-").map(Number);
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            return format(dateObj, "EEEE, MMMM d, yyyy");
        } catch {
            return selectedDateKey;
        }
    };

    // Calculate active date info for bottom banner (hovered date or clicked/selected date)
    const activeDateKey = hoveredDateInfo?.dateStr || selectedDateKey;
    const activeNoteObj = moodNotes.find((n) => n.date.slice(0, 10) === activeDateKey);
    const activeMoodKey = normalizeMoodKey(activeNoteObj?.mood);
    const activeFormattedDate = formatDateShort(activeDateKey);

    // Calculate mood stats for selected year
    const yearNotes = moodNotes.filter((n) => {
        const d = new Date(n.date);
        return isValid(d) && d.getFullYear() === selectedYear;
    });

    const stats: Record<MoodType, number> = {
        amazing: 0,
        ok: 0,
        tired: 0,
        sad: 0,
        stressed: 0,
    };

    yearNotes.forEach((n) => {
        const key = normalizeMoodKey(n.mood);
        if (key) {
            stats[key]++;
        }
    });

    const totalTrackedDays = Object.values(stats).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            {/* Top Interactive Logger Card */}
            <Card className="p-6 bg-card/50 border-0 shadow-md backdrop-blur-xl rounded-[var(--radius)] space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                            <Smile className="w-4 h-4" />
                        </div>
                        <h2 className="font-semibold text-lg text-foreground">
                            Log Mood {isTodaySelected ? "(Today)" : `for ${formatDateShort(selectedDateKey)}`}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium bg-background/60 px-3 py-1 rounded-full border border-border/40">
                            {getFormattedSelectedDate()}
                        </span>
                        {!isTodaySelected && (
                            <button
                                onClick={() => {
                                    handleSelectDate(todayStr);
                                    setSelectedYear(today.getFullYear());
                                }}
                                className="flex items-center gap-1 text-xs text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20"
                                title="Go to today"
                            >
                                <CalendarDays className="w-3.5 h-3.5" />
                                Today
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {(Object.keys(MOOD_CONFIGS) as MoodType[]).map((key) => {
                        const cfg = MOOD_CONFIGS[key];
                        const isSelected = selectedMood === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedMood(key)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 border group cursor-pointer",
                                    isSelected
                                        ? cfg.pillSelectedClass
                                        : "bg-neutral-800/40 hover:bg-neutral-800 border-neutral-700/60 text-white"
                                )}
                            >
                                <span className="transition-transform duration-200 group-hover:scale-110">
                                    {cfg.icon}
                                </span>
                                <span className={cn(
                                    "text-xs font-medium mt-1.5",
                                    isSelected ? "font-bold" : "text-neutral-400 group-hover:text-white"
                                )}>
                                    {cfg.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <Textarea
                    placeholder="Optional description: What made you feel this way?"
                    className="resize-none bg-background/50 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/40 text-sm min-h-[80px] rounded-xl"
                    value={descriptionText}
                    onChange={(e) => setDescriptionText(e.target.value)}
                />

                <div className="flex items-center justify-between pt-1">
                    {selectedDateNote ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Logged as <strong className={cn("inline-flex items-center gap-1", MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].textClass)}>{React.isValidElement(MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].icon) ? React.cloneElement(MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5 inline" }) : null} {MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].label}</strong></span>
                            {selectedDateNote.text && <span className="italic truncate max-w-[200px]">&ldquo;{selectedDateNote.text}&rdquo;</span>}
                            <button
                                onClick={() => {
                                    deleteMoodNote(selectedDateNote.id);
                                    setSelectedMood(null);
                                    setDescriptionText("");
                                }}
                                className="text-muted-foreground hover:text-rose-500 transition-colors ml-1 p-1"
                                title="Clear mood for this date"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground/60 italic">No mood saved yet for this date</span>
                    )}

                    <Button
                        size="sm"
                        onClick={handleSaveMood}
                        className="rounded-xl px-5 text-xs font-semibold shadow"
                    >
                        <Sparkles className="w-4 h-4" />
                        Save Mood
                    </Button>
                </div>
            </Card>

            {/* Yearly Pixel Grid Container */}
            <Card className="p-6 bg-card/50 border-0 shadow-md backdrop-blur-xl rounded-[var(--radius)] space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                            Yearly Mood Tracker
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            <strong>1 click</strong> to select date & view details below. <strong>2 clicks</strong> to cycle mood.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            onClick={() => setSelectedYear((y) => y - 1)}
                            className="p-1.5 rounded-lg hover:bg-background/80 transition-colors text-muted-foreground hover:text-foreground"
                            title="Previous Year"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-base px-2 py-0.5 bg-background/60 rounded-md border border-border/40">
                            {selectedYear}
                        </span>
                        <button
                            onClick={() => setSelectedYear((y) => y + 1)}
                            className="p-1.5 rounded-lg hover:bg-background/80 transition-colors text-muted-foreground hover:text-foreground"
                            title="Next Year"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {selectedYear !== today.getFullYear() && (
                            <button
                                onClick={() => {
                                    setSelectedYear(today.getFullYear());
                                    setSelectedDateKey(todayStr);
                                }}
                                className="text-xs text-primary hover:underline ml-2"
                            >
                                Current Year
                            </button>
                        )}
                    </div>
                </div>

                {/* 12 Month x 31 Day Grid Display */}
                <div className="overflow-x-auto pb-2">
                    <div className="min-w-[320px] max-w-full mx-auto flex flex-col items-center">
                        {/* Month Header Row */}
                        <div className="grid grid-cols-[30px_repeat(12,1fr)] gap-1 w-full text-center text-xs font-semibold text-muted-foreground mb-2">
                            <div className="w-7"></div>
                            {MONTH_LABELS.map((m, idx) => (
                                <div key={idx} className="w-full flex items-center justify-center py-1" title={FULL_MONTH_NAMES[idx]}>
                                    {m}
                                </div>
                            ))}
                        </div>

                        {/* Day Rows 1..31 */}
                        {Array.from({ length: 31 }, (_, dayIdx) => {
                            const dayNum = dayIdx + 1;
                            return (
                                <div
                                    key={dayNum}
                                    className="grid grid-cols-[30px_repeat(12,1fr)] gap-1 w-full items-center my-[1.5px]"
                                >
                                    {/* Row Day Number Label */}
                                    <div className="text-[10px] font-mono text-muted-foreground/70 text-right pr-2 select-none">
                                        {dayNum < 10 ? `0${dayNum}` : dayNum}
                                    </div>

                                    {/* 12 Month Cells for this Day */}
                                    {Array.from({ length: 12 }, (_, monthIdx) => {
                                        const monthDaysCount = getDaysInMonth(new Date(selectedYear, monthIdx, 1));
                                        const isValidDay = dayNum <= monthDaysCount;
                                        
                                        const monthStr = (monthIdx + 1).toString().padStart(2, "0");
                                        const dayStr = dayNum.toString().padStart(2, "0");
                                        const dateKey = `${selectedYear}-${monthStr}-${dayStr}`;

                                        const noteObj = moodNotes.find((n) => n.date.slice(0, 10) === dateKey);
                                        const moodKey = normalizeMoodKey(noteObj?.mood);
                                        const cfg = moodKey ? MOOD_CONFIGS[moodKey] : null;

                                        const isSelectedCell = selectedDateKey === dateKey;
                                        const isCellToday = selectedYear === today.getFullYear() &&
                                            monthIdx === today.getMonth() &&
                                            dayNum === today.getDate();

                                        if (!isValidDay) {
                                            return (
                                                <div
                                                    key={monthIdx}
                                                    className="aspect-square w-full rounded-[3px] bg-muted/10 opacity-20 pointer-events-none"
                                                />
                                            );
                                        }

                                        return (
                                            <button
                                                key={monthIdx}
                                                type="button"
                                                onClick={() => {
                                                    handleSelectDate(dateKey);
                                                }}
                                                onDoubleClick={(e) => {
                                                    e.preventDefault();
                                                    cycleMoodForDate(dateKey);
                                                }}
                                                onMouseEnter={() => {
                                                    const formattedDate = formatDateShort(dateKey);
                                                    setHoveredDateInfo({
                                                        dateStr: dateKey,
                                                        formattedDate,
                                                        moodKey,
                                                        text: noteObj?.text,
                                                    });
                                                }}
                                                onMouseLeave={() => setHoveredDateInfo(null)}
                                                className={cn(
                                                    "aspect-square w-full rounded-[4px] transition-all duration-150 cursor-pointer relative group",
                                                    cfg
                                                        ? `${cfg.bgClass} shadow-sm scale-100 hover:scale-125 z-10`
                                                        : "bg-muted/20 hover:bg-muted/50 border border-border/20 hover:border-primary/40",
                                                    isSelectedCell && "ring-2 ring-primary border-2 border-primary scale-110 z-30 shadow-md",
                                                    isCellToday && !isSelectedCell && "ring-2 ring-primary/60 ring-offset-1 ring-offset-background z-20"
                                                )}
                                                title={`${formatDateShort(dateKey)}${cfg ? `: ${cfg.label}` : ": Empty (1 click: Select date | 2 clicks: Cycle mood)"}${noteObj?.text ? ` - "${noteObj.text}"` : ""}`}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Selected/Active Date Info Banner */}
                <div className="min-h-[44px] flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/40 text-xs">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-foreground text-sm">{activeFormattedDate}:</span>
                            {activeMoodKey ? (
                                <span className={cn("font-semibold text-sm flex items-center gap-1.5", MOOD_CONFIGS[activeMoodKey].textClass)}>
                                    <span className="text-base">{MOOD_CONFIGS[activeMoodKey].icon}</span>
                                    <span>{MOOD_CONFIGS[activeMoodKey].label}</span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground italic">No mood logged</span>
                            )}
                            {activeNoteObj?.text && (
                                <span className="text-foreground/80 italic ml-2 max-w-[300px] truncate bg-background/50 px-2 py-0.5 rounded border border-border/30">
                                    &ldquo;{activeNoteObj.text}&rdquo;
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">1 Click: Select Date | 2 Clicks: Cycle Mood</span>
                    </div>
                </div>

                {/* Mood Legend & Yearly Summary */}
                <div className="pt-2 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {(Object.keys(MOOD_CONFIGS) as MoodType[]).map((key) => {
                            const cfg = MOOD_CONFIGS[key];
                            return (
                                <div key={key} className="flex items-center gap-1.5 text-xs">
                                    <span className={cn("w-3.5 h-3.5 rounded-[3px]", cfg.bgClass)} />
                                    <span className="text-muted-foreground font-medium">{cfg.label}</span>
                                    <span className="font-mono text-[10px] font-semibold text-foreground/80">({stats[key]})</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Total tracked days in {selectedYear}: <strong className="text-foreground">{totalTrackedDays}</strong>
                    </div>
                </div>
            </Card>
        </div>
    );
}
