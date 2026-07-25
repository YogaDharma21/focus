"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MOODS = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😐", label: "Okay" },
    { emoji: "😞", label: "Sad" },
];

export interface SessionReportData {
    duration: number;
    mood: string;
    note: string;
    tasks: string[];
}

interface SessionReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    duration: number;
    tasks: string[];
    sessionName: string;
    onSubmit: (data: SessionReportData) => void;
}

export function SessionReportDialog({
    open,
    onOpenChange,
    duration,
    tasks,
    sessionName,
    onSubmit,
}: SessionReportDialogProps) {
    const { todos, addMoodNote } = useAppStore();
    const [mood, setMood] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs}s`;
        if (secs === 0) return `${mins} min`;
        return `${mins} min ${secs}s`;
    };

    const handleSubmit = async () => {
        setSubmitting(true);

        const reportData: SessionReportData = {
            duration,
            mood,
            note,
            tasks: tasks.length > 0 ? tasks : todos.map((t) => t.text),
        };

        try {
            const response = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reportData),
            });

            if (response.ok) {
                if (note.trim()) {
                    addMoodNote({
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        mood: mood || "😐",
                        text: note.trim(),
                    });
                }
                onSubmit(reportData);
                setMood("");
                setNote("");
            }
        } catch {
            onSubmit(reportData);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        Session Complete
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="font-semibold">{formatDuration(duration)}</span>
                    </div>

                    {sessionName && (
                        <div className="flex items-center justify-between p-3 rounded-[var(--radius)] bg-secondary/20">
                            <span className="text-sm text-muted-foreground">Session</span>
                            <span className="font-medium text-sm truncate max-w-[200px]">{sessionName}</span>
                        </div>
                    )}

                    {tasks.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
                            <div className="space-y-1.5">
                                {tasks.map((task, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-2 rounded-md bg-secondary/10 text-sm"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span className="truncate">{task}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Mood</h3>
                        <div className="flex gap-2">
                            {MOODS.map((m) => (
                                <button
                                    key={m.emoji}
                                    onClick={() => setMood(mood === m.emoji ? "" : m.emoji)}
                                    className={cn(
                                        "text-2xl p-3 rounded-lg transition-all",
                                        mood === m.emoji
                                            ? "bg-primary/20 ring-2 ring-primary"
                                            : "bg-background/50 hover:bg-background",
                                    )}
                                    title={m.label}
                                >
                                    {m.emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Add Notes</h3>
                        <Textarea
                            placeholder="How did the session go? What did you accomplish?"
                            className="resize-none bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-base min-h-[120px]"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Notes will also be saved to your mood journal
                        </p>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full"
                    >
                        {submitting ? "Saving..." : "Save Session Report"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
