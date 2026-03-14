import React, { useState } from "react";
import { motion } from "framer-motion";

export const OrientalBackground: React.FC = () => {
  // Select background_3 or background_4 randomly on mount
  const [bgImage] = useState(
    () => `/assets/codygame/background_${Math.random() > 0.5 ? "3" : "4"}.jpg`,
  );

  return (
    <>
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 7.0, delay: 0.5, ease: [0.42, 0, 1, 1] }}
        src={bgImage}
        className="w-full h-auto min-h-full absolute"
        style={{
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -20%)",
          maxWidth: "none",
        }}
      />
    </>
  );
};
