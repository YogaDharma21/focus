import React, { useState } from 'react';
import { Info, Github, ExternalLink, X, Sparkles } from 'lucide-react';

const PROJECT_INFO = {
  name: "Focus Desktop",
  version: "v1.2.0",
  description: "A minimalist, high-performance desktop productivity suite designed to keep you in flow state. Features flexible Pomodoro & Flow timers, smart break calculation, task management with subtasks, streak & distraction analytics, mood reflections, and ambient music.",
  github: "https://github.com/YogaDharma21/focus",
  issues: "https://github.com/YogaDharma21/focus/issues"
};

export const ProjectInfoModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bottom Left Info Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-all text-xs font-medium w-full text-left"
        title="About Project Info"
      >
        <Info className="w-4 h-4 text-zinc-400 shrink-0" />
        <span className="hidden md:inline text-xs">Project Info</span>
      </button>

      {/* Info Dialog Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 relative text-zinc-100 select-none">
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold shadow-md">
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  {PROJECT_INFO.name}
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
                    {PROJECT_INFO.version}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">Minimalist Productivity Suite</p>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
              {PROJECT_INFO.description}
            </p>

            {/* GitHub Links */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Links & Repository</span>
              <div className="space-y-1.5">
                <a
                  href={PROJECT_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4 text-zinc-300" />
                  <span className="font-medium">GitHub Repository</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto text-zinc-500" />
                </a>

                <a
                  href={PROJECT_INFO.issues}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-200 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                  <span className="font-medium">Report an Issue</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto text-zinc-500" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
