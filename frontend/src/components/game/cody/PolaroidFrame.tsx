import React from "react";
import { motion } from "framer-motion";
import { Clover, Heart, Music, Sparkles, Star } from "lucide-react";

type SignatureIconKey = "Heart" | "Sparkles" | "Clover" | "Star" | "Music";

const SIGNATURE_ICONS: Array<{
  key: SignatureIconKey;
  color: string;
  Icon: React.ComponentType<{
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    className?: string;
  }>;
}> = [
  {
    key: "Heart",
    color: "#E85D75",
    Icon: Heart,
  },
  {
    key: "Sparkles",
    color: "#F2B84B",
    Icon: Sparkles,
  },
  {
    key: "Clover",
    color: "#53A66F",
    Icon: Clover,
  },
  {
    key: "Star",
    color: "#5C8DF6",
    Icon: Star,
  },
  {
    key: "Music",
    color: "#8A63D2",
    Icon: Music,
  },
];

interface PolaroidFrameProps {
  isFlyAway?: boolean;
  activeBackground?: string | null;
  backgroundContent?: React.ReactNode;
  underlayContent?: React.ReactNode;
  overlayContent?: React.ReactNode;
  frameOverlayContent?: React.ReactNode;
  children?: React.ReactNode;
  characterOffset?: { x?: number; y?: number };
  characterStageClassName?: string;
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
  characterStageClassName,
  polaroidRef,
  hideAnimations,
}) => {
  const isFastReveal = !!activeBackground?.startsWith("linear-gradient");
  const revealDuration = isFastReveal ? 0 : 7.0;
  const revealDelay = isFastReveal ? 0 : 0.5;
  const resolvedCharacterStageClassName =
    characterStageClassName ||
    (isFastReveal ? "h-[420px] md:h-[470px]" : "h-[600px] md:h-[640px]");
  const [showEffects, setShowEffects] = React.useState(
    hideAnimations || revealDuration === 0,
  );
  const signatureIcon = React.useMemo(
    () => SIGNATURE_ICONS[Math.floor(Math.random() * SIGNATURE_ICONS.length)],
    [],
  );
  const SignatureIconComponent = signatureIcon.Icon;

  React.useEffect(() => {
    if (hideAnimations || revealDuration === 0) {
      setShowEffects(true);
      return;
    }

    setShowEffects(false);
  }, [activeBackground, hideAnimations, revealDuration]);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}. photo by 치코`;

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto overflow-x-hidden flex p-2 md:p-0">
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
            onAnimationComplete={() => {
              if (!hideAnimations) {
                setShowEffects(true);
              }
            }}
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
          <div className="absolute bottom-[14px] left-1/2 z-10 flex w-full -translate-x-1/2 justify-center pointer-events-none">
            <div
              className={`relative w-full ${resolvedCharacterStageClassName}`}
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
            className="inline-flex items-center font-marker font-bold text-[18px] sm:text-[22px] md:text-[20px] tracking-wider select-none"
            style={{
              color: "#333333",
              fontFamily: "'OneStoreMobilePop', system-ui, sans-serif",
              fontWeight: 600,
              transform: "rotate(-2deg)",
            }}
          >
            <span>{formattedDate}</span>
            <span
              className="inline-flex shrink-0"
              style={{
                filter: `drop-shadow(0 1px 1px ${signatureIcon.color}33)`,
              }}
            >
              <SignatureIconComponent
                size={18}
                strokeWidth={1.9}
                color={signatureIcon.color}
                className="shrink-0"
              />
            </span>
          </span>
        </div>
      </motion.div>
    </div>
  );
};
