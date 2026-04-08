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
const BLOCK_WIDTH_RANGE = { min: 14, max: 44 };
const BLOCK_HEIGHT_RANGE = { min: 4, max: 11.5 };
const EDGE_INSET = { top: -2, left: -14 };
const CLUSTER_SPREAD = { top: 3, left: 14 };
const OVERFLOW_ALLOWANCE = { top: 4, left: 12 };
const ANCHOR_TOP_RANGE = { min: 8, max: 82 };

type EdgeSide = "left" | "right";

type EdgeAnchor = {
  side: EdgeSide;
  top: number;
};

const createFrames = (): GlitchFrame[] =>
  Array.from({ length: 5 }, () => ({
    x: Math.round((Math.random() - 0.5) * 20),
    y: Math.round((Math.random() - 0.5) * 8),
    opacity: Number((0.56 + Math.random() * 0.2).toFixed(2)),
    skew: Math.round((Math.random() - 0.5) * 36),
  }));

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const randomInRange = (min: number, max: number) =>
  min + Math.random() * (max - min);

const pickSide = (): EdgeSide => (Math.random() > 0.5 ? "right" : "left");

const createAnchor = (): EdgeAnchor => ({
  side: pickSide(),
  top: randomInRange(ANCHOR_TOP_RANGE.min, ANCHOR_TOP_RANGE.max),
});

const getEdgePosition = (
  anchor: EdgeAnchor,
  width: number,
  height: number,
  offsetLeft: number,
  offsetTop: number,
) => {
  const minLeft = -width + OVERFLOW_ALLOWANCE.left;
  const maxLeft = 100 - OVERFLOW_ALLOWANCE.left;
  const minTop = -height + OVERFLOW_ALLOWANCE.top;
  const maxTop = 100 - OVERFLOW_ALLOWANCE.top;

  const topBase = anchor.top;
  const leftBase =
    anchor.side === "left"
      ? EDGE_INSET.left
      : 100 - width - EDGE_INSET.left - CLUSTER_SPREAD.left;

  return {
    top: clamp(topBase + offsetTop, minTop, maxTop - height * 0.15),
    left: clamp(leftBase + offsetLeft, minLeft, maxLeft),
  };
};

const createRandomBlocks = (): GlitchBlock[] => {
  const blockCount = 12 + Math.floor(Math.random() * 6);
  const overlapAnchors = Array.from({ length: 4 }, () => createAnchor());

  return Array.from({ length: blockCount }, (_, index) => {
    const width = Number(
      (
        BLOCK_WIDTH_RANGE.min +
        Math.random() * (BLOCK_WIDTH_RANGE.max - BLOCK_WIDTH_RANGE.min)
      ).toFixed(1),
    );
    const height = Number(
      (
        BLOCK_HEIGHT_RANGE.min +
        Math.random() * (BLOCK_HEIGHT_RANGE.max - BLOCK_HEIGHT_RANGE.min)
      ).toFixed(1),
    );
    const shouldOverlap = index % 4 === 0 || index % 5 === 0;
    const anchor = overlapAnchors[index % overlapAnchors.length];
    const position = getEdgePosition(
      shouldOverlap ? anchor : createAnchor(),
      width,
      height,
      shouldOverlap
        ? (Math.random() - 0.5) * (CLUSTER_SPREAD.left * 0.7)
        : randomInRange(-3, CLUSTER_SPREAD.left * 0.55),
      shouldOverlap
        ? (Math.random() - 0.5) * (CLUSTER_SPREAD.top * 0.7)
        : randomInRange(-8, CLUSTER_SPREAD.top * 0.45),
    );

    return {
      top: Number(position.top.toFixed(1)),
      left: Number(position.left.toFixed(1)),
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
