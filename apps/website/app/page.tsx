"use client";

import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { MediaPlayer } from "@/components/modules/MediaPlayer";
import { FocusTimer } from "@/components/modules/FocusTimer";
import { TodoList } from "@/components/modules/TodoList";
import { StatsJournal } from "@/components/modules/StatsJournal";
import { DynamicIslandTimer } from "@/components/modules/DynamicIslandTimer";
import { DeepFocusOverlay } from "@/components/modules/DeepFocusOverlay";
import { BackgroundDisplay } from "@/components/modules/BackgroundDisplay";
import { SettingsPage } from "@/components/modules/SettingsPage";
import { MoodTracker } from "@/components/modules/MoodTracker";
import { useAppStore } from "@/lib/store";
import { useTimerEngine } from "@/lib/hooks";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export default function Page() {
    useTimerEngine();
    const currentView = useAppStore((s) => s.currentView);
    const isActive = useAppStore((s) => s.isActive);
    const deepFocusMode = useAppStore((s) => s.deepFocusMode);
    const setDeepFocusMode = useAppStore((s) => s.setDeepFocusMode);
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
    const prevActiveRef = useRef(isActive);

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
                "flex min-h-screen transition-opacity duration-300",
                deepFocusMode && "opacity-0 pointer-events-none invisible"
            )}>
                <BottomNavbar />
                
                <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:pl-28 pb-24 z-10 relative transition-all duration-300 ease-in-out">
                    <header className="relative flex items-center justify-between mb-8 gap-2">
                        <div className="flex items-center gap-3">
                            <img src="/icon-192.png" alt="Focus Logo" className="w-8 h-8 rounded-lg object-contain shadow-sm" />
                            <h1 className="text-xl font-bold tracking-tight opacity-90 hidden sm:block">
                                Focus
                            </h1>
                        </div>

                        {currentView !== "FOCUS" && (
                            <div className="absolute left-1/2 -translate-x-1/2 z-30">
                                <DynamicIslandTimer />
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 sm:gap-2 relative z-30">
                            <MediaPlayer />
                        </div>
                    </header>

                    <div className="w-full">
                        {currentView === "FOCUS" && (
                            <div className="flex items-center justify-center min-h-[60vh]">
                                <FocusTimer />
                            </div>
                        )}

                        {(currentView === "TODO" || currentView === "JOURNAL") && (
                            <div className="max-w-2xl mx-auto w-full pb-8 pt-12">
                                {currentView === "TODO" ? (
                                    <TodoList />
                                ) : (
                                    <StatsJournal />
                                )}
                            </div>
                        )}

                        {currentView === "NOTES" && (
                            <div className="max-w-2xl mx-auto w-full pb-8 pt-12">
                                <MoodTracker />
                            </div>
                        )}

                        {currentView === "SETTINGS" && (
                            <div className="max-w-2xl mx-auto w-full pb-8 pt-12">
                                <SettingsPage />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
