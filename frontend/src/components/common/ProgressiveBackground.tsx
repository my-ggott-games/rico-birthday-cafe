import React, { useEffect, useState } from "react";

type ProgressiveBackgroundProps = {
  thumbnailSrc?: string;
  fullSrc: string;
  alt?: string;
  className?: string;
  overlayClassName?: string;
  imageClassName?: string;
};

const ProgressiveBackground: React.FC<ProgressiveBackgroundProps> = ({
  thumbnailSrc,
  fullSrc,
  alt = "",
  className = "",
  overlayClassName = "bg-black/20",
  imageClassName = "object-cover",
}) => {
  const previewSrc = thumbnailSrc ?? fullSrc;
  const [isHighResReady, setIsHighResReady] = useState(false);
  const [isHighResVisible, setIsHighResVisible] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let frameId: number | null = null;
    let revealTimerId: number | null = null;
    const image = new Image();

    setIsHighResReady(false);
    setIsHighResVisible(false);

    const revealHighRes = () => {
      if (isCancelled) {
        return;
      }

      setIsHighResReady(true);
      frameId = window.requestAnimationFrame(() => {
        if (!isCancelled) {
          revealTimerId = window.setTimeout(() => {
            if (!isCancelled) {
              setIsHighResVisible(true);
            }
          }, 80);
        }
      });
    };

    const decodeAndReveal = () => {
      if (typeof image.decode === "function") {
        image
          .decode()
          .catch(() => undefined)
          .finally(revealHighRes);
        return;
      }

      revealHighRes();
    };

    image.src = fullSrc;

    if (image.complete) {
      decodeAndReveal();
    } else {
      image.onload = decodeAndReveal;
    }

    return () => {
      isCancelled = true;
      image.onload = null;

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      if (revealTimerId !== null) {
        window.clearTimeout(revealTimerId);
      }
    };
  }, [fullSrc]);

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
        fetchPriority="high"
        decoding="async"
        style={{ willChange: "opacity, filter, transform" }}
        className={[
          "absolute inset-0 h-full w-full",
          "transition-[opacity,filter,transform] duration-[2200ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          isHighResVisible
            ? "scale-100 opacity-25 blur-[10px] saturate-[0.96] brightness-[0.96] md:scale-[1.03]"
            : "scale-[1.04] opacity-100 blur-[22px] saturate-[1.08] brightness-[1.04] md:scale-[1.12]",
          imageClassName,
        ].join(" ")}
      />

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(0,0,0,0.18)_100%)]" />
    </div>
  );
};

export default ProgressiveBackground;
