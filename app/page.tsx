"use client";

import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { InfoButton } from "@/components/layout/InfoModal";
import { MediaPlayer } from "@/components/modules/MediaPlayer";
import { FocusTimer } from "@/components/modules/FocusTimer";
import { TodoList } from "@/components/modules/TodoList";
import { StatsJournal } from "@/components/modules/StatsJournal";
import { DynamicIslandTimer } from "@/components/modules/DynamicIslandTimer";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Page() {
    const { currentView, mediaPlayerOpen } = useAppStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-500">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-[var(--radius)] blur-[120px] opacity-20" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-[var(--radius)] blur-[120px] opacity-20" />
            </div>

            <div className={cn(
                "flex-1 w-full max-w-7xl mx-auto p-6 pb-20 z-10 relative transition-all duration-300 ease-in-out",
                mediaPlayerOpen && "lg:pr-[344px]"
            )}>
                <header className="flex items-center justify-between mb-8">
                    <h1 className="text-xl font-bold tracking-tight opacity-90">
                        {currentView === "FOCUS" && "Focus Session"}
                        {currentView === "TODO" && "Tasks"}
                        {currentView === "JOURNAL" && "Journal & Stats"}
                    </h1>
                    <div className="flex items-center">
                        <div className="scale-90">
                            <InfoButton />
                        </div>
                    </div>
                </header>

                <div className="w-full transition-all duration-500">
                    {currentView !== "FOCUS" && <DynamicIslandTimer />}

                    {currentView === "FOCUS" && (
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <FocusTimer />
                        </div>
                    )}

                    {(currentView === "TODO" || currentView === "JOURNAL") && (
                        <div className={cn(
                            "max-w-2xl mx-auto w-full pb-8 pt-12 transition-all duration-300 ease-in-out",
                            mediaPlayerOpen && "lg:max-w-none lg:mx-0 lg:pr-0"
                        )}>
                            {currentView === "TODO" ? (
                                <TodoList />
                            ) : (
                                <StatsJournal />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <BottomNavbar />
            <MediaPlayer />
        </main>
    );
}
