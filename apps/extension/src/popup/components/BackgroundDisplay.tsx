import React from "react";
import { BackgroundTheme } from "../../types";

interface BackgroundDisplayProps {
  theme: BackgroundTheme;
}

const backgrounds: Record<string, { className: string; svg: React.ReactNode }> = {
  dark: {
    className: "bg-[#0a0a0f]",
    svg: null,
  },
  default: {
    className: "bg-[#0a0a0f]",
    svg: null,
  },
  gradient: {
    className: "bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]",
    svg: (
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[180px] h-[180px] bg-purple-500/40 rounded-full blur-[60px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[220px] h-[220px] bg-blue-500/30 rounded-full blur-[70px]" />
        <div className="absolute top-[40%] left-[40%] w-[150px] h-[150px] bg-pink-500/20 rounded-full blur-[50px]" />
      </div>
    ),
  },
  mountain: {
    className: "bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a]",
    svg: (
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-[55%] opacity-60 pointer-events-none"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        <path fill="#1e293b" d="M0,600 L0,300 Q200,200 400,280 T800,250 T1200,300 L1440,280 L1440,600 Z" />
        <path fill="#0f172a" d="M0,600 L0,400 Q300,320 600,380 T1000,350 T1440,400 L1440,600 Z" />
        <path fill="rgba(255,255,255,0.03)" d="M0,600 L0,450 Q400,380 800,420 T1440,400 L1440,600 Z" />
      </svg>
    ),
  },
  library: {
    className: "bg-gradient-to-b from-[#1a1510] via-[#2c2416] to-[#1a1510]",
    svg: (
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-[65%] opacity-50 pointer-events-none"
        viewBox="0 0 1440 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="extShelfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
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
    className: "bg-gradient-to-b from-[#1a1410] via-[#2c1f14] to-[#1a1410]",
    svg: (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[12%] left-[15%] w-[120px] h-[150px] border-4 border-amber-900/30 rounded-lg bg-amber-950/20" />
        <div className="absolute top-[10%] left-[17%] w-[40px] h-[60px] bg-gradient-to-b from-amber-200/10 to-amber-100/5 blur-sm" />
        <div className="absolute bottom-[20%] left-[20%] w-[30px] h-[40px] bg-amber-900/20 rounded-b-full blur-[2px]" />
        <div className="absolute bottom-[15%] right-[10%] w-[200px] h-[150px] bg-amber-500/10 rounded-full blur-[60px]" />
        <div className="absolute top-[35%] right-[12%] w-[30px] h-[40px] border-2 border-amber-900/20 rounded-b-full bg-amber-900/10" />
      </div>
    ),
  },
  "anime-room": {
    className: "bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
    svg: (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[5%] left-[10%] w-[200px] h-[260px] bg-gradient-to-b from-orange-200/20 via-pink-200/10 to-purple-300/20 rounded-lg opacity-60" />
        <div className="absolute top-[8%] left-[12%] w-[130px] h-[170px] bg-gradient-to-b from-yellow-100/30 to-orange-200/20 rounded blur-[2px]" />
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-[#0f3460]/80 to-transparent" />
        <div className="absolute bottom-[8%] left-[8%] w-[45px] h-[60px] bg-indigo-900/30 rounded-t-lg" />
        <div className="absolute bottom-[8%] left-[22%] w-[35px] h-[50px] bg-purple-900/20 rounded-t-lg" />
        <div className="absolute bottom-[8%] left-[36%] w-[50px] h-[70px] bg-indigo-800/25 rounded-t-lg" />
        <div className="absolute bottom-[8%] right-[15%] w-[60px] h-[45px] bg-pink-900/20 rounded-t-lg" />
        <div className="absolute top-[12%] left-[45%] w-[90px] h-[2px] bg-amber-200/30 rotate-[-15deg]" />
      </div>
    ),
  },
};

export function BackgroundDisplay({ theme }: BackgroundDisplayProps) {
  const config = backgrounds[theme] || backgrounds.dark;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-0 transition-all duration-700 ease-in-out ${config.className}`}>
      {config.svg}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
    </div>
  );
}
