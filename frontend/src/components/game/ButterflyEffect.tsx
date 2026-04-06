import React, { useEffect, useRef, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";

type ButterflyConfig = {
  scale: number;
  flapDelay: string;
  flapDuration: string;
  wanderSpeed: number;
};

const createButterflyConfig = (): ButterflyConfig => ({
  scale: 0.4 + Math.random() * 0.16, // slightly larger
  flapDelay: `${(Math.random() * 1.2).toFixed(2)}s`,
  flapDuration: `${(500 + Math.random() * 500).toFixed(0)}ms`,
  wanderSpeed: 7 + Math.random() * 8, // 7~15s slow wander
});

const WanderingButterfly: React.FC<{
  config: ButterflyConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
}> = ({ config, containerRef }) => {
  const { scale, flapDelay, flapDuration, wanderSpeed } = config;
  const controls = useAnimation();

  useEffect(() => {
    let cancelled = false;

    const wander = async () => {
      const c = containerRef.current;
      if (!c) return;
      // Random starting position
      await controls.set({
        x: Math.random() * (c.clientWidth - 20),
        y: Math.random() * (c.clientHeight - 20),
      });
      while (!cancelled) {
        const el = containerRef.current;
        if (!el) break;
        await controls.start({
          x: Math.random() * (el.clientWidth - 20),
          y: Math.random() * (el.clientHeight - 20),
          transition: { duration: wanderSpeed, ease: "easeInOut" },
        });
      }
    };

    const timer = setTimeout(
      () => {
        void wander();
      },
      60 + Math.random() * 200,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [controls, wanderSpeed, containerRef]);

  return (
    <motion.div
      animate={controls}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <div className="bf-butterfly" style={{ transform: `scale(${scale})` }}>
        <div className="bf-glow" />

        {/* Left wing */}
        <div
          className="bf-wing bf-wing--left"
          style={{ animationDelay: flapDelay, animationDuration: flapDuration }}
        >
          <div className="bf-bit bf-bit--upper" />
          <div className="bf-bit bf-bit--lower" />
        </div>

        {/* Right wing */}
        <div
          className="bf-wing bf-wing--right"
          style={{ animationDelay: flapDelay, animationDuration: flapDuration }}
        >
          <div className="bf-bit bf-bit--upper" />
          <div className="bf-bit bf-bit--lower" />
        </div>
      </div>
    </motion.div>
  );
};

export const BlueButterflyOverlay: React.FC<{ count?: number }> = ({
  count = 9,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const butterflies = useMemo(
    () => Array.from({ length: count }, () => createButterflyConfig()),
    [count],
  );

  return (
    <div ref={containerRef} className="bf-wrapper" aria-hidden="true">
      {butterflies.map((config, i) => (
        <WanderingButterfly
          key={i}
          config={config}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
};
