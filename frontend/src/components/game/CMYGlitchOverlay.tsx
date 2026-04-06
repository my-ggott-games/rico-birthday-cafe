import React, { useEffect, useState } from "react";

type GlitchFrame = {
  x: number;
  y: number;
  opacity: number;
  skew: number;
};

type GlitchBlock = {
  top: number;
  left: number;
  width: number;
  height: number;
  color: string;
  zIndex: number;
  frames: GlitchFrame[];
};

const BLOCK_COLORS = [
  "rgba(255, 0, 170, 0.78)",
  "rgba(0, 255, 255, 0.76)",
  "rgba(255, 230, 0, 0.74)",
];

const ACTIVE_BURST_MS = 1000;
const IDLE_MS = 2000;
const STEP_MS = 55;

const createFrames = (): GlitchFrame[] =>
  Array.from({ length: 5 }, () => ({
    x: Math.round((Math.random() - 0.5) * 20),
    y: Math.round((Math.random() - 0.5) * 8),
    opacity: Number((0.56 + Math.random() * 0.2).toFixed(2)),
    skew: Math.round((Math.random() - 0.5) * 36),
  }));

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const createRandomBlocks = (): GlitchBlock[] => {
  const blockCount = 12 + Math.floor(Math.random() * 6);
  const overlapAnchors = Array.from({ length: 3 }, () => ({
    top: 10 + Math.random() * 68,
    left: 8 + Math.random() * 66,
  }));

  return Array.from({ length: blockCount }, (_, index) => {
    const width = Number((5 + Math.random() * 23).toFixed(1));
    const height = Number((1.6 + Math.random() * 5.8).toFixed(1));
    const shouldOverlap = index % 4 === 0 || index % 5 === 0;
    const anchor = overlapAnchors[index % overlapAnchors.length];

    const top = shouldOverlap
      ? clamp(anchor.top + (Math.random() - 0.5) * 18, 2, 93)
      : clamp(4 + Math.random() * 86, 2, 93);
    const left = shouldOverlap
      ? clamp(anchor.left + (Math.random() - 0.5) * 20, 1, 90)
      : clamp(3 + Math.random() * 84, 1, 90);

    return {
      top: Number(top.toFixed(1)),
      left: Number(left.toFixed(1)),
      width,
      height,
      color: BLOCK_COLORS[index % BLOCK_COLORS.length],
      zIndex: 1 + (index % 4),
      frames: createFrames(),
    };
  });
};

export const CMYGlitchOverlay: React.FC = () => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isBursting, setIsBursting] = useState(true);
  const [glitchBlocks, setGlitchBlocks] = useState<GlitchBlock[]>(() =>
    createRandomBlocks(),
  );

  useEffect(() => {
    let burstTimer: number;
    let idleTimer: number;

    const scheduleCycle = () => {
      setGlitchBlocks((current) =>
        current.map((block, index) =>
          index % 3 === 0
            ? { ...createRandomBlocks()[0], zIndex: block.zIndex }
            : { ...block, frames: createFrames() },
        ),
      );
      setFrameIndex(0);
      setIsBursting(true);
      burstTimer = window.setTimeout(() => {
        setIsBursting(false);
        idleTimer = window.setTimeout(scheduleCycle, IDLE_MS);
      }, ACTIVE_BURST_MS);
    };

    scheduleCycle();

    return () => {
      window.clearTimeout(burstTimer);
      window.clearTimeout(idleTimer);
    };
  }, []);

  useEffect(() => {
    if (!isBursting) {
      return;
    }

    const interval = window.setInterval(() => {
      setFrameIndex((current) => current + 1);
    }, STEP_MS);

    return () => window.clearInterval(interval);
  }, [isBursting]);

  return (
    <div
      className={`cmy-glitch-overlay absolute inset-0 overflow-hidden pointer-events-none ${isBursting ? "cmy-glitch-overlay--burst" : ""}`}
    >
      <div
        className={`cmy-glitch-stage absolute inset-0 ${isBursting ? "cmy-glitch-stage--burst" : ""}`}
      >
        {glitchBlocks.map((block, index) => {
          const frame =
            block.frames[(frameIndex + index) % block.frames.length];

          return (
            <div
              key={`${block.top}-${block.left}-${index}`}
              className={`cmy-glitch-block absolute ${isBursting ? "cmy-glitch-block--burst" : ""}`}
              style={{
                top: `${block.top}%`,
                left: `${block.left}%`,
                width: `${block.width}%`,
                height: `${block.height}%`,
                background: `linear-gradient(90deg, ${block.color}, rgba(255,255,255,0.08))`,
                opacity: isBursting ? frame.opacity : 0,
                transform: isBursting
                  ? `translate(${frame.x}px, ${frame.y}px) skewX(${frame.skew}deg)`
                  : "translate(0, 0) skewX(0deg)",
                boxShadow: isBursting
                  ? `-4px 0 0 rgba(255, 0, 170, 0.34), 4px 0 0 rgba(0, 255, 255, 0.32), 0 0 0 1px rgba(255, 230, 0, 0.35)`
                  : "none",
                zIndex: block.zIndex,
                willChange: "transform, opacity",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
