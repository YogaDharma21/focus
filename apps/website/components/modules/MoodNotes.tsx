"use client";

import React from "react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, NotebookPen, Smile, Sparkles, Meh, Frown, Angry, Moon } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

const MOOD_ICONS: Record<string, React.ReactNode> = {
    Happy: <Smile className="w-6 h-6" />,
    Excited: <Sparkles className="w-6 h-6" />,
    Okay: <Meh className="w-6 h-6" />,
    Sad: <Frown className="w-6 h-6" />,
    Stressed: <Angry className="w-6 h-6" />,
    Tired: <Moon className="w-6 h-6" />,
};

const MOODS = [
    { value: "Happy", label: "Happy" },
    { value: "Excited", label: "Excited" },
    { value: "Okay", label: "Okay" },
    { value: "Sad", label: "Sad" },
    { value: "Stressed", label: "Stressed" },
    { value: "Tired", label: "Tired" },
];

export function MoodNotes() {
    const { moodNotes, addMoodNote, deleteMoodNote } = useAppStore();
    const [selectedMood, setSelectedMood] = useState<string>("");
    const [noteText, setNoteText] = useState("");

    const handleSubmit = () => {
        if (!selectedMood || !noteText.trim()) return;
        addMoodNote({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            mood: selectedMood,
            text: noteText.trim(),
        });
        setSelectedMood("");
        setNoteText("");
    };

    const todayNotes = moodNotes.filter((n) => isToday(new Date(n.date)));
    const pastNotes = moodNotes.filter((n) => !isToday(new Date(n.date))).reverse();

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6 bg-card/50 border-0 shadow-md backdrop-blur-sm rounded-[var(--radius)] space-y-4">
                <div className="flex items-center gap-2">
                    <NotebookPen className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-lg">Mood Note</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                    {MOODS.map((mood) => (
                        <button
                            key={mood.value}
                            onClick={() =>
                                setSelectedMood(
                                    selectedMood === mood.value ? "" : mood.value,
                                )
                            }
                            className={cn(
                                "text-2xl p-3 rounded-lg transition-all",
                                selectedMood === mood.value
                                    ? "bg-primary/20 ring-2 ring-primary"
                                    : "bg-background/50 hover:bg-background",
                            )}
                            title={mood.label}
                        >
                            {MOOD_ICONS[mood.value]}
                        </button>
                    ))}
                </div>

                <Textarea
                    placeholder="How do you feel today? Write about your day..."
                    className="resize-none bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-base min-h-[120px]"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                />

                <Button
                    onClick={handleSubmit}
                    disabled={!selectedMood || !noteText.trim()}
                    className="w-full"
                >
                    Save Mood Note
                </Button>
            </Card>

            {todayNotes.length > 0 && (
                <Card className="p-6 bg-primary/5 border-primary/10 shadow-md backdrop-blur-sm rounded-[var(--radius)]">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Today
                    </h3>
                    <div className="space-y-3">
                        {todayNotes.map((note) => (
                            <div
                                key={note.id}
                                className="flex items-start gap-3"
                            >
                                <span className="flex-shrink-0">{MOOD_ICONS[note.mood] || note.mood}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                                        {note.text}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(note.date), "h:mm a")}
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteMoodNote(note.id)}
                                    className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {pastNotes.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Past Notes
                    </h3>
                    <div className="space-y-3">
                        {pastNotes.map((note) => {
                            const noteDate = new Date(note.date);
                            const dateLabel = isYesterday(noteDate)
                                ? "Yesterday"
                                : format(noteDate, "MMM d, yyyy");
                            return (
                                <Card
                                    key={note.id}
                                    className="p-4 bg-card/50 border-0 shadow-sm backdrop-blur-sm rounded-[var(--radius)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <span className="flex-shrink-0">
                                                {MOOD_ICONS[note.mood] || note.mood}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    {dateLabel}
                                                </p>
                                                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                                                    {note.text}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                deleteMoodNote(note.id)
                                            }
                                            className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {moodNotes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <NotebookPen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No mood notes yet.</p>
                    <p className="text-sm">
                        Select a mood and write about your day.
                    </p>
                </div>
            )}
        </div>
    );
}
