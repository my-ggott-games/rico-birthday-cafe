import { useEffect, useId, useMemo, type CSSProperties } from "react";
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
  stiffness: 150,
  damping: 25,
};

const GYRO_GAMMA_MIN = -20;
const GYRO_GAMMA_MAX = 20;
const GYRO_BETA_MIN = 25;
const GYRO_BETA_MAX = 65;
const GYRO_BETA_NATURAL = 45;

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
  const springX = useSpring(targetX, HOLOGRAPHIC_SPRING);
  const springY = useSpring(targetY, HOLOGRAPHIC_SPRING);

  const shineX = useTransform(springX, (value) => `${clamp(value, 0, 100)}%`);
  const shineY = useTransform(springY, (value) => `${clamp(value, 0, 100)}%`);
  const glareX = useTransform(
    springX,
    (value) => `${clamp(50 + (value - 50) * 1.06, 0, 100)}%`,
  );
  const glareY = useTransform(
    springY,
    (value) => `${clamp(50 + (value - 50) * 0.94, 0, 100)}%`,
  );
  const sparkleDriftX = useTransform(springX, (value) => (value - 50) * 0.18);
  const sparkleDriftY = useTransform(springY, (value) => (value - 50) * 0.22);

  const overlayVars = useMemo(
    () =>
      ({
        "--shine-x": shineX,
        "--shine-y": shineY,
        "--glare-x": glareX,
        "--glare-y": glareY,
      }) as CSSProperties,
    [glareX, glareY, shineX, shineY],
  );

  const shineGradient = useMemo(
    () =>
      `linear-gradient(
        118deg,
        rgba(255, 255, 255, 0) 12%,
        hsla(188, 100%, 72%, 0.9) 24%,
        hsla(316, 100%, 72%, 0.92) 42%,
        hsla(54, 100%, 72%, 0.88) 58%,
        hsla(272, 100%, 74%, 0.92) 74%,
        rgba(255, 255, 255, 0) 88%
      ),
      conic-gradient(
        from 180deg at var(--shine-x) var(--shine-y),
        hsla(188, 100%, 62%, 0.95) 0deg,
        hsla(316, 100%, 68%, 0.95) 95deg,
        hsla(54, 100%, 70%, 0.92) 190deg,
        hsla(272, 100%, 72%, 0.94) 280deg,
        hsla(188, 100%, 62%, 0.95) 360deg
      )`,
    [],
  );

  const glareGradient = useMemo(
    () =>
      `radial-gradient(
        farthest-corner circle at var(--glare-x) var(--glare-y),
        rgba(255, 255, 255, 0.96) 0%,
        rgba(255, 255, 255, 0.84) 6%,
        rgba(255, 236, 244, 0.46) 14%,
        rgba(172, 232, 255, 0.22) 24%,
        rgba(255, 255, 255, 0.08) 34%,
        transparent 48%
      )`,
    [],
  );

  const sparkleGradient = useMemo(
    () =>
      `radial-gradient(
        farthest-corner circle at var(--glare-x) var(--glare-y),
        rgba(255, 255, 255, 0.36) 0%,
        rgba(255, 255, 255, 0.12) 18%,
        rgba(255, 255, 255, 0) 44%
      ),
      linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.16) 8%,
        rgba(255, 255, 255, 0) 26%,
        rgba(255, 255, 255, 0.2) 52%,
        rgba(255, 255, 255, 0) 74%,
        rgba(255, 255, 255, 0.14) 100%
      )`,
    [],
  );

  const desktopSweepGradient = useMemo(
    () =>
      `linear-gradient(
        118deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0) 18%,
        hsla(188, 100%, 72%, 0.84) 34%,
        hsla(316, 100%, 72%, 0.88) 48%,
        hsla(54, 100%, 72%, 0.84) 62%,
        hsla(272, 100%, 74%, 0.86) 76%,
        rgba(255, 255, 255, 0) 100%
      )`,
    [],
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
      const normalizedX =
        ((clamp(event.gamma ?? 0, GYRO_GAMMA_MIN, GYRO_GAMMA_MAX) -
          GYRO_GAMMA_MIN) /
          (GYRO_GAMMA_MAX - GYRO_GAMMA_MIN)) *
        100;
      const normalizedY =
        ((clamp(
          event.beta ?? GYRO_BETA_NATURAL,
          GYRO_BETA_MIN,
          GYRO_BETA_MAX,
        ) -
          GYRO_BETA_MIN) /
          (GYRO_BETA_MAX - GYRO_BETA_MIN)) *
        100;

      targetX.set(clamp(normalizedX, 0, 100));
      targetY.set(clamp(normalizedY, 0, 100));
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [mobileInteractive, orientationEnabled, targetX, targetY, visible]);

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
          <filter
            id={noiseFilterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85 1.1"
              numOctaves="2"
              seed="19"
              result="fineNoise"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.12 0.18"
              numOctaves="1"
              seed="7"
              result="coarseNoise"
            />
            <feBlend
              in="fineNoise"
              in2="coarseNoise"
              mode="screen"
              result="combinedNoise"
            />
            <feColorMatrix
              in="combinedNoise"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 3.2 -1.3"
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
          backgroundImage: shineGradient,
          backgroundSize: "240% 240%, 165% 165%",
          backgroundPosition:
            "var(--shine-x) var(--shine-y), var(--shine-x) var(--shine-y)",
          backgroundRepeat: "no-repeat",
          mixBlendMode: "color-dodge",
          opacity: mobileInteractive ? 0.82 : 0.68,
          filter: "saturate(1.35) contrast(1.14)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          ...overlayVars,
          background: glareGradient,
          mixBlendMode: "overlay",
          opacity: mobileInteractive ? 0.88 : 0.72,
          filter: "blur(8px) saturate(1.08)",
        }}
      />

      {desktopSweep && !mobileInteractive && (
        <motion.div
          className="absolute inset-[-48%]"
          style={{
            background: desktopSweepGradient,
            mixBlendMode: "color-dodge",
            transform: "rotate(-18deg)",
            filter: "blur(18px) saturate(1.2)",
          }}
          animate={{
            x: ["-140%", "138%"],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 4.2,
            ease: "easeInOut",
          }}
        />
      )}

      <motion.div
        className="absolute inset-[-10%]"
        style={{
          ...overlayVars,
          backgroundImage: sparkleGradient,
          backgroundSize: "145% 145%, 220% 220%",
          backgroundPosition: "center, var(--shine-x) var(--shine-y)",
          backgroundRepeat: "no-repeat",
          mixBlendMode: "soft-light",
          opacity: mobileInteractive ? 0.42 : 0.3,
          filter: `url(#${noiseFilterId}) saturate(1.3) contrast(1.18)`,
          x: sparkleDriftX,
          y: sparkleDriftY,
        }}
      />
    </motion.div>
  );
};
