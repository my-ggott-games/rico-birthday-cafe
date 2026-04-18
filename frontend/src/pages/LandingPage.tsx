import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ProgressiveBackground from "../components/common/ProgressiveBackground";
import ProgressiveImage from "../components/common/ProgressiveImage";
import { pushEvent } from "../utils/analytics";

const LANDING_IMAGE_ASPECT = "aspect-[3847/2885]";
const MOBILE_DOOR_FRAME_CLASS =
  "pointer-events-auto absolute left-1/2 top-[60%] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center";
const DESKTOP_LANDING_FRAME_CLASS = `${LANDING_IMAGE_ASPECT} relative w-[max(100vw,calc(100dvh*3847/2885))]`;
const DESKTOP_DOOR_FRAME_CLASS =
  "absolute left-1/2 top-[45%] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center";
const ENTER_ANIMATION_DURATION_MS = 1850;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    pushEvent("view_home");
  }, []);

  const preventDrag = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const handleEnter = () => {
    if (isOpen) {
      return;
    }

    pushEvent("click_enter_site");
    pushEvent("click_cta_main");
    triggerEnterAnimation();
  };

  const triggerEnterAnimation = () => {
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
          thumbnailSrc="/pages/landing/background-thumb.jpg"
          fullSrc="/pages/landing/background.jpg"
          previewFetchPriority="high"
          className="z-0"
          overlayClassName="bg-transparent"
          imageClassName="object-cover object-center"
          showVignette={false}

        />

        <div className="pointer-events-none absolute inset-0 z-10 bg-[#05080c] md:hidden">
          <div className="absolute left-1/2 top-1/2 h-full aspect-[3847/2885] -translate-x-1/2 -translate-y-1/2 scale-[0.75]">
            <ProgressiveImage
              thumbnailSrc="/pages/landing/background-thumb.jpg"
              fullSrc="/pages/landing/background.jpg"
              previewFetchPriority="low"
              alt=""
              className="h-full w-full"
              imageClassName="object-cover object-center"

            />

            {!isOpen && (
              <motion.div
                onClick={handleEnter}
                className={MOBILE_DOOR_FRAME_CLASS}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <motion.div
                  className="landing-door-pulse flex h-32 w-32 items-center justify-center rounded-[1.75rem] border border-white/55 bg-[rgba(255,255,255,0.5)] shadow-[0_12px_30px_rgba(0,0,0,0.16)]"
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

        <div className="absolute left-1/2 top-0 hidden -translate-x-1/2 md:block">
          <div className={DESKTOP_LANDING_FRAME_CLASS}>
            {!isOpen && (
              <motion.div
                onClick={handleEnter}
                className={`${DESKTOP_DOOR_FRAME_CLASS} cursor-pointer`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <motion.div
                  className="landing-door-pulse flex h-56 w-56 items-center justify-center rounded-[2.6rem] border border-white/55 bg-transparent shadow-[0_12px_30px_rgba(0,0,0,0.16)]"
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

    </div>
  );
};

export default LandingPage;
