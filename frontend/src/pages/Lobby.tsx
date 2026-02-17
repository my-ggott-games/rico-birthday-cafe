import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RicoSlogan from '../components/game/RicoSlogan';

const Lobby: React.FC = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#FFFDF7]">
            {/* Background: Cafe Interior */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#F43F5E 2px, transparent 2px), radial-gradient(#F43F5E 2px, transparent 2px)',
                    backgroundSize: '40px 40px',
                    backgroundPosition: '0 0, 20px 20px'
                }}
            />
            {/* Floor */}
            <div className="absolute bottom-0 w-full h-1/3 bg-[#f3e6d8] border-t-8 border-[#D6C0B0]" />

            <div className={`relative z-10 w-full h-full ${isMobile ? 'p-4' : 'p-10'} flex flex-col`}>
                <header className={`flex justify-between items-center ${isMobile ? 'mb-2' : 'mb-6'}`}>
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-black text-[#4A3b32] drop-shadow-sm rotate-[-1deg]`}>
                        ☕ Main Hall
                    </h2>
                    <div className={`${isMobile ? 'px-3 py-1 text-sm' : 'px-6 py-2'} bg-white rounded-full border-2 border-[#D6C0B0] shadow-sm font-bold text-[#F43F5E]`}>
                        Stamps: 0 / 5
                    </div>
                </header>

                {/* Rico Slogan Component */}
                <RicoSlogan />

                <div className={`flex-1 relative ${isMobile ? 'mt-0 flex flex-col items-center justify-center gap-4' : 'mt-4'}`}>
                    {/* Hotspot: TPO Cody (Paper Doll Table) */}
                    <Link
                        to="/game/cody"
                        className={isMobile ? "relative" : "absolute top-10 left-20 group"}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`relative ${isMobile ? 'w-32 h-44' : 'w-48 h-64'} bg-pink-100 rounded-[20px] border-4 border-[#4A3b32] shadow-xl overflow-hidden flex items-center justify-center rotate-[-2deg] hover:rotate-0 transition-transform`}>
                                {/* Paper Texture bg */}
                                <div className="absolute inset-0 bg-white"
                                    style={{ backgroundImage: 'radial-gradient(#eee 2px, transparent 2px)', backgroundSize: '10px 10px' }}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <span className={`${isMobile ? 'text-2xl' : 'text-4xl'} filter drop-shadow-sm`}>✂️</span>
                                    <span className={`bg-[#F43F5E] text-white ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} font-black rotate-[-5deg] shadow-md border-2 border-white`}>
                                        PAPER<br />DOLL
                                    </span>
                                </div>
                            </div>
                            <div className={`mt-2 bg-white ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'} rounded-xl font-bold text-[#4A3b32] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#F43F5E] group-hover:text-white transition-colors`}>
                                Table Play
                            </div>
                        </motion.div>
                    </Link>

                    {/* Hotspot: Itabag (Display Table) - Positioned differently for mobile */}
                    <Link
                        to="/game/itabag"
                        className={isMobile ? "relative scale-90" : "absolute bottom-10 right-1/3 group"}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`relative ${isMobile ? 'w-48 h-24' : 'w-64 h-32'} bg-white rounded-xl border-4 border-[#4A3b32] shadow-xl flex items-center justify-center overflow-visible`}>
                                {/* Tablecloth */}
                                <div className="absolute top-0 w-full h-4 bg-red-100" />
                                <div className={`${isMobile ? 'text-4xl' : 'text-5xl'} drop-shadow-md`}>🎒</div>
                                <span className={`absolute -top-4 -right-4 bg-yellow-400 text-white rounded-full ${isMobile ? 'p-1.5 text-[10px]' : 'p-2 text-xs'} border-2 border-white shadow-sm font-bold rotate-12`}>NEW!</span>
                            </div>
                            <div className={`mt-2 bg-white ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'} rounded-xl font-bold text-[#4A3b32] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#F43F5E] group-hover:text-white transition-colors`}>
                                Decorate Itabag
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
                            <div className={`relative ${isMobile ? 'w-24 h-36' : 'w-40 h-56'} bg-[#a3e635] rounded-t-3xl border-4 border-[#4A3b32] shadow-xl flex flex-col items-center justify-center p-4`}>
                                <div className={`${isMobile ? 'text-3xl' : 'text-6xl'} drop-shadow-md`}>🧩</div>
                            </div>
                            <div className={`mt-2 bg-white ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2'} rounded-xl font-bold text-[#4A3b32] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#F43F5E] group-hover:text-white transition-colors`}>
                                Birthday Puzzle
                            </div>
                        </motion.div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
