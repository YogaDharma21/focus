"use client"

import Image from "next/image"
import { ExternalLink } from "lucide-react"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="FocusTrackers Application Icon"
              width={28}
              height={28}
              className="size-7 rounded-md object-contain"
            />
            <span className="font-bold text-sm text-foreground">FocusTrackers</span>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground">
              v0.0.1
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground font-medium">
            <a
              href="https://app.focustrackers.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>Launch Web App</span>
              <ExternalLink className="size-3" />
            </a>
            <a href="#ecosystem" className="hover:text-foreground transition-colors">
              Ecosystem
            </a>
            <a href="#interactive-demo" className="hover:text-foreground transition-colors">
              Try Demo
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#download" className="hover:text-foreground transition-colors">
              Downloads
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <a
              href="https://github.com/YogaDharma21/focus"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
              aria-label="GitHub Repository"
            >
              <GithubIcon className="size-3.5" />
              GitHub
            </a>
          </div>

          {/* License & Version */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <span>FocusTrackers v0.0.1</span>
            <span>•</span>
            <span>MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
