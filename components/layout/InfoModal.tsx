"use client";

import { Github, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

const PROJECT_INFO = {
  name: "Focus",
  version: "1.0.0",
  description:
    "A minimalist productivity app designed to help you stay in flow. Features a Pomodoro-style timer, task management, stats/journaling, and an ambient media player for focus enhancement.",
  github: "https://github.com/YogaDharma21/focus-website",
  techStack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "shadcn/ui"],
  links: [
    {
      label: "GitHub Repository",
      url: "https://github.com/YogaDharma21/focus-website",
      icon: Github,
    },
    {
      label: "Report an Issue",
      url: "https://github.com/YogaDharma21/focus-website/issues",
      icon: ExternalLink,
    },
  ],
};

export function InfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl">{PROJECT_INFO.name}</DialogTitle>
          <DialogDescription className="text-base">
            {PROJECT_INFO.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Version {PROJECT_INFO.version}</span>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Built with</p>
            <div className="flex flex-wrap gap-2">
              {PROJECT_INFO.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 bg-secondary rounded-md text-xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-3">Links</p>
            <div className="space-y-2">
              {PROJECT_INFO.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors text-sm"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300 ease-out group text-muted-foreground hover:text-foreground hover:bg-white/5"
      >
        <span className="transform transition-transform duration-300 group-hover:scale-105">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-xl">{PROJECT_INFO.name}</DialogTitle>
            <DialogDescription className="text-base">
              {PROJECT_INFO.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Version {PROJECT_INFO.version}</span>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Built with</p>
              <div className="flex flex-wrap gap-2">
                {PROJECT_INFO.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-secondary rounded-md text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-3">Links</p>
              <div className="space-y-2">
                {PROJECT_INFO.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors text-sm"
                  >
                    <link.icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
