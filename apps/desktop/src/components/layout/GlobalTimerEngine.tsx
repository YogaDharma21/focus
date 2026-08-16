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
    setPreviousMode
  } = useDesktopStore();



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

        electron.showNotification("Session Complete!", `Great work finishing "${title}"! Time for a break.`);
        
        setPreviousMode('POMODORO');
        setTimerState('BREAK');
        setTimeLeft(pomodoroSettings.break * 60);

        if (pomodoroSettings.autoStartBreak) {
          setIsActive(true);
        }
      } else {
        if (previousMode === 'STOPWATCH') {
          electron.showNotification("Break Complete!", "Ready to jump back into Flow state?");
          setTimerMode('STOPWATCH');
          setFlowTimeElapsed(0);
        } else {
          electron.showNotification("Break Complete!", "Ready to start focusing again?");
          setTimerState('WORK');
          setTimeLeft(pomodoroSettings.work * 60);
        }

        if (pomodoroSettings.autoStartTimer) {
          setIsActive(true);
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
        "Flow Session Complete!", 
        `Focused for ${Math.floor(durationWorked / 60)}m. Earned ${breakStr} break!`
      );
      
      setPreviousMode('STOPWATCH');
      setTimerMode('POMODORO');
      setTimerState('BREAK');
      setTimeLeft(calculatedBreakSeconds);
      setFlowTimeElapsed(0);

      if (pomodoroSettings.autoStartBreak) {
        setIsActive(true);
      }
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
