import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppIcon } from "./AppIcon";
import type { AppIconName } from "./appIconRegistry";
import { PushableButton } from "./PushableButton";

export type Direction = "up" | "down" | "left" | "right";

export interface TutorialSlide {
  title: string;
  titleIcon?: AppIconName;
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
  onClose?: () => void;
}

export const TutorialBanner: React.FC<TutorialBannerProps> = ({
  slides,
  className = "h-[172px]",
  onClose,
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
      className={`relative mx-auto flex w-full max-w-full items-center justify-center overflow-x-hidden ${className}`}
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
          className="absolute inset-0 w-full h-full rounded-[24px] border-2 px-4 pt-3 pb-3 flex flex-col shadow-[0_8px_24px_rgba(22,109,119,0.18)] bg-[#FFFFF8] text-[#166D77]"
          style={{ borderColor: "#5EC7A5" }}
        >
          <div className="mb-1 flex items-center justify-center gap-2 text-center font-black text-lg leading-snug md:text-xl">
            {s.titleIcon && (
              <AppIcon
                name={s.titleIcon}
                size={22}
                className="shrink-0"
                style={{ color: "#5EC7A5" }}
              />
            )}
            <span>{s.title}</span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center gap-2 text-center">
            <div className="flex flex-col gap-0.5 w-full">
              {s.lines.map((line, i) => (
                <p
                  key={i}
                  className="text-sm md:text-base leading-snug font-medium"
                  style={{ color: "rgba(22,109,119,0.9)" }}
                >
                  {line}
                </p>
              ))}
            </div>

            {s.showArrows && (
              <div className="mt-2 flex w-full items-center justify-center gap-2 md:gap-3">
                {(["left", "up", "down", "right"] as Direction[]).map((d) => {
                  const icons: Record<Direction, AppIconName> = {
                    left: "ArrowBigLeft",
                    up: "ArrowBigUp",
                    down: "ArrowBigDown",
                    right: "ArrowBigRight",
                  };
                  return (
                    <PushableButton
                      key={d}
                      className="h-[60px] w-[60px] px-0 py-0 md:h-[72px] md:w-[72px]"
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      <AppIcon
                        name={icons[d]}
                        size={40}
                        strokeWidth={2.4}
                        style={{ color: "#FFFFF8" }}
                      />
                    </PushableButton>
                  );
                })}
              </div>
            )}

            {s.highlight && (
              <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
                <span
                  className="px-3 py-1.5 rounded-xl font-bold text-sm md:text-base shadow-sm"
                  style={{ background: "#D9F6EA", color: "#166D77" }}
                >
                  {s.highlight.a}
                </span>
                <span className="font-bold text-sm md:text-base text-[#166D77]">
                  +
                </span>
                <span
                  className="px-3 py-1.5 rounded-xl font-bold text-sm md:text-base shadow-sm"
                  style={{ background: "#D9F6EA", color: "#166D77" }}
                >
                  {s.highlight.b}
                </span>
                <span className="font-bold text-sm md:text-base text-[#166D77]">
                  →
                </span>
                <span
                  className="px-3 py-1.5 rounded-xl font-bold text-sm md:text-base shadow-sm"
                  style={{ background: "#5EC7A5", color: "#FFFFF8" }}
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
                      i === slide ? "#166D77" : "rgba(22,109,119,0.24)",
                  }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => paginate(-1)}
                disabled={slide === 0}
                className="px-3 py-1.5 rounded-xl border-2 font-bold text-xs transition-all active:scale-95 disabled:opacity-30 disabled:scale-100"
                style={{
                  background: "rgba(22,109,119,0.12)",
                  color: "#166D77",
                  borderColor: "#3f9e80",
                }}
              >
                이전
              </button>
              <button
                onClick={() => {
                  if (isLast) {
                    onClose?.();
                    return;
                  }
                  paginate(1);
                }}
                className="px-3 py-1.5 rounded-xl border-2 font-black text-xs transition-all active:scale-95 disabled:opacity-30 disabled:scale-100"
                style={{
                  background: "#5EC7A5",
                  color: "#FFFFF8",
                  borderColor: "#3f9e80",
                }}
              >
                {isLast ? "닫기" : "다음"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
