import React, { useEffect, useId, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type HolographicOverlayProps = {
  visible: boolean;
  mobileInteractive: boolean;
  desktopSweep: boolean;
  imageUrl: string;
};

const HOLOGRAPHIC_SPRING = {
  stiffness: 140,
  damping: 22,
};

export const HolographicOverlay = ({
  visible,
  mobileInteractive,
  desktopSweep,
  imageUrl,
}: HolographicOverlayProps) => {
  const noiseFilterId = useId().replace(/:/g, "");
  const targetX = useMotionValue(50);
  const targetY = useMotionValue(50);
  const springX = useSpring(targetX, HOLOGRAPHIC_SPRING);
  const springY = useSpring(targetY, HOLOGRAPHIC_SPRING);
  const glintX = useTransform(springX, (value) => `${value}%`);
  const glintY = useTransform(springY, (value) => `${value}%`);
  const fieldX = useTransform(
    springX,
    (value) => `${clamp(50 + (value - 50) * 0.65, 4, 96)}%`,
  );
  const fieldY = useTransform(
    springY,
    (value) => `${clamp(50 + (value - 50) * 0.6, 4, 96)}%`,
  );

  const palette = useMemo(
    () => ({
      cyan: "hsla(192, 100%, 56%, 0.95)",
      pink: "hsla(320, 100%, 66%, 0.9)",
      violet: "hsla(266, 100%, 65%, 0.88)",
      gold: "hsla(52, 100%, 58%, 0.82)",
    }),
    [],
  );

  const overlayVars = useMemo(
    () =>
      ({
        "--glint-x": glintX,
        "--glint-y": glintY,
        "--field-x": fieldX,
        "--field-y": fieldY,
      }) as React.CSSProperties,
    [fieldX, fieldY, glintX, glintY],
  );

  const radialBurst = useMemo(
    () =>
      `radial-gradient(circle at var(--glint-x) var(--glint-y),
        ${palette.cyan} 0%,
        ${palette.pink} 28%,
        ${palette.gold} 52%,
        transparent 76%)`,
    [palette],
  );

  const spectralField = useMemo(
    () =>
      `conic-gradient(from 210deg at var(--field-x) var(--field-y),
        ${palette.cyan},
        ${palette.violet},
        ${palette.pink},
        ${palette.gold},
        ${palette.cyan})`,
    [palette],
  );

  const diagonalField = useMemo(
    () =>
      `linear-gradient(125deg,
        transparent 0%,
        ${palette.cyan} 18%,
        transparent 36%,
        ${palette.violet} 54%,
        transparent 70%,
        ${palette.gold} 92%)`,
    [palette],
  );

  const desktopSweepGradient = useMemo(
    () =>
      `linear-gradient(118deg,
        transparent 0%,
        transparent 20%,
        ${palette.cyan} 38%,
        ${palette.pink} 52%,
        ${palette.violet} 66%,
        ${palette.gold} 80%,
        transparent 100%)`,
    [palette],
  );

  useEffect(() => {
    targetX.set(50);
    targetY.set(50);
  }, [targetX, targetY, visible]);

  useEffect(() => {
    if (
      !visible ||
      !mobileInteractive ||
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = clamp(event.gamma ?? 0, -35, 35);
      const beta = clamp(event.beta ?? 0, -50, 50);

      targetX.set(clamp(50 + (gamma / 35) * 28, 4, 96));
      targetY.set(clamp(50 + (beta / 50) * 22, 6, 94));
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [mobileInteractive, targetX, targetY, visible]);

  if (!visible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="pointer-events-none absolute inset-0 z-[3] overflow-hidden"
    >
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id={noiseFilterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.78"
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
          ...overlayVars,
          background: radialBurst,
          mixBlendMode: "color-dodge",
          opacity: mobileInteractive ? 0.98 : 0.72,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          ...overlayVars,
          background: spectralField,
          mixBlendMode: "color-dodge",
          opacity: mobileInteractive ? 0.72 : 0.34,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: diagonalField,
          mixBlendMode: "overlay",
          opacity: mobileInteractive ? 0.58 : 0.2,
          filter: mobileInteractive ? "saturate(1.32) contrast(1.08)" : "saturate(1.06)",
        }}
      />

      {desktopSweep && !mobileInteractive && (
        <motion.div
          className="absolute inset-[-45%]"
          style={{
            background: desktopSweepGradient,
            mixBlendMode: "color-dodge",
            transform: "rotate(-18deg)",
            filter: "blur(16px) saturate(1.12)",
          }}
          animate={{
            x: ["-140%", "138%"],
            opacity: [0, 0.84, 0],
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
          fill="rgba(22,109,119,0.82)"
          filter={`url(#${noiseFilterId})`}
          opacity="0.18"
          style={{ mixBlendMode: "soft-light" }}
        />
      </svg>
    </motion.div>
  );
};
