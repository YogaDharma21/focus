import React from 'react';
import { 
  Clock, Activity, CheckCircle2, ListTodo, Flame, Target, BarChart2, TrendingUp 
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';

export const StatsJournal: React.FC = () => {
  const { sessions, todos, distractions, flowTimeElapsed } = useDesktopStore();

  // 1. Current Timer status string for top floating capsule
  const activeSeconds = flowTimeElapsed;
  const m = Math.floor(activeSeconds / 60);
  const s = activeSeconds % 60;
  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const now = new Date();
  const currentMinutesPassed = now.getHours() * 60 + now.getMinutes();
  const dayProgressPercent = Math.min(100, Math.max(0, Math.round((currentMinutesPassed / 1440) * 100)));
  const minutesRemaining = 1440 - currentMinutesPassed;
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const minsRemainingPart = minutesRemaining % 60;

  const todaySessions = sessions.filter(s => {
    if (!s.date) return false;
    const sDate = new Date(s.date);
    return (
      sDate.getFullYear() === now.getFullYear() &&
      sDate.getMonth() === now.getMonth() &&
      sDate.getDate() === now.getDate()
    );
  });
  const minutesToday = Math.round(todaySessions.reduce((acc, s) => acc + s.duration, 0) / 60);

  const tasksTodayCount = todos.filter(t => t.completed).length;
  const pendingTasksCount = todos.filter(t => !t.completed).length;
  const totalTasksCount = todos.length;
  const completionRatePercent = totalTasksCount > 0 
    ? Math.round((tasksTodayCount / totalTasksCount) * 100) 
    : 0;

  const calculateStreak = () => {
    if (!sessions || sessions.length === 0) return { current: 0, best: 0 };
    const dates = Array.from(
      new Set(
        sessions
          .filter(s => s && s.date)
          .map(s => {
            const d = new Date(s.date);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          })
      )
    ).sort();

    if (dates.length === 0) return { current: 0, best: 0 };

    let best = 1;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > best) best = tempStreak;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }

    const cur = new Date();
    const curY = cur.getFullYear();
    const curM = String(cur.getMonth() + 1).padStart(2, '0');
    const curD = String(cur.getDate()).padStart(2, '0');
    const today = `${curY}-${curM}-${curD}`;

    const yDate = new Date(cur.getTime() - 86400000);
    const yY = yDate.getFullYear();
    const yM = String(yDate.getMonth() + 1).padStart(2, '0');
    const yD = String(yDate.getDate()).padStart(2, '0');
    const yesterday = `${yY}-${yM}-${yD}`;

    const lastDate = dates[dates.length - 1];

    let current = 0;
    if (lastDate === today || lastDate === yesterday) {
      current = tempStreak;
    }

    return { current, best: Math.max(best, current) };
  };

  const streakData = calculateStreak();
  const currentStreak = streakData.current;
  const bestStreak = streakData.best;

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const getWeeklyMinutes = () => {
    const weeklyMinutes: Record<string, number> = {
      Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
    };

    const todayDate = new Date();
    const currentDayOfWeek = todayDate.getDay();
    const sunday = new Date(todayDate);
    sunday.setDate(todayDate.getDate() - currentDayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    daysOfWeek.forEach((day, index) => {
      const targetDate = new Date(sunday);
      targetDate.setDate(sunday.getDate() + index);

      const daySessions = sessions.filter((s) => {
        if (!s.date) return false;
        const sDate = new Date(s.date);
        return (
          sDate.getFullYear() === targetDate.getFullYear() &&
          sDate.getMonth() === targetDate.getMonth() &&
          sDate.getDate() === targetDate.getDate()
        );
      });

      const historicalSeconds = daySessions.reduce(
        (acc, s) => acc + s.duration,
        0
      );
      weeklyMinutes[day] = Math.round(historicalSeconds / 60);
    });

    return weeklyMinutes;
  };

  const weeklyMinutes = getWeeklyMinutes();
  const maxWeeklyMins = Math.max(120, ...Object.values(weeklyMinutes));

  const distractionCounts: Record<string, number> = {};
  if (distractions.length > 0) {
    distractions.forEach(item => {
      const catName = item.category || "Social Media";
      distractionCounts[catName] = (distractionCounts[catName] || 0) + 1;
    });
  } else {
    distractionCounts["Social Media"] = 1;
  }

  const totalDistractions = Math.max(1, distractions.length);
  const distractionCategories = Object.entries(distractionCounts)
    .map(([name, count]) => ({
      name,
      count: distractions.length === 0 ? 1 : count,
      percent: Math.round(((distractions.length === 0 ? 1 : count) / totalDistractions) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  const mostCommonCategory = distractionCategories[0]?.name || "Social Media";
  const mostCommonPercent = distractionCategories[0]?.percent || 100;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col select-none space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">Journal & Stats</h2>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight">Day Progress</span>
          </div>
          <span className="text-xs font-mono font-bold text-foreground">{dayProgressPercent}%</span>
        </div>

        <div className="w-full h-2.5 bg-muted/80 rounded-full overflow-hidden">
          <div 
            className="bg-foreground h-full rounded-full transition-all duration-500"
            style={{ width: `${dayProgressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-muted-foreground font-medium">
          {hoursRemaining}h {minsRemainingPart}m remaining today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-foreground font-sans">{minutesToday}</span>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Minutes Today</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-foreground font-sans">{tasksTodayCount}</span>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Tasks Today</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground">
            <ListTodo className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-foreground font-sans">{pendingTasksCount}</span>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Pending Tasks</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight">Longest Streak</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Current</span>
              <span className="text-sm font-bold text-foreground font-mono">{currentStreak} Days</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Best</span>
              <span className="text-sm font-bold text-foreground font-mono">{bestStreak} Days</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight">Completion Rate</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-foreground font-sans">{completionRatePercent}%</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Tasks Finished</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Focus Trend</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2 h-24 pt-2">
            {daysOfWeek.map((day) => {
              const minsLogged = weeklyMinutes[day] || 0;
              const heightPercent =
                minsLogged > 0
                  ? Math.min(100, Math.max(12, Math.round((minsLogged / maxWeeklyMins) * 100)))
                  : 4;
              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative cursor-pointer"
                >
                  <div className="absolute -top-8 px-2 py-1 rounded text-[10px] font-mono font-bold bg-secondary text-foreground border border-border pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-md">
                    {day}: {minsLogged} mins
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground font-medium">
                    {minsLogged}m
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      minsLogged > 0
                        ? "bg-foreground group-hover:bg-foreground/80"
                        : "bg-muted/80"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-mono font-bold text-foreground">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground">
            <BarChart2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">Distraction Analysis</h3>
        </div>

        <p className="text-xs text-muted-foreground font-medium">
          Most common: <strong className="text-foreground font-semibold">{mostCommonCategory}</strong> ({mostCommonPercent}%)
        </p>

        <div className="space-y-3 pt-1">
          {distractionCategories.map((cat) => (
            <div key={cat.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">{cat.name}</span>
                <span className="text-muted-foreground font-mono font-normal">{cat.count} ({cat.percent}%)</span>
              </div>
              <div className="w-full h-1.5 bg-muted/80 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
