"use client";

import { useAppStore, ViewType } from "@/lib/store";
import { Timer, CheckSquare, BarChart2, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavbar() {
    const currentView = useAppStore((s) => s.currentView);
    const setView = useAppStore((s) => s.setView);

    const navItems: {
        label: string;
        value: ViewType;
        icon: React.ReactNode;
    }[] = [
        { label: "Focus", value: "FOCUS", icon: <Timer className="w-5 h-5" /> },
        {
            label: "Tasks",
            value: "TODO",
            icon: <CheckSquare className="w-5 h-5" />,
        },
        {
            label: "Stats",
            value: "JOURNAL",
            icon: <BarChart2 className="w-5 h-5" />,
        },
        {
            label: "Mood",
            value: "NOTES",
            icon: <Smile className="w-5 h-5" />,
        },
    ];

    return (
        <div
            className={cn(
                "fixed z-40 transition-all duration-300 ease-out",
                "bottom-6 left-1/2 -translate-x-1/2 flex flex-row gap-2",
                "md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-6 md:translate-x-0 md:flex-col md:gap-0",
            )}
        >
            <nav
                className={cn(
                    "flex items-center gap-2 p-2 bg-sidebar/80 backdrop-blur-xl border border-sidebar-border shadow-lg ring-1 ring-white/5 rounded-[var(--radius)]",
                    "flex-row md:flex-col",
                )}
            >
                {navItems.map((item) => {
                    const isActive = currentView === item.value;
                    return (
                        <button
                            key={item.value}
                            onClick={() => setView(item.value)}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 transition-all duration-300 ease-out group rounded-[var(--radius)]",
                                isActive
                                    ? "text-primary-foreground bg-primary shadow-lg"
                                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
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
            </nav>
        </div>
    );
}



