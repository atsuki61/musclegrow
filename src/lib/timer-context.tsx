"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

interface TimerContextType {
  timeLeft: number;
  duration: number;
  isActive: boolean;
  isMinimized: boolean;
  startTimer: (seconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  addTime: (seconds: number) => void;
  toggleMinimize: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // ビープ音を再生する関数
  const playBeep = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // 音量

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2); // 0.2秒鳴らす
    } catch (error) {
      console.error("Audio play error:", error);
    }
  }, []);

  // バイブレーション
  const vibrate = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  // タイマーのカウントダウン処理
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      // 終了予定時刻がない場合は設定（初回または再開時）
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;

        const now = Date.now();
        const remaining = Math.ceil((endTimeRef.current - now) / 1000);

        if (remaining <= 0) {
          setTimeLeft(0);
          setIsActive(false);
          endTimeRef.current = null;
          if (intervalRef.current) clearInterval(intervalRef.current);

          // 完了通知
          playBeep();
          vibrate();
          setIsMinimized(false); // 完了したら最大化して気付かせる
        } else {
          setTimeLeft(remaining);
        }
      }, 100); // 0.1秒ごとにチェックしてズレを防ぐ
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      endTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, playBeep, vibrate]);

  const startTimer = useCallback((seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsActive(true);
    setIsMinimized(false);
    endTimeRef.current = Date.now() + seconds * 1000;
  }, []);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
    endTimeRef.current = null;
  }, []);

  const resumeTimer = useCallback(() => {
    if (timeLeft > 0) {
      setIsActive(true);
      // endTimeRefはuseEffect内で再設定される
    }
  }, [timeLeft]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(0);
    setDuration(0);
    endTimeRef.current = null;
  }, []);

  const addTime = useCallback(
    (seconds: number) => {
      setTimeLeft((prev) => {
        const newTime = prev + seconds;
        if (isActive) {
          // アクティブな場合は終了時刻も延長
          endTimeRef.current =
            (endTimeRef.current || Date.now()) + seconds * 1000;
        }
        return newTime;
      });
      setDuration((prev) => Math.max(prev, timeLeft + seconds));
    },
    [isActive, timeLeft]
  );

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  return (
    <TimerContext.Provider
      value={{
        timeLeft,
        duration,
        isActive,
        isMinimized,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        addTime,
        toggleMinimize,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
