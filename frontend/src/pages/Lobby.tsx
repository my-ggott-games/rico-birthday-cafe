import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RicoSlogan from '../components/game/RicoSlogan';

const Lobby: React.FC = () => {
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

            <div className="relative z-10 w-full h-full p-10 flex flex-col">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-4xl font-black text-[#4A3b32] drop-shadow-sm rotate-[-1deg]">
                        ☕ Main Hall
                    </h2>
                    <div className="bg-white px-6 py-2 rounded-full border-2 border-[#D6C0B0] shadow-sm font-bold text-[#F43F5E]">
                        Stamps: 0 / 5
                    </div>
                </header>

                {/* Rico Slogan Component */}
                <RicoSlogan />

                <div className="flex-1 relative mt-4">
                    {/* Hotspot: TPO Cody (Paper Doll Table) */}
                    <Link to="/game/cody" className="absolute top-10 left-20 group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative w-48 h-64 bg-pink-100 rounded-t-[20px] rounded-b-[20px] border-4 border-[#4A3b32] shadow-xl overflow-hidden flex items-center justify-center rotate-[-2deg] hover:rotate-0 transition-transform">
                                {/* Paper Texture bg */}
                                <div className="absolute inset-0 bg-white"
                                    style={{ backgroundImage: 'radial-gradient(#eee 2px, transparent 2px)', backgroundSize: '10px 10px' }}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <span className="text-4xl filter drop-shadow-sm">✂️</span>
                                    <span className="bg-[#F43F5E] text-white px-3 py-1 font-black rotate-[-5deg] shadow-md border-2 border-white text-sm">PAPER<br />DOLL</span>
                                </div>
                            </div>
                            <div className="mt-4 bg-white px-4 py-2 rounded-xl font-bold text-[#4A3b32] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#F43F5E] group-hover:text-white transition-colors">
                                Table Play
                            </div>
                        </motion.div>
                    </Link>

                    {/* Hotspot: Itabag (Display Table) */}
                    <Link to="/game/itabag" className="absolute bottom-20 right-1/3 group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative w-64 h-32 bg-white rounded-xl border-4 border-[#4A3b32] shadow-xl flex items-center justify-center relative overflow-visible">
                                {/* Tablecloth */}
                                <div className="absolute top-0 w-full h-4 bg-red-100" />
                                <div className="text-5xl drop-shadow-md">🎒</div>
                                <span className="absolute -top-4 -right-4 bg-yellow-400 text-white rounded-full p-2 border-2 border-white shadow-sm font-bold text-xs rotate-12">NEW!</span>
                            </div>
                            <div className="mt-4 bg-white px-4 py-2 rounded-xl font-bold text-[#4A3b32] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#F43F5E] group-hover:text-white transition-colors">
                                Decorate Itabag
                            </div>
                        </motion.div>
                    </Link>

                    {/* Hotspot: Mini Game (Puzzle) */}
                    <Link to="/game/puzzle" className="absolute top-20 right-20 group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative w-40 h-56 bg-[#a3e635] rounded-t-3xl border-4 border-[#4A3b32] shadow-xl flex flex-col items-center justify-center p-4">
                                <div className="text-6xl drop-shadow-md">🧩</div>
                            </div>
                            <div className="mt-4 bg-white px-4 py-2 rounded-xl font-bold text-[#4A3b32] shadow-md border-2 border-[#D6C0B0] group-hover:bg-[#F43F5E] group-hover:text-white transition-colors">
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
