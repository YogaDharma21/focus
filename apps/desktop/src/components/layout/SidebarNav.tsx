import React from 'react';
import { LayoutGrid, CheckSquare, Calendar, Shield, SlidersHorizontal } from 'lucide-react';
import { useDesktopStore, ViewType } from '../../lib/store';
import { cn } from '../../lib/utils';

export const SidebarNav: React.FC = () => {
  const { currentView, setView, shield, isActive, timerState } = useDesktopStore();

  const shieldEnforcing = shield.enabled && isActive && timerState === "FLOW";

  const navItems: { id: ViewType; label: string; icon: React.FC<{ className?: string }>; dot?: boolean }[] = [
    { id: "FOCUS", label: "Focus", icon: LayoutGrid },
    { id: "TASKS", label: "Tasks", icon: CheckSquare },
    { id: "JOURNAL", label: "Stats", icon: Calendar },
    { id: "SHIELD", label: "Shield", icon: Shield, dot: shieldEnforcing },
    { id: "SETTINGS", label: "Settings", icon: SlidersHorizontal },
  ];

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col select-none">
      <nav
        aria-label="Primary"
        className="flex flex-col items-center gap-2 p-2 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-full"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ease-out group",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface"
              )}
            >
              <span
                className={cn(
                  "transform transition-transform duration-300",
                  active ? "scale-105" : "group-hover:scale-105"
                )}
              >
                <Icon className="w-5 h-5" />
              </span>
              {item.dot && (
                <span
                  className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"
                  title="Shield enforcing"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
