import React, { useEffect, useRef } from "react";
import { ClickEffectEngine } from "./clickEffectEngine";

const MIN_BURST_INTERVAL_MS = 60;

export const CursorManager: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const engine = new ClickEffectEngine(canvas);
    let lastBurstTime = 0;

    const handleClick = (event: MouseEvent) => {
      const now = performance.now();
      if (now - lastBurstTime < MIN_BURST_INTERVAL_MS) {
        return;
      }
      lastBurstTime = now;
      engine.burst(event.clientX, event.clientY);
    };
    const handleResize = () => engine.resize();

    window.addEventListener("click", handleClick, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("resize", handleResize);
      engine.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999999] h-full w-full"
    />
  );
};
