import React from "react";

type ProgressiveImageProps = {
  thumbnailSrc?: string;
  fullSrc: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  previewFetchPriority?: "high" | "low" | "auto";
  onHighResVisible?: () => void;
};

const FADE_DURATION_MS = 180;

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
  const [activeSrc, setActiveSrc] = React.useState(previewSrc);
  const [nextSrc, setNextSrc] = React.useState(
    fullSrc !== previewSrc ? fullSrc : null,
  );
  const [isNextVisible, setIsNextVisible] = React.useState(false);

  React.useEffect(() => {
    setActiveSrc(previewSrc);
    setNextSrc(fullSrc !== previewSrc ? fullSrc : null);
    setIsNextVisible(false);
  }, [fullSrc, previewSrc]);

  const handleNextLoad = React.useCallback(() => {
    window.requestAnimationFrame(() => {
      setIsNextVisible(true);
    });

    window.setTimeout(() => {
      setActiveSrc(fullSrc);
      setNextSrc(null);
      setIsNextVisible(false);
      onHighResVisible?.();
    }, FADE_DURATION_MS);
  }, [fullSrc, onHighResVisible]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={activeSrc}
        alt={alt}
        draggable={false}
        fetchPriority={previewFetchPriority}
        decoding="async"
        style={{ willChange: "opacity, filter, transform" }}
        className={[
          "absolute inset-0 h-full w-full transition-[opacity,filter,transform] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          nextSrc
            ? "scale-[1.01] opacity-20 blur-[6px] saturate-[0.98]"
            : "scale-100 opacity-100 blur-0 saturate-100",
          imageClassName,
        ].join(" ")}
      />

      {nextSrc ? (
        <img
          src={nextSrc}
          alt={alt}
          draggable={false}
          decoding="async"
          onLoad={handleNextLoad}
          style={{ willChange: "opacity, filter, transform" }}
          className={[
            "absolute inset-0 h-full w-full transition-[opacity,filter,transform] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isNextVisible
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
