"use client";

import { useAppStore, ViewType } from "@/lib/store";
import { LayoutGrid, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavbar() {
    const currentView = useAppStore((s) => s.currentView);
    const setView = useAppStore((s) => s.setView);

    const navItems: {
        label: string;
        value: ViewType;
        icon: React.ReactNode;
    }[] = [
        { label: "Focus", value: "FOCUS", icon: <LayoutGrid className="w-5 h-5" /> },
        {
            label: "Stats",
            value: "JOURNAL",
            icon: <Calendar className="w-5 h-5" />,
        },
        { label: "Settings", value: "SETTINGS", icon: <Settings className="w-5 h-5" /> },
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
                    "flex items-center gap-2 p-2 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-full",
                    "flex-row md:flex-col",
                )}
            >
                {navItems.map((item) => {
                    const isActive = currentView === item.value;
                    return (
                        <button
                            key={item.value}
                            onClick={() => setView(item.value)}
                            title={item.label}
                            aria-label={item.label}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 transition-all duration-300 ease-out group rounded-full",
                                isActive
                                    ? "text-primary-foreground bg-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-surface",
                            )}
                        >
                            <span
                                className={cn(
                                    "transform transition-transform duration-300",
                                    isActive
                                        ? "scale-105"
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
