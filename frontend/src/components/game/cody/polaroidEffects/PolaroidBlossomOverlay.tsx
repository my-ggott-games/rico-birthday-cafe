import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const blossomThemes = [
  { outer: "#FF9A76", inner: "rgba(255, 209, 179, 0.9)", vein: "#D46A6A" },
  { outer: "#FF8E8E", inner: "rgba(255, 196, 196, 0.9)", vein: "#A54B4B" },
  { outer: "#FFA08D", inner: "rgba(255, 224, 215, 0.9)", vein: "#CC7A7A" },
];

const tintedPetalImages: HTMLCanvasElement[] = blossomThemes.map((theme) => {
  const canvas = document.createElement("canvas");
  canvas.width = 40;
  canvas.height = 40;
  const context = canvas.getContext("2d");

  if (context) {
    context.filter = "blur(1.5px)";
    context.globalAlpha = 0.2;
    context.fillStyle = theme.outer;
    context.beginPath();
    context.moveTo(20, 35);
    context.bezierCurveTo(10, 30, 10, 10, 20, 5);
    context.bezierCurveTo(30, 10, 30, 30, 20, 35);
    context.fill();

    context.globalAlpha = 1;
    context.filter = "blur(1px)";
    context.fillStyle = theme.inner;
    context.beginPath();
    context.moveTo(20, 32);
    context.bezierCurveTo(13, 27, 13, 13, 20, 8);
    context.bezierCurveTo(27, 13, 27, 27, 20, 32);
    context.fill();

    context.filter = "blur(1.5px)";
    context.globalAlpha = 0.4;
    const veinGradient = context.createLinearGradient(20, 10, 20, 30);
    veinGradient.addColorStop(0, "rgba(255,255,255,0)");
    veinGradient.addColorStop(0.5, theme.vein);
    veinGradient.addColorStop(1, "rgba(255,255,255,0)");
    context.strokeStyle = veinGradient;
    context.lineWidth = 0.8;
    context.beginPath();
    context.moveTo(20, 30);
    context.lineTo(20, 10);
    context.stroke();
  }

  return canvas;
});

class BlossomPetal {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  xSpeed: number;
  ySpeed: number;
  rotZ: number;
  rotZSpeed: number;
  img: HTMLCanvasElement;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight * 2 - canvasHeight;
    this.w = 25 + Math.random() * 15;
    this.h = 18 + Math.random() * 10;
    this.opacity = 0.7 + Math.random() * 0.3;
    this.xSpeed = 0.4 + Math.random() * 0.6;
    this.ySpeed = 0.2 + Math.random() * 0.4;
    this.rotZ = Math.random() * Math.PI * 2;
    this.rotZSpeed = (Math.random() - 0.5) * 0.02;
    this.img =
      tintedPetalImages[Math.floor(Math.random() * tintedPetalImages.length)];
  }

  draw(context: CanvasRenderingContext2D) {
    if (this.y > this.canvasHeight + 50 || this.x > this.canvasWidth + 50) {
      this.x = -50;
      this.y =
        Math.random() * this.canvasHeight * 1.5 - this.canvasHeight * 0.5;
    }

    context.save();
    context.translate(this.x, this.y);
    context.rotate(this.rotZ);
    context.globalAlpha = this.opacity;

    if (this.img) {
      context.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
    }

    context.restore();
  }

  animate(context: CanvasRenderingContext2D) {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    this.rotZ += this.rotZSpeed;
    this.draw(context);
  }
}

export const PolaroidBlossomOverlay: React.FC<{
  isFinished?: boolean;
  isFlyAway?: boolean;
}> = ({ isFlyAway }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPetals, setShowPetals] = useState(!isFlyAway);

  useEffect(() => {
    setShowPetals(!isFlyAway);
  }, [isFlyAway]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    let animationFrameId: number;
    const petals: BlossomPetal[] = [];

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    for (let index = 0; index < 15; index += 1) {
      petals.push(new BlossomPetal(canvas.width, canvas.height));
    }

    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (showPetals) {
        petals.forEach((petal) => {
          petal.canvasWidth = canvas.width;
          petal.canvasHeight = canvas.height;
          petal.animate(context);
        });

        animationFrameId = window.requestAnimationFrame(render);
      }
    };

    if (showPetals) {
      render();
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showPetals]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[100] w-full h-full pointer-events-none"
    >
      <motion.canvas
        data-html2canvas-ignore
        ref={canvasRef}
        initial={{ opacity: isFlyAway ? 0 : 1 }}
        animate={{ opacity: showPetals ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ touchAction: "none" }}
      />
    </div>
  );
};
