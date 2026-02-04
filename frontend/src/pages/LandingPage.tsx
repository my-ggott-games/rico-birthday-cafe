import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleEnter = () => {
        setIsOpen(true);
        setTimeout(() => {
            navigate('/lobby');
        }, 1500); // Wait for animation
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 bg-gradient-to-b from-purple-900 to-black opacity-50"
            />

            <div className="relative z-10 text-center">
                <h1 className="text-4xl md:text-6xl text-white font-bold mb-8 drop-shadow-glow">
                    Rico's Birthday Cafe
                </h1>

                <motion.div
                    onClick={handleEnter}
                    className="cursor-pointer relative group inline-block"
                    animate={isOpen ? { scale: 3, opacity: 0 } : { scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                    <img
                        src="/assets/landing_door.png"
                        alt="Door to Cafe"
                        className="w-64 md:w-80 h-auto group-hover:drop-shadow-[0_0_25px_rgba(255,255,100,0.6)] transition-all duration-300"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default LandingPage;
