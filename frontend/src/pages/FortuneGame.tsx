import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommonTitle } from '../components/common/CommonTitle';
import { ReturnButton } from '../components/common/ReturnButton';
import { GameHelp } from '../components/common/GameHelp';
import { useAuthStore } from '../store/useAuthStore';
import { BASE_URL } from '../utils/api';
import { useToastStore } from '../store/useToastStore';

// ---------------------------------------------------------
// Types & Data
// ---------------------------------------------------------

type FortuneResult = {
    rank: string;
    message: string;
    bgColor: string;
    textColor: string;
    isGreatLuck: boolean;
};

const FORTUNE_DATA: FortuneResult[] = [
    { rank: "대길 (Great Luck)", message: "오늘 하루는 리코짱 파워로 완벽할 거야! ✨", bgColor: "bg-gradient-to-br from-yellow-300 to-yellow-500", textColor: "text-yellow-900", isGreatLuck: true },
    { rank: "길 (Good Luck)", message: "소소한 행운이 찾아올지도? 기분 좋은 하루! 🌸", bgColor: "bg-gradient-to-br from-pink-300 to-pink-500", textColor: "text-pink-900", isGreatLuck: false },
    { rank: "중길 (Fair Luck)", message: "평범한 게 제일 좋은 법! 무난한 하루가 될 거야. 🌿", bgColor: "bg-gradient-to-br from-green-300 to-green-500", textColor: "text-green-900", isGreatLuck: false },
    { rank: "소길 (Small Luck)", message: "작은 미소가 지어지는 일이 생길지도? 😊", bgColor: "bg-gradient-to-br from-blue-300 to-blue-500", textColor: "text-blue-900", isGreatLuck: false },
    { rank: "흉 (Bad Luck)", message: "조금 아쉬운 하루? 하지만 리코가 응원할게! 파이팅! 💪", bgColor: "bg-gradient-to-br from-purple-300 to-purple-500", textColor: "text-purple-900", isGreatLuck: false },
    { rank: "대흉 (Great Bad Luck)", message: "앗... 오늘은 조금 조심하는 게 좋겠어. 💦", bgColor: "bg-gradient-to-br from-gray-300 to-gray-500", textColor: "text-gray-900", isGreatLuck: false },
];

// Weighted random selection: Give more weight to better outcomes, but keep Great Luck kind of rare.
const getWeightedRandomFortune = (): FortuneResult => {
    const weights = [10, 30, 25, 20, 10, 5]; // Indexes map to FORTUNE_DATA
    const totalWeight = weights.reduce((acc, val) => acc + val, 0);
    let randomNum = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
        if (randomNum < weights[i]) {
            return FORTUNE_DATA[i];
        }
        randomNum -= weights[i];
    }
    return FORTUNE_DATA[1]; // Fallback to Good Luck
};

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------

export default function FortuneGame() {
    const { token } = useAuthStore();
    const { addToast } = useToastStore();
    const [gameState, setGameState] = useState<'idle' | 'shaking' | 'result'>('idle');
    const [fortune, setFortune] = useState<FortuneResult | null>(null);

    // Hardware shake detection for mobile
    useEffect(() => {
        if (gameState !== 'idle') return;

        let lastX = 0, lastY = 0, lastZ = 0;
        const threshold = 15; // Tuning needed based on testing

        const handleMotion = (event: DeviceMotionEvent) => {
            const acc = event.accelerationIncludingGravity;
            if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

            const deltaX = Math.abs(lastX - acc.x);
            const deltaY = Math.abs(lastY - acc.y);
            const deltaZ = Math.abs(lastZ - acc.z);

            if (deltaX + deltaY + deltaZ > threshold) {
                handleShakeStart();
            }

            lastX = acc.x;
            lastY = acc.y;
            lastZ = acc.z;
        };

        // request JS access to DeviceMotion if needed (iOS 13+)
        // Not adding the prompt here for simplicity, but attaching event listener
        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [gameState]);

    const claimAchievement = async () => {
        if (!token) return;
        try {
            await fetch(`${BASE_URL}/achievements/award/LUCKY_RICO_MOMENT`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            addToast({
                title: "대길 (Great Luck)",
                description: "오늘의 리코 운세에서 대길을 뽑았다!",
                icon: "🥠"
            });
        } catch (error) {
            console.error("Failed to claim achievement", error);
        }
    };

    const handleShakeStart = () => {
        if (gameState !== 'idle') return;
        setGameState('shaking');
        
        // After shaking for 2 seconds, reveal result
        setTimeout(() => {
            const finalResult = getWeightedRandomFortune();
            setFortune(finalResult);
            setGameState('result');
            
            // If great luck, trigger achievement
            if (finalResult.isGreatLuck) {
                claimAchievement();
            }
        }, 2000);
    };

    const handleReset = () => {
        setGameState('idle');
        setFortune(null);
    };

    return (
        <div className="min-h-[100dvh] bg-cream flex flex-col font-pretendard relative overflow-hidden">
            {/* Achievement Toast renders globally via App.tsx, so we don't need it here anymore */}

            {/* Header */}
            <header className="w-full flex justify-between items-center p-4 z-10">
                <ReturnButton gameName="로비" />
                <CommonTitle 
                    title="Rico's Fortune" 
                    subtitle="오늘의 리코 운세" 
                    helpSlot={<GameHelp slides={[]} mobileOnly />} 
                />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 z-10">
                
                <AnimatePresence mode="wait">
                    
                    {/* State: Idle or Shaking */}
                    {(gameState === 'idle' || gameState === 'shaking') && (
                        <motion.div
                            key="shakingStage"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex flex-col items-center gap-8"
                        >
                            <p className="font-bold text-[#166D77] text-xl text-center">
                                {gameState === 'idle' ? "통을 클릭하거나 기기를 흔들어봐!" : "운세 뽑는 중... 🎋"}
                            </p>
                            
                            {/* Omikuji Cylinder */}
                            <motion.div
                                onClick={handleShakeStart}
                                className="w-32 h-64 bg-[#D6C0B0] rounded-b-3xl rounded-t-lg border-8 border-[#8B5A2B] shadow-2xl relative cursor-pointer overflow-hidden flex flex-col items-center justify-center transform origin-bottom"
                                animate={
                                    gameState === 'shaking' 
                                        ? { 
                                            rotate: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
                                            x: [0, -5, 5, -5, 5, -3, 3, -1, 1, 0],
                                            y: [0, -10, 0, -10, 0, -5, 0, -5, 0]
                                          } 
                                        : { rotate: 0 }
                                }
                                transition={{
                                    duration: 2,
                                    ease: "easeInOut",
                                }}
                            >
                                {/* Pattern lines on cylinder */}
                                <div className="absolute inset-0 flex flex-col justify-evenly items-center opacity-30">
                                    <div className="w-full h-1 bg-[#8B5A2B]"></div>
                                    <div className="w-full h-1 bg-[#8B5A2B]"></div>
                                    <div className="w-full h-1 bg-[#8B5A2B]"></div>
                                </div>
                                
                                <span className="text-[#8B5A2B] font-black text-4xl transform rotate-90 scale-x-150 select-none">운세</span>
                            </motion.div>

                            {gameState === 'idle' && (
                                <button
                                    onClick={handleShakeStart}
                                    className="px-8 py-3 bg-[#5EC7A5] text-white font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
                                >
                                    운세 뽑기!
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* State: Result */}
                    {gameState === 'result' && fortune && (
                        <motion.div
                            key="resultStage"
                            initial={{ opacity: 0, scale: 0.5, y: 100 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="flex flex-col items-center gap-8 w-full max-w-sm"
                        >
                            <div className={`w-full p-8 rounded-[2rem] shadow-2xl ${fortune.bgColor} border-4 border-white border-opacity-50 relative overflow-hidden`}>
                                {/* Decorative internal border */}
                                <div className="absolute inset-2 border-2 border-white border-dashed opacity-50 rounded-[1.5rem]"></div>
                                
                                <div className="relative z-10 flex flex-col items-center gap-6">
                                    <div className={`text-5xl font-black ${fortune.textColor} drop-shadow-sm`}>
                                        {fortune.rank}
                                    </div>
                                    
                                    <div className="w-16 h-1 bg-white opacity-50 rounded-full"></div>
                                    
                                    <p className={`text-xl font-bold text-center leading-relaxed ${fortune.textColor}`}>
                                        "{fortune.message}"
                                    </p>
                                    
                                    {fortune.isGreatLuck && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.5, type: 'spring' }}
                                            className="mt-4 bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2"
                                        >
                                            <span>🥠</span>
                                            <span className="font-bold text-yellow-600 text-sm">대길 뽑기 업적 달성!</span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                            
                            <button
                                onClick={handleReset}
                                className="px-8 py-3 bg-white text-[#166D77] font-black rounded-full shadow-lg border-2 border-[#166D77] hover:bg-[#166D77] hover:text-white transition-colors"
                            >
                                한 번 더 뽑기
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>

            {/* Hidden Desktop Help */}
            <div className="hidden">
                 <GameHelp slides={[]} desktopOnly />
            </div>
            
        </div>
    );
}
