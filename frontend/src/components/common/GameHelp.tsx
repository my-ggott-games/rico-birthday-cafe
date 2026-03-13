import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialBanner, type TutorialSlide } from './TutorialBanner';

interface GameHelpProps {
    slides: TutorialSlide[];
    /** Extra class names for the desktop (static) banner container */
    desktopClassName?: string;
}

/**
 * Responsive help / tutorial component.
 *
 * - **Mobile (< lg)**: A "?" icon button that opens an animated modal overlay
 *   containing the TutorialBanner. Clicking the backdrop or the ✕ button closes it.
 * - **Desktop (>= lg)**: The TutorialBanner is rendered inline (static).
 *
 * Usage:
 * ```tsx
 * // In the header (renders the mobile "?" button via CommonTitle's helpSlot):
 * <CommonTitle title="Game" helpSlot={<GameHelp slides={SLIDES} />} />
 *
 * // In the desktop sidebar column:
 * <GameHelp slides={SLIDES} desktopOnly />
 * ```
 *
 * Pass `mobileOnly` or `desktopOnly` to render only one variant when the two
 * render sites are separate DOM locations (header button vs sidebar).
 */

interface GameHelpProps {
    slides: TutorialSlide[];
    desktopClassName?: string;
    /** If true, only renders the mobile toggle button (no desktop static view) */
    mobileOnly?: boolean;
    /** If true, only renders the desktop static banner (no mobile button) */
    desktopOnly?: boolean;
}

export const GameHelp: React.FC<GameHelpProps> = ({
    slides,
    desktopClassName = 'min-h-[300px] shadow-xl rounded-3xl',
    mobileOnly = false,
    desktopOnly = false,
}) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* ── Mobile toggle button ── */}
            {!desktopOnly && (
                <span className="lg:hidden">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setOpen(true)}
                        className="w-8 h-8 rounded-full font-black text-base flex items-center justify-center border-2 select-none"
                        style={{
                            background: '#166D77',
                            color: '#bef264',
                            borderColor: '#bef264',
                            boxShadow: '0 2px 8px rgba(22,109,119,0.25)',
                        }}
                        aria-label="튜토리얼 열기"
                    >
                        ?
                    </motion.button>

                    {/* Modal overlay */}
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                className="fixed inset-0 z-50 flex items-center justify-center p-6"
                                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setOpen(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                    className="w-full max-w-sm"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Close button */}
                                    <div className="flex justify-end mb-2">
                                        <button
                                            onClick={() => setOpen(false)}
                                            className="w-9 h-9 rounded-full font-black text-xl flex items-center justify-center"
                                            style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFF8' }}
                                            aria-label="닫기"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <TutorialBanner
                                        slides={slides}
                                        className="min-h-[300px] shadow-2xl rounded-3xl"
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </span>
            )}

            {/* ── Desktop static banner ── */}
            {!mobileOnly && (
                <div className="hidden lg:flex flex-col items-center justify-center w-full h-full">
                    <div className="w-full max-w-[400px]">
                        <TutorialBanner slides={slides} className={desktopClassName} />
                    </div>
                </div>
            )}
        </>
    );
};
