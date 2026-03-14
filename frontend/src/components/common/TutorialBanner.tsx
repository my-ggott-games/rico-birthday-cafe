import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Direction = "up" | "down" | "left" | "right";

export interface TutorialSlide {
  title: string;
  lines: string[];
  showArrows?: boolean;
  highlight?: {
    a: string;
    b: string;
    result: string;
  } | null;
}

interface TutorialBannerProps {
  slides: TutorialSlide[];
  className?: string; // e.g. "h-[185px]"
}

export const TutorialBanner: React.FC<TutorialBannerProps> = ({
  slides,
  className = "h-[172px]",
}) => {
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const total = slides?.length ?? 0;
  const isLast = slide === total - 1;

  // Guard against empty or undefined slides to avoid runtime errors.
  if (!total) {
    return null;
  }

  const s = slides[Math.min(slide, total - 1)];

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setSlide((prev) => {
      const next = prev + newDirection;
      if (next < 0) return 0;
      if (next > total - 1) return total - 1;
      return next;
    });
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? "100%" : "-100%",
        opacity: 0,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? "100%" : "-100%",
        opacity: 0,
      };
    },
  };

  return (
    <div
      className={`w-full max-w-[min(400px,100vw)] mx-auto flex items-center justify-center overflow-x-hidden relative ${className}`}
    >
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <motion.div
          key={slide}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 350, damping: 35 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0 w-full h-full rounded-[24px] px-4 pt-3 pb-3 flex flex-col shadow-[0_8px_24px_rgba(74,59,50,0.2)] bg-[#166D77] text-pale-custard"
        >
          <div className="font-black text-lg md:text-xl mb-1 text-center leading-snug">
            {s.title}
          </div>

          <div className="flex-1 flex flex-col justify-center items-center gap-2 text-center">
            <div className="flex flex-col gap-0.5 w-full">
              {s.lines.map((line, i) => (
                <p
                  key={i}
                  className="text-sm md:text-base leading-snug font-medium"
                  style={{ color: "rgba(255,255,255,0.95)" }}
                >
                  {line}
                </p>
              ))}
            </div>

            {s.showArrows && (
              <div className="flex gap-2 mt-1 justify-center">
                {(["left", "up", "down", "right"] as Direction[]).map((d) => {
                  const icons: Record<Direction, string> = {
                    left: "←",
                    up: "↑",
                    down: "↓",
                    right: "→",
                  };
                  return (
                    <div
                      key={d}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-bold text-lg md:text-xl shadow-md"
                      style={{ background: "#1a1a1a", color: "#FFFFF8" }}
                    >
                      {icons[d]}
                    </div>
                  );
                })}
              </div>
            )}

            {s.highlight && (
              <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
                <span
                  className="px-3 py-1.5 rounded-xl font-bold text-sm md:text-base shadow-sm"
                  style={{ background: "#b7e4c7", color: "#1b4332" }}
                >
                  {s.highlight.a}
                </span>
                <span className="font-bold text-sm md:text-base text-pale-custard">
                  +
                </span>
                <span
                  className="px-3 py-1.5 rounded-xl font-bold text-sm md:text-base shadow-sm"
                  style={{ background: "#b7e4c7", color: "#1b4332" }}
                >
                  {s.highlight.b}
                </span>
                <span className="font-bold text-sm md:text-base text-pale-custard">
                  →
                </span>
                <span
                  className="px-3 py-1.5 rounded-xl font-bold text-sm md:text-base shadow-sm"
                  style={{ background: "#95d5b2", color: "#1b4332" }}
                >
                  {s.highlight.result}
                </span>
              </div>
            )}
          </div>

          {/* Pagination area at the bottom */}
          <div className="flex gap-2 items-center mt-auto pt-1.5">
            {/* Progress dots */}
            <div className="flex gap-1.5 flex-1 px-1">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === slide ? 16 : 6,
                    background:
                      i === slide ? "#bef264" : "rgba(255,255,255,0.3)",
                  }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => paginate(-1)}
                disabled={slide === 0}
                className="px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-30 disabled:scale-100"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#FFFFF8",
                }}
              >
                이전
              </button>
              <button
                onClick={() => paginate(1)}
                disabled={isLast}
                className="px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-30 disabled:scale-100"
                style={{ background: "#bef264", color: "#1b4332" }}
              >
                다음
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
