import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { AuthModal } from "../components/auth/AuthModal";
import ProgressiveBackground from "../components/common/ProgressiveBackground";
import ProgressiveImage from "../components/common/ProgressiveImage";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const preventDrag = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const handleEnter = () => {
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
    }, 1500); // Wait for animation
  };

  return (
    <div
      className="relative isolate flex min-h-screen h-dvh w-full select-none flex-col items-center justify-center overflow-hidden"
      onDragStart={preventDrag}
    >
      {/* Background Layers */}
      <ProgressiveBackground
        thumbnailSrc="/assets/landing_sample_thumb.jpg"
        fullSrc="/assets/landing_sample.jpeg"
        className="z-0"
        overlayClassName="bg-black/28"
      />

      <div className="relative z-20 flex flex-col items-center px-6">
        {/* Cafe Sign */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="rounded-[2rem] border-4 border-white/70 bg-white/22 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-md">
            <ProgressiveImage
              thumbnailSrc="/landing_slogan_thumb.jpg"
              fullSrc="/landing_slogan.jpg"
              alt="유즈하 리코 생일카페 배너"
              className="aspect-[2419/907] w-[min(86vw,860px)] rounded-[1.4rem]"
              imageClassName="object-cover"
            />
          </div>
          <p className="mt-4 inline-flex rounded-full border border-white/55 bg-white/24 px-5 py-2 text-sm font-black tracking-[0.28em] text-pale-custard shadow-lg backdrop-blur-sm md:text-base">
            2026.04.13 OPEN
          </p>
        </motion.div>

        {/* Door / Entrance */}
        <motion.div
          onClick={handleEnter}
          className="cursor-pointer relative group"
          animate={isOpen ? { scale: 5, opacity: 0 } : { scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="flex h-28 w-64 items-center justify-center rounded-[1.75rem] border border-white/70 bg-white/50 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm transition-all duration-300 group-hover:bg-white/60 group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.2)] md:h-32 md:w-80">
            <span className="text-xl font-black tracking-[0.24em] text-[#166D77] md:text-2xl">
              ENTER
            </span>
          </div>
        </motion.div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={triggerEnterAnimation}
      />
    </div>
  );
};

export default LandingPage;
