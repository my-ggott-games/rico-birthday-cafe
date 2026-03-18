import { AnimatePresence, motion } from "framer-motion";

type ZoomInBoxProps = {
  isOpen: boolean;
  imageUrl: string;
  title?: string;
  onClose: () => void;
};

export const ZoomInBox = ({
  isOpen,
  imageUrl,
  title = "Birthday Banquet",
  onClose,
}: ZoomInBoxProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-[rgba(24,18,10,0.76)] p-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-[#11110f]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-black text-[#fffff8] backdrop-blur-sm transition-colors hover:bg-black/55"
          >
            닫기
          </button>
          <div className="border-b border-white/10 px-6 py-4 text-[#fffff8]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f2d4a0]">
              Zoom View
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
          </div>
          <div className="relative bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_48%),linear-gradient(180deg,#1b1710_0%,#0b0b09_100%)] p-4 sm:p-6">
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[78vh] w-full rounded-[1.35rem] object-contain"
            />
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
