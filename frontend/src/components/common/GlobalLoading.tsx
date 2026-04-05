import React, { useState, useLayoutEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LOADING_MESSAGES } from "../../constants/loadingMessages";
import { setPageTransitionLoading } from "../../utils/pageTransitionLoading";
import { useAuthStore } from "../../store/useAuthStore";

const GlobalLoading: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [animationType, setAnimationType] = useState<"rotate" | "zoom" | "bob">(
    "rotate",
  );
  const [message, setMessage] = useState("");
  const isGuest = useAuthStore((state) => state.isGuest);
  // Keep track of the current path to avoid double-triggering on mount if strict mode
  const [prevPath, setPrevPath] = useState<string | null>(null);

  useLayoutEffect(() => {
    // Prevent triggering on initial mount if we want only on "move"?
    // User said "move pages". Usually implies subsequent navigation.
    // But usually initial load also has a loading screen.
    // I will allow it on mount too for consistency (reload -> loading).

    if (location.pathname === prevPath) return;
    setPrevPath(location.pathname);

    const validRoutes = [
      "/lobby",
      "/game/cody",
      "/game/itabag",
      "/game/baseball",
      "/game/puzzle",
      "/game/adventure",
      "/game/fortune",
      "/game/asparagus",
      "/credits",
    ];

    const isValidRoute = validRoutes.some((route) =>
      matchPath(route, location.pathname),
    );

    if (!isValidRoute) {
      setLoading(false);
      setPageTransitionLoading(false);
      return;
    }

    setLoading(true);
    setPageTransitionLoading(true);
    setPercent(0);
    // Randomly choose animation type for this loading session
    const types: ("rotate" | "zoom" | "bob")[] = ["rotate", "zoom", "bob"];
    setAnimationType(types[Math.floor(Math.random() * types.length)]);

    const isLandingToLobby = prevPath === "/" && location.pathname === "/lobby";
    const nextMessage = isLandingToLobby
      ? LOADING_MESSAGES[0]
      : LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    setMessage(nextMessage);

    // Random duration between 3000ms (3s) and 5000ms (5s)
    const duration = Math.floor(Math.random() * 2000) + 3000;
    const startTime = Date.now();

    // Random speed simulation:
    // We define a set of "breakpoints" or just use noise.
    // Let's use a simpler approach that guarantees 100% at end:
    // Current progress is time-based, but we add "jitter" to the displayed number.

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const rawProgress = (elapsed / duration) * 100;

      // Add sine wave based jitter to make speed appear random
      // Frequency of 3 full waves over the duration
      const jitter = Math.sin((elapsed / duration) * Math.PI * 6) * 5;

      // Ensure we don't exceed 100 or go below 0 purely due to jitter
      // But we want to reach 100 exactly at the end.
      let displayedProgress = rawProgress + jitter;

      // Clamp
      displayedProgress = Math.max(0, Math.min(99, displayedProgress));

      setPercent(Math.floor(displayedProgress));

      if (elapsed >= duration) {
        clearInterval(interval);
        setPercent(100);
        // Allow a small moment to see 100%
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    }, 30); // Higher frequency for smoother spring physics

    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => setPageTransitionLoading(false)}
    >
      {loading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFFFF8]"
          initial={{ opacity: 1 }} // Start fully visible to hide underlying page content immediately
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: "easeInOut" },
          }}
        >
          {/* Background decoration */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#5EC7A5 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center relative z-10"
          >
            {/* Animated Rico Icon or Spinner */}
            <motion.div
              animate={
                animationType === "rotate"
                  ? {
                      y: [-10, 10, -10],
                      rotate: [0, 90, 180, 270, 360],
                    }
                  : animationType === "zoom"
                    ? {
                        scale: [0.9, 1.1, 0.9],
                        y: [-5, 5, -5],
                      }
                    : {
                        y: [-15, 15, -15],
                        rotate: [0, 5, -5, 0],
                      }
              }
              transition={{
                duration:
                  animationType === "rotate"
                    ? 4
                    : animationType === "zoom"
                      ? 2
                      : 1.5,
                repeat: Infinity,
                ease: animationType === "rotate" ? "linear" : "easeInOut",
              }}
              className="mb-8 rounded-full border-2 border-[#166D77] bg-pale-custard p-3 shadow-lg"
            >
              <img
                src="/app/favicon.png"
                alt="Loading"
                className="w-20 h-20 object-contain"
              />
            </motion.div>

            <h2 className="text-xl md:text-2xl font-bold text-[#166D77] mb-6 tracking-tight text-center px-4">
              {message}
            </h2>
            {isGuest && (
              <p className="mb-4 rounded-full border border-[#166D77]/20 bg-[#166D77]/6 px-4 py-2 text-center text-sm font-bold text-[#166D77]">
                게스트 모드 입니다. 기록을 저장할 수 없어요.
              </p>
            )}

            <div className="relative w-72 h-8 bg-pale-custard rounded-full border-[3px] border-[#166D77] overflow-hidden mb-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
              {/* Inner fill with spring animation */}
              <motion.div
                className="h-full bg-[#5EC7A5] relative"
                animate={{ width: `${percent}%` }}
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 15,
                  mass: 0.5,
                }}
              >
                {/* Shimmer Effect overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Inner Glossy Detail */}
                <div className="absolute top-1 left-0 right-0 h-1 bg-pale-custard/20 rounded-full mx-2" />
              </motion.div>
            </div>

            {/* Percentage removed as per user request */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoading;
