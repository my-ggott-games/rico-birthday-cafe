import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Reference colors for deeper shades to extract
const colors = [
  { outer: "#B54D9D", inner: "rgba(240, 180, 225, 0.9)", vein: "#6E165A" }, // Red-purples
  { outer: "#8284D1", inner: "rgba(190, 195, 245, 0.9)", vein: "#3A3C87" }, // Blue-purples
  { outer: "#AA84E0", inner: "rgba(225, 200, 250, 0.9)", vein: "#5A368F" }, // Lavenders
];

const tintedImages: HTMLCanvasElement[] = colors.map((theme) => {
  const tCanvas = document.createElement("canvas");
  tCanvas.width = 40;
  tCanvas.height = 40;
  const tCtx = tCanvas.getContext("2d");
  if (tCtx) {
    // Outer leaf-shaped petal
    tCtx.filter = "blur(1.5px)";
    tCtx.globalAlpha = 0.2;
    tCtx.fillStyle = theme.outer;
    tCtx.beginPath();
    tCtx.moveTo(20, 37);
    tCtx.bezierCurveTo(14, 30, 13, 15, 20, 3);
    tCtx.bezierCurveTo(27, 15, 26, 30, 20, 37);
    tCtx.fill();

    // Inner vibrant leaf layer
    tCtx.globalAlpha = 1.0;
    tCtx.filter = "blur(1px)";
    tCtx.fillStyle = theme.inner;
    tCtx.beginPath();
    tCtx.moveTo(20, 33);
    tCtx.bezierCurveTo(15, 27, 15, 16, 20, 7);
    tCtx.bezierCurveTo(25, 16, 25, 27, 20, 33);
    tCtx.fill();

    // Center vein
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
    this.xSpeed = 1.0 + Math.random() * 1.5;
    this.ySpeed = 0.5 + Math.random() * 1.0;
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

interface SpringFestivalBackgroundProps {
  isFinished?: boolean;
  isFlyAway?: boolean;
  children?: React.ReactNode;
}

export const SpringFestivalBackground: React.FC<
  SpringFestivalBackgroundProps
> = ({ isFinished, isFlyAway, children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPetals, setShowPetals] = React.useState(!isFinished);

  useEffect(() => {
    if (isFinished && !isFlyAway) {
      // Wait for the slow fade-in of background/character to finish before showing petals
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

    const TOTAL = 30;
    const petalArray: Petal[] = [];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (showPetals) {
        petalArray.forEach((petal) => {
          petal.canvasWidth = canvas.width;
          petal.canvasHeight = canvas.height;
          petal.animate(ctx);
        });
      }
      animationFrameId = window.requestAnimationFrame(render);
    };

    for (let i = 0; i < TOTAL; i++) {
      petalArray.push(new Petal(canvas.width, canvas.height));
    }
    render();

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [showPetals]);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}. Yuzuha Riko`;

  if (!isFinished) {
    return (
      <div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
        ref={containerRef}
      >
        <div
          className="absolute inset-0 bg-no-repeat bg-contain bg-center opacity-60 pointer-events-none"
          style={{
            backgroundImage: "url('/assets/codygame/background_1.png')",
          }}
        />
        <motion.canvas
          ref={canvasRef}
          initial={{ opacity: 1 }}
          animate={{ opacity: showPetals ? 1 : 0 }}
          className="absolute inset-0 w-full h-full pointer-events-none z-[100]"
        />
      </div>
    );
  }

  return (
    // Flex auto-margin with scroll handles overflow gracefully on mobile devices
    <div className="absolute inset-0 z-40 overflow-y-auto overflow-x-hidden flex p-4 md:p-0">
      <motion.div
        initial={{ opacity: 1, scale: 0.9, y: 20 }}
        animate={
          isFlyAway
            ? {
                y: (Math.random() - 0.5) * 100, // Small random y wiggle
                x: window.innerWidth + 500,
                rotate: 15,
                scale: 0.8,
                opacity: 0,
              }
            : {
                scale: 1,
                y: 0,
              }
        }
        transition={{
          duration: isFlyAway ? 2.5 : 1.2, // Slower fly away
          delay: isFlyAway ? 0 : 0.5,
          ease: isFlyAway ? "easeInOut" : "easeOut",
        }}
        // 'my-20' adds generous vertical margin on mobile, 'md:my-auto' centers on PC
        className="relative p-4 pb-16 md:pb-20 max-w-full m-auto my-20 md:my-auto shrink-0"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "2px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          ref={containerRef}
          className="relative w-[300px] h-[450px] md:w-[340px] md:h-[510px] overflow-hidden"
          style={{
            backgroundColor: "#fdfdfd",
            borderRadius: "1px",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* Background Inside Frame - Manual cropping to avoid distortion in html2canvas */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 7.0, delay: 0.5, ease: [0.42, 0, 1, 1] }} // Starts very slowly, then speeds up
              src="/assets/codygame/background_1.png"
              className="w-full h-auto min-h-full absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -45%)", // Focus on middle-top scenery
                maxWidth: "none",
              }}
            />
          </div>

          {/* Fixed Wrapper: Prevents character position shifting when browser width changes */}
          <div
            className="absolute z-10 pointer-events-none"
            style={{
              width: "400px",
              height: "600px",
              left: "50%",
              bottom: "2%",
              marginLeft: "-200px",
            }}
          >
            {/* Shadow now separated from the character but fades in together */}
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 7.0, delay: 0.5, ease: [0.42, 0, 1, 1] }}
              src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%2240%22%20viewBox%3D%220%200%20100%2040%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22shadowG%22%20cx%3D%2250%25%22%20cy%3D%2250%25%22%20r%3D%2250%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22rgba(0%2C0%2C0%2C0.6)%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22rgba(0%2C0%2C0%2C0)%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cellipse%20cx%3D%2250%22%20cy%3D%2220%22%20rx%3D%2250%22%20ry%3D%2220%22%20fill%3D%22url(%23shadowG)%22%2F%3E%3C%2Fsvg%3E"
              alt="shadow"
              className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-96 h-24 object-contain mix-blend-multiply"
            />

            <motion.div
              initial={{ opacity: 0, scale: 1, x: 0, y: 45 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 45 }}
              transition={{ duration: 7.0, delay: 0.5, ease: [0.42, 0, 1, 1] }} // Starts very slowly, then speeds up
              className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto"
            >
              {children}
            </motion.div>
          </div>

          <motion.canvas
            data-html2canvas-ignore
            ref={canvasRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: showPetals ? 1 : 0 }}
            transition={{ duration: 0.8, ease: "easeIn" }} // Quick fade-in for petals
            className="absolute inset-0 w-full h-full pointer-events-none z-[100]"
            style={{ touchAction: "none" }}
          />
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <span
            className="font-marker font-bold text-[24px] md:text-[24px] tracking-wider select-none"
            style={{
              color: "#111827", // Use hex instead of Tailwind text-gray-900 to avoid oklch error
              fontFamily: "'Nanum Pen Script', 'Permanent Marker', cursive", // Hand-written marker feel
              fontWeight: 800,
              transform: "rotate(-2deg)", // Slight tilt for hand-written feel
            }}
          >
            {formattedDate}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
