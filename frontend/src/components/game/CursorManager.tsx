import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Club } from "lucide-react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  fillColor: string;
  glow: string;
  angle: number;
  velocity: number;
  size: number;
  rotation: number;
}

export const CursorManager: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastClickTime = useRef(0);

  const cloverPalette = [
    {
      color: "#65a30d",
      fillColor: "#d9f99d",
      glow: "rgba(190, 242, 100, 0.34)",
    },
    {
      color: "#4d7c0f",
      fillColor: "#ecfccb",
      glow: "rgba(217, 249, 157, 0.38)",
    },
    {
      color: "#15803d",
      fillColor: "#bbf7d0",
      glow: "rgba(187, 247, 208, 0.34)",
    },
    {
      color: "#16a34a",
      fillColor: "#dcfce7",
      glow: "rgba(220, 252, 231, 0.36)",
    },
    {
      color: "#166534",
      fillColor: "#86efac",
      glow: "rgba(134, 239, 172, 0.32)",
    },
    {
      color: "#84cc16",
      fillColor: "#f7fee7",
      glow: "rgba(236, 252, 203, 0.42)",
    },
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastClickTime.current < 500) return; // 500ms debounce to prevent rendering overload
      lastClickTime.current = now;

      const clickX = e.clientX;
      const clickY = e.clientY;

      // Create burst particles
      const particleCount = 8;
      const newParticles: Particle[] = Array.from({ length: particleCount }).map(
        (_, i) => ({
          id: Date.now() + i,
          x: clickX,
          y: clickY,
          ...cloverPalette[Math.floor(Math.random() * cloverPalette.length)],
          angle: (Math.PI * 2 * i) / particleCount + Math.random() * 0.5,
          velocity: 34 + Math.random() * 52,
          size: 22 + Math.random() * 12,
          rotation: Math.random() * 360,
        }),
      );

      setParticles((prev) => [...prev, ...newParticles]);

      // Cleanup particles after animation
      setTimeout(() => {
        setParticles((prev) =>
          prev.filter((p) => !newParticles.find((np) => np.id === p.id)),
        );
      }, 1400);
    };
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999999]">
      {/* Custom Cursor: Light Green Club - Disabled to fix Naver Whale bug
            <AnimatePresence>
                {window.innerWidth > 768 && (
                    <motion.div
                        className="fixed top-0 left-0 pointer-events-none z-[10001] flex items-center justify-center"
                        animate={{
                            x: mousePos.x - 20, // Center the cursor (40px / 2 = 20)
                            y: mousePos.y - 20,
                        }}
                        transition={{ type: 'spring', damping: 40, stiffness: 800, mass: 0.3 }}
                    >
                        Club cursor preview
                    </motion.div>
                )}
            </AnimatePresence>
            */}

      {/* Click Burst Effects: Small Clovers */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: p.x - p.size / 2,
              y: p.y - p.size / 2,
              scale: 1,
              opacity: 1,
              rotate: p.rotation,
            }}
            animate={{
              x: p.x - p.size / 2 + Math.cos(p.angle) * p.velocity,
              y: p.y - p.size / 2 + Math.sin(p.angle) * p.velocity,
              scale: 0.72,
              opacity: 0,
              rotate: p.rotation + 120,
            }}
            transition={{ duration: 1.15, ease: "easeOut" }}
            className="fixed select-none"
            style={{
              width: p.size * 2.8,
              height: p.size * 2.8,
            }}
          >
            <div
              className="relative flex h-full w-full items-center justify-center"
              style={{
                filter: `drop-shadow(0 0 8px ${p.glow}) drop-shadow(0 0 18px ${p.glow})`,
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: p.size * 1.65,
                  height: p.size * 1.65,
                  background: `radial-gradient(circle, ${p.glow} 0%, rgba(217,249,157,0.22) 42%, rgba(217,249,157,0) 76%)`,
                }}
              />
              <Club
                aria-hidden
                strokeWidth={1.75}
                style={{
                  width: p.size,
                  height: p.size,
                  color: p.color,
                  fill: p.fillColor,
                  fillOpacity: 0.96,
                }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
