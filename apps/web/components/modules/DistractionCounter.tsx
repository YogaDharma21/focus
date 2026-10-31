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
    const isActive = useAppStore((s) => s.isActive);
    const setIsActive = useAppStore((s) => s.setIsActive);
    const addDistraction = useAppStore((s) => s.addDistraction);
    const setDeepFocusMode = useAppStore((s) => s.setDeepFocusMode);
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
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-[var(--radius)] border-2 hover:bg-surface hover:border-border hover:text-crimson transition-all shrink-0 cursor-pointer",
                        !isActive && "opacity-50 cursor-not-allowed",
                        className
                    )}
                    disabled={!isActive}
                    title="Log Distraction"
                    onClick={(e) => e.stopPropagation()}
                >
                    <AlertTriangle className="size-4 sm:size-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-44 p-1.5 bg-card border border-border rounded-[16px] shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] z-[200]"
                align="center"
            >
                <div className="flex flex-col gap-1">
                    {DISTRACTION_CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className="w-full text-left px-3 py-1.5 rounded-[10px] text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
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


