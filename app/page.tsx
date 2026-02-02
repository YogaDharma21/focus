"use client";

import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { MediaPlayer } from "@/components/modules/MediaPlayer";
import { FocusTimer } from "@/components/modules/FocusTimer";
import { TodoList } from "@/components/modules/TodoList";
import { StatsJournal } from "@/components/modules/StatsJournal";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Page() {
    const { currentView } = useAppStore();
    const [mounted, setMounted] = useState(false);

    // Hydration fix
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-500">
            {/* Dynamic Background / Ambient Light */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-20" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-20" />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full max-w-7xl mx-auto p-6 pb-20 z-10 relative">
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-xl font-bold tracking-tight opacity-90">
                        {currentView === "FOCUS" && "Focus Session"}
                        {currentView === "TODO" && "Tasks"}
                        {currentView === "JOURNAL" && "Journal & Stats"}
                    </h1>
                    <div className="w-8 h-8 rounded-full bg-secondary/50" />{" "}
                    {/* Avatar placeholder */}
                </header>

                <div className="grid grid-cols-12 gap-8 w-full h-full">
                    {/* View content placeholders */}
                    <div
                        className={cn(
                            "transition-all duration-500 flex items-center justify-center",
                            currentView === "FOCUS"
                                ? "col-span-12"
                                : "col-span-12 lg:col-span-4",
                        )}
                    >
                        <FocusTimer />
                    </div>

                    {(currentView === "TODO" || currentView === "JOURNAL") && (
                        <div className="col-span-12 lg:col-span-8 h-full pb-8">
                            {currentView === "TODO" ? (
                                <TodoList />
                            ) : (
                                <StatsJournal />
                            )}
                        </div>
                    )}
                </div>

                {/* Persistent Media Player (V2 Layout) */}
                <MediaPlayer />
            </div>

            <BottomNavbar />
        </main>
    );
}
