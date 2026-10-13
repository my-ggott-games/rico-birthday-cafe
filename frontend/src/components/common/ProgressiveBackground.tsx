import React from "react";

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

// Must match the duration-[700ms] fade on the incoming image.
const FADE_DURATION_MS = 700;

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
  const previewSrc = thumbnailSrc ?? midSrc ?? fullSrc;
  const [activeSrc, setActiveSrc] = React.useState(previewSrc);
  const [nextSrc, setNextSrc] = React.useState<string | null>(
    midSrc && midSrc !== previewSrc
      ? midSrc
      : fullSrc !== previewSrc
        ? fullSrc
        : null,
  );
  const [isNextVisible, setIsNextVisible] = React.useState(false);
  const fullLoadTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const initialNextSrc =
      midSrc && midSrc !== previewSrc
        ? midSrc
        : fullSrc !== previewSrc
          ? fullSrc
          : null;

    setActiveSrc(previewSrc);
    setNextSrc(initialNextSrc);
    setIsNextVisible(false);

    if (fullLoadTimerRef.current !== null) {
      window.clearTimeout(fullLoadTimerRef.current);
      fullLoadTimerRef.current = null;
    }
  }, [fullSrc, midSrc, previewSrc]);

  React.useEffect(() => {
    return () => {
      if (fullLoadTimerRef.current !== null) {
        window.clearTimeout(fullLoadTimerRef.current);
      }
    };
  }, []);

  const queueFullImage = React.useCallback(() => {
    if (fullSrc === activeSrc || fullSrc === nextSrc) {
      return;
    }

    if (fullResLoadDelayMs > 0) {
      fullLoadTimerRef.current = window.setTimeout(() => {
        setNextSrc(fullSrc);
        setIsNextVisible(false);
      }, fullResLoadDelayMs);
      return;
    }

    setNextSrc(fullSrc);
    setIsNextVisible(false);
  }, [activeSrc, fullResLoadDelayMs, fullSrc, nextSrc]);

  const handleNextLoad = React.useCallback(() => {
    window.requestAnimationFrame(() => {
      setIsNextVisible(true);
    });

    window.setTimeout(() => {
      setActiveSrc((currentActive) => {
        if (!nextSrc) {
          return currentActive;
        }

        const resolvedSrc = nextSrc;

        if (resolvedSrc === fullSrc) {
          onHighResVisible?.();
        }

        return resolvedSrc;
      });

      setIsNextVisible(false);

      if (nextSrc && nextSrc === midSrc && fullSrc !== nextSrc) {
        queueFullImage();
        return;
      }

      setNextSrc(null);
    }, FADE_DURATION_MS);
  }, [fullSrc, midSrc, nextSrc, onHighResVisible, queueFullImage]);

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      ].join(" ")}
    >
      <img
        src={activeSrc}
        alt={alt}
        draggable={false}
        fetchPriority={previewFetchPriority}
        decoding="async"
        className={[
          // Only the tiny thumbnail is blurred (scaled up to hide blurred
          // edges). Never dimmed: on slow lines it stays up for seconds.
          "absolute inset-0 h-full w-full",
          activeSrc === thumbnailSrc ? "scale-[1.04] blur-[10px]" : "",
          imageClassName,
        ].join(" ")}
      />

      {nextSrc ? (
        <img
          src={nextSrc}
          alt={alt}
          draggable={false}
          decoding="async"
          fetchPriority={nextSrc === fullSrc ? "low" : "high"}
          onLoad={handleNextLoad}
          style={{ willChange: "opacity, filter, transform" }}
          className={[
            "absolute inset-0 h-full w-full transition-[opacity,filter] duration-[700ms] ease-out",
            isNextVisible ? "opacity-100 blur-0" : "opacity-0 blur-[6px]",
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
