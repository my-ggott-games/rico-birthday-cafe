import React, { useEffect, useState } from "react";

type ProgressiveBackgroundProps = {
  thumbnailSrc?: string;
  midSrc?: string;
  fullSrc: string;
  alt?: string;
  className?: string;
  overlayClassName?: string;
  imageClassName?: string;
  previewFetchPriority?: "high" | "low" | "auto";
  showVignette?: boolean;
  fullResLoadDelayMs?: number;
  onHighResVisible?: () => void;
};

const ProgressiveBackground: React.FC<ProgressiveBackgroundProps> = ({
  thumbnailSrc,
  midSrc,
  fullSrc,
  alt = "",
  className = "",
  overlayClassName = "bg-black/20",
  imageClassName = "object-cover",
  previewFetchPriority = "auto",
  showVignette = true,
  fullResLoadDelayMs = 0,
  onHighResVisible,
}) => {
  const previewSrc = thumbnailSrc ?? fullSrc;
  const [isMidReady, setIsMidReady] = useState(false);
  const [isMidVisible, setIsMidVisible] = useState(false);
  const [isHighResReady, setIsHighResReady] = useState(false);
  const [isHighResVisible, setIsHighResVisible] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let midFrameId: number | null = null;
    let midRevealTimerId: number | null = null;
    let fullFrameId: number | null = null;
    let fullRevealTimerId: number | null = null;
    let loadTimerId: number | null = null;
    const midImage = new Image();
    const fullImage = new Image();

    setIsMidReady(false);
    setIsMidVisible(false);
    setIsHighResReady(false);
    setIsHighResVisible(false);

    const revealMidRes = () => {
      if (isCancelled) {
        return;
      }

      setIsMidReady(true);
      midFrameId = window.requestAnimationFrame(() => {
        if (!isCancelled) {
          midRevealTimerId = window.setTimeout(() => {
            if (!isCancelled) {
              setIsMidVisible(true);
            }
          }, 80);
        }
      });
    };

    const revealHighRes = () => {
      if (isCancelled) {
        return;
      }

      setIsHighResReady(true);
      fullFrameId = window.requestAnimationFrame(() => {
        if (!isCancelled) {
          fullRevealTimerId = window.setTimeout(() => {
            if (!isCancelled) {
              setIsHighResVisible(true);
              onHighResVisible?.();
            }
          }, 80);
        }
      });
    };

    const decodeMidAndReveal = () => {
      if (typeof midImage.decode === "function") {
        midImage
          .decode()
          .catch(() => undefined)
          .finally(revealMidRes);
        return;
      }

      revealMidRes();
    };

    const decodeFullAndReveal = () => {
      if (typeof fullImage.decode === "function") {
        fullImage
          .decode()
          .catch(() => undefined)
          .finally(revealHighRes);
        return;
      }

      revealHighRes();
    };

    const startFullLoading = () => {
      if (isCancelled) {
        return;
      }

      fullImage.src = fullSrc;

      if (fullImage.complete) {
        decodeFullAndReveal();
      } else {
        fullImage.onload = decodeFullAndReveal;
      }
    };

    const queueFullLoading = () => {
      if (fullResLoadDelayMs > 0) {
        loadTimerId = window.setTimeout(startFullLoading, fullResLoadDelayMs);
        return;
      }

      startFullLoading();
    };

    if (!midSrc || midSrc === fullSrc) {
      setIsMidReady(true);
      setIsMidVisible(true);
      queueFullLoading();
      return () => {
        isCancelled = true;
        fullImage.onload = null;

        if (fullFrameId !== null) {
          window.cancelAnimationFrame(fullFrameId);
        }

        if (fullRevealTimerId !== null) {
          window.clearTimeout(fullRevealTimerId);
        }

        if (loadTimerId !== null) {
          window.clearTimeout(loadTimerId);
        }
      };
    }

    midImage.src = midSrc;

    const handleMidLoaded = () => {
      decodeMidAndReveal();
      queueFullLoading();
    };

    if (midImage.complete) {
      handleMidLoaded();
    } else {
      midImage.onload = handleMidLoaded;
    }

    return () => {
      isCancelled = true;
      midImage.onload = null;
      fullImage.onload = null;

      if (midFrameId !== null) {
        window.cancelAnimationFrame(midFrameId);
      }

      if (midRevealTimerId !== null) {
        window.clearTimeout(midRevealTimerId);
      }

      if (fullFrameId !== null) {
        window.cancelAnimationFrame(fullFrameId);
      }

      if (fullRevealTimerId !== null) {
        window.clearTimeout(fullRevealTimerId);
      }

      if (loadTimerId !== null) {
        window.clearTimeout(loadTimerId);
      }
    };
  }, [fullResLoadDelayMs, fullSrc, midSrc, onHighResVisible]);

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      ].join(" ")}
    >
      <img
        src={previewSrc}
        alt={alt}
        draggable={false}
        fetchPriority={previewFetchPriority}
        decoding="async"
        style={{ willChange: "opacity, filter, transform" }}
        className={[
          "absolute inset-0 h-full w-full",
          "transition-[opacity,filter,transform] duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          isMidVisible
            ? "scale-100 opacity-25 blur-[10px] saturate-[0.96] brightness-[0.96] md:scale-[1.03]"
            : "scale-[1.04] opacity-100 blur-[22px] saturate-[1.08] brightness-[1.04] md:scale-[1.12]",
          imageClassName,
        ].join(" ")}
      />

      {isMidReady && midSrc ? (
        <img
          src={midSrc}
          alt={alt}
          draggable={false}
          decoding="async"
          style={{ willChange: "opacity, filter, transform" }}
          className={[
            "absolute inset-0 h-full w-full",
            "transition-[opacity,filter,transform] duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isHighResVisible
              ? "scale-100 opacity-35 blur-[8px] saturate-[0.98] brightness-[0.98]"
              : isMidVisible
                ? "scale-100 opacity-100 blur-0 saturate-100 brightness-100"
                : "scale-[1.02] opacity-0 blur-[10px] saturate-[1.04] brightness-[1.03]",
            imageClassName,
          ].join(" ")}
        />
      ) : null}

      {isHighResReady ? (
        <img
          src={fullSrc}
          alt={alt}
          draggable={false}
          decoding="async"
          style={{ willChange: "opacity, filter, transform" }}
          className={[
            "absolute inset-0 h-full w-full",
            "transition-[opacity,filter,transform] duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isHighResVisible
              ? "scale-100 opacity-100 blur-0 saturate-100 brightness-100"
              : "scale-[1.01] opacity-0 blur-[12px] saturate-[1.04] brightness-[1.03] md:scale-[1.025]",
            imageClassName,
          ].join(" ")}
        />
      ) : null}

      <div className={`absolute inset-0 ${overlayClassName}`} />
      {showVignette ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(0,0,0,0.18)_100%)]" />
      ) : null}
    </div>
  );
};

export default ProgressiveBackground;
