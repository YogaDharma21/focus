import React, { useState, useEffect } from "react";
import { useDesktopStore } from "../../lib/store";
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

export const MoodTracker: React.FC = () => {
  const { moodNotes, setMoodForDate, cycleMoodForDate, deleteMoodNote } = useDesktopStore();
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

  const selectedDateNote = moodNotes.find((n) => n.date.slice(0, 10) === selectedDateKey);
  const currentSelectedMoodKey = normalizeMoodKey(selectedDateNote?.mood);

  useEffect(() => {
    setSelectedMood(currentSelectedMoodKey);
    setDescriptionText(selectedDateNote?.text || "");
  }, [selectedDateKey, selectedDateNote?.mood, selectedDateNote?.text]);

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

  const activeDateKey = hoveredDateInfo?.dateStr || selectedDateKey;
  const activeNoteObj = moodNotes.find((n) => n.date.slice(0, 10) === activeDateKey);
  const activeMoodKey = normalizeMoodKey(activeNoteObj?.mood);
  const activeFormattedDate = formatDateShort(activeDateKey);

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
      {/* Input & Detail Inspector Card */}
      <div className="p-6 bg-neutral-900/60 border border-neutral-800 shadow-md backdrop-blur-xl rounded-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-lg text-white">
              Log Mood {isTodaySelected ? "(Today)" : `for ${formatDateShort(selectedDateKey)}`}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700 text-neutral-300">
              {getFormattedSelectedDate()}
            </span>
            {!isTodaySelected && (
              <button
                onClick={() => {
                  setSelectedDateKey(todayStr);
                  setSelectedYear(today.getFullYear());
                }}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:underline bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 transition-colors"
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
                    ? cfg.pillSelectedClass
                    : "bg-neutral-800/40 hover:bg-neutral-800 border-neutral-700/60 text-white"
                )}
              >
                <span className="text-2xl sm:text-3xl transition-transform duration-200 group-hover:scale-110">
                  {cfg.emoji}
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

        <textarea
          placeholder="Optional reflection: What made you feel this way?"
          className="w-full resize-none bg-black/50 border border-neutral-800 focus:outline-none focus:border-indigo-500/60 text-sm text-white placeholder-neutral-500 p-3 rounded-xl min-h-[80px]"
          value={descriptionText}
          onChange={(e) => setDescriptionText(e.target.value)}
        />

        <div className="flex items-center justify-between pt-1">
          {selectedDateNote ? (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>Logged as <strong className={MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].textClass}>{MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].label} {MOOD_CONFIGS[currentSelectedMoodKey || "amazing"].emoji}</strong></span>
              {selectedDateNote.text && <span className="italic truncate max-w-[200px]">"{selectedDateNote.text}"</span>}
              <button
                onClick={() => {
                  deleteMoodNote(selectedDateNote.id);
                  setSelectedMood(null);
                  setDescriptionText("");
                }}
                className="text-neutral-500 hover:text-rose-500 transition-colors ml-1 p-1"
                title="Clear mood note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-neutral-500 italic">No mood logged for this date yet</span>
          )}

          <button
            onClick={handleSaveMood}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            Save Mood
          </button>
        </div>
      </div>

      {/* Yearly Pixel Grid Container */}
      <div className="p-6 bg-neutral-900/60 border border-neutral-800 shadow-md backdrop-blur-xl rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              Yearly Mood Tracker
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              <strong>1 click</strong> to select date & view details below. <strong>2 clicks</strong> to cycle mood.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
              title="Previous Year"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-base px-3 py-0.5 bg-black rounded-md border border-neutral-800 text-white font-mono">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
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
                className="text-xs text-indigo-400 hover:underline ml-2 font-mono"
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
            <div className="grid grid-cols-[30px_repeat(12,1fr)] gap-1 w-full text-center text-xs font-semibold font-mono text-neutral-400 mb-2">
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
                  <div className="text-[10px] font-mono text-neutral-500 text-right pr-2 select-none">
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
                          className="aspect-square w-full rounded-[3px] bg-neutral-800/10 opacity-20 pointer-events-none"
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
                            : "bg-neutral-800/40 hover:bg-neutral-700/60 border border-neutral-700/30",
                          isSelectedCell && "ring-2 ring-white border-2 border-white scale-110 z-30 shadow-md",
                          isCellToday && !isSelectedCell && "ring-2 ring-indigo-400/80 ring-offset-1 ring-offset-black z-20"
                        )}
                        title={`${formatDateShort(dateKey)}${cfg ? `: ${cfg.label} ${cfg.emoji}` : ": Empty (1 click: Select | 2 clicks: Cycle)"}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected/Active Date Info Banner */}
        <div className="min-h-[44px] flex items-center justify-between p-3 rounded-xl bg-black/60 border border-neutral-800 text-xs">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm">{activeFormattedDate}:</span>
              {activeMoodKey ? (
                <span className={cn("font-semibold text-sm flex items-center gap-1.5", MOOD_CONFIGS[activeMoodKey].textClass)}>
                  <span className="text-base">{MOOD_CONFIGS[activeMoodKey].emoji}</span>
                  <span>{MOOD_CONFIGS[activeMoodKey].label}</span>
                </span>
              ) : (
                <span className="text-neutral-500 italic">No mood logged</span>
              )}
              {activeNoteObj?.text && (
                <span className="text-neutral-300 italic ml-2 max-w-[300px] truncate bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
                  "{activeNoteObj.text}"
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">1 Click: Select Date | 2 Clicks: Cycle Mood</span>
          </div>
        </div>

        {/* Mood Legend & Yearly Summary */}
        <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(Object.keys(MOOD_CONFIGS) as MoodType[]).map((key) => {
              const cfg = MOOD_CONFIGS[key];
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <span className={cn("w-3 h-3 rounded-[3px]", cfg.bgClass)} />
                  <span className="text-neutral-400 font-medium">{cfg.label}</span>
                  <span className="font-mono text-[10px] font-semibold text-neutral-200">({stats[key]})</span>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-neutral-400 font-mono">
            Total tracked days in {selectedYear}: <strong className="text-white">{totalTrackedDays}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
