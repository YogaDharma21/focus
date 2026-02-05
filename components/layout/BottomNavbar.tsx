"use client";

import { useAppStore, ViewType } from "@/lib/store";
import { Timer, CheckSquare, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoButton } from "./InfoModal";

export function BottomNavbar() {
    const { currentView, setView } = useAppStore();

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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <nav className="flex items-center gap-2 p-2 bg-sidebar/80 backdrop-blur-xl border border-sidebar-border rounded-full shadow-2xl ring-1 ring-white/5">
                {navItems.map((item) => {
                    const isActive = currentView === item.value;
                    return (
                        <button
                            key={item.value}
                            onClick={() => setView(item.value)}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300 ease-out group",
                                isActive
                                    ? "text-primary-foreground bg-primary shadow-[0_0_20px_rgba(255,255,255,0.15)]"
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
                            {isActive && (
                                <span className="absolute -bottom-1 w-1 h-1 bg-current rounded-full animate-fade-in" />
                            )}
                        </button>
                    );
                })}
                <InfoButton />
            </nav>
        </div>
    );
}
