import React from 'react';
import { Timer, CheckSquare, BarChart3, Settings } from 'lucide-react';
import { useDesktopStore, ViewType } from '../../lib/store';

export const SidebarNav: React.FC = () => {
  const { currentView, setView } = useDesktopStore();

  const navItems: { id: ViewType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "FOCUS", label: "Timer", icon: Timer },
    { id: "TODO", label: "Tasks", icon: CheckSquare },
    { id: "JOURNAL", label: "Stats", icon: BarChart3 },
    { id: "SETTINGS", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-56 h-full bg-background border-r border-border flex flex-col justify-between p-3 select-none z-20">
      <div className="space-y-4">
        <div className="px-3 pt-1 hidden md:block">
          <p className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">Menu</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-medium ${
                  active
                    ? "bg-secondary text-foreground font-semibold border border-border shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-foreground" : "text-muted-foreground"}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
