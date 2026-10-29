"use client"

import Image from "next/image"

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
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#download" className="hover:text-foreground transition-colors">
              Downloads
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
