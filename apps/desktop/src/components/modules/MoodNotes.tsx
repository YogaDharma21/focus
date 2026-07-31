import React, { useState } from 'react';
import { HeartHandshake, Smile, Frown, Meh, Zap, Flame, Trash2, Plus, Sparkles } from 'lucide-react';
import { useDesktopStore, MoodNote } from '../../lib/store';

export const MoodNotes: React.FC = () => {
  const { moodNotes, addMoodNote, deleteMoodNote } = useDesktopStore();

  const [selectedMood, setSelectedMood] = useState("🎯 Focused");
  const [noteText, setNoteText] = useState("");

  const moodOptions = [
    { label: "🎯 Focused", emoji: "🎯" },
    { label: "😃 Happy", emoji: "😃" },
    { label: "🧘 Calm", emoji: "🧘" },
    { label: "⚡ Stressed", emoji: "⚡" },
    { label: "😴 Tired", emoji: "😴" },
  ];

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
      <form onSubmit={handleSubmit} className="w-full md:w-80 glass-panel p-5 rounded-2xl border border-white/10 space-y-4 shrink-0">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <HeartHandshake className="w-4 h-4 text-pink-400" />
          <h3 className="text-xs font-bold text-zinc-200">Daily Focus Reflection</h3>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">How are you feeling?</label>
          <div className="flex flex-wrap gap-1.5">
            {moodOptions.map((m) => (
              <button
                type="button"
                key={m.label}
                onClick={() => setSelectedMood(m.label)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedMood === m.label
                    ? "bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-md shadow-pink-500/10"
                    : "bg-zinc-900/60 text-zinc-400 hover:bg-white/5"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Reflection & Notes</label>
          <textarea
            rows={4}
            placeholder="Write a brief reflection about your focus, wins, or challenges..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-pink-500 resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Log Mood Reflection
        </button>
      </form>

      {/* Mood History Cards */}
      <div className="flex-1 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col space-y-3 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h4 className="text-xs font-semibold text-zinc-200">Reflection Journal Timeline</h4>
          <span className="text-[10px] text-zinc-500">{moodNotes.length} entries</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {moodNotes.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
              No mood reflections recorded yet. Log your first check-in!
            </div>
          ) : (
            moodNotes.slice().reverse().map((note) => (
              <div key={note.id} className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2 relative group hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold">
                    {note.mood}
                  </span>
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
