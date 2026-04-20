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
  width = "18rem", // 288px default
  height = "25.2rem", // ~403px default
  foilType = "holo",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasDeviceOrientation, setHasDeviceOrientation] = useState(false);
  const [isGyroActive, setIsGyroActive] = useState(false);
  const [interacting, setInteracting] = useState(false);

  // Use motion values for pointer/gyro tracking (0-100 values)
  const xValue = useMotionValue(50);
  const yValue = useMotionValue(50);

  const fadeValue = useMotionValue(0);
  // Smooth spring for fade in/out (adjusted to be slightly faster)
  const fadeSpring = useSpring(fadeValue, { damping: 22, stiffness: 40, mass: 1 });

  useEffect(() => {
    fadeValue.set(interacting || isGyroActive ? 1 : 0);
  }, [interacting, isGyroActive, fadeValue]);

  // Apply smooth physics to the values
  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const springX = useSpring(xValue, springConfig);
  const springY = useSpring(yValue, springConfig);

  // Transform to rotateX and rotateY for the 3D parallax
  const rotateX = useTransform(springY, [0, 100], [15, -15]);
  const rotateY = useTransform(springX, [0, 100], [-15, 15]);

  // Translate background positions based on pointer/gyro
  const bgPos = useMotionTemplate`${springX}% ${springY}%`;
  const bgPosInverted = useMotionTemplate`${useTransform(springX, x => 100 - x)}% ${useTransform(springY, y => 100 - y)}%`;

  // Strength of the lighting based on distance from center
  const intensity = useTransform([springX, springY], ([x, y]: number[]) => {
    const dist = Math.hypot((x - 50) / 50, (y - 50) / 50);
    return clamp(dist, 0, 1) * 0.4;
  });

  useEffect(() => {
    const requestPermission = async () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        try {
          const perm = await (DeviceOrientationEvent as any).requestPermission();
          if (perm === "granted") {
            setHasDeviceOrientation(true);
          }
        } catch (error) {
          console.error("Device orientation permission error", error);
        }
      } else {
        // Automatically enabled on non-iOS or older iOS
        setHasDeviceOrientation(true);
      }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Gamma: left to right (-90 to 90)
      // Beta: front to back (-180 to 180)
      if (e.gamma === null || e.beta === null) return;
      setIsGyroActive(true);
      
      const gamma = clamp(e.gamma, -45, 45);
      const beta = clamp(e.beta - 40, -45, 45); // Adjust for typical holding angle

      const normX = ((gamma + 45) / 90) * 100;
      const normY = ((beta + 45) / 90) * 100;

      xValue.set(normX);
      yValue.set(normY);
    };

    if (hasDeviceOrientation) {
      window.addEventListener("deviceorientation", handleOrientation);
    } else {
      requestPermission();
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [hasDeviceOrientation, xValue, yValue]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isGyroActive) return;
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    
    xValue.set(x);
    yValue.set(y);
  };

  const handlePointerEnter = () => {
    setInteracting(true);
  };

  const handlePointerLeave = () => {
    setInteracting(false);
    // Return to center if not using device orientation
    if (!isGyroActive) {
      xValue.set(50);
      yValue.set(50);
    }
  };

  // Hologram styles based on simeydotme card effects
  const foilBackground = useMemo(() => {
    switch (foilType) {
      case "radiant":
        return `url('https://cosmos-images2.imgix.net/file/spina/photo/20565/191010_nature.jpg?ixlib=rails-2.1.4&auto=format&ch=Width%2CDPR&fit=max&w=835')`; // Placeholder for stars
      case "galaxy":
        return `url('https://grainy-gradients.vercel.app/noise.svg')`; 
      case "holo":
      default:
        // Vibrant Rainbow sweep
        return `linear-gradient(
          115deg,
          transparent 15%,
          hsla(192, 100%, 60%, 0.85) 28%,
          hsla(272, 100%, 65%, 0.85) 38%,
          hsla(324, 100%, 62%, 0.85) 48%,
          hsla(52, 100%, 60%, 0.85) 65%,
          transparent 82%
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
        className="group relative w-full h-full transition-transform duration-300 ease-out"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          scale: interacting ? 1.05 : 1, // slight pop on hover
        }}
      >
        {/* Base Image */}
        <div className="absolute inset-0 overflow-hidden z-10 bg-[#111]">
          <img
            src={imageSrc}
            alt="Holographic Card"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Glare Layer */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none mix-blend-soft-light"
          style={{
            background: useMotionTemplate`radial-gradient(farthest-corner circle at ${springX}% ${springY}%, rgba(255, 255, 255, 0.6) 5%, rgba(255, 255, 255, 0.15) 25%, rgba(0, 0, 0, 0.5) 80%)`,
            opacity: intensity,
          }}
        />

        {/* Diagonal Soft Glare Layer */}
        <motion.div
          className="absolute inset-0 z-[25] pointer-events-none mix-blend-color-dodge opacity-25"
          style={{
            background: `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%)`,
            backgroundPosition: bgPos,
            backgroundSize: "200% 200%",
          }}
        />

        {/* Hologram Foil Layer */}
        <motion.div
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            background: foilBackground,
            mixBlendMode: glitterMixMode,
            backgroundPosition: foilType === "holo" ? bgPosInverted : "center",
            backgroundSize: foilType === "holo" ? "250% 250%" : "cover",
            opacity: foilType === "holo" ? useTransform(fadeSpring, fade => fade * 0.5) : useTransform(fadeSpring, fade => fade * 0.4),
            filter: foilType === "holo" ? "brightness(1.1) contrast(1.1) saturate(1.2)" : "brightness(1) contrast(1.1) saturate(1.2)",
          }}
        />
        
        <motion.div
          className="absolute inset-0 z-[35] pointer-events-none mix-blend-color-burn opacity-30"
          style={{
            background: useMotionTemplate`radial-gradient(circle at ${springX}% ${springY}%, transparent 80%, black 130%)`
          }}
        />

      </motion.div>
    </div>
  );
};
