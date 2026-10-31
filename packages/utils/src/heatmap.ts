export interface HeatmapDay {
  date: Date;
  dateKey: string;
  formattedDate: string;
  dayOfWeek: number;
  isValid: boolean;
  minutes: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface HeatmapWeek {
  weekIndex: number;
  days: HeatmapDay[];
  monthLabel?: string;
}

export interface HeatmapGridData {
  weeks: HeatmapWeek[];
  totalDays: number;
  activeDays: number;
  totalMinutes: number;
  totalHours: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const;

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatHeatmapDate(d: Date): string {
  const month = MONTH_NAMES[d.getMonth()];
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

export function getIntensityTier(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

export function buildAnnualHeatmapGrid(
  dailyMinutes: Record<string, number>,
  anchorDate: Date = new Date()
): HeatmapGridData {
  // End of today
  const today = new Date(anchorDate);
  today.setHours(23, 59, 59, 999);

  // Trailing 365 days (today - 364 days through today)
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 364);
  startDate.setHours(0, 0, 0, 0);

  // Sunday on or before the startDate
  const startDayOfWeek = startDate.getDay();
  const firstGridSunday = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - startDayOfWeek);
  firstGridSunday.setHours(0, 0, 0, 0);

  // Saturday on or after today
  const endDayOfWeek = today.getDay();
  const lastGridSaturday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - endDayOfWeek));
  lastGridSaturday.setHours(23, 59, 59, 999);

  const weeks: HeatmapWeek[] = [];
  const currentCursor = new Date(firstGridSunday);
  let weekIndex = 0;
  let totalDays = 0;
  let activeDays = 0;
  let totalMinutes = 0;
  let lastLabeledMonth = -1;
  let lastLabeledWeekCol = -99;

  while (currentCursor <= lastGridSaturday) {
    const days: HeatmapDay[] = [];
    let weekMonthCandidate: number | null = null;

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const cellDate = new Date(currentCursor);
      const isWithin365Range = cellDate >= startDate && cellDate <= today;
      const dateKey = toDateKey(cellDate);
      const minutes = isWithin365Range ? (dailyMinutes[dateKey] || 0) : 0;
      const intensity = isWithin365Range ? getIntensityTier(minutes) : 0;

      if (isWithin365Range) {
        totalDays++;
        if (minutes > 0) {
          activeDays++;
          totalMinutes += minutes;
        }
      }

      // Check if this week contains the 1st of any month
      if (cellDate.getDate() === 1) {
        weekMonthCandidate = cellDate.getMonth();
      }

      days.push({
        date: cellDate,
        dateKey,
        formattedDate: formatHeatmapDate(cellDate),
        dayOfWeek,
        isValid: isWithin365Range,
        minutes,
        intensity,
      });

      currentCursor.setDate(currentCursor.getDate() + 1);
    }

    let monthLabel: string | undefined;
    if (
      weekMonthCandidate !== null &&
      weekMonthCandidate !== lastLabeledMonth &&
      weekIndex - lastLabeledWeekCol >= 2
    ) {
      monthLabel = MONTH_NAMES[weekMonthCandidate];
      lastLabeledMonth = weekMonthCandidate;
      lastLabeledWeekCol = weekIndex;
    }

    weeks.push({
      weekIndex,
      days,
      monthLabel,
    });

    weekIndex++;
  }

  const totalHours = (totalMinutes / 60).toFixed(1);

  return {
    weeks,
    totalDays,
    activeDays,
    totalMinutes,
    totalHours,
  };
}
