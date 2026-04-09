import React from "react";
import { motion } from "framer-motion";

const AVAILABLE_BACKGROUNDS = [
  "1-1",
  "1-2",
  "1-3",
  "2-1",
  "2-2",
  "2-3",
  "3-1",
  "3-2",
  "3-3",
  "4-1",
  "4-2",
  "4-3",
];

const randomBackgroundId =
  AVAILABLE_BACKGROUNDS[
    Math.floor(Math.random() * AVAILABLE_BACKGROUNDS.length)
  ];
const cachedRandomBackground = `/assets/codygame/background_${randomBackgroundId}.jpg`;

export const PolaroidSpringBackdrop: React.FC<{ isFinished?: boolean }> = ({
  isFinished,
}) => {
  if (!isFinished) {
    return (
      <div
        className="absolute inset-0 bg-center bg-contain bg-no-repeat opacity-60 pointer-events-none"
        style={{ backgroundImage: `url('${cachedRandomBackground}')` }}
      />
    );
  }

  return (
    <motion.img
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 7, delay: 0.5, ease: [0.42, 0, 1, 1] }}
      src={cachedRandomBackground}
      className="absolute min-h-full w-full h-auto"
      style={{
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -45%)",
        maxWidth: "none",
      }}
    />
  );
};
