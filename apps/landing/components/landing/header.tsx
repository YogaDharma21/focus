"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu, X, ExternalLink } from "lucide-react"

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

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#download", label: "Downloads" },
  { href: "#faq", label: "FAQ" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl transition-all duration-300">
      <div className="relative">
        <nav
          aria-label="Primary navigation"
          className="relative bg-card/95 backdrop-blur-md border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-full px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between"
        >
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-2 sm:gap-2.5 shrink-0" aria-label="FocusTrackers Home">
            <Image
              src="/icon.png"
              alt="FocusTrackers Application Icon"
              width={26}
              height={26}
              className="size-6 sm:size-6.5 rounded-lg object-contain"
            />
            <span className="font-bold text-xs sm:text-sm tracking-tight text-foreground">
              FocusTrackers
            </span>
          </a>

          {/* Desktop Nav Items - Centered, Borderless, Clean Typography */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <a
              href="https://github.com/YogaDharma21/focus"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full"
              title="GitHub Repository"
              aria-label="GitHub Repository"
            >
              <GithubIcon className="size-4" />
            </a>
            <a
              href="https://app.focustrackers.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <span>Launch App</span>
              <ExternalLink className="size-3" />
            </a>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu Card */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 p-3 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[20px] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 mt-1 border-t border-border flex items-center justify-between px-2">
              <a
                href="https://github.com/YogaDharma21/focus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <GithubIcon className="size-4" />
                <span>GitHub</span>
              </a>
              <a
                href="https://app.focustrackers.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
              >
                <span>Launch App</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
