import { useCallback, useState } from "react";

const REDUCED_MOTION_STORAGE_KEY = "lobby_chiko_reduced_motion";

const readInitialReducedMotion = () => {
  try {
    const stored = window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY);
    if (stored !== null) {
      return stored === "true";
    }
  } catch {
    // Storage can be unavailable in private mode.
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const useChikoReducedMotion = () => {
  const [isReducedMotion, setIsReducedMotion] = useState(
    readInitialReducedMotion,
  );

  const toggleReducedMotion = useCallback(() => {
    setIsReducedMotion((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, String(next));
      } catch {
        // Storage can be unavailable in private mode.
      }
      return next;
    });
  }, []);

  return { isReducedMotion, toggleReducedMotion };
};
