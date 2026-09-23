import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Globe,
  AppWindow,
  Check,
  Info,
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { isBlockingRequired } from '../../lib/shield';
import { cn } from '../../lib/utils';

type ShieldListTab = "blocked" | "allowed" | "apps";

const QUICK_ADD_SITES = ["facebook.com", "instagram.com", "reddit.com", "youtube.com"];
const QUICK_ADD_APPS = ["discord.exe", "steam.exe", "spotify.exe"];

const TAB_CONFIG: { id: ShieldListTab; label: (counts: { blocked: number; allowed: number; apps: number }) => string; placeholder: string; submitLabel: string }[] = [
  {
    id: "blocked",
    label: (c) => `Blocked Sites (${c.blocked})`,
    placeholder: "Block domain (e.g. twitter.com)...",
    submitLabel: "Block",
  },
  {
    id: "allowed",
    label: (c) => `Allowed (${c.allowed})`,
    placeholder: "Allow domain (e.g. music.youtube.com)...",
    submitLabel: "Allow",
  },
  {
    id: "apps",
    label: (c) => `Blocked Apps (${c.apps})`,
    placeholder: "Block app (e.g. discord.exe)...",
    submitLabel: "Block",
  },
];

export const ShieldPage: React.FC = () => {
  const {
    shield,
    setShieldEnabled,
    addBlockedSite,
    removeBlockedSite,
    addAllowedSite,
    removeAllowedSite,
    addBlockedApp,
    removeBlockedApp,
    isActive,
    timerState,
  } = useDesktopStore();

  const [listTab, setListTab] = useState<ShieldListTab>("blocked");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const blocking = isBlockingRequired(shield.enabled, isActive, timerState);
  const counts = {
    blocked: shield.blockedSites.length,
    allowed: shield.allowedSites.length,
    apps: shield.blockedApps.length,
  };
  const activeTab = TAB_CONFIG.find((t) => t.id === listTab) ?? TAB_CONFIG[0];

  const showFeedback = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (listTab === "blocked") addBlockedSite(input);
    else if (listTab === "allowed") addAllowedSite(input);
    else addBlockedApp(input);
    setInput("");
  };

  const handleQuickAdd = (value: string, kind: "site" | "app") => {
    if (kind === "site") {
      if (listTab === "allowed") addAllowedSite(value);
      else addBlockedSite(value);
    } else {
      addBlockedApp(value);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-24 animate-in fade-in duration-200 select-none">
      {feedback && (
        <div className="fixed top-12 right-6 z-50 animate-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div className="px-4 py-2.5 rounded-xl text-xs font-medium border shadow-2xl flex items-center gap-2 backdrop-blur-md pointer-events-auto bg-secondary/95 text-foreground border-border shadow-black/50">
            <Check className="w-4 h-4 text-muted-foreground" />
            <span>{feedback}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3.5 mb-8 pb-6 border-b border-border">
        <div className="w-11 h-11 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground shadow-inner">
          <Shield className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Focus Shield</h1>
          <p className="text-xs text-muted-foreground">Block distracting apps and websites while a Flow session is running.</p>
        </div>
      </div>

      <div className="space-y-6">
        <section
          className={cn(
            "p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-4 justify-between shadow-sm",
            shield.enabled
              ? "bg-secondary/70 border-border"
              : "bg-secondary/40 border-border"
          )}
        >
          <div className="flex items-center gap-3">
            {shield.enabled ? (
              <ShieldCheck className="w-6 h-6 text-foreground shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-muted-foreground shrink-0" />
            )}
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                SITE & APP BLOCKER SHIELD
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {shield.enabled
                  ? blocking
                    ? "Enforcing now — Flow session is active"
                    : isActive
                      ? "Paused — resumes when you return to Flow"
                      : "Armed — activates when you start a Flow session"
                  : "Shield currently OFF"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {shield.enabled && (
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  blocking
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-secondary text-muted-foreground border-border"
                )}
              >
                {blocking ? "Enforcing" : "Armed"}
              </span>
            )}
            <button
              onClick={() => {
                setShieldEnabled(!shield.enabled);
                showFeedback(!shield.enabled ? "Shield enabled." : "Shield disabled.");
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95",
                shield.enabled
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              )}
            >
              {shield.enabled ? "ENABLED" : "ENABLE"}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTab.placeholder}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-mono bg-secondary/70 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
            >
              {activeTab.submitLabel}
            </button>
          </form>

          <div className="flex gap-1 p-1 rounded-xl bg-card border border-border">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setListTab(tab.id)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                  listTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.id === "apps" ? (
                  <AppWindow className="w-3.5 h-3.5" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                {tab.label(counts)}
              </button>
            ))}
          </div>

          {listTab === "blocked" && (
            <div className="space-y-1.5">
              {shield.blockedSites.length === 0 && (
                <p className="text-[11px] text-muted-foreground px-1">
                  No blocked sites yet — add domains above to block them during Flow sessions.
                </p>
              )}
              {shield.blockedSites.map((site) => (
                <div
                  key={site}
                  className="px-4 py-2.5 rounded-xl border flex items-center justify-between bg-card/60 border-border"
                >
                  <span className="text-xs font-mono text-foreground">{site}</span>
                  <button
                    onClick={() => removeBlockedSite(site)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-secondary transition-colors"
                    title={`Unblock ${site}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick add:
                </span>
                {QUICK_ADD_SITES.filter((s) => !shield.blockedSites.includes(s)).map((site) => (
                  <button
                    key={site}
                    onClick={() => handleQuickAdd(site, "site")}
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                  >
                    + {site}
                  </button>
                ))}
              </div>
            </div>
          )}

          {listTab === "allowed" && (
            <div className="space-y-1.5">
              {shield.allowedSites.length === 0 && (
                <p className="text-[11px] text-muted-foreground px-1">
                  Allowed domains always bypass the blocker — useful for subdomains such as
                  music players on an otherwise blocked site.
                </p>
              )}
              {shield.allowedSites.map((site) => (
                <div
                  key={site}
                  className="px-4 py-2.5 rounded-xl border flex items-center justify-between bg-emerald-500/5 border-emerald-500/20"
                >
                  <span className="text-xs font-mono text-foreground">{site}</span>
                  <button
                    onClick={() => removeAllowedSite(site)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-secondary transition-colors"
                    title={`Remove ${site} from allowed list`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {listTab === "apps" && (
            <div className="space-y-1.5">
              {shield.blockedApps.length === 0 && (
                <p className="text-[11px] text-muted-foreground px-1">
                  No blocked apps yet — add process names (e.g. discord.exe) to get warned
                  when they run during Flow sessions.
                </p>
              )}
              {shield.blockedApps.map((app) => (
                <div
                  key={app}
                  className="px-4 py-2.5 rounded-xl border flex items-center justify-between bg-card/60 border-border"
                >
                  <span className="text-xs font-mono text-foreground flex items-center gap-2">
                    <AppWindow className="w-3.5 h-3.5 text-muted-foreground" />
                    {app}
                  </span>
                  <button
                    onClick={() => removeBlockedApp(app)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-secondary transition-colors"
                    title={`Unblock ${app}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick add:
                </span>
                {QUICK_ADD_APPS.filter((a) => !shield.blockedApps.includes(a)).map((app) => (
                  <button
                    key={app}
                    onClick={() => handleQuickAdd(app, "app")}
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                  >
                    + {app}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="p-4 rounded-2xl bg-secondary/40 border border-border flex gap-3">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            While a Flow session runs, Focus watches the OS process list for blocked apps
            and visible window titles for blocked sites. Detections raise a block overlay
            and are logged as distractions — apps are only closed when you choose to
            terminate them. Allowed domains always bypass site blocking.
          </p>
        </section>
      </div>
    </div>
  );
};
