"use client";

import { Focus } from "lucide-react";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { InfoButton } from "@/components/layout/InfoModal";
import { MediaPlayer } from "@/components/modules/MediaPlayer";
import { FocusTimer } from "@/components/modules/FocusTimer";
import { TodoList } from "@/components/modules/TodoList";
import { StatsJournal } from "@/components/modules/StatsJournal";
import { DynamicIslandTimer } from "@/components/modules/DynamicIslandTimer";
import { DeepFocusOverlay } from "@/components/modules/DeepFocusOverlay";
import { BackgroundDisplay } from "@/components/modules/BackgroundDisplay";
import { BackgroundSelector } from "@/components/modules/BackgroundSelector";
import { MoodNotes } from "@/components/modules/MoodNotes";
import { FocusSessionHistory } from "@/components/modules/FocusSessionHistory";
import { useAppStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function Page() {
    const { currentView, mediaPlayerOpen, isActive, deepFocusMode, setDeepFocusMode } = useAppStore();
    const [mounted, setMounted] = useState(false);
    const prevActiveRef = useRef(isActive);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isActive && !prevActiveRef.current && !deepFocusMode) {
            setDeepFocusMode(true);
        }
        prevActiveRef.current = isActive;
    }, [isActive, deepFocusMode, setDeepFocusMode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "f" || e.key === "F") {
                const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
                if (tag === "input" || tag === "textarea" || tag === "select") {
                    return;
                }
                setDeepFocusMode(!deepFocusMode);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [deepFocusMode, setDeepFocusMode]);

    const toggleFocusMode = () => setDeepFocusMode(!deepFocusMode);

    if (!mounted) return null;

    return (
        <main className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-500">
            <BackgroundDisplay />

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-[var(--radius)] blur-[120px] opacity-20" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-[var(--radius)] blur-[120px] opacity-20" />
            </div>

            {deepFocusMode && <DeepFocusOverlay />}

            <div className={cn(
                "flex min-h-screen transition-opacity duration-500",
                deepFocusMode && "opacity-0 pointer-events-none"
            )}>
                <BottomNavbar />
                
                <div className={cn(
                    "flex-1 w-full max-w-7xl mx-auto p-6 pb-24 z-10 relative transition-all duration-300 ease-in-out",
                    mediaPlayerOpen && "md:pr-[344px]"
                )}>
                    <header className="flex items-center justify-between mb-8">
                        <h1 className="text-xl font-bold tracking-tight opacity-90">
                        {currentView === "FOCUS" && "Focus Session"}
                        {currentView === "TODO" && "Tasks"}
                        {currentView === "JOURNAL" && "Journal & Stats"}
                        {currentView === "NOTES" && "Notes"}
                        {currentView === "HISTORY" && "Session History"}
                        </h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleFocusMode}
                                className={cn(
                                    "flex flex-col items-center justify-center w-16 h-14 rounded-[var(--radius)] transition-all duration-300 ease-out group",
                                    deepFocusMode
                                        ? "text-primary-foreground bg-primary shadow-lg"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                                )}
                                title="Toggle Deep Focus Mode"
                            >
                                <span className="transform transition-transform duration-300 group-hover:scale-105">
                                    <Focus className="w-6 h-6" />
                                </span>
                            </button>
                            <BackgroundSelector />
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

                        {currentView === "NOTES" && (
                            <div className={cn(
                                "max-w-2xl mx-auto w-full pb-8 pt-12 transition-all duration-300 ease-in-out",
                                mediaPlayerOpen && "lg:max-w-none lg:mx-0 lg:pr-0"
                            )}>
                                <MoodNotes />
                            </div>
                        )}

                        {currentView === "HISTORY" && (
                            <div className={cn(
                                "max-w-2xl mx-auto w-full pb-8 pt-12 transition-all duration-300 ease-in-out",
                                mediaPlayerOpen && "lg:max-w-none lg:mx-0 lg:pr-0"
                            )}>
                                <FocusSessionHistory />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <MediaPlayer />
        </main>
    );
}
