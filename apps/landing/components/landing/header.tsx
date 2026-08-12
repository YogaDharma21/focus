"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Timer, Menu, X, ExternalLink } from "lucide-react"

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

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-between">
        {/* Brand Logo - Minimal with Actual Focus Target Icon */}
        <a href="#" className="flex items-center gap-2.5">
          <Image
            src="/icon.png"
            alt="Focus App Icon"
            width={32}
            height={32}
            className="size-8 rounded-lg object-contain"
          />
          <span className="font-bold text-lg tracking-tight text-foreground">
            Focus
          </span>
        </a>

        {/* Desktop Nav - Mathematically Centered */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border absolute left-1/2 -translate-x-1/2">
          <a
            href="#ecosystem"
            className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            Ecosystem
          </a>
          <a
            href="#interactive-demo"
            className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            Try Demo
          </a>
          <a
            href="#features"
            className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            Features
          </a>
          <a
            href="#download"
            className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            Downloads
          </a>
          <a
            href="#faq"
            className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/YogaDharma21/focus"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="GitHub Repository"
          >
            <GithubIcon className="size-5" />
          </a>
          <a
            href="https://focustracks.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Launch Web App
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 py-6 space-y-4">
          <a
            href="#ecosystem"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-foreground py-2 border-b border-border/50"
          >
            Ecosystem
          </a>
          <a
            href="#interactive-demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-foreground py-2 border-b border-border/50"
          >
            Try Demo
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-foreground py-2 border-b border-border/50"
          >
            Features
          </a>
          <a
            href="#download"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-foreground py-2 border-b border-border/50"
          >
            Downloads
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-foreground py-2 border-b border-border/50"
          >
            FAQ
          </a>
          <div className="pt-2 flex items-center justify-between">
            <a
              href="https://github.com/YogaDharma21/focus"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <GithubIcon className="size-5" />
              GitHub
            </a>
            <a
              href="https://focustracks.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground"
            >
              Launch Web App
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
