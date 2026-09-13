import React, { useState, useEffect, useMemo } from "react";
import { MoodNote } from "../../types";
import { format, isValid, getDaysInMonth } from "date-fns";
import { Smile, Meh, Moon, Frown, Zap, ChevronLeft, ChevronRight, Sparkles, Trash2, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { cn } from "../../lib/utils";

export type MoodType = "amazing" | "ok" | "tired" | "sad" | "stressed";

export interface MoodConfig {
  key: MoodType;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  bgClass: string;
  textClass: string;
  pillSelectedClass: string;
}

export const MOOD_CONFIGS: Record<MoodType, MoodConfig> = {
  amazing: {
    key: "amazing",
    label: "Amazing",
    emoji: "😊",
    icon: <Smile className="w-5 h-5" />,
    color: "var(--primary)",
    bgClass: "bg-primary hover:bg-primary/90",
    textClass: "text-primary-foreground font-semibold",
    pillSelectedClass: "bg-primary text-primary-foreground shadow-lg scale-105 border-primary font-bold",
  },
  ok: {
    key: "ok",
    label: "OK",
    emoji: "🙂",
    icon: <Meh className="w-5 h-5" />,
    color: "var(--muted-foreground)",
    bgClass: "bg-secondary hover:bg-secondary/80",
    textClass: "text-secondary-foreground font-semibold",
    pillSelectedClass: "bg-secondary text-secondary-foreground shadow-lg scale-105 border-secondary font-bold",
  },
  tired: {
    key: "tired",
    label: "Tired",
    emoji: "😴",
    icon: <Moon className="w-5 h-5" />,
    color: "var(--muted-foreground)",
    bgClass: "bg-muted hover:bg-muted/80",
    textClass: "text-muted-foreground font-semibold",
    pillSelectedClass: "bg-muted text-foreground shadow-lg scale-105 border-muted font-bold",
  },
  sad: {
    key: "sad",
    label: "Sad",
    emoji: "😔",
    icon: <Frown className="w-5 h-5" />,
    color: "var(--muted-foreground)",
    bgClass: "bg-accent hover:bg-accent/80",
    textClass: "text-accent-foreground font-semibold",
    pillSelectedClass: "bg-accent text-accent-foreground shadow-lg scale-105 border-accent font-bold",
  },
  stressed: {
    key: "stressed",
    label: "Stressed",
    emoji: "😤",
    icon: <Zap className="w-5 h-5" />,
    color: "var(--destructive)",
    bgClass: "bg-destructive/20 hover:bg-destructive/30",
    textClass: "text-destructive font-semibold",
    pillSelectedClass: "bg-destructive text-destructive-foreground shadow-lg scale-105 border-destructive font-bold",
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

interface MoodTrackerProps {
  moodNotes: MoodNote[];
  onSetMoodForDate: (dateKey: string, mood: string, text?: string) => void;
  onCycleMoodForDate: (dateKey: string) => void;
  onDeleteMoodNote: (id: string) => void;
}

export function MoodTracker({
  moodNotes,
  onSetMoodForDate,
  onCycleMoodForDate,
  onDeleteMoodNote,
}: MoodTrackerProps) {
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

  const notesMap = useMemo(() => {
    const map = new Map<string, MoodNote>();
    moodNotes.forEach((n) => {
      if (n?.date) {
        map.set(n.date.slice(0, 10), n);
      }
    });
    return map;
  }, [moodNotes]);

  const daysInMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => getDaysInMonth(new Date(selectedYear, monthIdx, 1)));
  }, [selectedYear]);

  const selectedDateNote = notesMap.get(selectedDateKey);
  const currentSelectedMoodKey = normalizeMoodKey(selectedDateNote?.mood);

  useEffect(() => {
    setSelectedMood(currentSelectedMoodKey);
    setDescriptionText(selectedDateNote?.text || "");
  }, [selectedDateKey, selectedDateNote?.mood, selectedDateNote?.text]);

  const handleSaveMood = () => {
    const moodToSave = selectedMood || currentSelectedMoodKey || "amazing";
    onSetMoodForDate(selectedDateKey, moodToSave, descriptionText.trim());
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

  const activeDateKey = hoveredDateInfo?.dateStr || selectedDateKey;
  const activeNoteObj = notesMap.get(activeDateKey);
  const activeMoodKey = normalizeMoodKey(activeNoteObj?.mood);
  const activeFormattedDate = formatDateShort(activeDateKey);

  const stats = useMemo(() => {
    const s: Record<MoodType, number> = {
      amazing: 0,
      ok: 0,
      tired: 0,
      sad: 0,
      stressed: 0,
    };
    moodNotes.forEach((n) => {
      if (!n?.date) return;
      const d = new Date(n.date);
      if (isValid(d) && d.getFullYear() === selectedYear) {
        const key = normalizeMoodKey(n.mood);
        if (key) s[key]++;
      }
    });
    return s;
  }, [moodNotes, selectedYear]);

  const totalTrackedDays = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto stable-scrollbar">
      {/* Quick Input & Inspector Card */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
        "bg-card border-border"
      }`}>
        {/* Clean Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold font-mono text-xs whitespace-nowrap min-w-0">
            <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground shrink-0">
              <Smile className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">LOG MOOD</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${
              "bg-secondary border-border text-foreground"
            }`}>
              {formatDateShort(selectedDateKey)}
            </span>
            {!isTodaySelected && (
              <button
                onClick={() => {
                  setSelectedDateKey(todayStr);
                  setSelectedYear(today.getFullYear());
                }}
                className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap transition-all ${
                  "bg-primary/10 text-foreground border-primary/20 hover:bg-primary/20"
                }`}
                title="Go to today"
              >
                <CalendarDays className="w-3 h-3" />
                Today
              </button>
            )}
          </div>
        </div>

        {/* 5 Mood Selection Buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {(Object.keys(MOOD_CONFIGS) as MoodType[]).map((key) => {
            const cfg = MOOD_CONFIGS[key];
            const isSelected = selectedMood === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMood(key)}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border transition-all text-xs group",
                  isSelected
                    ? cfg.pillSelectedClass
                    : "bg-secondary/60 hover:bg-secondary border-border/60 text-foreground"
                )}
              >
                <span className="transition-transform duration-200 group-hover:scale-110">
                  {cfg.icon}
                </span>
                <span className="text-[9px] font-medium mt-0.5">
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Description Text Area */}
        <textarea
          placeholder="Optional reflection: What made you feel this way?"
          rows={2}
          value={descriptionText}
          onChange={(e) => setDescriptionText(e.target.value)}
          className={`w-full p-2 rounded-lg text-xs border focus:outline-none ${
            "bg-background border-border text-foreground placeholder-muted-foreground focus:border-foreground"
          }`}
        />

        <div className="flex items-center justify-between text-xs pt-0.5">
          {selectedDateNote ? (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate max-w-[210px]">
              <span>Logged: <strong className={MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].textClass}>{MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].label}</strong></span>
              {selectedDateNote.text && <span className="italic truncate">"{selectedDateNote.text}"</span>}
              <button
                onClick={() => {
                  onDeleteMoodNote(selectedDateNote.id);
                  setSelectedMood(null);
                  setDescriptionText("");
                }}
                className="text-muted-foreground hover:text-rose-500 transition-colors ml-1 p-0.5 flex-shrink-0"
                title="Clear mood note"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground italic">No mood logged for this date</span>
          )}

          <button
            type="button"
            onClick={handleSaveMood}
            className={`ml-auto px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 flex-shrink-0 ${
              "bg-primary text-primary-foreground border-primary hover:bg-accent"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Save Mood
          </button>
        </div>
      </div>

      {/* Yearly Pixel Grid Card */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
        "bg-card border-border"
      }`}>
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2 text-xs font-bold font-mono">
            <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground shrink-0">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <span>YEARLY MOOD TRACKER</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className={`p-1 rounded hover:bg-secondary transition-colors ${"text-muted-foreground hover:text-foreground"}`}
              title="Previous year"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
              "bg-background border-border text-foreground"
            }`}>
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear((y) => y + 1)}
              className={`p-1 rounded hover:bg-secondary transition-colors ${"text-muted-foreground hover:text-foreground"}`}
              title="Next year"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {selectedYear !== today.getFullYear() && (
              <button
                onClick={() => {
                  setSelectedYear(today.getFullYear());
                  setSelectedDateKey(todayStr);
                }}
                className="text-[10px] text-primary hover:underline ml-1 font-mono"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* 12 Months x 31 Days Pixel Grid */}
        <div className="overflow-x-auto pb-1">
          <div className="w-full flex flex-col items-center">
            {/* Header Months J F M A M J J A S O N D */}
            <div className="grid grid-cols-[20px_repeat(12,1fr)] gap-[2px] w-full text-center text-[9px] font-mono font-bold text-muted-foreground mb-1">
              <div className="w-5"></div>
              {MONTH_LABELS.map((m, idx) => (
                <div key={idx} className="w-full flex items-center justify-center" title={FULL_MONTH_NAMES[idx]}>
                  {m}
                </div>
              ))}
            </div>

            {/* Rows 1..31 */}
            {Array.from({ length: 31 }, (_, dayIdx) => {
              const dayNum = dayIdx + 1;
              return (
                <div key={dayNum} className="grid grid-cols-[20px_repeat(12,1fr)] gap-[2px] w-full items-center my-[1px]">
                  <div className="text-[8px] font-mono text-muted-foreground text-right pr-1 select-none">
                    {dayNum < 10 ? `0${dayNum}` : dayNum}
                  </div>

                  {Array.from({ length: 12 }, (_, monthIdx) => {
                    const monthDaysCount = daysInMonths[monthIdx];
                    const isValidDay = dayNum <= monthDaysCount;
                    
                    const monthStr = (monthIdx + 1).toString().padStart(2, "0");
                    const dayStr = dayNum.toString().padStart(2, "0");
                    const dateKey = `${selectedYear}-${monthStr}-${dayStr}`;

                    const noteObj = notesMap.get(dateKey);
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
                          className="aspect-square w-full rounded-[2px] bg-secondary/10 opacity-10 pointer-events-none"
                        />
                      );
                    }

                    return (
                      <button
                        key={monthIdx}
                        type="button"
                        onClick={() => setSelectedDateKey(dateKey)}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          onCycleMoodForDate(dateKey);
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
                          "aspect-square w-full rounded-[2px] transition-all cursor-pointer relative group",
                          cfg
                            ? `${cfg.bgClass} shadow-sm scale-100 hover:scale-125 z-10`
                            : "bg-secondary/40 hover:bg-secondary/60 border border-border/30",
                          isSelectedCell && "ring-2 ring-white border border-white scale-110 z-30 shadow-md",
                          isCellToday && !isSelectedCell && "ring-1 ring-primary/80 ring-offset-1 ring-offset-black z-20"
                        )}
                        title={`${formatDateShort(dateKey)}${cfg ? `: ${cfg.label}` : ": Empty (1 click: Select | 2 clicks: Cycle)"}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Info Banner */}
        <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
          "bg-background/60 border-border text-foreground"
        }`}>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="font-bold text-xs whitespace-nowrap">{activeFormattedDate}:</span>
            {activeMoodKey ? (
              <span className={cn("font-semibold text-xs flex items-center gap-1 whitespace-nowrap", MOOD_CONFIGS[activeMoodKey].textClass)}>
                <span className="w-3.5 h-3.5">{MOOD_CONFIGS[activeMoodKey].icon}</span>
                <span>{MOOD_CONFIGS[activeMoodKey].label}</span>
              </span>
            ) : (
              <span className="text-muted-foreground italic text-[11px] whitespace-nowrap">No mood logged</span>
            )}
            {activeNoteObj?.text && (
              <span className="text-muted-foreground italic text-[11px] truncate max-w-[150px]">
                "{activeNoteObj.text}"
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap flex-shrink-0 ml-1">1 Click: Select | 2 Clicks: Cycle</span>
        </div>

        {/* Legend & Stats Footer - Clean, Non-wrapping Flex Layout */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(MOOD_CONFIGS) as MoodType[]).map((key) => {
              const cfg = MOOD_CONFIGS[key];
              return (
                <div key={key} className="flex items-center gap-1 whitespace-nowrap">
                  <span className={cn("w-2.5 h-2.5 rounded-[2px]", cfg.bgClass)} />
                  <span className="text-muted-foreground text-[9px]">{cfg.label}</span>
                  <span className="font-bold text-[9px]">({stats[key]})</span>
                </div>
              );
            })}
          </div>
          <div className="text-muted-foreground whitespace-nowrap flex-shrink-0">Total Tracked: <strong className="text-foreground">{totalTrackedDays}</strong></div>
        </div>
      </div>
    </div>
  );
}
