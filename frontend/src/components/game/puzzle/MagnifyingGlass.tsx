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

const LENS_SIZE = 200; // Even larger for PC
const MOBILE_LENS_SIZE = 140; 
const LENS_OFFSET_Y = 30; 
const MOBILE_OFFSET_X = 60; 
const LENS_ZOOM = 2.1; // Higher zoom for clearer detail

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

  const isMobile =
    typeof window !== "undefined" && window.innerWidth <= 1023;
  const lensSize = isMobile ? MOBILE_LENS_SIZE : LENS_SIZE;

  let leftPos: number;
  let topPos: number;

  if (isMobile) {
    // Dynamic horizontal positioning: Side swap based on screen half
    const isPointerOnRight = pointerX > boardWidth / 2;
    if (isPointerOnRight) {
      // Finger is on right -> Glass moves to the left of the finger
      leftPos = pointerX - lensSize - MOBILE_OFFSET_X;
    } else {
      // Finger is on left -> Glass moves to the right of the finger
      leftPos = pointerX + MOBILE_OFFSET_X;
    }
    // Vertical centering for "just left/right" behavior
    topPos = pointerY - lensSize / 2;
  } else {
    // PC: Centered above cursor
    leftPos = pointerX - lensSize / 2;
    topPos = pointerY - lensSize - LENS_OFFSET_Y;
  }

  // Clamping to ensure it never exits the photo bounds
  const left = clamp(leftPos, 0, boardWidth - lensSize);
  const top = clamp(topPos, 0, boardHeight - lensSize);

  const backgroundX = -(pointerX * LENS_ZOOM) + lensSize / 2;
  const backgroundY = -(pointerY * LENS_ZOOM) + lensSize / 2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="pointer-events-none absolute z-[80] overflow-hidden rounded-full border-4 border-[#fff7eb]"
      style={{
        left,
        top,
        width: lensSize,
        height: lensSize,
        boxShadow:
          "0 26px 36px rgba(14, 24, 28, 0.45), 0 8px 18px rgba(14, 24, 28, 0.25), inset 0 1px 0 rgba(255,255,255,0.4)",
        backgroundImage: `url(${imageUrl})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${boardWidth * LENS_ZOOM}px ${boardHeight * LENS_ZOOM}px`,
        backgroundPosition: `${backgroundX}px ${backgroundY}px`,
      }}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full border border-white/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.15)]" />
    </motion.div>
  );
};
