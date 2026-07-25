"use client";

import { useAppStore, BackgroundType } from "@/lib/store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const backgrounds: { value: BackgroundType; label: string; preview: string }[] = [
    {
        value: "dark",
        label: "Dark",
        preview: "bg-[#0a0a0f]",
    },
    {
        value: "gradient",
        label: "Gradient",
        preview: "bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]",
    },
    {
        value: "mountain",
        label: "Mountain",
        preview: "bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a]",
    },
    {
        value: "library",
        label: "Library",
        preview: "bg-gradient-to-b from-[#1a1510] via-[#2c2416] to-[#1a1510]",
    },
    {
        value: "cafe",
        label: "Cafe",
        preview: "bg-gradient-to-b from-[#1a1410] via-[#2c1f14] to-[#1a1410]",
    },
    {
        value: "anime-room",
        label: "Anime Room",
        preview: "bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
    },
];

export function BackgroundSelector() {
    const background = useAppStore((s) => s.background);
    const setBackground = useAppStore((s) => s.setBackground);
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                    title="Change Background"
                >
                    <Palette className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Choose Background</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 mt-2">
                    {backgrounds.map((bg) => (
                        <button
                            key={bg.value}
                            onClick={() => {
                                setBackground(bg.value);
                                setOpen(false);
                            }}
                            className={cn(
                                "relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-[1.02]",
                                background === bg.value
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-transparent hover:border-white/20"
                            )}
                        >
                            <div
                                className={cn("absolute inset-0", bg.preview)}
                            />
                            <div className="absolute inset-0 bg-black/20" />
                            <span className="absolute inset-x-0 bottom-0 p-2 text-xs font-medium text-white/90 bg-black/40 backdrop-blur-sm text-center">
                                {bg.label}
                            </span>
                            {background === bg.value && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
