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
  Lock,
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import { isBlockingRequired } from '../../lib/shield';
import { cn } from '../../lib/utils';
import { BlockedAppIcon, SiteIcon } from './ShieldIcons';
import { RunningAppsPicker } from './RunningAppsPicker';

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
    placeholder: "Type an app to block (or pick below)...",
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

  const isStrictLocked = isActive && timerState === "FLOW";

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
    if (isStrictLocked) return;
    if (!input.trim()) return;
    if (listTab === "blocked") addBlockedSite(input);
    else if (listTab === "allowed") addAllowedSite(input);
    else addBlockedApp(input);
    setInput("");
  };

  const handleQuickAdd = (value: string, kind: "site" | "app") => {
    if (isStrictLocked) return;
    if (kind === "site") {
      if (listTab === "allowed") addAllowedSite(value);
      else addBlockedSite(value);
    } else {
      addBlockedApp(value);
    }
    showFeedback(`Added ${value}.`);
  };

  const handleBlockRunningApp = (image: string) => {
    if (isStrictLocked) return;
    addBlockedApp(image);
    showFeedback(`Blocked ${image}.`);
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
        </div>
      </div>

      <div className="space-y-6">
        <section
          className={cn(
            "p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-4 justify-between shadow-sm transition-colors duration-300",
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
                {isStrictLocked
                  ? "Locked while a focus session is active"
                  : shield.enabled
                    ? blocking
                      ? "Enforcing now - Flow session is active"
                      : isActive
                        ? "Paused - resumes when you return to Flow"
                        : "Armed - activates when you start a Flow session"
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
            {isStrictLocked && (
              <span
                title="Locked while a focus session is active"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border border-border bg-secondary text-muted-foreground"
              >
                <Lock className="w-3 h-3 text-muted-foreground" />
                <span className="hidden sm:inline">Locked while a focus session is active</span>
                <span className="sm:hidden">Locked</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                if (isStrictLocked) return;
                setShieldEnabled(!shield.enabled);
                showFeedback(!shield.enabled ? "Shield enabled." : "Shield disabled.");
              }}
              disabled={isStrictLocked}
              title={isStrictLocked ? "Locked while focusing" : undefined}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300",
                isStrictLocked
                  ? "opacity-50 cursor-not-allowed bg-secondary text-muted-foreground border-border"
                  : shield.enabled
                    ? "bg-primary text-primary-foreground border-primary active:scale-95 cursor-pointer"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80 active:scale-95 cursor-pointer"
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
              disabled={isStrictLocked}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isStrictLocked ? "Locked while focusing" : activeTab.placeholder}
              title={isStrictLocked ? "Locked while focusing" : undefined}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl text-xs font-mono bg-secondary/70 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors",
                isStrictLocked && "opacity-50 cursor-not-allowed"
              )}
            />
            <button
              type="submit"
              disabled={isStrictLocked || !input.trim()}
              title={isStrictLocked ? "Locked while focusing" : undefined}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 shadow-sm",
                isStrictLocked || !input.trim()
                  ? "opacity-50 cursor-not-allowed bg-secondary text-muted-foreground border border-border"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 cursor-pointer"
              )}
            >
              {isStrictLocked ? (
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{activeTab.submitLabel}</span>
                </span>
              ) : (
                activeTab.submitLabel
              )}
            </button>
          </form>

          <div className="flex gap-1 p-1 rounded-xl bg-card border border-border">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListTab(tab.id)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer",
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
                  No blocked sites yet - add domains above to block them during Flow sessions.
                </p>
              )}
              {shield.blockedSites.map((site) => (
                <div
                  key={site}
                  className="px-4 py-2.5 rounded-xl border flex items-center justify-between bg-card/60 border-border"
                >
                  <span className="text-xs font-mono text-foreground flex items-center gap-2 min-w-0">
                    <SiteIcon site={site} />
                    <span className="truncate">{site}</span>
                  </span>
                  <button
                    type="button"
                    disabled={isStrictLocked}
                    onClick={() => {
                      if (isStrictLocked) return;
                      removeBlockedSite(site);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg text-muted-foreground transition-all duration-300",
                      isStrictLocked
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:text-rose-400 hover:bg-secondary active:scale-95 cursor-pointer"
                    )}
                    title={isStrictLocked ? "Locked while focusing" : `Unblock ${site}`}
                    aria-label={isStrictLocked ? "Locked while focusing" : `Unblock ${site}`}
                  >
                    {isStrictLocked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
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
                    type="button"
                    disabled={isStrictLocked}
                    onClick={() => handleQuickAdd(site, "site")}
                    title={isStrictLocked ? "Locked while focusing" : undefined}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-mono bg-secondary border border-border text-muted-foreground transition-all duration-300",
                      isStrictLocked
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:text-foreground hover:border-muted-foreground active:scale-95 cursor-pointer"
                    )}
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
                  Allowed domains always bypass the blocker - useful for subdomains such as
                  music players on an otherwise blocked site.
                </p>
              )}
              {shield.allowedSites.map((site) => (
                <div
                  key={site}
                  className="px-4 py-2.5 rounded-xl border flex items-center justify-between bg-emerald-500/5 border-emerald-500/20"
                >
                  <span className="text-xs font-mono text-foreground flex items-center gap-2 min-w-0">
                    <SiteIcon site={site} />
                    <span className="truncate">{site}</span>
                  </span>
                  <button
                    type="button"
                    disabled={isStrictLocked}
                    onClick={() => {
                      if (isStrictLocked) return;
                      removeAllowedSite(site);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg text-muted-foreground transition-all duration-300",
                      isStrictLocked
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:text-rose-400 hover:bg-secondary active:scale-95 cursor-pointer"
                    )}
                    title={isStrictLocked ? "Locked while focusing" : `Remove ${site} from allowed list`}
                    aria-label={isStrictLocked ? "Locked while focusing" : `Remove ${site} from allowed list`}
                  >
                    {isStrictLocked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {listTab === "apps" && (
            <div className="space-y-1.5">
              {shield.blockedApps.length === 0 && (
                <p className="text-[11px] text-muted-foreground px-1">
                  No blocked apps yet - pick a running app below or type a process
                  name (e.g. discord.exe).
                </p>
              )}
              {shield.blockedApps.map((app) => (
                <div
                  key={app}
                  className="px-4 py-2.5 rounded-xl border flex items-center justify-between bg-card/60 border-border"
                >
                  <span className="text-xs font-mono text-foreground flex items-center gap-2 min-w-0">
                    <BlockedAppIcon image={app} />
                    <span className="truncate">{app}</span>
                  </span>
                  <button
                    type="button"
                    disabled={isStrictLocked}
                    onClick={() => {
                      if (isStrictLocked) return;
                      removeBlockedApp(app);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg text-muted-foreground transition-all duration-300",
                      isStrictLocked
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:text-rose-400 hover:bg-secondary active:scale-95 cursor-pointer"
                    )}
                    title={isStrictLocked ? "Locked while focusing" : `Unblock ${app}`}
                    aria-label={isStrictLocked ? "Locked while focusing" : `Unblock ${app}`}
                  >
                    {isStrictLocked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Choose from your apps - click + to block
                  </p>
                  {isStrictLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      <span>Locked while focusing</span>
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "transition-opacity duration-300",
                    isStrictLocked && "opacity-50 pointer-events-none select-none cursor-not-allowed"
                  )}
                  title={isStrictLocked ? "Locked while focusing" : undefined}
                >
                  <RunningAppsPicker
                    blockedApps={shield.blockedApps}
                    onBlock={handleBlockRunningApp}
                    disabled={isStrictLocked}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick add:
                </span>
                {QUICK_ADD_APPS.filter((a) => !shield.blockedApps.includes(a)).map((app) => (
                  <button
                    key={app}
                    type="button"
                    disabled={isStrictLocked}
                    onClick={() => handleQuickAdd(app, "app")}
                    title={isStrictLocked ? "Locked while focusing" : undefined}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-mono bg-secondary border border-border text-muted-foreground transition-all duration-300",
                      isStrictLocked
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:text-foreground hover:border-muted-foreground active:scale-95 cursor-pointer"
                    )}
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
            and visible window titles for blocked sites. Detections raise a fullscreen
            block overlay and are logged as distractions, apps are only
            closed when you choose to terminate them. Dismissing the overlay snoozes that
            item for 10 minutes; pausing the timer does not. Allowed domains always bypass
            site blocking.
          </p>
        </section>
      </div>
    </div>
  );
};
