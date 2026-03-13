import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { BASE_URL } from '../utils/api';
import { ReturnButton } from '../components/common/ReturnButton';

// Mocked credits content
const CREDITS_SECTIONS = [
    {
        title: 'Producer',
        names: ['Yuzuha Rico', 'Rico Fans']
    },
    {
        title: 'Project Lead',
        names: ['G. Minho']
    },
    {
        title: 'Lead Developer',
        names: ['Antigravity AI']
    },
    {
        title: 'Art & Design',
        names: ['Rico Archive', 'Community Artists']
    },
    {
        title: 'Special Thanks',
        names: ['Everyone who participated', 'Rico Birthday Cafe Attendees']
    }
];

// Placeholder illustrations to cycle on PC
const ILLUSTRATION_IMAGES = [
    '/assets/illustration1.png', // Replace with actual paths if available
    '/assets/illustration2.png',
];

export default function Credits() {
    const { token } = useAuthStore();
    const [claimed, setClaimed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Swap illustration every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % ILLUSTRATION_IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const awardAchievement = async () => {
        if (!token) {
            alert("로그인이 필요합니다!");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/achievements/award/THANK_YOU_ALL`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                setClaimed(true);
            } else {
                console.error("Failed to claim achievement");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative flex flex-col">
            
            {/* Fixed header buttons */}
            <div className="absolute top-4 left-4 z-50">
                <ReturnButton 
                    gameName="엔딩 크레딧" 
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-[#166D77] text-white border-2 border-[#bef264]" 
                />
            </div>

            <div className="flex-1 flex flex-col md:flex-row h-screen">
                
                {/* Visual Pane (PC only) */}
                <div className="hidden md:flex w-1/2 h-full items-center justify-center p-10 relative bg-gray-900 border-r border-gray-800">
                    {/* Placeholder image cycling */}
                    <motion.div
                        key={currentImageIndex}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="w-full h-full bg-contain bg-center bg-no-repeat"
                        style={{
                            // Just a visual placeholder until actual assets are provided
                            backgroundImage: `linear-gradient(to bottom right, #166D77, #5EC7A5)`
                        }}
                    >
                        <div className="w-full h-full flex items-center justify-center font-bold text-4xl opacity-20">
                            Illustration {currentImageIndex + 1}
                        </div>
                    </motion.div>
                </div>

                {/* Credits Scroll Pane */}
                {/* Container masks the scroll. */}
                <div className="w-full md:w-1/2 h-full relative overflow-hidden flex justify-center">
                    
                    {/* Mobile background (dimmed) */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#166D77]/20 to-black md:hidden" />

                    <motion.div 
                        className="w-full max-w-lg px-8 relative z-10 flex flex-col items-center text-center pb-32"
                        // Animate from bottom of screen to way above screen
                        initial={{ y: '100vh' }}
                        // Approximate absolute value to ensure it scrolls all the way through (-200% handles long lists)
                        animate={{ y: '-250%' }}
                        transition={{ 
                            duration: 45, // SLOW scroll
                            ease: "linear",
                            repeat: 0 // Play once
                        }}
                    >
                        {/* Title Space */}
                        <div className="pt-32 pb-40">
                            <h1 className="text-4xl md:text-5xl font-black mb-4 text-[#bef264]">THANK YOU</h1>
                            <p className="text-[#5EC7A5] font-bold tracking-widest">FOR COMING TO RICO'S BIRTHDAY CAFE</p>
                        </div>

                        {/* Sections */}
                        {CREDITS_SECTIONS.map((section, idx) => (
                            <div key={idx} className="mb-24 w-full">
                                <h2 className="text-xl md:text-2xl font-bold text-[#5EC7A5] mb-6 tracking-wider uppercase">
                                    {section.title}
                                </h2>
                                <div className="flex flex-col gap-4">
                                    {section.names.map((name, i) => (
                                        <p key={i} className="text-lg md:text-xl font-medium text-gray-200">
                                            {name}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Final message & Achievement Button */}
                        <div className="pt-32 pb-[50vh] flex flex-col items-center">
                            <h2 className="text-3xl font-black text-white mb-10">And You</h2>
                            
                            {!claimed ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={awardAchievement}
                                    disabled={loading}
                                    className="flex items-center gap-3 px-8 py-4 rounded-full font-black text-lg shadow-[0_0_30px_rgba(94,199,165,0.4)] border-2 transition-all hover:bg-[#5EC7A5] hover:text-[#166D77]"
                                    style={{
                                        background: 'transparent',
                                        color: '#5EC7A5',
                                        borderColor: '#5EC7A5'
                                    }}
                                >
                                    <span className="text-2xl">🎬</span>
                                    {loading ? '기록 중...' : '엔딩 크레딧 시청 완료 배지 받기'}
                                </motion.button>
                            ) : (
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="px-8 py-4 rounded-full font-black text-lg bg-[#5EC7A5] text-[#166D77] flex items-center gap-2"
                                >
                                    <span className="text-xl">✨</span> 감사합니다! 배지가 지급되었습니다.
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
