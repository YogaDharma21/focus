import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Focus Track - Deep Focus & Productivity",
        template: "%s | Focus Track",
    },
    description:
        "The ultimate minimal productivity companion. Master your work with integrated Pomodoro, Flow timers, task management, and ambient music playlists.",
    keywords: [
        "focus timer",
        "pomodoro",
        "task management",
        "productivity app",
        "study timer",
        "digital journal",
        "ambient music",
    ],
    authors: [{ name: "Focus Track Team" }],
    creator: "Focus Track Team",
    publisher: "Focus Track",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: "Focus Track - Deep Focus & Productivity",
        description:
            "Master your work with integrated Pomodoro, Flow timers, task management, and ambient music playlists.",
        url: "https://focustracks.vercel.app",
        siteName: "Focus Track",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Focus Track - Deep Focus & Productivity",
        description:
            "Master your work with integrated Pomodoro, Flow timers, task management, and ambient music playlists.",
    },
    robots: {
        index: true,
        follow: true,
    },
    manifest: "/manifest.json",
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                suppressHydrationWarning
            >
                {children}
            </body>
        </html>
    );
}
