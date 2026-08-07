"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Smile, ChevronLeft, ChevronRight, Sparkles, Trash2, Calendar as CalendarIcon, Info, CalendarDays } from "lucide-react";
import { format, isValid, getDaysInMonth } from "date-fns";
import { cn } from "@/lib/utils";

export type MoodType = "amazing" | "ok" | "tired" | "sad" | "stressed";

export interface MoodConfig {
    key: MoodType;
    label: string;
    emoji: string;
    color: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    ringClass: string;
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
    amazing: {
        key: "amazing",
        label: "Amazing",
        emoji: "😊",
        color: "#10b981", // emerald-500
        bgClass: "bg-emerald-500 hover:bg-emerald-400",
        borderClass: "border-emerald-500",
        textClass: "text-emerald-400",
        ringClass: "ring-emerald-400",
    },
    ok: {
        key: "ok",
        label: "OK",
        emoji: "🙂",
        color: "#38bdf8", // sky-400
        bgClass: "bg-sky-400 hover:bg-sky-300",
        borderClass: "border-sky-400",
        textClass: "text-sky-300",
        ringClass: "ring-sky-300",
    },
    tired: {
        key: "tired",
        label: "Tired",
        emoji: "😴",
        color: "#fbbf24", // amber-400
        bgClass: "bg-amber-400 hover:bg-amber-300",
        borderClass: "border-amber-400",
        textClass: "text-amber-300",
        ringClass: "ring-amber-300",
    },
    sad: {
        key: "sad",
        label: "Sad",
        emoji: "😔",
        color: "#6366f1", // indigo-500
        bgClass: "bg-indigo-500 hover:bg-indigo-400",
        borderClass: "border-indigo-500",
        textClass: "text-indigo-300",
        ringClass: "ring-indigo-300",
    },
    stressed: {
        key: "stressed",
        label: "Stressed",
        emoji: "😤",
        color: "#f43f5e", // rose-500
        bgClass: "bg-rose-500 hover:bg-rose-400",
        borderClass: "border-rose-500",
        textClass: "text-rose-400",
        ringClass: "ring-rose-400",
    },
};

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const FULL_MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function normalizeMoodKey(rawMood: string | undefined): MoodType | null {
    if (!rawMood) return null;
    if (rawMood === "amazing" || rawMood === "😊" || rawMood === "🤩" || rawMood === "Happy" || rawMood === "Excited") return "amazing";
    if (rawMood === "ok" || rawMood === "🙂" || rawMood === "😐" || rawMood === "Okay") return "ok";
    if (rawMood === "tired" || rawMood === "😴" || rawMood === "Tired") return "tired";
    if (rawMood === "sad" || rawMood === "😔" || rawMood === "Sad") return "sad";
    if (rawMood === "stressed" || rawMood === "😤" || rawMood === "Stressed") return "stressed";
    return null;
}

export function MoodTracker() {
    const { moodNotes, setMoodForDate, cycleMoodForDate, deleteMoodNote } = useAppStore();
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    
    const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
    const [selectedDateKey, setSelectedDateKey] = useState<string>(todayStr);
    const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
    const [descriptionText, setDescriptionText] = useState("");
    const [hoveredDateInfo, setHoveredDateInfo] = useState<{
        dateStr: string;
        formattedDate: string;
        moodKey: MoodType | null;
        text?: string;
    } | null>(null);

    // Get note for currently selected date
    const selectedDateNote = moodNotes.find((n) => n.date.slice(0, 10) === selectedDateKey);
    const currentSelectedMoodKey = normalizeMoodKey(selectedDateNote?.mood);

    // Sync input form whenever selectedDateKey changes or store updates
    useEffect(() => {
        setSelectedMood(currentSelectedMoodKey);
        setDescriptionText(selectedDateNote?.text || "");
    }, [selectedDateKey, selectedDateNote?.mood, selectedDateNote?.text]);

    const handleSaveMood = () => {
        const moodToSave = selectedMood || currentSelectedMoodKey || "amazing";
        setMoodForDate(selectedDateKey, moodToSave, descriptionText.trim());
    };

    const isTodaySelected = selectedDateKey === todayStr;

    // Helper to format selected date label
    const getFormattedSelectedDate = () => {
        try {
            const parts = selectedDateKey.split("-").map(Number);
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            return format(dateObj, "EEEE, MMMM d, yyyy");
        } catch {
            return selectedDateKey;
        }
    };

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
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Input & Detail Inspector Card for Selected Date */}
            <Card className="p-6 bg-card/50 border-0 shadow-md backdrop-blur-xl rounded-[var(--radius)] space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Smile className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">
                            Log Mood {isTodaySelected ? "(Today)" : `for ${format(new Date(selectedDateKey.replace(/-/g, "/")), "MMM d")}`}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium bg-background/60 px-3 py-1 rounded-full border border-border/40">
                            {getFormattedSelectedDate()}
                        </span>
                        {!isTodaySelected && (
                            <button
                                onClick={() => {
                                    setSelectedDateKey(todayStr);
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
                                    "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 border group",
                                    isSelected
                                        ? `${cfg.bgClass} text-white shadow-lg scale-105 border-transparent`
                                        : "bg-background/40 hover:bg-background/80 border-border/40 text-foreground"
                                )}
                            >
                                <span className="text-2xl sm:text-3xl transition-transform duration-200 group-hover:scale-110">
                                    {cfg.emoji}
                                </span>
                                <span className={cn(
                                    "text-xs font-medium mt-1.5",
                                    isSelected ? "text-white font-semibold" : "text-muted-foreground group-hover:text-foreground"
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
                            <span>Logged as <strong className={MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].textClass}>{MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].label} {MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].emoji}</strong></span>
                            {selectedDateNote.text && <span className="italic truncate max-w-[200px]">"{selectedDateNote.text}"</span>}
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
                        <span className="text-xs text-muted-foreground">No mood logged for this date yet</span>
                    )}

                    <Button
                        onClick={handleSaveMood}
                        className="ml-auto flex items-center gap-2"
                        size="sm"
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
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            Yearly Mood Tracker
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            <strong>Single click</strong> to select date & edit. <strong>Double click</strong> to cycle mood.
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
                                                    setSelectedDateKey(dateKey);
                                                }}
                                                onDoubleClick={(e) => {
                                                    e.preventDefault();
                                                    cycleMoodForDate(dateKey);
                                                }}
                                                onMouseEnter={() => {
                                                    const formattedDate = format(new Date(selectedYear, monthIdx, dayNum), "MMM d, yyyy");
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
                                                    isSelectedCell && "ring-2 ring-white border-2 border-white scale-110 z-30 shadow-md",
                                                    isCellToday && !isSelectedCell && "ring-2 ring-primary/80 ring-offset-1 ring-offset-background z-20"
                                                )}
                                                title={`${format(new Date(selectedYear, monthIdx, dayNum), "MMM d, yyyy")}${cfg ? `: ${cfg.label} ${cfg.emoji}` : ": Empty (1 click: Select date | 2 clicks: Cycle mood)"}${noteObj?.text ? ` - "${noteObj.text}"` : ""}`}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Info Banner */}
                <div className="min-h-[44px] flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/40 text-xs">
                    {hoveredDateInfo ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{hoveredDateInfo.formattedDate}:</span>
                                {hoveredDateInfo.moodKey ? (
                                    <span className={cn("font-medium flex items-center gap-1", MOOD_CONFIGS[hoveredDateInfo.moodKey].textClass)}>
                                        {MOOD_CONFIGS[hoveredDateInfo.moodKey].emoji} {MOOD_CONFIGS[hoveredDateInfo.moodKey].label}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground italic">No mood logged</span>
                                )}
                                {hoveredDateInfo.text && (
                                    <span className="text-foreground/80 italic ml-2 max-w-[300px] truncate">
                                        "{hoveredDateInfo.text}"
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">1 Click: Select | 2 Clicks: Cycle</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Info className="w-4 h-4 text-primary/70" />
                            <span>1 click to select date & edit details. 2 clicks (double-click) to quick-cycle mood.</span>
                        </div>
                    )}
                </div>

                {/* Mood Legend & Yearly Summary */}
                <div className="pt-2 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {(Object.keys(MOOD_CONFIGS) as MoodType[]).map((key) => {
                            const cfg = MOOD_CONFIGS[key];
                            return (
                                <div key={key} className="flex items-center gap-1.5 text-xs">
                                    <span className={cn("w-3 h-3 rounded-[3px]", cfg.bgClass)} />
                                    <span className="text-muted-foreground">{cfg.label}</span>
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
