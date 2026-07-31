import React from 'react';
import { Timer, CheckSquare, BarChart3, HeartHandshake, Maximize2, Palette } from 'lucide-react';
import { useDesktopStore, ViewType, BackgroundType } from '../../lib/store';

export const SidebarNav: React.FC = () => {
  const { currentView, setView, setDeepFocusMode, background, setBackground } = useDesktopStore();
  const [showBgSelector, setShowBgSelector] = React.useState(false);

  const navItems: { id: ViewType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "FOCUS", label: "Timer", icon: Timer },
    { id: "TODO", label: "Tasks", icon: CheckSquare },
    { id: "JOURNAL", label: "Analytics", icon: BarChart3 },
    { id: "NOTES", label: "Mood Notes", icon: HeartHandshake },
  ];

  const backgrounds: { id: BackgroundType; label: string }[] = [
    { id: "dark", label: "Dark Modern" },
    { id: "gradient", label: "Aurora Gradient" },
    { id: "mountain", label: "Mountain Mist" },
    { id: "library", label: "Cozy Library" },
    { id: "cafe", label: "Lo-Fi Cafe" },
    { id: "anime-room", label: "Anime Room" },
  ];

  return (
    <aside className="w-16 md:w-56 h-full bg-zinc-950/60 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between p-3 select-none z-20">
      {/* Top: Nav items */}
      <div className="space-y-6">
        <div className="px-2 pt-2 hidden md:block">
          <p className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase">Menu</p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                  active
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-cyan-400" : "text-zinc-400"}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Zen Deep Focus & Theme picker */}
      <div className="space-y-2 pt-4 border-t border-white/5">
        {/* Background Selector Popover */}
        <div className="relative">
          <button
            onClick={() => setShowBgSelector(!showBgSelector)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all text-sm"
          >
            <Palette className="w-5 h-5 text-indigo-400" />
            <span className="hidden md:inline text-xs">Theme & Ambient</span>
          </button>

          {showBgSelector && (
            <div className="absolute bottom-12 left-0 w-48 p-2 rounded-xl bg-zinc-900/95 border border-white/10 backdrop-blur-2xl shadow-2xl z-50 space-y-1">
              <p className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Background Theme</p>
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setBackground(bg.id);
                    setShowBgSelector(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    background === bg.id
                      ? "bg-cyan-500/20 text-cyan-400 font-medium"
                      : "text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Deep Focus Fullscreen Button */}
        <button
          onClick={() => setDeepFocusMode(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 hover:text-white transition-all text-sm font-medium shadow-md shadow-purple-500/10"
        >
          <Maximize2 className="w-5 h-5 text-purple-400" />
          <span className="hidden md:inline">Deep Focus</span>
        </button>
      </div>
    </aside>
  );
};
