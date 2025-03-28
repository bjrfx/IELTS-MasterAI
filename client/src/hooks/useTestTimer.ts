import { useState, useEffect, useCallback } from 'react';

type TimerConfig = {
  minutes: number;
  seconds?: number;
  autoStart?: boolean;
  onTimeUp?: () => void;
};

export const useTestTimer = ({ minutes, seconds = 0, autoStart = false, onTimeUp }: TimerConfig) => {
  const [timeLeft, setTimeLeft] = useState({
    minutes,
    seconds,
    total: minutes * 60 + seconds,
  });
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft({
      minutes,
      seconds,
      total: minutes * 60 + seconds,
    });
    setIsRunning(false);
    setIsPaused(false);
  }, [minutes, seconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev.total <= 1) {
            clearInterval(interval!);
            setIsRunning(false);
            if (onTimeUp) {
              onTimeUp();
            }
            return { minutes: 0, seconds: 0, total: 0 };
          }

          const newTotal = prev.total - 1;
          const newMinutes = Math.floor(newTotal / 60);
          const newSeconds = newTotal % 60;

          return {
            minutes: newMinutes,
            seconds: newSeconds,
            total: newTotal,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, isPaused, onTimeUp]);

  const formattedTime = `${String(timeLeft.minutes).padStart(2, '0')}:${String(
    timeLeft.seconds
  ).padStart(2, '0')}`;

  return {
    timeLeft,
    formattedTime,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
  };
};
