import React, { useState } from 'react';
import { NotebookPen, Trash2, Plus, Target, Smile, Wind, Zap, Moon } from 'lucide-react';
import { useDesktopStore, MoodNote } from '../../lib/store';

export const MoodNotes: React.FC = () => {
  const { moodNotes, addMoodNote, deleteMoodNote } = useDesktopStore();

  const [selectedMood, setSelectedMood] = useState("Focused");
  const [noteText, setNoteText] = useState("");

  const moodOptions = [
    { label: "Focused", icon: Target, key: "Focused" },
    { label: "Happy", icon: Smile, key: "Happy" },
    { label: "Calm", icon: Wind, key: "Calm" },
    { label: "Stressed", icon: Zap, key: "Stressed" },
    { label: "Tired", icon: Moon, key: "Tired" },
  ];

  const renderMoodBadge = (moodStr: string) => {
    const cleanMood = moodStr.replace(/^[^\w\s]+\s*/, '');
    let IconComponent = Target;
    if (cleanMood.includes("Happy")) IconComponent = Smile;
    else if (cleanMood.includes("Calm")) IconComponent = Wind;
    else if (cleanMood.includes("Stressed")) IconComponent = Zap;
    else if (cleanMood.includes("Tired")) IconComponent = Moon;

    return (
      <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium inline-flex items-center gap-1.5">
        <IconComponent className="w-3 h-3 text-zinc-300" />
        <span>{cleanMood}</span>
      </span>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newNote: MoodNote = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mood: selectedMood,
      text: noteText.trim()
    };

    addMoodNote(newNote);
    setNoteText("");
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full select-none overflow-hidden">
      {/* Mood Entry Form */}
      <form onSubmit={handleSubmit} className="w-full md:w-80 shadcn-card p-5 space-y-4 shrink-0">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
          <NotebookPen className="w-4 h-4 text-zinc-300" />
          <h3 className="text-xs font-semibold text-zinc-200">Daily Focus Reflection</h3>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">How are you feeling?</label>
          <div className="flex flex-wrap gap-1.5">
            {moodOptions.map((m) => {
              const IconComp = m.icon;
              return (
                <button
                  type="button"
                  key={m.key}
                  onClick={() => setSelectedMood(m.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedMood === m.key
                      ? "bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800/60"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Reflection & Notes</label>
          <textarea
            rows={4}
            placeholder="Write a brief reflection..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full shadcn-input p-3 text-xs resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Log Reflection
        </button>
      </form>

      {/* Mood History Cards */}
      <div className="flex-1 shadcn-card p-5 flex flex-col space-y-3 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h4 className="text-xs font-semibold text-zinc-200">Reflection Timeline</h4>
          <span className="text-[10px] text-zinc-500">{moodNotes.length} entries</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {moodNotes.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
              No mood reflections recorded yet.
            </div>
          ) : (
            moodNotes.slice().reverse().map((note) => (
              <div key={note.id} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 relative group hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between">
                  {renderMoodBadge(note.mood)}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(note.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => deleteMoodNote(note.id)}
                      className="text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
