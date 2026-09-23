import React, { useEffect, useRef } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { SidebarNav } from './components/layout/SidebarNav';
import { FocusTimer } from './components/modules/FocusTimer';
import { TodoList } from './components/modules/TodoList';
import { StatsJournal } from './components/modules/StatsJournal';
import { MediaPlayer } from './components/modules/MediaPlayer';
import { SettingsPage } from './components/modules/SettingsPage';
import { ShieldPage } from './components/modules/ShieldPage';
import { ShieldBlockOverlay } from './components/modules/ShieldBlockOverlay';
import { DeepFocusOverlay } from './components/modules/DeepFocusOverlay';
import { FloatingTimerCapsule } from './components/layout/FloatingTimerCapsule';
import { GlobalTimerEngine } from './components/layout/GlobalTimerEngine';
import { useDesktopStore } from './lib/store';
import { electron } from './lib/electron';
import type { ShieldViolation } from './lib/shield';

const SHIELD_SNOOZE_MS = 10 * 60 * 1000;

export const App: React.FC = () => {
  const { 
    currentView, 
    deepFocusMode, 
    setDeepFocusMode, 
    isActive, 
    setIsActive,
    theme,
    shield,
    timerState,
    shieldViolations,
    dismissShieldViolations,
  } = useDesktopStore();

  const shieldSnoozedUntil = useRef(new Map<string, number>());

  useEffect(() => {
    // Register IPC listeners from electron main process
    const cleanupShortcut = electron.onShortcut((command) => {
      if (command === 'toggle-deep-focus') {
        setDeepFocusMode(!deepFocusMode);
      } else if (command === 'toggle-timer') {
        setIsActive(!isActive);
      }
    });

    const cleanupAction = electron.onTimerAction((action) => {
      if (action === 'toggle') {
        setIsActive(!isActive);
      }
    });

    return () => {
      cleanupShortcut();
      cleanupAction();
    };
  }, [deepFocusMode, isActive]);

  // Keep the main-process Shield monitor in sync with config + session state.
  useEffect(() => {
    electron.syncShieldState({
      shield: {
        enabled: shield.enabled,
        blockedSites: shield.blockedSites,
        allowedSites: shield.allowedSites,
        blockedApps: shield.blockedApps,
      },
      session: { isActive, timerState },
    });
  }, [shield, isActive, timerState]);

  // Handle Shield detections from the main process: log once per item,
  // surface the block overlay, and respect 10-minute snoozes on dismiss.
  useEffect(() => {
    const handleViolation = (violation: ShieldViolation) => {
      const state = useDesktopStore.getState();
      const key = `${violation.kind}:${violation.match}`;
      const alreadyShown = state.shieldViolations.some(
        (v) => v.kind === violation.kind && v.match === violation.match
      );
      if (alreadyShown) return;
      if (Date.now() < (shieldSnoozedUntil.current.get(key) ?? 0)) return;
      state.pushShieldViolation(violation);
      if (violation.kind === "app") {
        state.addShieldDistraction("Shield Blocked App", {
          app: violation.process ?? violation.match,
        });
      } else {
        state.addShieldDistraction("Shield Blocked Site", {
          website: violation.title ?? violation.match,
        });
      }
    };

    return electron.onShieldViolation(handleViolation);
  }, []);

  const handleDismissShieldViolations = () => {
    const now = Date.now();
    for (const v of useDesktopStore.getState().shieldViolations) {
      shieldSnoozedUntil.current.set(`${v.kind}:${v.match}`, now + SHIELD_SNOOZE_MS);
    }
    dismissShieldViolations();
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="w-screen h-screen bg-background font-sans overflow-hidden flex flex-col relative select-none">
      {/* Global Background Timer Ticker Engine */}
      <GlobalTimerEngine />
      
      {/* Frameless Custom Window Titlebar */}
      <TitleBar />

      {/* Floating Timer Capsule (visible on non-FOCUS views) */}
      <FloatingTimerCapsule />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden z-10">
        <SidebarNav />

        <main className="flex-1 overflow-y-auto p-6 relative">
          {currentView === 'FOCUS' && <FocusTimer />}
          {currentView === 'TODO' && <TodoList />}
          {currentView === 'JOURNAL' && <StatsJournal />}
          {currentView === 'SHIELD' && <ShieldPage />}
          {currentView === 'SETTINGS' && <SettingsPage />}
        </main>
      </div>

      {/* Shield block overlay (dismiss snoozes detections for 10 minutes) */}
      {shieldViolations.length > 0 && (
        <ShieldBlockOverlay onDismiss={handleDismissShieldViolations} />
      )}

      {/* Persistent Audio Media Player */}
      <MediaPlayer />

      {/* Fullscreen Zen Overlay */}
      <DeepFocusOverlay />
    </div>
  );
};
