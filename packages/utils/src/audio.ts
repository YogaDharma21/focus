let sharedAudioContext: AudioContext | null = null;
let unlockRegistered = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioContext) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioContext = new AudioCtx();
    }
  }
  return sharedAudioContext;
}

export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

export function registerAutoplayUnlock(): void {
  if (typeof window === "undefined" || unlockRegistered) return;
  unlockRegistered = true;

  const unlock = () => {
    unlockAudioContext();
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
    window.removeEventListener("touchstart", unlock, true);
  };

  window.addEventListener("pointerdown", unlock, { capture: true, once: true });
  window.addEventListener("keydown", unlock, { capture: true, once: true });
  window.addEventListener("touchstart", unlock, { capture: true, once: true });
}

export function playSynthesizedChime(volume = 0.8): void {
  // ponytail: Two-tone sine chime fallback when HTMLAudioElement autoplay is blocked. Upgrade to decoded audio buffer if custom audio samples needed.
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const vol = Math.max(0.01, Math.min(1, typeof volume === "number" ? volume : 0.8));

    // Two-tone chime: D5 (587.33 Hz) and A5 (880.00 Hz)
    const tones = [
      { freq: 587.33, offset: 0, duration: 0.35 },
      { freq: 880.0, offset: 0.12, duration: 0.55 },
    ];

    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(tone.freq, now + tone.offset);

      const startTime = now + tone.offset;
      gain.gain.setValueAtTime(vol * 0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + tone.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + tone.duration);
    }
  } catch (err) {
    console.warn("Synthesized chime failed:", err);
  }
}

export function requestNotificationPermission(): void {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

export function showNotificationToast(title: string, body?: string, icon = "/favicon.ico"): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon });
    } catch {
      // ignore
    }
  }
}
