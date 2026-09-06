import React, { useEffect, useState } from "react";
import { Pause, ShieldAlert, Timer } from "lucide-react";
import { AppStateData } from "../types";
import { getStoredState, saveStoredState, subscribeToStateChanges } from "../lib/storage";
import "../index.css";

export function Blocked() {
  const [state, setState] = useState<AppStateData | null>(null);
  const [targetUrl, setTargetUrl] = useState("");

  useEffect(() => {
    getStoredState().then((s) => {
      setState(s);
      document.body.className = "dark";
    });

    const unsubscribe = subscribeToStateChanges((newState) => {
      setState(newState);
    });

    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    if (target) {
      setTargetUrl(target);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!state || !targetUrl) return;
    const isBlockingActive =
      state.shield.enabled &&
      state.isActive &&
      (state.timerState === "WORK" || state.timerState === "FLOW");

    if (!isBlockingActive) {
      window.location.href = targetUrl;
    }
  }, [state, targetUrl]);

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

  const pauseTimer = async () => {
    if (!state) return;
    await saveStoredState({ isActive: false });
  };

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
    <div className="min-h-screen flex items-center justify-center p-6 select-none font-sans bg-black text-white">
      <div className="max-w-md w-full p-8 rounded-2xl border flex flex-col items-center text-center shadow-2xl bg-neutral-950 border-neutral-800">
        <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 bg-white text-black border-white">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-60 mb-1">
          FOCUS SHIELD BLOCKED
        </span>

        <h1 className="text-xl font-extrabold font-heading tracking-tight mb-2 uppercase">
          {displayDomain}
        </h1>

        <p className="text-xs max-w-sm mb-6 leading-relaxed text-neutral-400">
          This domain is blocked during your active <b>Pomodoro Work Session</b>.
        </p>

        {/* Live Timer Card */}
        {state && (
          <div className="w-full p-4 rounded-xl border flex items-center gap-3 mb-6 bg-neutral-900 border-neutral-800">
            <Timer className="w-5 h-5 shrink-0" />
            <div className="text-left">
              <div className="text-[10px] font-mono opacity-60 uppercase">Session Time Remaining</div>
              <div className="text-lg font-bold font-mono">{timeFormatted}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={pauseTimer}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 border transition-all bg-white text-black border-white hover:bg-neutral-200"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause Timer
          </button>
          <button
            onClick={pauseShieldTemporarily}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs border transition-all bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          >
            Disable Shield
          </button>
        </div>
      </div>
    </div>
  );
}
