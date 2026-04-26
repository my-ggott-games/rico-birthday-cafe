import React, { useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type PolaroidHolographicOverlayProps = {
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

export const PolaroidHolographicOverlay = ({
  visible,
  mobileInteractive,
  orientationEnabled,
  desktopSweep,
  imageUrl,
}: PolaroidHolographicOverlayProps) => {
  const mobileGyroActive = mobileInteractive && orientationEnabled;
  const targetX = useMotionValue(50);
  const targetY = useMotionValue(50);
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
      cyan: "hsla(192, 100%, 50%, 1)",
      pink: "hsla(324, 100%, 58%, 1)",
      violet: "hsla(272, 100%, 58%, 1)",
      gold: "hsla(52, 100%, 52%, 1)",
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
  const mobileTiltStrength = useTransform([springX, springY], (latest) => {
    const [x, y] = latest as number[];
    const normalizedX = (x - 50) / 50;
    const normalizedY = (y - 50) / 50;
    return Math.min(Math.hypot(normalizedX, normalizedY), 1);
  });
  const mobileSweepAngle = useTransform([springX, springY], (latest) => {
    const [x, y] = latest as number[];
    const angle = 110 + x * 0.2 + (y - 50) * 0.08;
    return `${clamp(angle, 110, 140)}deg`;
  });
  const mobileSweepPosition = useTransform([springX, springY], (latest) => {
    const [x, y] = latest as number[];
    return `${clamp(x, 0, 100)}% ${clamp(y, 0, 100)}%`;
  });
  const mobileSweepOpacity = useTransform(
    mobileTiltStrength,
    (value) => 0.58 + value * 0.18,
  );
  const mobileSweepGradient = useTransform([mobileSweepAngle], (latest) => {
    const [angle] = latest as [string];
    return `linear-gradient(${angle},
      transparent 0%,
      rgba(255,255,255,0.03) 14%,
      hsla(192, 100%, 58%, 0.58) 32%,
      hsla(324, 100%, 60%, 0.72) 50%,
      hsla(272, 100%, 60%, 0.65) 64%,
      hsla(52, 100%, 58%, 0.58) 80%,
      transparent 100%)`;
  });

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
      style={{ isolation: "isolate", transform: "translateZ(0)" }}
    >


      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {!mobileInteractive && (
        <div
          className="absolute inset-0"
          style={{
            ...overlayVars,
            background: radialBurst,
            opacity: 0.86,
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
            opacity: 0.66,
          }}
        />
      )}
      <motion.div
        className={mobileGyroActive ? "absolute inset-[-18%]" : "absolute inset-0"}
        style={{
          background: diagonalField,
          mixBlendMode: "overlay",
          opacity: mobileInteractive ? 0.5 : 0,
          filter: mobileInteractive ? undefined : "saturate(1.06)",
          x: mobileInteractive && orientationEnabled ? diagonalOffsetX : 0,
          y: mobileInteractive && orientationEnabled ? diagonalOffsetY : 0,
          willChange: "transform",
        }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
      />

      {mobileGyroActive && (
        <motion.div
          className="absolute inset-[-45%]"
          style={{
            backgroundImage: mobileSweepGradient,
            backgroundSize: "240% 240%",
            backgroundPosition: mobileSweepPosition,
            backgroundRepeat: "no-repeat",
            mixBlendMode: "color-dodge",
            opacity: mobileSweepOpacity,
            // Avoid saturate() filter on mobile to prevent GPU artifact/noise residue
            willChange: "transform",
          }}
        />
      )}

      {desktopSweep && !mobileInteractive && (
        <motion.div
          className="absolute inset-[-45%]"
          style={{
            background: desktopSweepGradient,
            mixBlendMode: "color-dodge",
            transform: "rotate(-18deg)",
            filter: "blur(16px) saturate(1.12)",
            willChange: "transform",
          }}
          animate={{
            x: ["-140%", "138%"],
            opacity: [0, 0.96, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 4.2,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
};
