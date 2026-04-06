import React from "react";
import { motion } from "framer-motion";

interface PolaroidFrameProps {
  isFlyAway?: boolean;
  activeBackground?: string | null;
  backgroundContent?: React.ReactNode;
  underlayContent?: React.ReactNode;
  overlayContent?: React.ReactNode;
  frameOverlayContent?: React.ReactNode;
  children?: React.ReactNode;
  characterOffset?: { x?: number; y?: number };
  polaroidRef?: React.RefObject<HTMLDivElement | null>;
  hideAnimations?: boolean;
}

export const PolaroidFrame: React.FC<PolaroidFrameProps> = ({
  isFlyAway,
  activeBackground,
  backgroundContent,
  underlayContent,
  overlayContent,
  frameOverlayContent,
  children,
  characterOffset,
  polaroidRef,
  hideAnimations,
}) => {
  const isFastReveal = !!activeBackground?.startsWith("linear-gradient");
  const revealDuration = isFastReveal ? 0 : 7.0;
  const revealDelay = isFastReveal ? 0 : 0.5;
  const effectsRevealDelayMs = (revealDelay + revealDuration) * 1000;
  const characterStageHeightClass = isFastReveal
    ? "h-[420px] md:h-[470px]"
    : "h-[600px] md:h-[640px]";
  const [showEffects, setShowEffects] = React.useState(
    hideAnimations || effectsRevealDelayMs === 0,
  );

  React.useEffect(() => {
    if (hideAnimations || effectsRevealDelayMs === 0) {
      setShowEffects(true);
      return;
    }

    setShowEffects(false);
    const timer = window.setTimeout(
      () => setShowEffects(true),
      effectsRevealDelayMs,
    );

    return () => window.clearTimeout(timer);
  }, [effectsRevealDelayMs, hideAnimations]);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}. Yuzuha Riko`;

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto overflow-x-hidden flex p-4 md:p-0">
      <motion.div
        ref={polaroidRef}
        initial={{ opacity: 0, scale: 1, y: 0 }}
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
                opacity: 1,
                scale: 1,
                y: 0,
              }
        }
        transition={{
          duration: isFlyAway ? 2.5 : 0.2, // Fast pop-in
          delay: 0,
          ease: isFlyAway ? "easeInOut" : "easeOut",
        }}
        className="relative p-4 pb-16 md:pb-20 max-w-full m-auto md:my-auto shrink-0"
        style={{
          backgroundColor: "#FFFFF8",
          borderRadius: "2px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        {!hideAnimations && showEffects && frameOverlayContent && (
          <div className="absolute inset-0 z-[120] pointer-events-none overflow-hidden">
            {frameOverlayContent}
          </div>
        )}

        <div
          className={`relative h-[300px] w-[300px] overflow-hidden md:h-[340px] md:w-[340px] ${
            activeBackground?.startsWith("bg-") ? activeBackground : ""
          }`}
          style={{
            background: activeBackground?.startsWith("linear-gradient")
              ? activeBackground
              : undefined,
            backgroundColor:
              !activeBackground || activeBackground === "spring-festival"
                ? "transparent"
                : undefined,
            borderRadius: "1px",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* Background Content */}
          <motion.div
            initial={{ opacity: hideAnimations ? 1 : isFastReveal ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: hideAnimations ? 0 : revealDuration,
              delay: hideAnimations ? 0 : revealDelay,
              ease: [0.42, 0, 1, 1],
            }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            {backgroundContent}
          </motion.div>

          {!hideAnimations && showEffects && underlayContent && (
            <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
              {underlayContent}
            </div>
          )}

          {/* Character and Shadow */}
          <div
            className="absolute bottom-[14px] left-1/2 z-10 flex w-full -translate-x-1/2 justify-center pointer-events-none"
          >
            <div
              className={`relative w-full ${characterStageHeightClass}`}
              style={{
                transform: `translate(${characterOffset?.x || 0}px, ${characterOffset?.y || 0}px)`,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 1, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{
                  duration: revealDuration,
                  delay: revealDelay,
                  ease: [0.42, 0, 1, 1],
                }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-auto"
              >
                {children}
              </motion.div>
            </div>
          </div>

          {/* This renders using the bounds of containerRef! */}
          {!hideAnimations && showEffects && (
            <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
              {overlayContent}
            </div>
          )}
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <span
            className="font-marker font-bold text-[18px] sm:text-[22px] md:text-[24px] tracking-wider select-none"
            style={{
              color: "#333333",
              fontFamily: "'OneStoreMobilePop', 'Permanent Marker', cursive",
              fontWeight: 800,
              transform: "rotate(-2deg)",
            }}
          >
            {formattedDate}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
