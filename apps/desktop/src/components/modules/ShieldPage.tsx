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
  Clock,
  Calendar,
} from 'lucide-react';
import { useDesktopStore } from '../../lib/store';
import {
  isBlockingRequired,
  isBlocklistLocked,
  isScheduleActive,
  getActiveSchedule,
  ShieldSchedule,
} from '../../lib/shield';
import { cn } from '../../lib/utils';
import { BlockedAppIcon, SiteIcon } from './ShieldIcons';
import { RunningAppsPicker } from './RunningAppsPicker';

type ShieldListTab = "blocked" | "allowed" | "apps" | "schedules";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const QUICK_ADD_SITES = ["facebook.com", "instagram.com", "reddit.com", "youtube.com"];
const QUICK_ADD_APPS = ["discord.exe", "steam.exe", "spotify.exe"];

const TAB_CONFIG: { id: ShieldListTab; label: (counts: { blocked: number; allowed: number; apps: number; schedules: number }) => string; placeholder: string; submitLabel: string }[] = [
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
  {
    id: "schedules",
    label: (c) => `Schedules (${c.schedules})`,
    placeholder: "",
    submitLabel: "",
  },
];

export const ShieldPage: React.FC = () => {
  const {
    shield,
    setShieldEnabled,
    setShieldStrictMode,
    toggleShieldSchedule,
    updateShieldSchedule,
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

  const locked = isBlocklistLocked(shield, isActive, timerState);
  const scheduleActive = isScheduleActive(shield.schedules);
  const activeSchedule = getActiveSchedule(shield.schedules);
  const blocking = isBlockingRequired(shield, isActive, timerState);

  const counts = {
    blocked: shield.blockedSites.length,
    allowed: shield.allowedSites.length,
    apps: shield.blockedApps.length,
    schedules: (shield.schedules || []).filter((s) => s.enabled).length,
  };
  const activeTab = TAB_CONFIG.find((t) => t.id === listTab) ?? TAB_CONFIG[0];

  const showFeedback = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) {
      showFeedback("Blocklist is locked in active Flow session.");
      return;
    }
    if (!input.trim()) return;
    if (listTab === "blocked") addBlockedSite(input);
    else if (listTab === "allowed") addAllowedSite(input);
    else if (listTab === "apps") addBlockedApp(input);
    setInput("");
  };

  const handleQuickAdd = (value: string, kind: "site" | "app") => {
    if (locked) {
      showFeedback("Blocklist is locked in active Flow session.");
      return;
    }
    if (kind === "site") {
      if (listTab === "allowed") addAllowedSite(value);
      else addBlockedSite(value);
    } else {
      addBlockedApp(value);
    }
    showFeedback(`Added ${value}.`);
  };

  const handleBlockRunningApp = (image: string) => {
    if (locked) {
      showFeedback("Blocklist is locked in active Flow session.");
      return;
    }
    addBlockedApp(image);
    showFeedback(`Blocked ${image}.`);
  };

  const handleDayToggle = (scheduleId: string, currentDays: number[], dayIndex: number) => {
    const updated = currentDays.includes(dayIndex)
      ? currentDays.filter((d) => d !== dayIndex)
      : [...currentDays, dayIndex].sort();
    updateShieldSchedule(scheduleId, { days: updated });
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
            shield.enabled || blocking
              ? "bg-secondary/70 border-border"
              : "bg-secondary/40 border-border"
          )}
        >
          <div className="flex items-center gap-3">
            {blocking ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : shield.enabled ? (
              <ShieldCheck className="w-6 h-6 text-foreground shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-muted-foreground shrink-0" />
            )}
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                SITE & APP BLOCKER SHIELD
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {blocking
                  ? scheduleActive
                    ? `Enforcing now — Scheduled rule active${activeSchedule?.name ? ` (${activeSchedule.name})` : ""}`
                    : "Enforcing now — Flow session is active"
                  : shield.enabled
                    ? isActive
                      ? "Paused — resumes when you return to Flow"
                      : "Armed — activates during Flow sessions or scheduled hours"
                    : "Shield currently OFF"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(shield.enabled || blocking) && (
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
                if (locked && shield.enabled) {
                  showFeedback("Cannot disable Shield during locked Flow session.");
                  return;
                }
                setShieldEnabled(!shield.enabled);
                showFeedback(!shield.enabled ? "Shield enabled." : "Shield disabled.");
              }}
              disabled={locked && shield.enabled}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95",
                shield.enabled
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
                locked && shield.enabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {shield.enabled ? "ENABLED" : "ENABLE"}
            </button>
          </div>
        </section>

        {locked && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">Strict Mode Active</h3>
              <p className="text-[11px] text-amber-300/80">
                Blocklist edits are locked while your Flow session is active to prevent impulse overrides.
              </p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-border bg-card/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground tracking-tight">STRICT MODE</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  Lock blocklist during Flow sessions
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={locked}
              onClick={() => {
                setShieldStrictMode(!shield.strictMode);
                showFeedback(!shield.strictMode ? "Strict mode enabled." : "Strict mode disabled.");
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 shrink-0",
                shield.strictMode
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
                locked && "opacity-50 cursor-not-allowed"
              )}
            >
              {shield.strictMode ? "ON" : "OFF"}
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground tracking-tight">SCHEDULE RULES</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {scheduleActive ? "Schedule actively enforcing" : "Auto-enable during specific hours"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setListTab("schedules")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 shrink-0",
                listTab === "schedules"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              )}
            >
              {listTab === "schedules" ? "OPEN" : "VIEW"}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          {listTab !== "schedules" && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                disabled={locked}
                onChange={(e) => setInput(e.target.value)}
                placeholder={locked ? "Blocklist locked during active Flow session" : activeTab.placeholder}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl text-xs font-mono bg-secondary/70 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors",
                  locked && "opacity-50 cursor-not-allowed"
                )}
              />
              <button
                type="submit"
                disabled={locked}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-sm",
                  locked && "opacity-50 cursor-not-allowed"
                )}
              >
                {activeTab.submitLabel}
              </button>
            </form>
          )}

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
                ) : tab.id === "schedules" ? (
                  <Clock className="w-3.5 h-3.5" />
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
                  <span className="text-xs font-mono text-foreground flex items-center gap-2 min-w-0">
                    <SiteIcon site={site} />
                    <span className="truncate">{site}</span>
                  </span>
                  <button
                    onClick={() => removeBlockedSite(site)}
                    disabled={locked}
                    className={cn(
                      "p-1.5 rounded-lg text-muted-foreground transition-colors",
                      locked ? "opacity-30 cursor-not-allowed" : "hover:text-rose-400 hover:bg-secondary"
                    )}
                    title={locked ? "Locked in active Flow session" : `Unblock ${site}`}
                  >
                    {locked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
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
                    disabled={locked}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-mono bg-secondary border border-border text-muted-foreground transition-colors",
                      locked ? "opacity-30 cursor-not-allowed" : "hover:text-foreground hover:border-muted-foreground"
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
                  Allowed domains always bypass the blocker — useful for subdomains such as
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
                    onClick={() => removeAllowedSite(site)}
                    disabled={locked}
                    className={cn(
                      "p-1.5 rounded-lg text-muted-foreground transition-colors",
                      locked ? "opacity-30 cursor-not-allowed" : "hover:text-rose-400 hover:bg-secondary"
                    )}
                    title={locked ? "Locked in active Flow session" : `Remove ${site} from allowed list`}
                  >
                    {locked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {listTab === "apps" && (
            <div className="space-y-1.5">
              {shield.blockedApps.length === 0 && (
                <p className="text-[11px] text-muted-foreground px-1">
                  No blocked apps yet — pick a running app below or type a process
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
                    onClick={() => removeBlockedApp(app)}
                    disabled={locked}
                    className={cn(
                      "p-1.5 rounded-lg text-muted-foreground transition-colors",
                      locked ? "opacity-30 cursor-not-allowed" : "hover:text-rose-400 hover:bg-secondary"
                    )}
                    title={locked ? "Locked in active Flow session" : `Unblock ${app}`}
                  >
                    {locked ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
              <div className="pt-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Choose from your apps — click + to block
                </p>
                <RunningAppsPicker
                  blockedApps={shield.blockedApps}
                  onBlock={handleBlockRunningApp}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick add:
                </span>
                {QUICK_ADD_APPS.filter((a) => !shield.blockedApps.includes(a)).map((app) => (
                  <button
                    key={app}
                    onClick={() => handleQuickAdd(app, "app")}
                    disabled={locked}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-mono bg-secondary border border-border text-muted-foreground transition-colors",
                      locked ? "opacity-30 cursor-not-allowed" : "hover:text-foreground hover:border-muted-foreground"
                    )}
                  >
                    + {app}
                  </button>
                ))}
              </div>
            </div>
          )}

          {listTab === "schedules" && (
            <div className="space-y-3">
              {(shield.schedules || []).map((rule) => {
                const ruleActive = isScheduleActive([rule]);
                return (
                  <div
                    key={rule.id}
                    className="p-4 rounded-2xl border border-border bg-card/60 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {rule.name || "Schedule Rule"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Auto-enable shield on selected days and hours
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ruleActive && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Active Now
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleShieldSchedule(rule.id)}
                          className={cn(
                            "px-3 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95",
                            rule.enabled
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                          )}
                        >
                          {rule.enabled ? "ENABLED" : "ENABLE"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/50">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={rule.start}
                          onChange={(e) =>
                            updateShieldSchedule(rule.id, { start: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-xl text-xs font-mono tabular-nums bg-secondary/70 border border-border text-foreground focus:outline-none focus:border-muted-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={rule.end}
                          onChange={(e) =>
                            updateShieldSchedule(rule.id, { end: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-xl text-xs font-mono tabular-nums bg-secondary/70 border border-border text-foreground focus:outline-none focus:border-muted-foreground"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1.5">
                        Active Days
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_OF_WEEK.map((dayName, idx) => {
                          const isSelected = rule.days.includes(idx);
                          return (
                            <button
                              key={dayName}
                              type="button"
                              onClick={() => handleDayToggle(rule.id, rule.days, idx)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors",
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-secondary/60 text-muted-foreground border-border hover:text-foreground"
                              )}
                            >
                              {dayName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="p-4 rounded-2xl bg-secondary/40 border border-border flex gap-3">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            While a Flow session runs, Focus watches the OS process list for blocked apps
            and visible window titles for blocked sites. Detections raise a fullscreen
            block overlay and are logged as distractions — apps are only
            closed when you choose to terminate them. Dismissing the overlay snoozes that
            item for 10 minutes; pausing the timer does not. Allowed domains always bypass
            site blocking.
          </p>
        </section>
      </div>
    </div>
  );
};
