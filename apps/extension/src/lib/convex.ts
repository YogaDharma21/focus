import { ConvexReactClient } from "convex/react";

// Convex Client instance for cloud synchronization
const CONVEX_URL = (import.meta as any).env?.VITE_CONVEX_URL || "https://placeholder-focus-app.convex.cloud";

export const convexClient = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

export function checkOnlineStatus(): boolean {
  if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
    return navigator.onLine;
  }
  return true;
}

export function subscribeOnlineStatus(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }

  return () => {};
}
