import React, { useEffect, useState } from "react";

type ProgressiveBackgroundProps = {
  thumbnailSrc: string;
  fullSrc: string;
  alt?: string;
  className?: string;
  overlayClassName?: string;
};

const ProgressiveBackground: React.FC<ProgressiveBackgroundProps> = ({
  thumbnailSrc,
  fullSrc,
  alt = "",
  className = "",
  overlayClassName = "bg-black/20",
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
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      ].join(" ")}
    >
      <img
        src={thumbnailSrc}
        alt={alt}
        draggable={false}
        fetchPriority="high"
        decoding="async"
        style={{ willChange: "opacity, filter, transform" }}
        className={[
          "absolute inset-0 h-full w-full object-cover",
          "transition-[opacity,filter,transform] duration-[1600ms] ease-out",
          isHighResVisible
            ? "scale-105 opacity-0 blur-sm"
            : "scale-110 opacity-100 blur-2xl",
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
            "absolute inset-0 h-full w-full object-cover",
            "transition-[opacity,filter,transform] duration-[1400ms] ease-out",
            isHighResVisible
              ? "scale-100 opacity-100 blur-0"
              : "scale-105 opacity-0 blur-lg",
          ].join(" ")}
        />
      ) : null}

      <div className={`absolute inset-0 ${overlayClassName}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(0,0,0,0.18)_100%)]" />
    </div>
  );
};

export default ProgressiveBackground;
