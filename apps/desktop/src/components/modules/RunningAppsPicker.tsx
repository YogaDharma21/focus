import React, { useEffect, useMemo, useState } from 'react';
import { AppWindow, Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { electron, type InstalledAppInfo, type RunningAppInfo } from '../../lib/electron';
import { BlockedAppIcon } from './ShieldIcons';

interface RunningAppsPickerProps {
  blockedApps: string[];
  onBlock: (image: string) => void;
}

type PickerTab = "running" | "installed";

function isSupportedError(result: { success: boolean; error?: string }): boolean {
  return !result.success && !!result.error?.includes("Not running inside Electron");
}

export const RunningAppsPicker: React.FC<RunningAppsPickerProps> = ({ blockedApps, onBlock }) => {
  const [tab, setTab] = useState<PickerTab>("running");
  const [apps, setApps] = useState<RunningAppInfo[]>([]);
  const [installed, setInstalled] = useState<InstalledAppInfo[]>([]);
  const [installedLoaded, setInstalledLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [query, setQuery] = useState("");

  const blockedSet = useMemo(
    () => new Set(blockedApps.map((a) => a.trim().toLowerCase())),
    [blockedApps],
  );

  const loadRunning = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await electron.listRunningApps();
      if (isSupportedError(result)) {
        setUnsupported(true);
        setApps([]);
        return;
      }
      if (!result.success) {
        setError(result.error ?? "Could not read running apps.");
        return;
      }
      setApps(result.apps ?? []);
    } catch {
      setError("Could not read running apps.");
    } finally {
      setLoading(false);
    }
  };

  const loadInstalled = async (refresh: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await electron.listInstalledApps(refresh);
      if (isSupportedError(result)) {
        setUnsupported(true);
        setInstalled([]);
        return;
      }
      if (!result.success) {
        setError(result.error ?? "Could not read installed apps.");
        return;
      }
      setInstalled(result.apps ?? []);
      setInstalledLoaded(true);
    } catch {
      setError("Could not read installed apps.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRunning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTab = (next: PickerTab) => {
    setTab(next);
    setError(null);
    if (next === "installed" && !installedLoaded) {
      loadInstalled(false);
    }
  };

  const handleRefresh = () => {
    if (tab === "installed") loadInstalled(true);
    else loadRunning();
  };

  const q = query.trim().toLowerCase();
  const visibleRunning = apps.filter((app) => {
    if (blockedSet.has(app.image.toLowerCase())) return false;
    if (!q) return true;
    return (
      app.image.toLowerCase().includes(q) ||
      app.displayName.toLowerCase().includes(q) ||
      app.title.toLowerCase().includes(q)
    );
  });
  const visibleInstalled = installed.filter((app) => {
    if (blockedSet.has(app.image.toLowerCase())) return false;
    if (!q) return true;
    return (
      app.image.toLowerCase().includes(q) ||
      app.displayName.toLowerCase().includes(q)
    );
  });

  if (unsupported) return null;

  const emptyHint =
    tab === "running"
      ? apps.length === 0
        ? "No windowed apps detected — open an app and refresh."
        : q
          ? `No running apps match "${query}".`
          : "Every running app is already blocked."
      : !installedLoaded
        ? "Loading installed apps..."
        : installed.length === 0
          ? "No installed apps found."
          : q
            ? `No installed apps match "${query}".`
            : "Every installed app is already blocked.";

  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      <div className="px-4 pt-3.5 pb-3 border-b border-border space-y-2">
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/60 border border-border">
          {(["running", "installed"] as PickerTab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                tab === t
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "running" ? "Running" : "Installed"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "running" ? "Search running apps..." : "Search all installed apps..."}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-secondary/70 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
            title={tab === "running" ? "Refresh running apps" : "Refresh installed apps"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto p-2 space-y-1">
        {loading && (tab === "running" ? apps.length === 0 : !installedLoaded) && (
          <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {tab === "running" ? "Reading running apps..." : "Reading installed apps..."}
          </div>
        )}
        {!loading && error && (
          <p className="text-[11px] text-muted-foreground px-2 py-4 text-center">
            {error}{" "}
            <button onClick={handleRefresh} className="underline hover:text-foreground">Try again</button>
          </p>
        )}
        {!loading && !error && (tab === "running" ? visibleRunning.length === 0 : visibleInstalled.length === 0) && (
          <p className="text-[11px] text-muted-foreground px-2 py-4 text-center">
            {emptyHint}
          </p>
        )}
        {tab === "running" && visibleRunning.map((app) => (
          <div
            key={app.image}
            className="px-2.5 py-2 rounded-xl flex items-center gap-2.5 hover:bg-secondary/60 transition-colors group"
          >
            {app.icon ? (
              <img
                src={app.icon}
                alt=""
                className="w-6 h-6 rounded-md object-contain shrink-0"
              />
            ) : (
              <span className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center shrink-0">
                <AppWindow className="w-3.5 h-3.5 text-muted-foreground" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {app.displayName}
                <span className="ml-1.5 text-[10px] font-mono font-normal text-muted-foreground">
                  {app.image}
                </span>
              </p>
              {app.title && (
                <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                  {app.title}
                </p>
              )}
            </div>
            <button
              onClick={() => onBlock(app.image)}
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all opacity-60 group-hover:opacity-100"
              title={`Block ${app.image}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
        {tab === "installed" && visibleInstalled.map((app) => (
          <div
            key={app.image}
            className="px-2.5 py-2 rounded-xl flex items-center gap-2.5 hover:bg-secondary/60 transition-colors group"
          >
            <BlockedAppIcon image={app.image} className="w-6 h-6 rounded-md" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {app.displayName}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground truncate leading-tight mt-0.5">
                {app.image}
              </p>
            </div>
            <button
              onClick={() => onBlock(app.image)}
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all opacity-60 group-hover:opacity-100"
              title={`Block ${app.image}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
