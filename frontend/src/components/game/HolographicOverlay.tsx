import React, { useEffect, useId, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type HolographicOverlayProps = {
  visible: boolean;
  mobileInteractive: boolean;
  orientationEnabled: boolean;
  desktopSweep: boolean;
  imageUrl: string;
  permissionDenied?: boolean;
};

const HOLOGRAPHIC_SPRING = {
  stiffness: 120,
  damping: 25,
};

export const HolographicOverlay = ({
  visible,
  mobileInteractive,
  orientationEnabled,
  desktopSweep,
  imageUrl,
}: HolographicOverlayProps) => {
  const noiseFilterId = useId().replace(/:/g, "");
  const targetX = useMotionValue(50);
  const targetY = useMotionValue(50);
  const [sensorDebug, setSensorDebug] = useState({ beta: 0, gamma: 0 });
  const springX = useSpring(targetX, HOLOGRAPHIC_SPRING);
  const springY = useSpring(targetY, HOLOGRAPHIC_SPRING);
  const glintX = useTransform(springX, (value) => `${value}%`);
  const glintY = useTransform(springY, (value) => `${value}%`);
  const fieldX = useTransform(
    springX,
    (value) => `${clamp(50 + (value - 50) * 0.72, 0, 100)}%`,
  );
  const fieldY = useTransform(
    springY,
    (value) => `${clamp(50 + (value - 50) * 0.68, 0, 100)}%`,
  );
  const isDev = import.meta.env.DEV;

  const palette = useMemo(
    () => ({
      cyan: "hsla(192, 100%, 54%, 1)",
      pink: "hsla(324, 100%, 62%, 0.96)",
      violet: "hsla(272, 100%, 62%, 0.92)",
      gold: "hsla(52, 100%, 56%, 0.88)",
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
  const diagonalOffsetX = useTransform(
    springX,
    (value) => `${(value - 50) * 0.35}%`,
  );
  const diagonalOffsetY = useTransform(
    springY,
    (value) => `${(value - 50) * 0.35}%`,
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
    setSensorDebug({ beta: 0, gamma: 0 });
  }, [targetX, targetY, visible]);

  useEffect(() => {
    if (
      !visible ||
      !orientationEnabled ||
      !mobileInteractive ||
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = clamp(event.gamma ?? 0, -35, 35);
      const beta = clamp(event.beta ?? 0, -50, 50);
      const normalizedX = clamp(((gamma + 35) / 70) * 100, 0, 100);
      const normalizedY = clamp(((beta + 50) / 100) * 100, 0, 100);

      targetX.set(normalizedX);
      targetY.set(normalizedY);

      if (isDev) {
        setSensorDebug({ beta, gamma });
        console.log("[gyro]", { beta, gamma, x: normalizedX, y: normalizedY });
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [isDev, mobileInteractive, orientationEnabled, targetX, targetY, visible]);

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

      {!mobileInteractive && (
        <div
          className="absolute inset-0"
          style={{
            ...overlayVars,
            background: radialBurst,
            opacity: 0.72,
          }}
        />
      )}
      {!mobileInteractive && (
        <div
          className="absolute inset-0"
          style={{
            ...overlayVars,
            background: spectralField,
            mixBlendMode: "color-dodge",
            opacity: 0.5,
          }}
        />
      )}
      <motion.div
        className="absolute inset-0"
        style={{
          background: diagonalField,
          mixBlendMode: "overlay",
          opacity: mobileInteractive ? 0.5 : 0,
          filter: mobileInteractive
            ? "saturate(1.6) contrast(1.14)"
            : "saturate(1.06)",
          x: mobileInteractive && orientationEnabled ? diagonalOffsetX : 0,
          y: mobileInteractive && orientationEnabled ? diagonalOffsetY : 0,
        }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
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
