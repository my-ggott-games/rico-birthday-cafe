import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Reference colors for deeper shades to extract
const colors = [
  { outer: "#FF9A76", inner: "rgba(255, 209, 179, 0.9)", vein: "#D46A6A" }, // Warm Peach
  { outer: "#FF8E8E", inner: "rgba(255, 196, 196, 0.9)", vein: "#A54B4B" }, // Soft Pink
  { outer: "#FFA08D", inner: "rgba(255, 224, 215, 0.9)", vein: "#CC7A7A" }, // Light Coral
];

const tintedImages: HTMLCanvasElement[] = colors.map((theme) => {
  const tCanvas = document.createElement("canvas");
  tCanvas.width = 40;
  tCanvas.height = 40;
  const tCtx = tCanvas.getContext("2d");
  if (tCtx) {
    tCtx.filter = "blur(1.5px)";
    tCtx.globalAlpha = 0.2;
    tCtx.fillStyle = theme.outer;
    tCtx.beginPath();
    tCtx.moveTo(20, 35);
    tCtx.bezierCurveTo(10, 30, 10, 10, 20, 5);
    tCtx.bezierCurveTo(30, 10, 30, 30, 20, 35);
    tCtx.fill();

    tCtx.globalAlpha = 1.0;
    tCtx.filter = "blur(1px)";
    tCtx.fillStyle = theme.inner;
    tCtx.beginPath();
    tCtx.moveTo(20, 32);
    tCtx.bezierCurveTo(13, 27, 13, 13, 20, 8);
    tCtx.bezierCurveTo(27, 13, 27, 27, 20, 32);
    tCtx.fill();

    tCtx.filter = "blur(1.5px)";
    tCtx.globalAlpha = 0.4;
    const veinGrad = tCtx.createLinearGradient(20, 10, 20, 30);
    veinGrad.addColorStop(0, "rgba(255,255,255,0)");
    veinGrad.addColorStop(0.5, theme.vein);
    veinGrad.addColorStop(1, "rgba(255,255,255,0)");
    tCtx.strokeStyle = veinGrad;
    tCtx.lineWidth = 0.8;
    tCtx.beginPath();
    tCtx.moveTo(20, 30);
    tCtx.lineTo(20, 10);
    tCtx.stroke();
  }
  return tCanvas;
});

class Petal {
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
    this.img = tintedImages[Math.floor(Math.random() * tintedImages.length)];
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.y > this.canvasHeight + 50 || this.x > this.canvasWidth + 50) {
      this.x = -50;
      this.y =
        Math.random() * this.canvasHeight * 1.5 - this.canvasHeight * 0.5;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotZ);
    ctx.globalAlpha = this.opacity;
    if (this.img) {
      ctx.drawImage(this.img, -this.w / 2, -this.h / 2, this.w, this.h);
    }
    ctx.restore();
  }

  animate(ctx: CanvasRenderingContext2D) {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    this.rotZ += this.rotZSpeed;
    this.draw(ctx);
  }
}

// Global cached random BG so it doesn't change on re-renders, but since we are exporting separate components,
// we just let them accept bgImage or generate it internally if they don't care. We'll generate once here.
const AVAILABLE_BGS = [
  "1-1",
  "1-2",
  "1-3",
  "2-1",
  "2-2",
  "2-3",
  "3-1",
  "3-2",
  "3-3",
  "4-1",
  "4-2",
  "4-3",
];
const randomBgId =
  AVAILABLE_BGS[Math.floor(Math.random() * AVAILABLE_BGS.length)];
const cachedRandomBg = `/assets/codygame/background_${randomBgId}.jpg`;

export const SpringFestivalBackground: React.FC<{ isFinished?: boolean }> = ({
  isFinished,
}) => {
  if (!isFinished) {
    return (
      <div
        className="absolute inset-0 bg-no-repeat bg-contain bg-center opacity-60 pointer-events-none"
        style={{ backgroundImage: `url('${cachedRandomBg}')` }}
      />
    );
  }

  return (
    <motion.img
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 7.0, delay: 0.5, ease: [0.42, 0, 1, 1] }}
      src={cachedRandomBg}
      className="w-full h-auto min-h-full absolute"
      style={{
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -45%)",
        maxWidth: "none",
      }}
    />
  );
};

export const SpringFestivalPetals: React.FC<{
  isFinished?: boolean;
  isFlyAway?: boolean;
}> = ({ isFinished, isFlyAway }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPetals, setShowPetals] = useState(!isFinished);

  useEffect(() => {
    if (isFinished && !isFlyAway) {
      const timer = setTimeout(() => setShowPetals(true), 7500);
      return () => clearTimeout(timer);
    } else if (!isFinished) {
      if (!showPetals) setShowPetals(true);
    } else if (isFlyAway) {
      if (showPetals) setShowPetals(false);
    }
  }, [isFinished, isFlyAway, showPetals]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    const TOTAL = 15;
    const petalArray: Petal[] = [];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (showPetals) {
        petalArray.forEach((petal) => {
          petal.canvasWidth = canvas.width;
          petal.canvasHeight = canvas.height;
          petal.animate(ctx);
        });
        animationFrameId = window.requestAnimationFrame(render);
      }
    };

    for (let i = 0; i < TOTAL; i++) {
      petalArray.push(new Petal(canvas.width, canvas.height));
    }

    if (showPetals) {
      render();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      className="absolute inset-0 w-full h-full pointer-events-none z-[100]"
    >
      <motion.canvas
        data-html2canvas-ignore
        ref={canvasRef}
        initial={{ opacity: isFinished ? 0 : 1 }}
        animate={{ opacity: showPetals ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ touchAction: "none" }}
      />
    </div>
  );
};
