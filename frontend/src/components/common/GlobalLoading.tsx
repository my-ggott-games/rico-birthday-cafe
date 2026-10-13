import React, { useLayoutEffect, useState } from "react";
import { useLocation, matchPath } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { LOADING_MESSAGES } from "../../constants/loadingMessages";
import {
  getPreviousPathname,
  setPageTransitionLoading,
} from "../../utils/pageTransitionLoading";
import { useAuthStore } from "../../store/useAuthStore";
import {
  getAssetGroupForPath,
  getAssetGroupProgress,
  prioritizeAssetGroup,
} from "../../utils/assetPreloadQueue";

const MAX_LOADING_MS = 8000;

const GlobalLoading: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, {
    stiffness: 70,
    damping: 20,
    mass: 0.6,
  });
  const progressWidth = useTransform(smoothProgress, (value) => `${value}%`);
  const [animationType, setAnimationType] = useState<"rotate" | "zoom" | "bob">(
    "rotate",
  );
  const [message, setMessage] = useState("");
  const isGuest = useAuthStore((state) => state.isGuest);

  useLayoutEffect(() => {
    // Read from the app-level path history: this component is not mounted on
    // the landing page, so its own first mount can still be a transition.
    const prevPath = getPreviousPathname(location.pathname);

    // Skip loader for initial hard entry (direct URL / reload) to prevent
    // page -> loading -> page flicker.
    if (prevPath === null) {
      setLoading(false);
      setPageTransitionLoading(false);
      return;
    }

    const validRoutes = [
      "/lobby",
      "/game/cody",
      "/game/baseball",
      "/game/puzzle",
      "/game/adventure",
      "/game/asparagus",
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
    // Randomly choose animation type for this loading session
    const types: ("rotate" | "zoom" | "bob")[] = ["rotate", "zoom", "bob"];
    setAnimationType(types[Math.floor(Math.random() * types.length)]);

    const isLandingToLobby = prevPath === "/" && location.pathname === "/lobby";
    const nextMessage = isLandingToLobby
      ? LOADING_MESSAGES[0]
      : LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    setMessage(nextMessage);

    const groupId = getAssetGroupForPath(location.pathname);
    if (groupId) {
      prioritizeAssetGroup(groupId);
    }

    // Stay up at least this long (landing already plays an enter animation),
    // then until the page's first-screen assets arrive, capped at MAX_LOADING_MS.
    const minDuration = isLandingToLobby ? 2000 : 3000;
    const startTime = performance.now();
    let targetPercent = 0;
    let frameId = 0;
    let hideTimeoutId: number | undefined;

    progress.jump(0);
    smoothProgress.jump(0);

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const { loaded, total } = groupId
        ? getAssetGroupProgress(groupId)
        : { loaded: 0, total: 0 };
      const assetRatio = total === 0 ? 1 : loaded / total;
      const isDone =
        elapsed >= MAX_LOADING_MS || (assetRatio === 1 && elapsed >= minDuration);

      if (isDone) {
        progress.set(100);
        // Allow a small moment to see 100%
        hideTimeoutId = window.setTimeout(() => setLoading(false), 500);
        return;
      }

      // Keep creeping toward 90% so the bar never looks stuck, and jump ahead
      // as assets land; real progress is spread over the minimum duration.
      const creep = 90 * (1 - Math.exp(-elapsed / 2500));
      const real = 90 * assetRatio * Math.min(1, elapsed / minDuration);
      targetPercent = Math.max(targetPercent, creep, real);
      progress.set(targetPercent);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(hideTimeoutId);
    };
  }, [location.pathname, progress, smoothProgress]);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => setPageTransitionLoading(false)}
    >
      {loading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFFFF8] select-none"
          initial={{ opacity: 1 }} // Start fully visible to hide underlying page content immediately
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: "easeInOut" },
          }}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
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
                draggable={false}
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
                style={{ width: progressWidth }}
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
