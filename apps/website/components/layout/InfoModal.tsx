"use client";

import { Github, ExternalLink } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

const PROJECT_INFO = {
    name: "Focus",
    version: "v0.0.1",
    description:
        "A minimalist productivity app designed to help you stay in flow. Features a Pomodoro-style timer, task management, stats, and an ambient media player for focus enhancement.",
    links: [
        {
            label: "GitHub Repository",
            url: "https://github.com/YogaDharma21/focus-website",
            icon: Github,
        },
    ],
};

export function InfoModal() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent showCloseButton>
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {PROJECT_INFO.name}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        {PROJECT_INFO.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Version {PROJECT_INFO.version}</span>
                    </div>

                    <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-3">Links</p>
                        <div className="space-y-2">
                            {PROJECT_INFO.links.map((link) => (
                                <a
                                    key={link.url}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 rounded-[var(--radius)] hover:bg-secondary transition-colors text-sm"
                                >
                                    <link.icon className="w-4 h-4" />
                                    <span>{link.label}</span>
                                    <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function InfoButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex flex-col items-center justify-center w-12 h-11 sm:w-16 sm:h-14 rounded-[var(--radius)] transition-all duration-300 ease-out group text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
                <span className="transform transition-transform duration-300 group-hover:scale-105">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                    </svg>
                </span>
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent showCloseButton>
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {PROJECT_INFO.name}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            {PROJECT_INFO.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Version {PROJECT_INFO.version}</span>
                        </div>

                        <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-3">Links</p>
                            <div className="space-y-2">
                                {PROJECT_INFO.links.map((link) => (
                                    <a
                                        key={link.url}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 rounded-[var(--radius)] hover:bg-secondary transition-colors text-sm"
                                    >
                                        <link.icon className="w-4 h-4" />
                                        <span>{link.label}</span>
                                        <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
