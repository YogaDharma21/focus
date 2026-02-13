"use client";

import { useAppStore, ViewType } from "@/lib/store";
import { Timer, CheckSquare, BarChart2, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks";

export function BottomNavbar() {
    const { currentView, setView, setMediaPlayerOpen, mediaPlayerOpen } =
        useAppStore();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const navItems: {
        label: string;
        value: ViewType;
        icon: React.ReactNode;
    }[] = [
        { label: "Focus", value: "FOCUS", icon: <Timer className="w-6 h-6" /> },
        {
            label: "Tasks",
            value: "TODO",
            icon: <CheckSquare className="w-6 h-6" />,
        },
        {
            label: "Stats",
            value: "JOURNAL",
            icon: <BarChart2 className="w-6 h-6" />,
        },
    ];

    return (
        <div
            className={cn(
                "fixed z-40 transition-all duration-300 ease-out",
                isDesktop
                    ? "left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2"
                    : "bottom-6 left-1/2 -translate-x-1/2 flex flex-row gap-2",
            )}
        >
            <nav
                className={cn(
                    "flex items-center gap-2 p-2 bg-sidebar/80 backdrop-blur-xl border border-sidebar-border shadow-2xl ring-1 ring-white/5",
                    isDesktop
                        ? "flex-col rounded-none"
                        : "flex-row rounded-none",
                )}
            >
                {navItems.map((item) => {
                    const isActive = currentView === item.value;
                    return (
                        <button
                            key={item.value}
                            onClick={() => setView(item.value)}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-16 h-14 transition-all duration-300 ease-out group",
                                isActive
                                    ? "text-primary-foreground bg-primary shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                                isDesktop ? "rounded-none" : "rounded-none",
                            )}
                        >
                            <span
                                className={cn(
                                    "transform transition-transform duration-300",
                                    isActive
                                        ? "scale-110"
                                        : "group-hover:scale-105",
                                )}
                            >
                                {item.icon}
                            </span>
                        </button>
                    );
                })}
                <button
                    onClick={() => setMediaPlayerOpen(!mediaPlayerOpen)}
                    className={cn(
                        "relative flex flex-col items-center justify-center w-16 h-14 transition-all duration-300 ease-out group text-muted-foreground hover:text-foreground hover:bg-white/5",
                        isDesktop ? "rounded-none" : "rounded-none",
                    )}
                    aria-label="Toggle media player"
                >
                    <span className="transform transition-transform duration-300 group-hover:scale-105">
                        <Youtube className="w-6 h-6" />
                    </span>
                    {mediaPlayerOpen && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-none" />
                    )}
                </button>
            </nav>
        </div>
    );
}
