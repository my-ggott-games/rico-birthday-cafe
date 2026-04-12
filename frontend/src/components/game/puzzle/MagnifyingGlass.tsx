import { motion } from "framer-motion";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type MagnifyingGlassProps = {
  visible: boolean;
  imageUrl: string;
  boardWidth: number;
  boardHeight: number;
  pointerX: number;
  pointerY: number;
};

const LENS_SIZE = 180;
const MOBILE_LENS_SIZE = 132;
const LENS_OFFSET_X = 28;
const LENS_OFFSET_Y = 30;
const LENS_ZOOM = 2.1;

export const MagnifyingGlass = ({
  visible,
  imageUrl,
  boardWidth,
  boardHeight,
  pointerX,
  pointerY,
}: MagnifyingGlassProps) => {
  if (!visible) {
    return null;
  }

  const isMobile = boardWidth <= 600;
  const lensSize = isMobile ? MOBILE_LENS_SIZE : LENS_SIZE;

  const left = clamp(
    pointerX + LENS_OFFSET_X,
    12,
    Math.max(12, boardWidth - lensSize - 12),
  );
  const top = clamp(
    pointerY - lensSize - LENS_OFFSET_Y,
    12,
    Math.max(12, boardHeight - lensSize - 12),
  );
  const backgroundX = -(pointerX * LENS_ZOOM) + lensSize / 2;
  const backgroundY = -(pointerY * LENS_ZOOM) + lensSize / 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="pointer-events-none absolute z-[8] overflow-hidden rounded-full border-4 border-[#fff7eb]"
      style={{
        left,
        top,
        width: lensSize,
        height: lensSize,
        boxShadow:
          "0 26px 36px rgba(14, 24, 28, 0.34), 0 8px 18px rgba(14, 24, 28, 0.18), inset 0 1px 0 rgba(255,255,255,0.38)",
        backgroundImage: `url(${imageUrl})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${boardWidth * LENS_ZOOM}px ${boardHeight * LENS_ZOOM}px`,
        backgroundPosition: `${backgroundX}px ${backgroundY}px`,
      }}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full border border-white/40" />
    </motion.div>
  );
};
