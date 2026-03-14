import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TutorialBanner, type TutorialSlide } from "./TutorialBanner";

interface GameHelpProps {
  slides: TutorialSlide[];
  buttonClassName?: string;
}

export const GameHelp: React.FC<GameHelpProps> = ({
  slides,
  buttonClassName = "",
}) => {
  const [open, setOpen] = useState(false);

  if (!slides.length) {
    return null;
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className={`w-8 h-8 rounded-full font-black text-base flex items-center justify-center border-2 select-none ${buttonClassName}`}
        style={{
          background: "#166D77",
          color: "#bef264",
          borderColor: "#bef264",
          boxShadow: "0 2px 8px rgba(22,109,119,0.25)",
        }}
        aria-label="튜토리얼 열기"
      >
        ?
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
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
              initial={{ scale: 0.92, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
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
                slides={slides}
                className="h-[228px] shadow-2xl rounded-3xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
