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
  metadataBase: new URL("https://focustrackers.my.id"),
  title: {
    default: "FocusTrackers - Master Your Attention & Stay in Flow",
    template: "%s | FocusTrackers",
  },
  description:
    "The minimalist, all-in-one productivity suite with Pomodoro & Flow timers, 1/5th break calculation, Focus Shield website blocker, ambient soundscapes, and cross-platform sync across Web, Desktop, Mobile, and Browser Extension.",
  applicationName: "FocusTrackers",
  keywords: [
    "FocusTrackers",
    "Focus Tracker",
    "Pomodoro Timer",
    "Flow Stopwatch",
    "Productivity Suite",
    "Focus Shield",
    "Website Blocker",
    "Ambient Sound Player",
    "Lofi Player",
    "Deep Work",
    "Break Calculator",
    "Cross-Platform Productivity",
  ],
  authors: [{ name: "FocusTrackers Team", url: "https://focustrackers.my.id" }],
  creator: "FocusTrackers Team",
  publisher: "FocusTrackers",
  alternates: {
    canonical: "https://focustrackers.my.id/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://focustrackers.my.id",
    siteName: "FocusTrackers",
    title: "FocusTrackers - Master Your Attention & Stay in Flow",
    description:
      "The minimalist, all-in-one productivity suite with Pomodoro & Flow timers, 1/5th break calculation, Focus Shield website blocker, ambient soundscapes, and cross-platform sync across Web, Desktop, Mobile, and Browser Extension.",
    images: [
      {
        url: "/screenshots/website/screenshot-main.png",
        width: 1200,
        height: 625,
        alt: "FocusTrackers Productivity Suite Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusTrackers - Master Your Attention & Stay in Flow",
    description:
      "The minimalist, all-in-one productivity suite with Pomodoro & Flow timers, 1/5th break calculation, Focus Shield website blocker, ambient soundscapes, and cross-platform sync across Web, Desktop, Mobile, and Browser Extension.",
    images: ["/screenshots/website/screenshot-main.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  category: "productivity",
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://focustrackers.my.id/#website",
      "url": "https://focustrackers.my.id",
      "name": "FocusTrackers",
      "description":
        "Minimalist productivity suite with Pomodoro and Flow timers, smart break calculations, website blocker, and ambient audio.",
      "publisher": {
        "@id": "https://focustrackers.my.id/#organization",
      },
      "inLanguage": "en-US",
    },
    {
      "@type": "Organization",
      "@id": "https://focustrackers.my.id/#organization",
      "name": "FocusTrackers",
      "url": "https://focustrackers.my.id",
      "logo": "https://focustrackers.my.id/icon.png",
      "sameAs": ["https://github.com/YogaDharma21/focus"],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://focustrackers.my.id/#software",
      "name": "FocusTrackers",
      "applicationCategory": "ProductivityApplication",
      "operatingSystem": "Web, Windows, macOS, Linux, iOS, Android, Chromium",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "url": "https://focustrackers.my.id",
      "image": "https://focustrackers.my.id/screenshots/website/screenshot-main.png",
      "description":
        "The minimalist, all-in-one productivity suite with Pomodoro & Flow timers, 1/5th break calculation, Focus Shield website blocker, ambient soundscapes, and cross-platform sync across Web, Desktop, Mobile, and Browser Extension.",
      "softwareVersion": "0.0.1",
      "featureList": [
        "Pomodoro & Flow timer modes",
        "Smart Flow break calculator (1/5th session length)",
        "Focus Shield website distraction blocker",
        "Curated ambient lofi music player",
        "Session-linked task management",
        "Productivity analytics and streak tracking",
        "Cross-platform support across Web, Desktop, Mobile, and Browser Extension",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://focustrackers.my.id/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does the Smart Flow Break Calculation work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "When using Flow mode, FocusTrackers tracks how long you've been in flow state continuously. Once you finish your session, FocusTrackers automatically calculates your break length as 1/5th (20%) of your active flow time. For example, a 50-minute flow session results in a 10-minute break.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I use the Web App directly in my browser?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Yes! You can launch the web application directly at https://app.focustrackers.my.id in any modern browser without installing anything.",
          },
        },
        {
          "@type": "Question",
          "name": "What is Focus Shield and how does it block websites?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Focus Shield is the built-in site blocking module in the Focus Browser Extension. It actively monitors tab navigation during active timer sessions. You can configure custom domain blocklists with soft warnings or hard block modes.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I use Focus offline on Desktop and Mobile?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Yes! Focus Desktop (Electron) and Focus Mobile (Expo / React Native) store session data, audio files, and task entries locally. Your data persists offline and automatically synchronizes when internet connectivity is available.",
          },
        },
        {
          "@type": "Question",
          "name": "Is Focus open source?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Yes, Focus is 100% open source under the MIT License! The entire codebase (including the Next.js web app, Expo mobile app, Electron desktop app, and Manifest V3 extension) lives in a clean unified repository.",
          },
        },
      ],
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
