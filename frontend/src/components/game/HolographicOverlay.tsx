import React, { useEffect, useId, useMemo } from "react";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type HolographicOverlayProps = {
  visible: boolean;
  orientationEnabled: boolean;
  imageUrl: string;
};

const HOLOGRAPHIC_SPRING = {
  stiffness: 120,
  damping: 25,
};

export const HolographicOverlay = ({
  visible,
  orientationEnabled,
  imageUrl,
}: HolographicOverlayProps) => {
  const noiseFilterId = useId().replace(/:/g, "");
  const targetX = useMotionValue(50);
  const targetY = useMotionValue(50);
  const springX = useSpring(targetX, HOLOGRAPHIC_SPRING);
  const springY = useSpring(targetY, HOLOGRAPHIC_SPRING);
  const glintX = useTransform(springX, (value) => `${value}%`);
  const glintY = useTransform(springY, (value) => `${value}%`);
  const shimmerX = useTransform(
    springX,
    (value) => `${clamp(50 + (value - 50) * 0.42, 10, 90)}%`,
  );
  const shimmerY = useTransform(
    springY,
    (value) => `${clamp(50 + (value - 50) * 0.36, 10, 90)}%`,
  );

  const spectralPalette = useMemo(
    () => ({
      sky: "hsla(190, 100%, 80%, 0.5)",
      pink: "hsla(300, 100%, 85%, 0.5)",
      lemon: "hsla(60, 100%, 90%, 0.5)",
    }),
    [],
  );

  const radialSheen = useMemo(
    () =>
      `radial-gradient(circle at var(--glint-x) var(--glint-y),
        ${spectralPalette.sky} 0%,
        ${spectralPalette.pink} 32%,
        ${spectralPalette.lemon} 58%,
        transparent 76%)`,
    [spectralPalette],
  );

  const spectralField = useMemo(
    () =>
      `linear-gradient(132deg,
        transparent 6%,
        ${spectralPalette.sky} 22%,
        transparent 38%,
        ${spectralPalette.pink} 56%,
        transparent 72%,
        ${spectralPalette.lemon} 92%)`,
    [spectralPalette],
  );

  const prismField = useMemo(
    () =>
      `conic-gradient(from 210deg at var(--field-x) var(--field-y),
        ${spectralPalette.sky},
        ${spectralPalette.pink},
        hsla(265, 100%, 86%, 0.52),
        ${spectralPalette.lemon},
        ${spectralPalette.sky})`,
    [spectralPalette],
  );

  const spectralSweep = useMemo(
    () =>
      `linear-gradient(118deg,
        transparent 0%,
        transparent 20%,
        ${spectralPalette.sky} 34%,
        ${spectralPalette.pink} 50%,
        hsla(265, 100%, 86%, 0.48) 64%,
        ${spectralPalette.lemon} 78%,
        transparent 100%)`,
    [spectralPalette],
  );

  const overlayStyle = useMemo(
    () =>
      ({
        "--glint-x": glintX,
        "--glint-y": glintY,
        "--field-x": shimmerX,
        "--field-y": shimmerY,
      }) as React.CSSProperties,
    [glintX, glintY, shimmerX, shimmerY],
  );

  useEffect(() => {
    targetX.set(50);
    targetY.set(50);
  }, [targetX, targetY, visible]);

  useEffect(() => {
    if (
      !visible ||
      !orientationEnabled ||
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = clamp(event.gamma ?? 0, -35, 35);
      const beta = clamp(event.beta ?? 0, -45, 45);

      targetX.set(clamp(50 + (gamma / 35) * 18, 12, 88));
      targetY.set(clamp(50 + ((beta - 5) / 45) * 14, 12, 88));
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [orientationEnabled, targetX, targetY, visible]);

  useEffect(() => {
    if (!visible || orientationEnabled || typeof window === "undefined") {
      return;
    }

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarsePointer) {
      return;
    }

    let frameId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      targetX.set(50 + Math.sin(elapsed * 0.45) * 10);
      targetY.set(50 + Math.cos(elapsed * 0.32) * 7);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [orientationEnabled, targetX, targetY, visible]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="pointer-events-none absolute inset-0 z-[3] overflow-hidden"
    >
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id={noiseFilterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="2"
              seed="23"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 10 -4"
            />
          </filter>
        </defs>
      </svg>

      <img
        src={imageUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div
        className="absolute inset-0"
        style={{
          ...overlayStyle,
          background: radialSheen,
          mixBlendMode: "color-dodge",
          opacity: 0.88,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: spectralField,
          mixBlendMode: "color-dodge",
          opacity: 0.56,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          ...overlayStyle,
          background: prismField,
          mixBlendMode: "color-dodge",
          opacity: 0.38,
        }}
      />
      {!orientationEnabled && (
        <motion.div
          className="absolute inset-[-42%]"
          style={{
            background: spectralSweep,
            mixBlendMode: "color-dodge",
            transform: "rotate(-18deg)",
            filter: "blur(14px) saturate(1.08)",
          }}
          animate={{
            x: ["-138%", "138%"],
            opacity: [0, 0.72, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 4.2,
            ease: "easeInOut",
          }}
        />
      )}

      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <rect
          width="100%"
          height="100%"
          fill="rgba(22,109,119,0.78)"
          filter={`url(#${noiseFilterId})`}
          opacity="0.12"
          style={{ mixBlendMode: "soft-light" }}
        />
      </svg>
    </motion.div>
  );
};
