import React from 'react';
import { BarChart2, Flame, Clock, AlertTriangle, CheckCircle2, Trophy, Calendar } from 'lucide-react';
import { useDesktopStore } from '../../lib/store';

export const StatsJournal: React.FC = () => {
  const { sessions, distractions, todos } = useDesktopStore();

  const totalFocusSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
  const totalFocusMinutes = Math.round(totalFocusSeconds / 60);

  const completedTasksCount = todos.filter(t => t.completed).length;

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full select-none overflow-y-auto space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Total Focus</p>
            <h3 className="text-xl font-bold font-mono text-white">{totalFocusMinutes} <span className="text-xs font-normal text-zinc-400">mins</span></h3>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Sessions</p>
            <h3 className="text-xl font-bold font-mono text-white">{sessions.length}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Tasks Done</p>
            <h3 className="text-xl font-bold font-mono text-white">{completedTasksCount}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3 shadow-lg">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Distractions</p>
            <h3 className="text-xl font-bold font-mono text-white">{distractions.length}</h3>
          </div>
        </div>
      </div>

      {/* Session History Table */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3 shadow-xl flex-1 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Focus Session History Log
          </h3>
          <span className="text-[10px] text-zinc-400">{sessions.length} recorded</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-500 text-xs">
              No focus sessions logged yet. Start a timer to build your streak!
            </div>
          ) : (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-zinc-400 border-b border-white/5 pb-2">
                  <th className="pb-2 font-medium">Date & Time</th>
                  <th className="pb-2 font-medium">Mode</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium">Linked Task</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.slice().reverse().map((session) => (
                  <tr key={session.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-mono text-zinc-400">
                      {new Date(session.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        session.mode === 'POMODORO'
                          ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                          : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                      }`}>
                        {session.mode}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono font-medium text-white">
                      {Math.round(session.duration / 60)} mins
                    </td>
                    <td className="py-2.5 text-zinc-300 truncate max-w-[200px]">
                      {session.taskTitle || 'General Focus'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
