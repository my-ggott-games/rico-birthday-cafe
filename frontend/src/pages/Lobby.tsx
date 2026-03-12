import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KCelebrateSlogan } from 'k-celebrate-slogan';
import { AchievementModal } from '../components/common/AchievementModal';
import { AdminModal } from '../components/auth/AdminModal';

const Lobby: React.FC = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isAchievementOpen, setIsAchievementOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#FFFFF8]">
            {/* Background: Cafe Interior */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#5EC7A5 2px, transparent 2px), radial-gradient(#5EC7A5 2px, transparent 2px)',
                    backgroundSize: '40px 40px',
                    backgroundPosition: '0 0, 20px 20px'
                }}
            />
            {/* Floor */}
            <div className="absolute bottom-0 w-full h-1/3 bg-[#f3e6d8] border-t-8 border-[#D6C0B0]" />

            <div className={`relative z-10 w-full h-full ${isMobile ? 'p-4' : 'p-10'} flex flex-col`}>
                <header className={`flex justify-between items-center ${isMobile ? 'mb-2' : 'mb-6'}`}>
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-black text-[#166D77] drop-shadow-sm rotate-[-1deg]`}>
                        ☕ Main Hall
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAchievementOpen(true)}
                            className={`${isMobile ? 'px-3 py-1 text-sm' : 'px-6 py-2'} bg-[#FFE4E6] rounded-full border-2 border-[#5EC7A5] shadow-sm font-black text-[#5EC7A5] hover:bg-[#5EC7A5] hover:text-pale-custard transition-colors flex items-center gap-1.5`}
                        >
                            <span className="drop-shadow-sm text-base">🏆</span> Badges
                        </button>
                        <button
                            onClick={() => setIsAdminOpen(true)}
                            className={`${isMobile ? 'px-3 py-1 text-[10px]' : 'px-5 py-2 text-xs'} bg-[#1a1a1a] text-pale-custard/40 rounded-full border border-pale-custard/10 shadow-lg font-mono tracking-tighter hover:text-pale-custard hover:border-[#5EC7A5]/50 transition-all group relative overflow-hidden`}
                        >
                            <span className="relative z-10 transition-transform group-hover:scale-110 inline-block">who am I?</span>
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#5EC7A5]/0 via-[#5EC7A5]/5 to-[#5EC7A5]/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </header>

                {/* Slogan */}
                <div className="flex justify-center w-full">
                    <KCelebrateSlogan
                        className="slogan-lobby"
                        text1="축하합니다"
                        text2="유즈하 리코"
                        text3="아무 이유 없음"
                        scale={isMobile ? 0.6 : 0.85}
                        emblemScale={isMobile ? 0.6 : 0.75}
                    />
                </div>

                <div className={`flex-1 relative ${isMobile ? 'mt-0 grid grid-cols-2 gap-3 place-items-center align-content-center h-full pb-4' : 'mt-4'}`}>
                    {/* Hotspot: TPO Cody (Paper Doll Table) */}
                    <Link
                        to="/game/cody"
                        className={isMobile ? "relative" : "absolute top-10 left-20 group"}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`relative ${isMobile ? 'w-32 h-44' : 'w-48 h-64'} bg-[#FFE4E6] rounded-[20px] border-4 border-[#166D77] shadow-xl overflow-hidden flex items-center justify-center rotate-[-2deg] hover:rotate-0 transition-transform`}>
                                {/* Paper Texture bg */}
                                <div className="absolute inset-0 bg-pale-custard"
                                    style={{ backgroundImage: 'radial-gradient(#eee 2px, transparent 2px)', backgroundSize: '10px 10px' }}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <span className={`${isMobile ? 'text-2xl' : 'text-4xl'} filter drop-shadow-sm`}>✂️</span>
                                    <span className={`bg-[#5EC7A5] text-pale-custard ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} font-black rotate-[-5deg] shadow-md border-2 border-pale-custard`}>
                                        PAPER<br />DOLL
                                    </span>
                                </div>
                            </div>
                            <div className={`mt-2 bg-pale-custard ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#5EC7A5] group-hover:text-pale-custard transition-colors`}>
                                리코 옷입히기
                            </div>
                        </motion.div>
                    </Link>

                    {/* Hotspot: Itabag (Display Table) - Positioned differently for mobile */}
                    <Link
                        to="/game/itabag"
                        className={isMobile ? "relative scale-[0.85]" : "absolute bottom-10 right-[20%] group"}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`relative ${isMobile ? 'w-48 h-24' : 'w-64 h-32'} bg-pale-custard rounded-xl border-4 border-[#166D77] shadow-xl flex items-center justify-center overflow-visible`}>
                                {/* Tablecloth */}
                                <div className="absolute top-0 w-full h-4 bg-[#fef2f2]" />
                                <div className={`${isMobile ? 'text-4xl' : 'text-5xl'} drop-shadow-md`}>🎒</div>
                            </div>
                            <div className={`mt-2 bg-pale-custard ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#5EC7A5] group-hover:text-pale-custard transition-colors`}>
                                이타백 꾸미기
                            </div>
                        </motion.div>
                    </Link>

                    {/* Hotspot: Mini Game (Puzzle) */}
                    <Link
                        to="/game/puzzle"
                        className={isMobile ? "relative" : "absolute top-20 right-20 group"}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`relative ${isMobile ? 'w-24 h-36' : 'w-40 h-56'} bg-[#a3e635] rounded-t-3xl border-4 border-[#166D77] shadow-xl flex flex-col items-center justify-center p-4`}>
                                <div className={`${isMobile ? 'text-3xl' : 'text-6xl'} drop-shadow-md`}>🧩</div>
                            </div>
                            <div className={`mt-2 bg-pale-custard ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#5EC7A5] group-hover:text-pale-custard transition-colors`}>
                                퍼즐놀이
                            </div>
                        </motion.div>
                    </Link>

                    {/* Hotspot: Asparagus Merge (2048 style) */}
                    <Link
                        to="/game/asparagus"
                        className={isMobile ? "relative scale-[0.85]" : "absolute bottom-8 left-[24%] -translate-x-1/2 group"}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`relative ${isMobile ? 'w-32 h-24' : 'w-52 h-32'} bg-[#d4edda] rounded-2xl border-4 border-[#166D77] shadow-xl flex flex-col items-center justify-center gap-1`}>
                                {/* Asparagus tile grid preview */}
                                <div className="grid grid-cols-3 gap-1 p-2">
                                    {['🌱', '🌿', '🥬', '🌾', '💎', '⚔️'].map((e, i) => (
                                        <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                                            style={{ background: '#2d6a4f', fontSize: isMobile ? 12 : 14 }}>{e}</div>
                                    ))}
                                </div>
                            </div>
                            <div className={`mt-2 bg-pale-custard ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'} rounded-xl font-bold text-[#166D77] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#5EC7A5] group-hover:text-pale-custard transition-colors`}>
                                아스파라거스 키우기
                            </div>
                        </motion.div>
                    </Link>
                </div>
            </div>

            <AchievementModal
                isOpen={isAchievementOpen}
                onClose={() => setIsAchievementOpen(false)}
            />

            <AdminModal
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
            />
        </div>
    );
};

export default Lobby;
