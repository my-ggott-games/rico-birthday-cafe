import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { AuthModal } from "../components/auth/AuthModal";
import ProgressiveBackground from "../components/common/ProgressiveBackground";
import ProgressiveImage from "../components/common/ProgressiveImage";

const LANDING_IMAGE_ASPECT = "aspect-[3847/2885]";
const MOBILE_SLOGAN_FRAME_CLASS =
  "absolute left-1/2 top-[10%] w-[30%] -translate-x-1/2";
const MOBILE_DOOR_FRAME_CLASS =
  "pointer-events-auto absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 cursor-pointer";
const DESKTOP_SLOGAN_FRAME_CLASS =
  "absolute left-1/2 top-[11%] w-[30%] -translate-x-1/2";
const DESKTOP_LANDING_FRAME_CLASS = `${LANDING_IMAGE_ASPECT} relative w-[max(100vw,calc(100dvh*3847/2885))]`;
const DESKTOP_DOOR_FRAME_CLASS =
  "absolute left-1/2 top-[56.3%] -translate-x-1/2 -translate-y-1/2";
const ENTER_ANIMATION_DURATION_MS = 1850;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => window.innerWidth < 768,
  );
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);
  const [isMobileFrameReady, setIsMobileFrameReady] = useState(false);
  const [isSloganReady, setIsSloganReady] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const preventDrag = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const isEnterButtonReady = isMobileViewport
    ? isBackgroundReady && isMobileFrameReady && isSloganReady
    : isBackgroundReady && isSloganReady;

  const handleEnter = () => {
    if (isOpen) {
      return;
    }

    if (isAuthenticated) {
      triggerEnterAnimation();
      return;
    }

    setIsAuthModalOpen(true);
  };

  const triggerEnterAnimation = () => {
    setIsAuthModalOpen(false);
    setIsOpen(true);
    setTimeout(() => {
      navigate("/lobby");
    }, ENTER_ANIMATION_DURATION_MS);
  };

  return (
    <div
      className="relative isolate flex min-h-screen h-dvh w-full select-none flex-col items-center justify-center overflow-hidden"
      onDragStart={preventDrag}
    >
      <motion.div
        initial={false}
        animate={
          isOpen
            ? { scale: 1.24, opacity: 0.98, filter: "brightness(1.04)" }
            : { scale: 1, opacity: 1, filter: "brightness(1)" }
        }
        transition={{
          duration: ENTER_ANIMATION_DURATION_MS / 1000,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute inset-0"
        style={{
          transformOrigin: "center center",
          willChange: "transform, opacity, filter",
        }}
      >
        {/* Background Layers */}
        <ProgressiveBackground
          thumbnailSrc="/landing-thumb.jpg"
          fullSrc="/landing.jpg"
          previewFetchPriority="high"
          className="z-0"
          overlayClassName="bg-transparent"
          imageClassName="object-cover object-center md:object-top"
          showVignette={false}
          onHighResVisible={() => setIsBackgroundReady(true)}
        />

        <div className="pointer-events-none absolute inset-0 z-10 bg-[#05080c] md:hidden">
          <div className="absolute left-1/2 top-1/2 h-full aspect-[3847/2885] -translate-x-1/2 -translate-y-1/2 scale-[0.75]">
            <ProgressiveImage
              thumbnailSrc="/landing-thumb.jpg"
              fullSrc="/landing.jpg"
              previewFetchPriority="low"
              alt=""
              className="h-full w-full"
              imageClassName="object-cover object-center"
              onHighResVisible={() => setIsMobileFrameReady(true)}
            />

            <motion.div
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.35 }}
              className={`${MOBILE_SLOGAN_FRAME_CLASS} z-20 text-center`}
            >
              <ProgressiveImage
                thumbnailSrc="/slogan/landing-thumb.jpg"
                fullSrc="/slogan/landing.jpg"
                previewFetchPriority="low"
                alt="유즈하 리코 생일카페 배너"
                className="mx-auto aspect-[2419/907] w-full overflow-hidden rounded-[0.8rem] shadow-[0_10px_24px_rgba(0,0,0,0.26)]"
                imageClassName="object-cover"
                onHighResVisible={() => setIsSloganReady(true)}
              />
              <p className="mt-3 inline-flex rounded-full border border-white/55 bg-white/24 px-4 py-2 text-xs font-black tracking-[0.24em] text-pale-custard shadow-lg backdrop-blur-sm">
                2026.04.13 OPEN
              </p>
            </motion.div>

            {!isOpen && isEnterButtonReady && (
              <motion.div
                onClick={handleEnter}
                className={MOBILE_DOOR_FRAME_CLASS}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <motion.div
                  className="flex h-32 w-32 items-center justify-center rounded-[1.75rem] border border-white/55 bg-[rgba(255,255,255,0.5)] shadow-[0_12px_30px_rgba(0,0,0,0.16)]"
                  whileHover={{
                    backgroundColor: "rgba(255,255,255,0.5)",
                    boxShadow: "0 16px 36px rgba(0,0,0,0.2)",
                  }}
                  whileTap={{
                    backgroundColor: "rgba(255,255,255,0.5)",
                    boxShadow: "0 16px 36px rgba(0,0,0,0.2)",
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <span
                    data-content="하이용사!"
                    className="landing-enter-text-stroke rounded-full px-3 py-2 text-xl font-black tracking-normal text-[#166D77]"
                  >
                    하이용사!
                  </span>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden -translate-x-1/2 md:block">
          <div className={DESKTOP_LANDING_FRAME_CLASS}>
            <motion.div
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.35 }}
              className={`${DESKTOP_SLOGAN_FRAME_CLASS} text-center`}
            >
              <ProgressiveImage
                thumbnailSrc="/slogan/landing-thumb.jpg"
                fullSrc="/slogan/landing.jpg"
                previewFetchPriority="low"
                alt="유즈하 리코 생일카페 배너"
                className="mx-auto aspect-[2419/907] w-full overflow-hidden rounded-[0.9rem] shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
                imageClassName="object-cover"
                onHighResVisible={() => setIsSloganReady(true)}
              />
              <p className="mt-3 inline-flex rounded-full border border-white/55 bg-white/24 px-5 py-2 text-sm font-black tracking-[0.28em] text-pale-custard shadow-lg backdrop-blur-sm">
                2026.04.13 OPEN
              </p>
            </motion.div>
          </div>
        </div>

        <div className="absolute left-1/2 top-0 hidden -translate-x-1/2 md:block">
          <div className={DESKTOP_LANDING_FRAME_CLASS}>
            {!isOpen && isEnterButtonReady && (
              <motion.div
                onClick={handleEnter}
                className={`${DESKTOP_DOOR_FRAME_CLASS} cursor-pointer`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <motion.div
                  className="flex h-56 w-56 items-center justify-center rounded-[2.6rem] border border-white/55 bg-transparent shadow-[0_12px_30px_rgba(0,0,0,0.16)]"
                  whileHover={{
                    backgroundColor: "rgba(255,255,255,0.5)",
                    boxShadow: "0 16px 36px rgba(0,0,0,0.2)",
                  }}
                  whileTap={{
                    backgroundColor: "rgba(255,255,255,0.5)",
                    boxShadow: "0 16px 36px rgba(0,0,0,0.2)",
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <span
                    data-content="하이용사!"
                    className="landing-enter-text-stroke rounded-full px-4 py-2 text-[2.6rem] font-black tracking-[0.08em] text-[#166D77]"
                  >
                    하이용사!
                  </span>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_20%,rgba(0,0,0,0.1)_42%,rgba(0,0,0,0.68)_100%)]"
          initial={false}
          animate={isOpen ? { opacity: 1 } : { opacity: 0 }}
          transition={{
            duration: ENTER_ANIMATION_DURATION_MS / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </motion.div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={triggerEnterAnimation}
      />
    </div>
  );
};

export default LandingPage;
