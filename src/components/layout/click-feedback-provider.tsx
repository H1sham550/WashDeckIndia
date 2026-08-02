"use client";

import React, { useEffect } from "react";

export function ClickFeedbackProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let audioCtx: AudioContext | null = null;

    const playClickTick = () => {
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(900, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.012);

        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.012);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.012);
      } catch {}
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest("button, .btn, a, [role='button'], .active-tap, input[type='submit'], input[type='button']");
      if (clickable) {
        playClickTick();
      }
    };

    window.addEventListener("click", handleClick, { capture: true, passive: true });

    return () => {
      window.removeEventListener("click", handleClick, { capture: true } as any);
    };
  }, []);

  return <>{children}</>;
}
