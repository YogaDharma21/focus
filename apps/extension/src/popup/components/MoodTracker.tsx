import React, { useState, useEffect } from "react";
import { MoodNote } from "../../types";
import { format, isValid, getDaysInMonth } from "date-fns";
import { Smile, ChevronLeft, ChevronRight, Sparkles, Trash2, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { cn } from "../../lib/utils";

export type MoodType = "amazing" | "ok" | "tired" | "sad" | "stressed";

export interface MoodConfig {
  key: MoodType;
  label: string;
  emoji: string;
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
    color: "#ffffff",
    bgClass: "bg-white hover:bg-slate-100",
    textClass: "text-white font-semibold",
    pillSelectedClass: "bg-white text-slate-950 shadow-lg scale-105 border-white font-bold",
  },
  ok: {
    key: "ok",
    label: "OK",
    emoji: "🙂",
    color: "#cbd5e1",
    bgClass: "bg-slate-300 hover:bg-slate-200",
    textClass: "text-slate-300 font-semibold",
    pillSelectedClass: "bg-slate-300 text-slate-950 shadow-lg scale-105 border-slate-300 font-bold",
  },
  tired: {
    key: "tired",
    label: "Tired",
    emoji: "😴",
    color: "#64748b",
    bgClass: "bg-slate-500 hover:bg-slate-400",
    textClass: "text-slate-400 font-semibold",
    pillSelectedClass: "bg-slate-500 text-white shadow-lg scale-105 border-slate-500 font-bold",
  },
  sad: {
    key: "sad",
    label: "Sad",
    emoji: "😔",
    color: "#334155",
    bgClass: "bg-slate-700 hover:bg-slate-600",
    textClass: "text-slate-300 font-semibold",
    pillSelectedClass: "bg-slate-700 text-white shadow-lg scale-105 border-slate-700 font-bold",
  },
  stressed: {
    key: "stressed",
    label: "Stressed",
    emoji: "😤",
    color: "#1e293b",
    bgClass: "bg-slate-800 hover:bg-slate-700",
    textClass: "text-slate-300 font-semibold",
    pillSelectedClass: "bg-slate-800 text-white shadow-lg scale-105 border-slate-800 font-bold",
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
  isDark?: boolean;
}

export function MoodTracker({
  moodNotes,
  onSetMoodForDate,
  onCycleMoodForDate,
  onDeleteMoodNote,
  isDark = true,
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

  // Get note for currently selected date
  const selectedDateNote = moodNotes.find((n) => n.date.slice(0, 10) === selectedDateKey);
  const currentSelectedMoodKey = normalizeMoodKey(selectedDateNote?.mood);

  // Sync form state when selected date or note changes
  useEffect(() => {
    setSelectedMood(currentSelectedMoodKey);
    setDescriptionText(selectedDateNote?.text || "");
  }, [selectedDateKey, selectedDateNote?.mood, selectedDateNote?.text]);

  const handleSaveMood = () => {
    const moodToSave = selectedMood || currentSelectedMoodKey || "amazing";
    onSetMoodForDate(selectedDateKey, moodToSave, descriptionText.trim());
  };

  const isTodaySelected = selectedDateKey === todayStr;

  const formatDateStr = (dateKey: string) => {
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

  // Compute active date info for bottom banner
  const activeDateKey = hoveredDateInfo?.dateStr || selectedDateKey;
  const activeNoteObj = moodNotes.find((n) => n.date.slice(0, 10) === activeDateKey);
  const activeMoodKey = normalizeMoodKey(activeNoteObj?.mood);
  const activeFormattedDate = formatDateStr(activeDateKey);

  // Calculate stats for current year
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
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-0.5">
      {/* Quick Input & Inspector Card for Selected Date */}
      <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${
        isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
      }`}>
        <div className="flex items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold font-mono">
            <Smile className="w-3.5 h-3.5 text-primary" />
            <span>LOG MOOD {isTodaySelected ? "(TODAY)" : `(${formatDateStr(selectedDateKey)})`}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isDark ? "bg-neutral-800 border-neutral-700 text-neutral-300" : "bg-neutral-200 border-neutral-300 text-neutral-800"
            }`}>
              {getFormattedSelectedDate()}
            </span>
            {!isTodaySelected && (
              <button
                onClick={() => {
                  setSelectedDateKey(todayStr);
                  setSelectedYear(today.getFullYear());
                }}
                className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isDark ? "bg-white/10 text-white border-white/20 hover:bg-white/20" : "bg-black/10 text-black border-black/20 hover:bg-black/20"
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
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all text-xs group",
                  isSelected
                    ? cfg.pillSelectedClass
                    : isDark
                    ? "bg-neutral-800/60 hover:bg-neutral-800 border-neutral-700/60 text-white"
                    : "bg-white hover:bg-neutral-100 border-neutral-300 text-black"
                )}
              >
                <span className="text-xl transition-transform duration-200 group-hover:scale-110">
                  {cfg.emoji}
                </span>
                <span className="text-[10px] font-medium mt-0.5">
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reflection / Description Input */}
        <textarea
          placeholder="Optional reflection: What made you feel this way?"
          rows={2}
          value={descriptionText}
          onChange={(e) => setDescriptionText(e.target.value)}
          className={`w-full p-2 rounded-lg text-xs border focus:outline-none ${
            isDark
              ? "bg-black border-neutral-800 text-white placeholder-neutral-600 focus:border-white"
              : "bg-white border-neutral-300 text-black placeholder-neutral-400 focus:border-black"
          }`}
        />

        <div className="flex items-center justify-between text-xs pt-0.5">
          {selectedDateNote ? (
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 truncate max-w-[220px]">
              <span>Logged: <strong className={MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].textClass}>{MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].label} {MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].emoji}</strong></span>
              {selectedDateNote.text && <span className="italic truncate">"{selectedDateNote.text}"</span>}
              <button
                onClick={() => {
                  onDeleteMoodNote(selectedDateNote.id);
                  setSelectedMood(null);
                  setDescriptionText("");
                }}
                className="text-neutral-500 hover:text-rose-500 transition-colors ml-1 p-0.5"
                title="Clear mood note"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-neutral-500 italic">No mood logged for this date</span>
          )}

          <button
            type="button"
            onClick={handleSaveMood}
            className={`ml-auto px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
              isDark ? "bg-white text-black border-white hover:bg-neutral-200" : "bg-black text-white border-black hover:bg-neutral-800"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Save Mood
          </button>
        </div>
      </div>

      {/* Yearly Pixel Grid Container */}
      <div className={`p-3 rounded-xl border flex flex-col gap-3 ${
        isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
      }`}>
        <div className="flex items-center justify-between border-b pb-2 border-neutral-800/60">
          <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
            <span>YEARLY MOOD TRACKER</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className={`p-1 rounded hover:bg-neutral-800 transition-colors ${isDark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-black"}`}
              title="Previous year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
              isDark ? "bg-black border-neutral-800 text-white" : "bg-white border-neutral-300 text-black"
            }`}>
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear((y) => y + 1)}
              className={`p-1 rounded hover:bg-neutral-800 transition-colors ${isDark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-black"}`}
              title="Next year"
            >
              <ChevronRight className="w-4 h-4" />
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
          <div className="min-w-[280px] flex flex-col items-center">
            {/* Header Months J F M A M J J A S O N D */}
            <div className="grid grid-cols-[24px_repeat(12,1fr)] gap-0.5 w-full text-center text-[10px] font-mono font-bold text-neutral-500 mb-1">
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
                <div key={dayNum} className="grid grid-cols-[24px_repeat(12,1fr)] gap-0.5 w-full items-center my-[1px]">
                  <div className="text-[9px] font-mono text-neutral-500 text-right pr-1 select-none">
                    {dayNum < 10 ? `0${dayNum}` : dayNum}
                  </div>

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
                          className="aspect-square w-full rounded-[2px] bg-neutral-800/10 opacity-10 pointer-events-none"
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
                          "aspect-square w-full rounded-[3px] transition-all cursor-pointer relative group",
                          cfg
                            ? `${cfg.bgClass} shadow-sm scale-100 hover:scale-125 z-10`
                            : isDark
                            ? "bg-neutral-800/40 hover:bg-neutral-700/60 border border-neutral-700/30"
                            : "bg-neutral-200/60 hover:bg-neutral-300/80 border border-neutral-300/40",
                          isSelectedCell && "ring-2 ring-white border border-white scale-110 z-30 shadow-md",
                          isCellToday && !isSelectedCell && "ring-1 ring-primary/80 ring-offset-1 ring-offset-black z-20"
                        )}
                        title={`${format(new Date(selectedYear, monthIdx, dayNum), "MMM d, yyyy")}${cfg ? `: ${cfg.label} ${cfg.emoji}` : ": Empty (1 click: Select | 2 clicks: Cycle)"}`}
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
          isDark ? "bg-black/60 border-neutral-800 text-neutral-300" : "bg-white border-neutral-200 text-neutral-800"
        }`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs">{activeFormattedDate}:</span>
            {activeMoodKey ? (
              <span className={cn("font-semibold text-xs flex items-center gap-1", MOOD_CONFIGS[activeMoodKey].textClass)}>
                <span>{MOOD_CONFIGS[activeMoodKey].emoji}</span>
                <span>{MOOD_CONFIGS[activeMoodKey].label}</span>
              </span>
            ) : (
              <span className="text-neutral-500 italic text-[11px]">No mood logged</span>
            )}
            {activeNoteObj?.text && (
              <span className="text-neutral-400 italic text-[11px] truncate max-w-[180px]">
                "{activeNoteObj.text}"
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono text-neutral-500">1 Click: Select | 2 Clicks: Cycle</span>
        </div>

        {/* Legend & Stats */}
        <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(MOOD_CONFIGS) as MoodType[]).map((key) => {
              const cfg = MOOD_CONFIGS[key];
              return (
                <div key={key} className="flex items-center gap-1">
                  <span className={cn("w-2.5 h-2.5 rounded-[2px]", cfg.bgClass)} />
                  <span className="text-neutral-400">{cfg.label}</span>
                  <span className="font-bold">({stats[key]})</span>
                </div>
              );
            })}
          </div>
          <div className="text-neutral-500">Total: <strong>{totalTrackedDays}</strong></div>
        </div>
      </div>
    </div>
  );
}
