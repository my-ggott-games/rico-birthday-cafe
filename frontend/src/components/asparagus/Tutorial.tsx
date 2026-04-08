import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TutorialBanner } from "../common/TutorialBanner";
import { ASPARAGUS_TUTORIAL_SLIDES } from "../../constants/tutorialSlides";

export const TutorialModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger: "?" icon button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full font-black text-base flex items-center justify-center border-2 select-none"
        style={{
          background: "#166D77",
          color: "#FFFFF8",
          borderColor: "#FFFFF8",
          boxShadow: "0 2px 8px rgba(22,109,119,0.25)",
        }}
        aria-label="튜토리얼 열기"
      >
        ?
      </motion.button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-full font-black text-xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    color: "#FFFFF8",
                  }}
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <TutorialBanner
                slides={ASPARAGUS_TUTORIAL_SLIDES}
                className="min-h-[300px] shadow-2xl rounded-3xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/** Inline tutorial (used on desktop sidebar) */
export const Tutorial: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="w-full max-w-[400px]">
        <TutorialBanner
          slides={ASPARAGUS_TUTORIAL_SLIDES}
          className="min-h-[300px] shadow-xl rounded-3xl"
        />
      </div>
    </div>
  );
};
