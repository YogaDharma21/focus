import React from 'react';
import { 
  Clock, Activity, CheckCircle2, ListTodo, Flame, Target, BarChart2 
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';

export const StatsJournal: React.FC = () => {
  const { sessions, todos, distractions, timeLeft, timerMode, timerState, flowTimeElapsed } = useDesktopStore();

  // 1. Current Timer status string for top floating capsule
  const activeSeconds = timerMode === 'POMODORO' ? timeLeft : flowTimeElapsed;
  const m = Math.floor(activeSeconds / 60);
  const s = activeSeconds % 60;
  const timeString = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  const timerLabel = timerMode === 'POMODORO' 
    ? (timerState === 'WORK' ? 'Pomodoro' : 'Break')
    : 'Flow';

  // 2. Day Progress Calculation
  const now = new Date();
  const currentMinutesPassed = now.getHours() * 60 + now.getMinutes();
  const dayProgressPercent = Math.min(100, Math.max(0, Math.round((currentMinutesPassed / 1440) * 100)));
  const minutesRemaining = 1440 - currentMinutesPassed;
  const hoursRemaining = Math.floor(minutesRemaining / 60);
  const minsRemainingPart = minutesRemaining % 60;

  // 3. Stats Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todaySessions = sessions.filter(s => s.date.startsWith(todayStr));
  const minutesToday = Math.round(todaySessions.reduce((acc, s) => acc + s.duration, 0) / 60);

  const tasksTodayCount = todos.filter(t => t.completed).length;
  const pendingTasksCount = todos.filter(t => !t.completed).length;
  const totalTasksCount = todos.length;
  const completionRatePercent = totalTasksCount > 0 
    ? Math.round((tasksTodayCount / totalTasksCount) * 100) 
    : 0;

  // 4. Streak Calculation
  const sessionDatesSet = new Set(sessions.map(s => s.date.split('T')[0]));
  let currentStreak = 0;
  let d = new Date();
  while (sessionDatesSet.has(d.toISOString().split('T')[0])) {
    currentStreak++;
    d.setDate(d.getDate() - 1);
  }
  const bestStreak = Math.max(currentStreak, sessions.length > 0 ? 1 : 0);



  // 5. Weekly Focus Trend Calculation (Sunday to Saturday)
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

  // 6. Distraction Analysis Calculation
  const distractionCounts: Record<string, number> = {};
  if (distractions.length > 0) {
    distractions.forEach(item => {
      const catName = item.category || "Social Media";
      distractionCounts[catName] = (distractionCounts[catName] || 0) + 1;
    });
  } else {
    // Default demonstration category if no distractions logged yet
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
    <div className="h-full flex flex-col p-4 md:p-6 max-w-4xl mx-auto w-full select-none overflow-y-auto space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Journal & Stats</h2>
      </div>

      {/* 1. Day Progress Card */}
      <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>Day Progress</span>
          </div>
          <span className="text-xs font-mono font-bold text-white">{dayProgressPercent}%</span>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full h-2.5 bg-zinc-800/80 rounded-full overflow-hidden">
          <div 
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${dayProgressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-zinc-400 font-medium">
          {hoursRemaining}h {minsRemainingPart}m remaining today
        </p>
      </div>

      {/* 2. Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Minutes Today */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-white font-sans">{minutesToday}</span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Minutes Today</span>
        </div>

        {/* Tasks Today */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-white font-sans">{tasksTodayCount}</span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Tasks Today</span>
        </div>

        {/* Pending Tasks */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <ListTodo className="w-5 h-5" />
          </div>
          <span className="text-3xl font-extrabold text-white font-sans">{pendingTasksCount}</span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Pending Tasks</span>
        </div>
      </div>

      {/* 3. Middle 2 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Longest Streak Card */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Longest Streak</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Current</span>
              <span className="text-sm font-bold text-white font-mono">{currentStreak} Days</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Best</span>
              <span className="text-sm font-bold text-white font-mono">{bestStreak} Days</span>
            </div>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Completion Rate</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-white font-sans">{completionRatePercent}%</h3>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tasks Finished</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Focus Trend Card */}
      <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider font-bold text-white">
          FOCUS TREND
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
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 px-2 py-1 rounded text-[10px] font-mono font-bold bg-zinc-900 text-white border border-zinc-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap shadow-md">
                    {day}: {minsLogged} mins
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 font-medium">
                    {minsLogged}m
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      minsLogged > 0
                        ? "bg-white group-hover:bg-zinc-200"
                        : "bg-zinc-800/80"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs font-mono font-bold text-white">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Distraction Analysis Card (Placed under Focus Trend) */}
      <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">Distraction Analysis</h3>
        </div>

        <p className="text-xs text-zinc-400 font-medium">
          Most common: <strong className="text-white font-semibold">{mostCommonCategory}</strong> ({mostCommonPercent}%)
        </p>

        <div className="space-y-3 pt-1">
          {distractionCategories.map((cat) => (
            <div key={cat.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-white">{cat.name}</span>
                <span className="text-zinc-400 font-mono font-normal">{cat.count} ({cat.percent}%)</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
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
