import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "../../store/useToastStore";

export const AchievementToast: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed right-4 top-4 z-[9999] flex max-w-[calc(100vw-2rem)] flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="relative flex w-[min(22rem,calc(100vw-2rem))] items-start gap-4 overflow-hidden rounded-2xl border-4 border-[#facc15] bg-pale-custard p-4 shadow-[0_8px_0_rgba(0,0,0,0.1)] pointer-events-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#facc15]/10 to-transparent animate-[shimmer_2s_infinite]" />

            <div className="text-4xl shrink-0 z-10">{toast.icon || "🏆"}</div>
            <div className="flex-1 min-w-0 z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#166D77]/70">
                Achievement
              </p>
              <h4 className="mt-1 text-lg font-black leading-tight text-[#166D77]">
                {toast.title}
              </h4>
              <p className="mt-1 text-sm font-medium leading-snug text-[#166D77]/75">
                {toast.description}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute right-2 top-2 z-20 text-[#166D77]/40 hover:text-[#166D77]"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
