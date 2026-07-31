import React, { useEffect } from 'react';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';

export const GlobalTimerEngine: React.FC = () => {
  const {
    timerMode,
    setTimerMode,
    timerState,
    setTimerState,
    timeLeft,
    setTimeLeft,
    flowTimeElapsed,
    setFlowTimeElapsed,
    isActive,
    setIsActive,
    pomodoroSettings,
    todos,
    updateTodo,
    selectedTodoId,
    addSession,
    soundEffectEnabled,
    sessionName,
    previousMode,
    setPreviousMode
  } = useDesktopStore();

  const playCompletionSound = () => {
    if (!soundEffectEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio chime failed", e);
    }
  };

  const handleCompleteSession = () => {
    setIsActive(false);
    playCompletionSound();

    const activeTask = todos.find(t => t.id === selectedTodoId);
    const title = activeTask?.text || sessionName || 'Focus Session';

    if (timerMode === 'POMODORO') {
      if (timerState === 'WORK') {
        const durationWorked = Math.max(60, (pomodoroSettings.work * 60) - timeLeft);
        
        addSession({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          duration: durationWorked,
          mode: 'POMODORO',
          taskTitle: title
        });

        if (activeTask) {
          updateTodo(activeTask.id, {
            completedPomodoros: (activeTask.completedPomodoros || 0) + 1,
            completed: true,
            completedAt: new Date().toISOString(),
            groupId: 'finished'
          });
        }

        electron.showNotification("Session Complete! 🎉", `Great work finishing "${title}"! Time for a break.`);
        
        setPreviousMode('POMODORO');
        setTimerState('BREAK');
        setTimeLeft(pomodoroSettings.break * 60);

        if (pomodoroSettings.autoStartBreak) {
          setIsActive(true);
        }
      } else {
        if (previousMode === 'STOPWATCH') {
          electron.showNotification("Break Complete! ⚡", "Ready to jump back into Flow state?");
          setTimerMode('STOPWATCH');
          setFlowTimeElapsed(0);
        } else {
          electron.showNotification("Break Complete! ⚡", "Ready to start focusing again?");
          setTimerState('WORK');
          setTimeLeft(pomodoroSettings.work * 60);
        }
      }
    } else {
      const durationWorked = Math.max(1, flowTimeElapsed);
      const calculatedBreakSeconds = Math.max(1, Math.floor(durationWorked / 5));
      
      addSession({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        duration: durationWorked,
        mode: 'STOPWATCH',
        taskTitle: title
      });

      if (activeTask) {
        updateTodo(activeTask.id, {
          completed: true,
          completedAt: new Date().toISOString(),
          groupId: 'finished'
        });
      }

      const breakMins = Math.floor(calculatedBreakSeconds / 60);
      const breakSecs = calculatedBreakSeconds % 60;
      const breakStr = breakMins > 0 
        ? `${breakMins}m${breakSecs > 0 ? ` ${breakSecs}s` : ''}` 
        : `${breakSecs}s`;

      electron.showNotification(
        "Flow Session Complete! 🌊", 
        `Focused for ${Math.floor(durationWorked / 60)}m. Earned ${breakStr} break!`
      );
      
      setPreviousMode('STOPWATCH');
      setTimerMode('POMODORO');
      setTimerState('BREAK');
      setTimeLeft(calculatedBreakSeconds);
      setFlowTimeElapsed(0);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (timerMode === 'POMODORO') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              return 0;
            }
            return prev - 1;
          });
        } else {
          setFlowTimeElapsed((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timerMode]);

  useEffect(() => {
    if (isActive && timerMode === 'POMODORO' && timeLeft === 0) {
      handleCompleteSession();
    }
  }, [timeLeft, isActive, timerMode]);

  return null;
};
