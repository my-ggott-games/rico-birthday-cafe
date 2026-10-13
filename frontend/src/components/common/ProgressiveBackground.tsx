import React from "react";

type ProgressiveBackgroundProps = {
  thumbnailSrc?: string;
  fullSrc: string;
  // Hold off requesting the full image, e.g. until a preload queue fetched it.
  loadFull?: boolean;
  alt?: string;
  className?: string;
  overlayClassName?: string;
  imageClassName?: string;
  previewFetchPriority?: "high" | "low" | "auto";
  showVignette?: boolean;
  onHighResVisible?: () => void;
};

const ProgressiveBackground: React.FC<ProgressiveBackgroundProps> = ({
  thumbnailSrc,
  fullSrc,
  loadFull = true,
  alt = "",
  className = "",
  overlayClassName = "bg-black/20",
  imageClassName = "object-cover",
  previewFetchPriority = "auto",
  showVignette = true,
  onHighResVisible,
}) => {
  const [isFullReady, setIsFullReady] = React.useState(!thumbnailSrc);
  const [isFullVisible, setIsFullVisible] = React.useState(!thumbnailSrc);
  const [isThumbnailRemoved, setIsThumbnailRemoved] = React.useState(
    !thumbnailSrc,
  );

  // The blurred thumbnail stays up until the full image is downloaded and
  // decoded, so the focus-in transition never shows a half-painted image.
  React.useEffect(() => {
    if (!thumbnailSrc || !loadFull) return;

    setIsFullReady(false);
    setIsFullVisible(false);
    setIsThumbnailRemoved(false);

    let isCancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.src = fullSrc;

    const markReady = () => {
      if (!isCancelled && image.naturalWidth > 0) {
        setIsFullReady(true);
      }
    };

    image.decode().then(markReady, () => {
      if (image.complete) {
        markReady();
        return;
      }
      image.onload = markReady;
    });

    return () => {
      isCancelled = true;
      image.onload = null;
    };
  }, [fullSrc, loadFull, thumbnailSrc]);

  // Mount the full image hidden first, then flip it visible on the next frame
  // so the opacity/blur transition actually runs.
  React.useEffect(() => {
    if (!isFullReady || isFullVisible) return;

    const frameId = window.requestAnimationFrame(() => {
      setIsFullVisible(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isFullReady, isFullVisible]);

  const handleFullTransitionEnd = (
    event: React.TransitionEvent<HTMLImageElement>,
  ) => {
    if (event.propertyName !== "opacity" || isThumbnailRemoved) return;

    setIsThumbnailRemoved(true);
    onHighResVisible?.();
  };

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      ].join(" ")}
    >
      {thumbnailSrc && !isThumbnailRemoved ? (
        <img
          src={thumbnailSrc}
          alt={alt}
          draggable={false}
          fetchPriority={previewFetchPriority}
          decoding="async"
          className={[
            // Scaled up so the blurred edges stay outside the frame.
            "absolute inset-0 h-full w-full scale-[1.06] blur-[12px]",
            imageClassName,
          ].join(" ")}
        />
      ) : null}

      {isFullReady ? (
        <img
          src={fullSrc}
          alt={alt}
          draggable={false}
          decoding="async"
          onTransitionEnd={handleFullTransitionEnd}
          className={[
            "absolute inset-0 h-full w-full transition-[opacity,filter,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isFullVisible
              ? "scale-100 opacity-100 blur-0"
              : "scale-[1.06] opacity-0 blur-[12px]",
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
