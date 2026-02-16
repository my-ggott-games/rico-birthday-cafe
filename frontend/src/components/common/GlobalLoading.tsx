import React, { useState, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalLoading: React.FC = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [percent, setPercent] = useState(0);
    // Keep track of the current path to avoid double-triggering on mount if strict mode
    const [prevPath, setPrevPath] = useState<string | null>(null);

    useLayoutEffect(() => {
        // Prevent triggering on initial mount if we want only on "move"?
        // User said "move pages". Usually implies subsequent navigation.
        // But usually initial load also has a loading screen.
        // I will allow it on mount too for consistency (reload -> loading).

        if (location.pathname === prevPath) return;
        setPrevPath(location.pathname);

        setLoading(true);
        setPercent(0);

        // Random duration between 3000ms (3s) and 5000ms (5s)
        const duration = Math.floor(Math.random() * 2000) + 3000;
        const startTime = Date.now();

        // Random speed simulation:
        // We define a set of "breakpoints" or just use noise.
        // Let's use a simpler approach that guarantees 100% at end:
        // Current progress is time-based, but we add "jitter" to the displayed number.

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            const rawProgress = (elapsed / duration) * 100;

            // Add sine wave based jitter to make speed appear random
            // Frequency of 3 full waves over the duration
            const jitter = Math.sin((elapsed / duration) * Math.PI * 6) * 5;

            // Ensure we don't exceed 100 or go below 0 purely due to jitter
            // But we want to reach 100 exactly at the end.
            let displayedProgress = rawProgress + jitter;

            // Clamp
            displayedProgress = Math.max(0, Math.min(99, displayedProgress));

            setPercent(Math.floor(displayedProgress));

            if (elapsed >= duration) {
                clearInterval(interval);
                setPercent(100);
                // Allow a small moment to see 100%
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
        }, 30); // Higher frequency for smoother spring physics

        return () => clearInterval(interval);
    }, [location.pathname]);

    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFFDF7]"
                    initial={{ opacity: 1 }} // Start fully visible to hide underlying page content immediately
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                >
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'radial-gradient(#F43F5E 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center relative z-10"
                    >
                        {/* Animated Rico Icon or Spinner */}
                        <motion.div
                            animate={{
                                y: [-10, 10, -10],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="text-8xl mb-6"
                        >
                            🍰
                        </motion.div>

                        <h2 className="text-4xl md:text-5xl font-black text-[#4A3b32] mb-4 tracking-tight">
                            Loading...
                        </h2>

                        <div className="relative w-72 h-8 bg-white rounded-full border-[3px] border-[#4A3b32] overflow-hidden mb-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                            {/* Inner fill with spring animation */}
                            <motion.div
                                className="h-full bg-[#F43F5E] relative"
                                animate={{ width: `${percent}%` }}
                                transition={{
                                    type: "spring",
                                    stiffness: 60,
                                    damping: 15,
                                    mass: 0.5
                                }}
                            >
                                {/* Shimmer Effect overlay */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />

                                {/* Inner Glossy Detail */}
                                <div className="absolute top-1 left-0 right-0 h-1 bg-white/20 rounded-full mx-2" />
                            </motion.div>
                        </div>

                        <div className="text-4xl font-black text-[#F43F5E] font-handwriting drop-shadow-sm">
                            {percent}%
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalLoading;
