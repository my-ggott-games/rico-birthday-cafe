import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProgressiveBackground from "../components/common/ProgressiveBackground";
import { pushEvent } from "../utils/analytics";

const LANDING_IMAGE_ASPECT = "aspect-[3847/2885]";
const MOBILE_DOOR_FRAME_CLASS =
  "pointer-events-auto absolute left-1/2 top-[60%] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center";
const LANDING_FRAME_CLASS = `${LANDING_IMAGE_ASPECT} absolute left-1/2 top-1/2 h-full -translate-x-1/2 -translate-y-1/2 scale-[0.75] md:top-1/2 md:h-auto md:w-[max(100vw,calc(100dvh*3847/2885))] md:-translate-y-1/2 md:scale-100`;
const DESKTOP_DOOR_FRAME_CLASS =
  "absolute left-1/2 top-[60%] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center";
const ENTER_ANIMATION_DURATION_MS = 1850;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    pushEvent("view_home");
  }, []);

  useEffect(() => {
    let timeoutId: number;
    const prefetch = () => { import("./Lobby"); };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(prefetch, { timeout: 4000 });
    } else {
      timeoutId = window.setTimeout(prefetch, 3000);
    }

    return () => { window.clearTimeout(timeoutId); };
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
      <div
        className="absolute inset-0"
        style={{
          transformOrigin: "center center",
          willChange: isOpen ? "transform, opacity, filter" : "auto",
          transition: `transform ${ENTER_ANIMATION_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${ENTER_ANIMATION_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${ENTER_ANIMATION_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          transform: isOpen ? "scale(1.24)" : "scale(1)",
          opacity: isOpen ? 0.98 : 1,
          filter: isOpen ? "brightness(1.04)" : "brightness(1)",
        }}
      >
        <div className="absolute inset-0 z-0 bg-[#05080c]">
          <div className={LANDING_FRAME_CLASS}>
            <ProgressiveBackground
              thumbnailSrc="/pages/landing/background-thumb.jpg"
              midSrc="/pages/landing/background-mid.webp"
              fullSrc="/pages/landing/background-full.webp"
              previewFetchPriority="high"
              className="z-0"
              overlayClassName="bg-transparent"
              imageClassName="object-cover object-center"
              showVignette={false}
              fullResLoadDelayMs={320}
            />

            {!isOpen && (
              <button
                type="button"
                onClick={handleEnter}
                className={`${MOBILE_DOOR_FRAME_CLASS} transition-transform duration-200 ease-out hover:scale-105 active:scale-105 md:hidden`}
              >
                <span className="landing-door-pulse flex h-32 w-32 items-center justify-center rounded-[1.75rem] border border-white/55 bg-[rgba(255,255,255,0.5)] shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-[background-color,box-shadow] duration-200 ease-out hover:bg-[rgba(255,255,255,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.2)] active:bg-[rgba(255,255,255,0.5)] active:shadow-[0_16px_36px_rgba(0,0,0,0.2)]">
                  <span
                    data-content="하이용사!"
                    className="landing-enter-text-stroke rounded-full px-3 py-2 text-xl font-black tracking-normal text-[#166D77]"
                  >
                    하이용사!
                  </span>
                </span>
              </button>
            )}

            {!isOpen && (
              <button
                type="button"
                onClick={handleEnter}
                className={`${DESKTOP_DOOR_FRAME_CLASS} hidden transition-transform duration-200 ease-out hover:scale-105 active:scale-105 md:flex`}
              >
                <span className="landing-door-pulse flex h-56 w-56 items-center justify-center rounded-[2.6rem] border border-white/55 bg-transparent shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-[background-color,box-shadow] duration-200 ease-out hover:bg-[rgba(255,255,255,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.2)] active:bg-[rgba(255,255,255,0.5)] active:shadow-[0_16px_36px_rgba(0,0,0,0.2)]">
                  <span
                    data-content="하이용사!"
                    className="landing-enter-text-stroke rounded-full px-4 py-2 text-[2.6rem] font-black tracking-[0.08em] text-[#166D77]"
                  >
                    하이용사!
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_20%,rgba(0,0,0,0.1)_42%,rgba(0,0,0,0.68)_100%)]"
          style={{
            opacity: isOpen ? 1 : 0,
            transition: `opacity ${ENTER_ANIMATION_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        />
      </div>
    </div>
  );
};

export default LandingPage;
