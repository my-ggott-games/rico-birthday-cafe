import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';

export const AchievementToast: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        className="bg-pale-custard pointer-events-auto rounded-2xl border-4 border-[#facc15] shadow-[0_8px_0_rgba(0,0,0,0.1)] p-4 flex items-center gap-4 w-80 relative overflow-hidden"
                    >
                        {/* Sparkle effect bg */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#facc15]/10 to-transparent animate-[shimmer_2s_infinite]" />

                        <div className="text-4xl shrink-0 z-10">
                            {toast.icon || '🏆'}
                        </div>
                        <div className="flex-1 min-w-0 z-10">
                            <h4 className="text-[#166D77] font-black text-sm truncate">Achievement Unlocked!</h4>
                            <p className="text-[#5EC7A5] font-bold text-lg truncate leading-tight">{toast.title}</p>
                            <p className="text-[#166D77]/70 text-xs font-medium truncate mt-0.5">{toast.description}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="absolute top-2 right-2 text-[#166D77]/40 hover:text-[#166D77] z-20"
                        >
                            ✕
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
