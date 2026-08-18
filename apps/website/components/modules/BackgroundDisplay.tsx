"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const backgrounds: Record<string, { label: string; className: string; svg: React.ReactNode }> = {
    dark: {
        label: "Dark",
        className: "bg-[#0a0a0f]",
        svg: null,
    },
    gradient: {
        label: "Gradient",
        className: "bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]",
        svg: (
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-purple-500/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[50%] w-[250px] h-[250px] bg-pink-500/20 rounded-full blur-[80px]" />
            </div>
        ),
    },
    mountain: {
        label: "Mountain",
        className: "bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a]",
        svg: (
            <svg className="absolute bottom-0 left-0 right-0 w-full h-[60%] opacity-60" viewBox="0 0 1440 600" preserveAspectRatio="none">
                <path fill="#1e293b" d="M0,600 L0,300 Q200,200 400,280 T800,250 T1200,300 L1440,280 L1440,600 Z" />
                <path fill="#0f172a" d="M0,600 L0,400 Q300,320 600,380 T1000,350 T1440,400 L1440,600 Z" />
                <path fill="rgba(255,255,255,0.03)" d="M0,600 L0,450 Q400,380 800,420 T1440,400 L1440,600 Z" />
            </svg>
        ),
    },
    library: {
        label: "Library",
        className: "bg-gradient-to-b from-[#1a1510] via-[#2c2416] to-[#1a1510]",
        svg: (
            <svg className="absolute bottom-0 left-0 right-0 w-full h-[70%] opacity-50" viewBox="0 0 1440 800" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="shelfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3d2e1a" />
                        <stop offset="100%" stopColor="#1a1510" />
                    </linearGradient>
                </defs>
                {[0, 1, 2, 3, 4].map((row) => (
                    <g key={row}>
                        <rect x="0" y={400 + row * 70} width="1440" height="4" fill="#4a3c2a" opacity="0.8" />
                        {Array.from({ length: 20 }).map((_, i) => {
                            const widths = [28, 32, 35, 30, 38, 25, 33, 29, 36, 31, 27, 34, 30, 28, 35, 32, 29, 37, 26, 33];
                            const fills = ["#8b5a2b", "#6b4423", "#a0522d", "#7b3f00", "#5c3317"];
                            return (
                                <rect
                                    key={i}
                                    x={i * 72 + 10}
                                    y={400 + row * 70 + 4}
                                    width={widths[i]}
                                    height={60}
                                    fill={fills[i % 5]}
                                    opacity="0.7"
                                    rx="1"
                                />
                            );
                        })}
                    </g>
                ))}
            </svg>
        ),
    },
    cafe: {
        label: "Cafe",
        className: "bg-gradient-to-b from-[#1a1410] via-[#2c1f14] to-[#1a1410]",
        svg: (
            <div className="absolute inset-0">
                <div className="absolute top-[15%] left-[20%] w-[180px] h-[220px] border-4 border-amber-900/30 rounded-lg bg-amber-950/20" />
                <div className="absolute top-[12%] left-[22%] w-[60px] h-[80px] bg-gradient-to-b from-amber-200/10 to-amber-100/5 blur-sm" />
                <div className="absolute bottom-[20%] left-[25%] w-[40px] h-[50px] bg-amber-900/20 rounded-b-full blur-[2px]" />
                <div className="absolute bottom-[15%] right-[20%] w-[300px] h-[200px] bg-amber-500/10 rounded-full blur-[80px]" />
                <div className="absolute top-[40%] right-[15%] w-[40px] h-[50px] border-2 border-amber-900/20 rounded-b-full bg-amber-900/10" />
            </div>
        ),
    },
    "anime-room": {
        label: "Anime Room",
        className: "bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
        svg: (
            <div className="absolute inset-0">
                <div className="absolute top-[5%] left-[15%] w-[300px] h-[400px] bg-gradient-to-b from-orange-200/20 via-pink-200/10 to-purple-300/20 rounded-lg opacity-60" />
                <div className="absolute top-[8%] left-[18%] w-[200px] h-[250px] bg-gradient-to-b from-yellow-100/30 to-orange-200/20 rounded blur-[2px]" />
                <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-[#0f3460]/80 to-transparent" />
                <div className="absolute bottom-[10%] left-[10%] w-[60px] h-[80px] bg-indigo-900/30 rounded-t-lg" />
                <div className="absolute bottom-[10%] left-[25%] w-[50px] h-[70px] bg-purple-900/20 rounded-t-lg" />
                <div className="absolute bottom-[10%] left-[40%] w-[70px] h-[90px] bg-indigo-800/25 rounded-t-lg" />
                <div className="absolute bottom-[10%] right-[20%] w-[80px] h-[60px] bg-pink-900/20 rounded-t-lg" />
                <div className="absolute top-[15%] left-[50%] w-[120px] h-[2px] bg-amber-200/30 rotate-[-15deg]" />
            </div>
        ),
    },
};

export function BackgroundDisplay() {
    const background = useAppStore((s) => s.background);
    const config = backgrounds[background] || backgrounds.dark;

    if (background === "dark") return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-0 transition-all duration-700 ease-in-out pointer-events-none",
                config.className
            )}
        >
            {config.svg}
            <div className="absolute inset-0 bg-black/25" />
        </div>
    );
}
