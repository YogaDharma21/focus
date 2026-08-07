import React, { useEffect } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { SidebarNav } from './components/layout/SidebarNav';
import { FocusTimer } from './components/modules/FocusTimer';
import { TodoList } from './components/modules/TodoList';
import { StatsJournal } from './components/modules/StatsJournal';
import { MoodTracker } from './components/modules/MoodTracker';
import { MediaPlayer } from './components/modules/MediaPlayer';
import { BackgroundDisplay } from './components/modules/BackgroundDisplay';
import { DeepFocusOverlay } from './components/modules/DeepFocusOverlay';
import { FloatingTimerCapsule } from './components/layout/FloatingTimerCapsule';
import { GlobalTimerEngine } from './components/layout/GlobalTimerEngine';
import { useDesktopStore } from './lib/store';
import { electron } from './lib/electron';

export const App: React.FC = () => {
  const { 
    currentView, 
    deepFocusMode, 
    setDeepFocusMode, 
    isActive, 
    setIsActive 
  } = useDesktopStore();

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

  return (
    <div className="w-screen h-screen bg-zinc-950 font-sans overflow-hidden flex flex-col relative select-none">
      {/* Global Background Timer Ticker Engine */}
      <GlobalTimerEngine />

      <BackgroundDisplay />
      
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
          {currentView === 'NOTES' && <MoodTracker />}
        </main>
      </div>

      {/* Persistent Audio Media Player */}
      <MediaPlayer />

      {/* Fullscreen Zen Overlay */}
      <DeepFocusOverlay />
    </div>
  );
};
