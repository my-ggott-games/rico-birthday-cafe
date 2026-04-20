import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pointer } from "lucide-react";

const R = 72;
const D = 0.707;

const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
const CIRCLE_SIZE = isDesktop ? 56 : 44;
const ICON_SIZE = isDesktop ? 30 : 22;

export const HoloPointerHint = ({ active }: { active: boolean }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) setVisible(true);
    else setVisible(false);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[70] flex items-center justify-center">
      <motion.div
        animate={{
          x: [0, 0, R * D, R, R * D, 0, -R * D, -R, -R * D, 0, 0],
          y: [0, -R, -R * D, 0, R * D, R, R * D, 0, -R * D, -R, 0],
        }}
        transition={{
          duration: 5,
          ease: "linear",
          times: [0, 0.07, 0.18, 0.29, 0.40, 0.52, 0.63, 0.74, 0.85, 0.93, 1],
        }}
        onAnimationComplete={() => setVisible(false)}
        className="flex items-center justify-center rounded-full"
        style={{
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
          backgroundColor: "var(--color-pale-custard)",
          border: "2px solid #5EC7A5",
        }}
      >
        <Pointer
          size={ICON_SIZE}
          style={{ color: "#0f766e" }}
        />
      </motion.div>
    </div>
  );
};
