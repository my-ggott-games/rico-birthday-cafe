import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal } from '../components/auth/AuthModal';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const { isAuthenticated } = useAuthStore();

    const handleEnter = () => {
        if (isAuthenticated) {
            triggerEnterAnimation();
        } else {
            setIsAuthModalOpen(true);
        }
    };

    const triggerEnterAnimation = () => {
        setIsAuthModalOpen(false);
        setIsOpen(true);
        setTimeout(() => {
            navigate('/lobby');
        }, 1500); // Wait for animation
    };

    return (
        <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center">
            {/* Background Layers */}
            <div className="absolute inset-0 bg-[#FFFDF7] z-0" />

            {/* Striped Awning Effect at top */}
            <div className="absolute top-0 w-full h-24 bg-[repeating-linear-gradient(45deg,#F43F5E,#F43F5E_20px,white_20px,white_40px)] shadow-lg z-10" />
            <div className="absolute top-24 w-full h-4 bg-white/20 z-10 rounded-b-xl" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Cafe Sign */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="mb-12 text-center"
                >
                    <div className="bg-white px-8 py-6 rounded-[2rem] border-4 border-[#F43F5E] shadow-[0_8px_0_rgba(0,0,0,0.1)]">
                        <h1 className="text-5xl md:text-7xl text-[#4A3b32] font-black tracking-tight drop-shadow-sm rotate-[-2deg]">
                            Rico's <span className="text-[#F43F5E]">Birthday</span> Cafe
                        </h1>
                        <p className="mt-2 text-xl text-[#F43F5E] font-bold tracking-widest uppercase">
                            🎉 2026.04.13 Open! 🎉
                        </p>
                    </div>
                    {/* Hanging chaos strings */}
                    <div className="absolute -top-12 left-10 w-1 h-12 bg-[#d1d5db] z-[-1]" />
                    <div className="absolute -top-12 right-10 w-1 h-12 bg-[#d1d5db] z-[-1]" />
                </motion.div>

                {/* Door / Entrance */}
                <motion.div
                    onClick={handleEnter}
                    className="cursor-pointer relative group"
                    animate={isOpen ? { scale: 5, opacity: 0 } : { scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <div className="relative bg-white p-4 rounded-t-full border-4 border-[#4A3b32] shadow-2xl">
                        {/* Glass reflection effect */}
                        <div className="absolute top-20 left-4 w-full h-full bg-gradient-to-br from-white/40 to-transparent rounded-t-full pointer-events-none z-20" />

                        <img
                            src="/assets/landing_door.png"
                            alt="Door to Cafe"
                            className="w-64 md:w-80 h-auto rounded-t-full"
                        />

                        {/* Door Handle / Open Sign */}
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 bg-[#F43F5E] text-white px-4 py-1 rounded-lg font-bold shadow-md border-2 border-white transform rotate-12"
                        >
                            OPEN
                        </motion.div>
                    </div>

                    {/* Welcome Mat */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[120%] h-8 bg-[#4A3b32] rounded-[50%] opacity-20 blur-sm scale-y-50 group-hover:scale-110 transition-transform" />
                </motion.div>

                <p className="mt-12 text-[#4A3b32]/60 font-bold animate-bounce">
                    Click the door to enter!
                </p>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSuccess={triggerEnterAnimation}
            />
        </div>
    );
};

export default LandingPage;
