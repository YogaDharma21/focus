import React, { useEffect, useState } from "react";
import { ShieldAlert, Timer, ArrowLeft } from "lucide-react";
import { AppStateData } from "../types";
import { getStoredState, saveStoredState } from "../lib/storage";
import "../index.css";

const QUOTES = [
  "“Focus is a muscle. The more you practice avoiding distractions, the easier it gets.”",
  "“Starve your distractions, feed your focus.”",
  "“Do something today that your future self will thank you for.”",
  "“Your focus determines your reality.”",
  "“The successful warrior is the average man, with laser-like focus.”"
];

export function Blocked() {
  const [state, setState] = useState<AppStateData | null>(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    getStoredState().then((s) => {
      setState(s);
      document.body.className = s.themeMode || "dark";
    });

    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    if (target) {
      setTargetUrl(target);
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
    if (targetUrl) {
      window.location.href = targetUrl;
    } else {
      window.history.back();
    }
  };

  const isDark = !state || state.themeMode === "dark";
  const mins = state ? Math.floor(state.timeLeft / 60) : 0;
  const secs = state ? state.timeLeft % 60 : 0;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  let displayDomain = "Website Blocked";
  if (targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      displayDomain = parsed.hostname;
    } catch {
      displayDomain = targetUrl;
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 select-none font-sans ${
      isDark ? "bg-black text-white" : "bg-white text-black"
    }`}>
      <div className={`max-w-md w-full p-8 rounded-2xl border flex flex-col items-center text-center shadow-2xl ${
        isDark ? "bg-neutral-950 border-neutral-800" : "bg-neutral-50 border-neutral-300"
      }`}>
        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${
          isDark ? "bg-white text-black border-white" : "bg-black text-white border-black"
        }`}>
          <ShieldAlert className="w-7 h-7" />
        </div>

        <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-60 mb-1">
          FOCUS SHIELD BLOCKED
        </span>

        <h1 className="text-xl font-extrabold font-heading tracking-tight mb-2 uppercase">
          {displayDomain}
        </h1>

        <p className={`text-xs max-w-sm mb-6 leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
          This domain is blocked during your active <b>Pomodoro Work Session</b>.
        </p>

        {/* Live Timer Card */}
        {state && (
          <div className={`w-full p-4 rounded-xl border flex items-center justify-between mb-6 ${
            isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-100 border-neutral-200"
          }`}>
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5" />
              <div className="text-left">
                <div className="text-[10px] font-mono opacity-60 uppercase">Session Time Remaining</div>
                <div className="text-lg font-bold font-mono">{timeFormatted}</div>
              </div>
            </div>

            <div className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded border ${
              isDark ? "bg-black text-white border-neutral-700" : "bg-white text-black border-neutral-300"
            }`}>
              {state.sessionName || "WORK SESSION"}
            </div>
          </div>
        )}

        {/* Quote Card */}
        <div className={`p-4 rounded-xl border italic text-xs mb-8 ${
          isDark ? "bg-neutral-900/50 border-neutral-800 text-neutral-300" : "bg-neutral-100 border-neutral-200 text-neutral-700"
        }`}>
          {quote}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={closeTab}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
              isDark ? "bg-white text-black border-white hover:bg-neutral-200" : "bg-black text-white border-black hover:bg-neutral-800"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Work</span>
          </button>

          <button
            onClick={pauseShieldTemporarily}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border transition-all ${
              isDark ? "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800" : "bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Disable Shield
          </button>
        </div>
      </div>
    </div>
  );
}
