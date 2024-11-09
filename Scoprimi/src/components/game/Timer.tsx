import React, { useEffect, useState, useRef, useCallback } from 'react';

interface TimerProps {
  duration: number;
  onTimeUp: () => void;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeUp, isActive }) => {
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const timerRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current !== null) {
            clearInterval(timerRef.current);
          }
          setTimeout(onTimeUp, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onTimeUp]);

  useEffect(() => {
    if (isActive) {
      startTimer();
    } else {
      // Quando isActive diventa false, ferma il timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, startTimer]);

  return (
    <div className='timer-div'>
      <img
        src="./svg/hourglass.svg"
        alt="timer"
        className='timer-icon'
      />

      <div className='timer'>
        <p>{timeLeft} secondi</p>
      </div>
    </div>
  );
};

export default Timer;
