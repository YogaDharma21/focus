import React from 'react';
import { Timer, CheckSquare, BarChart3, Smile, Maximize2, Palette, Settings } from 'lucide-react';
import { useDesktopStore, ViewType, BackgroundType } from '../../lib/store';
import { ProjectInfoModal } from './ProjectInfoModal';

export const SidebarNav: React.FC = () => {
  const { currentView, setView, setDeepFocusMode, background, setBackground } = useDesktopStore();
  const [showBgSelector, setShowBgSelector] = React.useState(false);

  const navItems: { id: ViewType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "FOCUS", label: "Timer", icon: Timer },
    { id: "TODO", label: "Tasks", icon: CheckSquare },
    { id: "JOURNAL", label: "Stats", icon: BarChart3 },
    { id: "NOTES", label: "Mood", icon: Smile },
    { id: "SETTINGS", label: "Settings", icon: Settings },
  ];

  const backgrounds: { id: BackgroundType; label: string }[] = [
    { id: "dark", label: "Dark Modern" },
    { id: "mountain", label: "Mountain Mist" },
    { id: "library", label: "Cozy Library" },
    { id: "cafe", label: "Lo-Fi Cafe" },
    { id: "anime-room", label: "Anime Room" },
  ];

  return (
    <aside className="w-16 md:w-56 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between p-3 select-none z-20">
      {/* Top: Nav items */}
      <div className="space-y-4">
        <div className="px-3 pt-1 hidden md:block">
          <p className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase">Menu</p>
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
                    ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-zinc-100" : "text-zinc-400"}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Zen Deep Focus & Project Info */}
      <div className="space-y-1.5 pt-3 border-t border-zinc-800">

        {/* Deep Focus Fullscreen Button */}
        <button
          onClick={() => setDeepFocusMode(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition-all text-xs font-semibold shadow-sm"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden md:inline">Deep Focus</span>
        </button>

        {/* Project Info Button & Dialog */}
        <ProjectInfoModal />
      </div>
    </aside>
  );
};
