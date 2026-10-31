import React, { useEffect } from 'react';
import { playCompletionSound, registerAutoplayUnlock } from '../../lib/sound';
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
    setDeepFocusMode,
    setIsMusicPlaying,
    autoStartFlow,
  } = useDesktopStore();

  const prevTimerRef = React.useRef({ isActive, timerState });

  useEffect(() => {
    registerAutoplayUnlock();
  }, []);

  useEffect(() => {
    const prev = prevTimerRef.current;
    const isRunningFlow = isActive && timerState === 'FLOW';
    const wasRunningFlow = prev.isActive && prev.timerState === 'FLOW';
    if (isRunningFlow && !wasRunningFlow) {
      setIsMusicPlaying(true);
    } else if (!isRunningFlow && wasRunningFlow) {
      setIsMusicPlaying(false);
    }
    prevTimerRef.current = { isActive, timerState };
  }, [isActive, timerState, setIsMusicPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (timerState === 'BREAK') {
          setTimeLeft((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              const breakNotification = {
                title: 'Break Finished!',
                body: 'Time to get back into flow.',
              };
              playCompletionSound(false, breakNotification);
              setTimerState('FLOW');
              if (autoStartFlow ?? true) {
                setDeepFocusMode(true);
              } else {
                setIsActive(false);
              }
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
  }, [isActive, setFlowTimeElapsed, setTimeLeft, timerState, setTimerState, setIsActive, setDeepFocusMode, autoStartFlow]);

  return null;
};
