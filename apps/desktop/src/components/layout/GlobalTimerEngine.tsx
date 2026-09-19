import React, { useEffect } from 'react';
import { playCompletionSound } from '../../lib/sound';
import { useDesktopStore } from '../../lib/store';
import { electron } from '../../lib/electron';

export const GlobalTimerEngine: React.FC = () => {
  const {
    timeLeft,
    setTimeLeft,
    setTimerState,
    flowTimeElapsed,
    setFlowTimeElapsed,
    timerState,
    isActive,
    setIsActive,
    todos,
    updateTodo,
    selectedTodoId,
    addSession,
    sessionName,
    setDeepFocusMode,
    setIsMusicPlaying
  } = useDesktopStore();

  const prevTimerRef = React.useRef({ isActive });

  useEffect(() => {
    const prev = prevTimerRef.current;
    if (isActive && !prev.isActive) {
      setIsMusicPlaying(true);
    } else if (!isActive && prev.isActive) {
      setIsMusicPlaying(false);
    }
    prevTimerRef.current = { isActive };
  }, [isActive, setIsMusicPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (timerState === 'BREAK') {
          setTimeLeft((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              setTimerState('FLOW');
              setIsActive(false);
              return 0;
            }
            return next;
          });
        } else {
          setFlowTimeElapsed((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, setFlowTimeElapsed, setTimeLeft, timerState, setTimerState, setIsActive]);

  return null;
};
