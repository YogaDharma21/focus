"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const DISTRACTION_CATEGORIES = [
    "Phone",
    "Social Media",
    "Bathroom",
    "Meeting",
    "Other",
] as const;

export function DistractionCounter() {
    const { isActive, setIsActive, addDistraction } = useAppStore();
    const [open, setOpen] = useState(false);

    const handleDistraction = (category: string) => {
        addDistraction(category);
        setIsActive(false);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "w-12 h-12 rounded-[var(--radius)] border-2 transition-all",
                        isActive
                            ? "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                            : "opacity-50 cursor-not-allowed",
                    )}
                    disabled={!isActive}
                    title="I got distracted"
                    onClick={(e) => e.stopPropagation()}
                >
                    <AlertTriangle className="w-5 h-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-48 p-2 rounded-[var(--radius)]"
                align="center"
            >
                <div className="flex flex-col gap-1">
                    {DISTRACTION_CATEGORIES.map((cat) => (
                        <Button
                            key={cat}
                            variant="ghost"
                            size="sm"
                            className="justify-start rounded-[var(--radius)]"
                            onClick={() => handleDistraction(cat)}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

