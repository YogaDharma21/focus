import React, { useState } from 'react';
import { Info, Github, ExternalLink, X, Sparkles } from 'lucide-react';

const PROJECT_INFO = {
  name: "Focus Desktop",
  version: "v0.0.1",
  description: "A minimalist, high-performance desktop productivity suite designed to keep you in flow state. Features flexible Pomodoro & Flow timers, smart break calculation, task management with subtasks, streak & distraction analytics, and ambient music.",
  github: "https://github.com/YogaDharma21/focus"
};

export const ProjectInfoModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-xs font-medium w-full text-left"
        title="About Project Info"
      >
        <Info className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="hidden md:inline text-xs">Project Info</span>
      </button>

      {open && (
        <div 
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-96 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 relative text-foreground select-none animate-in zoom-in-95 duration-150"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  {PROJECT_INFO.name}
                  <span className="px-2 py-0.5 rounded-full bg-secondary border border-border text-[10px] font-mono text-muted-foreground">
                    {PROJECT_INFO.version}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">Minimalist Productivity Suite</p>
              </div>
            </div>

            <p className="text-xs text-foreground leading-relaxed bg-secondary/60 p-3.5 rounded-xl border border-border">
              {PROJECT_INFO.description}
            </p>

            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Links & Repository</span>
              <div className="space-y-1.5">
                <a
                  href={PROJECT_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background border border-border hover:bg-secondary text-xs text-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">GitHub Repository</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
