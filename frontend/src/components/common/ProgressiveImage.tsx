import React, { useEffect, useState } from "react";

type ProgressiveImageProps = {
  thumbnailSrc: string;
  fullSrc: string;
  alt: string;
  className?: string;
  imageClassName?: string;
};

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  thumbnailSrc,
  fullSrc,
  alt,
  className = "",
  imageClassName = "",
}) => {
  const [isHighResReady, setIsHighResReady] = useState(false);
  const [isHighResVisible, setIsHighResVisible] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let frameId: number | null = null;
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
          setIsHighResVisible(true);
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
    };
  }, [fullSrc]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={thumbnailSrc}
        alt={alt}
        draggable={false}
        fetchPriority="high"
        decoding="async"
        style={{ willChange: "opacity, filter, transform" }}
        className={[
          "absolute inset-0 h-full w-full",
          "transition-[opacity,filter,transform] duration-[1400ms] ease-out",
          isHighResVisible
            ? "scale-[1.02] opacity-0 blur-sm"
            : "scale-[1.05] opacity-100 blur-xl",
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
            "transition-[opacity,filter,transform] duration-[1200ms] ease-out",
            isHighResVisible
              ? "scale-100 opacity-100 blur-0"
              : "scale-[1.02] opacity-0 blur-md",
            imageClassName,
          ].join(" ")}
        />
      ) : null}
    </div>
  );
};

export default ProgressiveImage;
