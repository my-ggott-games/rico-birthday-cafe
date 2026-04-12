import React, { useEffect, useState } from "react";

type ProgressiveImageProps = {
  thumbnailSrc?: string;
  fullSrc: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  previewFetchPriority?: "high" | "low" | "auto";
  onHighResVisible?: () => void;
};

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  thumbnailSrc,
  fullSrc,
  alt,
  className = "",
  imageClassName = "",
  previewFetchPriority = "auto",
  onHighResVisible,
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
              onHighResVisible?.();
            }
          }, 60);
        }
      });
    };

    const decodeAndReveal = () => {
      if (typeof image.decode === "function") {
        image.decode().catch(() => undefined).finally(revealHighRes);
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
  }, [fullSrc, onHighResVisible]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={previewSrc}
        alt={alt}
        draggable={false}
        fetchPriority={previewFetchPriority}
        decoding="async"
        style={{ willChange: "opacity, filter, transform" }}
        className={[
          "absolute inset-0 h-full w-full",
          "transition-[opacity,filter,transform] duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          isHighResVisible
            ? "scale-[1.01] opacity-20 blur-[6px] saturate-[0.98]"
            : "scale-[1.05] opacity-100 blur-[18px] saturate-[1.05]",
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
            "transition-[opacity,filter,transform] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isHighResVisible
              ? "scale-100 opacity-100 blur-0 saturate-100"
              : "scale-[1.015] opacity-0 blur-[10px] saturate-[1.03]",
            imageClassName,
          ].join(" ")}
        />
      ) : null}
    </div>
  );
};

export default ProgressiveImage;
