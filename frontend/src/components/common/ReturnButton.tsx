import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ReturnButtonProps {
    className?: string;
    style?: React.CSSProperties;
    gameName?: string;
}

const MESSAGES = [
    "{Game Name}, quit now?",
    "Sorry... is it not fun?",
    "Want to try something else?",
    "Back to lobby?"
];

export const ReturnButton: React.FC<ReturnButtonProps> = ({ className, style, gameName = "게임" }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");

    const handleOpen = () => {
        const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)].replace("{Game Name}", gameName);
        setMessage(randomMsg);
        setIsOpen(true);
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpen}
                className={className}
                style={style}
            >
                ← 돌아가기
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="bg-[#FFFFF8] p-6 rounded-[2rem] shadow-2xl z-10 max-w-sm w-full border-4 border-[#D6C0B0] text-center"
                        >
                            <span className="text-4xl block mb-3">🚪</span>
                            <h3 className="text-[#166D77] font-black text-xl mb-6">
                                {message}
                            </h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => navigate('/lobby')}
                                    className="flex-1 py-3 rounded-xl font-black text-sm bg-[#ff6b6b] text-white hover:bg-[#fa5252] transition-colors"
                                >
                                    Quit
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-3 rounded-xl font-black text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                    Wait
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
