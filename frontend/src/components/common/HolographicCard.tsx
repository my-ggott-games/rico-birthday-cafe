import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export interface HolographicCardProps {
  imageSrc: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  foilType?: "holo" | "radiant" | "galaxy";
}

export const HolographicCard: React.FC<HolographicCardProps> = ({
  imageSrc,
  className = "",
  width = "18rem",
  height = "25.2rem",
  foilType = "holo",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [interacting, setInteracting] = useState(false);

  const xValue = useMotionValue(50);
  const yValue = useMotionValue(50);

  const fadeValue = useMotionValue(0);
  const fadeSpring = useSpring(fadeValue, { damping: 22, stiffness: 40, mass: 1 });

  useEffect(() => {
    fadeValue.set(interacting ? 1 : 0);
  }, [interacting, fadeValue]);

  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const springX = useSpring(xValue, springConfig);
  const springY = useSpring(yValue, springConfig);

  const rotateX = useTransform(springY, [0, 100], [15, -15]);
  const rotateY = useTransform(springX, [0, 100], [-15, 15]);

  const bgPos = useMotionTemplate`${springX}% ${springY}%`;
  const invertedX = useTransform(springX, (x) => 100 - x);
  const invertedY = useTransform(springY, (y) => 100 - y);
  const bgPosInverted = useMotionTemplate`${invertedX}% ${invertedY}%`;

  const intensity = useTransform([springX, springY], ([x, y]: number[]) => {
    const dist = Math.hypot((x - 50) / 50, (y - 50) / 50);
    return clamp(dist, 0, 1) * 0.5;
  });

  const foilOpacityScale = foilType === "holo" ? 0.48 : 0.55;
  const foilOpacity = useTransform(fadeSpring, (f) => f * foilOpacityScale);
  const glareOpacity = useTransform(fadeSpring, (f) => f * 0.38);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    xValue.set(clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100));
    yValue.set(clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100));
  };

  const handlePointerEnter = () => setInteracting(true);

  const handlePointerLeave = () => {
    setInteracting(false);
    xValue.set(50);
    yValue.set(50);
  };

  const foilBackground = useMemo(() => {
    switch (foilType) {
      case "radiant":
        return `url('https://cosmos-images2.imgix.net/file/spina/photo/20565/191010_nature.jpg?ixlib=rails-2.1.4&auto=format&ch=Width%2CDPR&fit=max&w=835')`;
      case "galaxy":
        return `url('https://grainy-gradients.vercel.app/noise.svg')`;
      case "holo":
      default:
        return `linear-gradient(
          115deg,
          transparent 4%,
          hsla(192, 100%, 50%, 1) 18%,
          hsla(272, 100%, 58%, 1) 31%,
          hsla(324, 100%, 56%, 1) 44%,
          hsla(52,  100%, 50%, 1) 58%,
          hsla(120, 100%, 48%, 1) 71%,
          transparent 88%
        )`;
    }
  }, [foilType]);

  const glitterMixMode = foilType === "galaxy" ? "overlay" : "color-dodge";

  return (
    <div
      className={`relative block ${className}`}
      style={{ perspective: "1500px", width, height }}
    >
      <motion.div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="group relative w-full h-full"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ scale: interacting ? 1.05 : 1 }}
      >
        <div className="absolute inset-0 overflow-hidden z-10 bg-[#111]">
          <img
            src={imageSrc}
            alt="Holographic Card"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Glare layer */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none mix-blend-soft-light will-change-transform"
          style={{
            background: useMotionTemplate`radial-gradient(farthest-corner circle at ${springX}% ${springY}%, rgba(255,255,255,0.7) 5%, rgba(255,255,255,0.18) 25%, rgba(0,0,0,0.5) 80%)`,
            opacity: intensity,
          }}
        />

        {/* Diagonal soft glare */}
        <motion.div
          className="absolute inset-0 z-[25] pointer-events-none mix-blend-color-dodge will-change-transform"
          style={{
            background: `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.52) 25%, transparent 30%)`,
            backgroundPosition: bgPos,
            backgroundSize: "200% 200%",
            opacity: glareOpacity,
          }}
        />

        {/* Hologram foil */}
        <motion.div
          className="absolute inset-0 z-30 pointer-events-none will-change-transform"
          style={{
            background: foilBackground,
            mixBlendMode: glitterMixMode,
            backgroundPosition: foilType === "holo" ? bgPosInverted : "center",
            backgroundSize: foilType === "holo" ? "250% 250%" : "cover",
            opacity: foilOpacity,
            filter: "brightness(1.08) contrast(1.06) saturate(1.1)",
          }}
        />

        <motion.div
          className="absolute inset-0 z-[35] pointer-events-none mix-blend-color-burn opacity-30 will-change-transform"
          style={{
            background: useMotionTemplate`radial-gradient(circle at ${springX}% ${springY}%, transparent 80%, black 130%)`,
          }}
        />
      </motion.div>
    </div>
  );
};
