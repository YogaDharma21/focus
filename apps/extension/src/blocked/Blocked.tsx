import React, { useEffect, useState } from "react";
import { ShieldAlert, Timer, ArrowLeft, Flame, Sparkles } from "lucide-react";
import { AppStateData } from "../types";
import { getStoredState, saveStoredState } from "../lib/storage";
import "../index.css";

const QUOTES = [
  "“Focus is a muscle. The more you practice avoiding distractions, the easier it gets.”",
  "“Starve your distractions, feed your focus.”",
  "“Do something today that your future self will thank you for.”",
  "“Your focus determines your reality.” — Qui-Gon Jinn",
  "“The successful warrior is the average man, with laser-like focus.” — Bruce Lee"
];

export function Blocked() {
  const [state, setState] = useState<AppStateData | null>(null);
  const [targetDomain, setTargetDomain] = useState("");
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    getStoredState().then(setState);

    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    if (target) {
      try {
        const parsed = new URL(target);
        setTargetDomain(parsed.hostname);
      } catch {
        setTargetDomain(target);
      }
    }

    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const closeTab = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.getCurrent((tab) => {
        if (tab?.id) chrome.tabs.remove(tab.id);
      });
    } else {
      window.history.back();
    }
  };

  const pauseShieldTemporarily = async () => {
    if (!state) return;
    await saveStoredState({
      shield: {
        ...state.shield,
        enabled: false
      }
    });
    if (targetDomain) {
      window.location.href = `https://${targetDomain}`;
    } else {
      window.history.back();
    }
  };

  const mins = state ? Math.floor(state.timeLeft / 60) : 0;
  const secs = state ? state.timeLeft % 60 : 0;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel max-w-lg w-full p-8 rounded-3xl border border-slate-800/80 shadow-2xl flex flex-col items-center text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
          Distraction Shield Active
        </span>

        <h1 className="text-2xl font-extrabold text-white font-heading mb-2">
          {targetDomain ? `${targetDomain} is Blocked` : "Website Blocked"}
        </h1>

        <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
          You are currently in an active <span className="text-emerald-400 font-semibold">Focus Session</span>. Stay in flow and finish your goal!
        </p>

        {/* Live Timer Status Card */}
        {state && (
          <div className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Timer className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-300">Remaining Focus Time</div>
                <div className="text-xl font-bold text-white font-heading">{timeFormatted}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{state.sessionName || "Active Session"}</span>
            </div>
          </div>
        )}

        {/* Quote Card */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 mb-8 italic text-xs text-slate-300">
          {quote}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={closeTab}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Work</span>
          </button>

          <button
            onClick={pauseShieldTemporarily}
            className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 font-semibold text-xs transition-all"
          >
            Disable Shield (5m)
          </button>
        </div>
      </div>
    </div>
  );
}
