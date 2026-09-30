import React, { useEffect, useMemo, useState } from 'react';
import { AppWindow, Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { electron, type RunningAppInfo } from '../../lib/electron';

interface RunningAppsPickerProps {
  blockedApps: string[];
  onBlock: (image: string) => void;
}

function isSupportedError(result: { success: boolean; error?: string }): boolean {
  return !result.success && !!result.error?.includes("Not running inside Electron");
}

export const RunningAppsPicker: React.FC<RunningAppsPickerProps> = ({ blockedApps, onBlock }) => {
  const [apps, setApps] = useState<RunningAppInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [query, setQuery] = useState("");

  const blockedSet = useMemo(
    () => new Set(blockedApps.map((a) => a.trim().toLowerCase())),
    [blockedApps],
  );

  const load = async () => {
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim().toLowerCase();
  const visible = apps.filter((app) => {
    if (blockedSet.has(app.image.toLowerCase())) return false;
    if (!q) return true;
    return (
      app.image.toLowerCase().includes(q) ||
      app.displayName.toLowerCase().includes(q) ||
      app.title.toLowerCase().includes(q)
    );
  });

  if (unsupported) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      <div className="px-4 pt-3.5 pb-3 border-b border-border flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search running apps..."
            className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-secondary/70 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
          title="Refresh running apps"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto p-2 space-y-1">
        {loading && apps.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Reading running apps...
          </div>
        )}
        {!loading && error && (
          <p className="text-[11px] text-muted-foreground px-2 py-4 text-center">
            {error}{" "}
            <button onClick={load} className="underline hover:text-foreground">Try again</button>
          </p>
        )}
        {!loading && !error && visible.length === 0 && (
          <p className="text-[11px] text-muted-foreground px-2 py-4 text-center">
            {apps.length === 0
              ? "No windowed apps detected — open an app and refresh."
              : q
                ? `No running apps match "${query}".`
                : "Every running app is already blocked."}
          </p>
        )}
        {visible.map((app) => (
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
      </div>
    </div>
  );
};
