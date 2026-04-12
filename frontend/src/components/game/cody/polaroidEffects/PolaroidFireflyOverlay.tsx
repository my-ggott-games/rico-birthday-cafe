import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface FireflyParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacitySpeed: number;
}

export const PolaroidFireflyOverlay: React.FC<{ isFinished?: boolean }> = ({
  isFinished,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showFireflies] = React.useState(true);

  useEffect(() => {
    if (!showFireflies) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const fireflies: FireflyParticle[] = [];
    const count = 10;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    for (let i = 0; i < count; i++) {
      fireflies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random(),
        opacitySpeed: 0.01 + Math.random() * 0.02,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fireflies.forEach((f) => {
        f.x += f.speedX;
        f.y += f.speedY;
        f.opacity += f.opacitySpeed;

        if (f.opacity > 1 || f.opacity < 0.2) f.opacitySpeed *= -1;
        if (f.x < 0 || f.x > canvas.width) f.speedX *= -1;
        if (f.y < 0 || f.y > canvas.height) f.speedY *= -1;

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          f.x,
          f.y,
          0,
          f.x,
          f.y,
          f.size * 4,
        );
        gradient.addColorStop(0, `rgba(255, 255, 245, ${f.opacity})`);
        gradient.addColorStop(1, "rgba(255, 255, 245, 0)");

        ctx.fillStyle = gradient;
        ctx.arc(f.x, f.y, f.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity * 0.8})`;
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showFireflies]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <motion.canvas
        initial={{ opacity: isFinished ? 0 : 1 }}
        animate={{ opacity: showFireflies ? 1 : 0 }}
        transition={{ duration: 2 }}
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
};
