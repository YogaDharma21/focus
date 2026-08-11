import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Focus — Master Your Attention & Stay in Flow",
  description:
    "The minimalist, all-in-one productivity suite with Pomodoro & Flow timers, 1/5th break calculation, Focus Shield website blocker, ambient soundscapes, and cross-platform sync across Web, Desktop, Mobile, and Browser Extension.",
  keywords: [
    "Focus App",
    "Pomodoro Timer",
    "Flow Stopwatch",
    "Productivity Suite",
    "Focus Shield",
    "Website Blocker",
    "Ambient Sound Player",
    "Cross-Platform Productivity",
  ],
  authors: [{ name: "Focus Team" }],
  openGraph: {
    title: "Focus — Master Your Attention & Stay in Flow",
    description:
      "Minimalist productivity suite for Web, Desktop, Mobile, and Browser Extension.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased scroll-smooth", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
