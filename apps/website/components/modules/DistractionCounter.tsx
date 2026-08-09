"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISTRACTION_CATEGORIES = [
    "Phone",
    "Social Media",
    "Bathroom",
    "Meeting",
    "Other",
] as const;

interface DistractionCounterProps {
    className?: string;
}

export function DistractionCounter({ className }: DistractionCounterProps) {
    const { isActive, setIsActive, addDistraction, setDeepFocusMode } = useAppStore();
    const [open, setOpen] = useState(false);

    const handleDistraction = (category: string) => {
        addDistraction(category);
        setIsActive(false);
        setDeepFocusMode(false);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-white/5 hover:border-white/20 hover:text-rose-400 transition-all shrink-0 cursor-pointer",
                        !isActive && "opacity-50 cursor-not-allowed",
                        className
                    )}
                    disabled={!isActive}
                    title="Log Distraction"
                    onClick={(e) => e.stopPropagation()}
                >
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-44 p-1.5 bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl z-[200]"
                align="center"
            >
                <div className="flex flex-col gap-1">
                    {DISTRACTION_CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                            onClick={() => handleDistraction(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}


