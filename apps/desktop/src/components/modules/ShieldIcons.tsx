import React, { useEffect, useState } from 'react';
import { AppWindow, Globe } from 'lucide-react';
import { electron } from '../../lib/electron';
import { normalizeSite } from '../../lib/shield';
import { cn } from '../../lib/utils';

/** Favicon for a blocked/allowed domain via Google's favicon service. */
export function siteFaviconUrl(site: string): string {
  const domain = normalizeSite(site);
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export const SiteIcon: React.FC<{ site: string; className?: string }> = ({ site, className }) => {
  const [failed, setFailed] = useState(false);
  const url = siteFaviconUrl(site);
  useEffect(() => setFailed(false), [site]);
  if (!url || failed) {
    return <Globe className={cn("w-4 h-4 text-muted-foreground shrink-0", className)} />;
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("w-4 h-4 rounded-[4px] object-contain shrink-0 bg-white/5", className)}
    />
  );
};

// In-memory cache so blocked-app icons are fetched once per session and
// never persisted to localStorage (data URLs can be large).
const appIconCache = new Map<string, string>();

export const BlockedAppIcon: React.FC<{ image: string; className?: string }> = ({ image, className }) => {
  const key = image.trim().toLowerCase();
  const [icon, setIcon] = useState<string>(() => appIconCache.get(key) ?? "");
  const [tried, setTried] = useState<boolean>(() => appIconCache.has(key));

  useEffect(() => {
    if (tried) return;
    let cancelled = false;
    electron.getAppIcon(image).then((res) => {
      if (cancelled) return;
      const next = res?.icon ?? "";
      appIconCache.set(key, next);
      setIcon(next);
      setTried(true);
    }).catch(() => {
      if (!cancelled) setTried(true);
    });
    return () => { cancelled = true; };
  }, [image, key, tried]);

  if (icon) {
    return (
      <img
        src={icon}
        alt=""
        className={cn("w-5 h-5 rounded-[5px] object-contain shrink-0", className)}
      />
    );
  }
  return <AppWindow className={cn("w-4 h-4 text-muted-foreground shrink-0", className)} />;
};
