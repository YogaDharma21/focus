import React, { useEffect } from 'react';
import { playCompletionSound } from '../../lib/sound';
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
    setPreviousMode,
    setDeepFocusMode
  } = useDesktopStore();



  const handleCompleteSession = () => {
    const state = useDesktopStore.getState();
    setIsActive(false);
    playCompletionSound();

    const activeTask = state.todos.find(t => t.id === state.selectedTodoId);
    const title = activeTask?.text || state.sessionName || 'Focus Session';

    if (state.timerMode === 'POMODORO') {
      if (state.timerState === 'WORK') {
        const durationWorked = Math.max(60, (state.pomodoroSettings.work * 60) - state.timeLeft);
        
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

        electron.showNotification("Session Complete!", `Great work finishing "${title}"! Time for a break.`);
        
        setPreviousMode('POMODORO');
        setTimerState('BREAK');
        setTimeLeft(state.pomodoroSettings.break * 60);

        if (state.pomodoroSettings.autoStartBreak) {
          setIsActive(true);
        }
        setDeepFocusMode(false);
      } else {
        if (state.previousMode === 'STOPWATCH') {
          electron.showNotification("Break Complete!", "Ready to jump back into Flow state?");
          setTimerMode('STOPWATCH');
          setFlowTimeElapsed(0);
        } else {
          electron.showNotification("Break Complete!", "Ready to start focusing again?");
          setTimerState('WORK');
          setTimeLeft(state.pomodoroSettings.work * 60);
        }

        if (state.pomodoroSettings.autoStartTimer) {
          setIsActive(true);
          setDeepFocusMode(true);
        } else {
          setDeepFocusMode(false);
        }
      }
    } else {
      const durationWorked = Math.max(1, state.flowTimeElapsed);
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

      electron.showNotification(
        "Flow Session Completed!",
        `Great focus flow! Taking a recommended ${Math.floor(calculatedBreakSeconds / 60)}m break.`
      );
      
      setPreviousMode('STOPWATCH');
      setTimerMode('POMODORO');
      setTimerState('BREAK');
      setTimeLeft(calculatedBreakSeconds);
      setFlowTimeElapsed(0);

      if (state.pomodoroSettings.autoStartBreak) {
        setIsActive(true);
      }
      setDeepFocusMode(false);
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
