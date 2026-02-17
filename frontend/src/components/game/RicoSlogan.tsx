import React from 'react';
import { motion } from 'framer-motion';
import PinwheelSVG from './PinwheelSVG';


const RicoSlogan: React.FC = () => {
    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-lg mx-auto my-1 transform rotate-[-0.5deg] z-20 pointer-events-none"
        >
            <style>
                {`
                @font-face {
                    font-family: 'JoseonPalace';
                    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@1.0/ChosunGs.woff') format('woff');
                    font-weight: normal;
                    font-display: swap;
                }
                `}
            </style>
            <div className="relative bg-white border-2 border-gray-100 py-3 px-8 flex flex-col items-center justify-center shadow-lg select-none overflow-hidden rounded-sm">

                {/* Left Emblem */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center">
                    {/* Swirl Pinwheel Decoration */}
                    <PinwheelSVG flipped={false} reverse />

                    {/* Red Disk - Sticker Style */}
                    <div
                        className="relative w-[55%] h-[55%] bg-[#E11D48] rounded-full flex items-center justify-center z-10"
                        style={{
                            border: '3px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 2px 0 rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.08)',
                        }}
                    >
                        <span
                            className="text-2xl font-black text-[#FDE047] leading-none"
                            style={{
                                fontFamily: '"Nanum Myeongjo", serif',
                                fontWeight: 900,
                                textShadow: '-1.0px -1.0px 0 #000, 1.0px -1.0px 0 #000, -1.0px 1.0px 0 #000, 1.0px 1.0px 0 #000',
                                transform: 'translateY(1.5px)'
                            }}
                        >
                            경
                        </span>
                    </div>
                </div>

                {/* Main Text Area */}
                <div className="flex flex-col items-center z-10">
                    <span
                        className="text-3xl font-black text-[#1c89bf] tracking-[0.35em] leading-none mb-1"
                        style={{
                            fontFamily: '"Nanum Myeongjo", serif',
                            fontWeight: 900,
                            textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.1)',
                            display: 'inline-block',
                            transform: 'scaleX(1.2)',
                        }}
                    >
                        축하합니다
                    </span>

                    <h1
                        className="text-4xl font-black text-[#222222] my-1 leading-none tracking-tight"
                        style={{
                            fontFamily: "'JoseonPalace', 'Noto Serif KR', serif",
                            fontWeight: 900,
                            WebkitTextStroke: '1.5px #222222'
                        }}
                    >
                        유즈하 리코
                    </h1>

                    <span
                        className="text-sm font-normal text-gray-900 tracking-[0.4em] mt-2 uppercase"
                        style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                        }}
                    >
                        ㅡ 아무 이유 없음 ㅡ
                    </span>
                </div>

                {/* Right Emblem */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center">
                    {/* Swirl Pinwheel Decoration */}
                    <PinwheelSVG />

                    {/* Red Disk - Sticker Style */}
                    <div
                        className="relative w-[55%] h-[55%] bg-[#E11D48] rounded-full flex items-center justify-center z-10"
                        style={{
                            border: '3px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 2px 0 rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.08)',
                        }}
                    >
                        <span
                            className="text-2xl font-black text-[#FDE047] leading-none"
                            style={{
                                fontFamily: '"Nanum Myeongjo", serif',
                                fontWeight: 900,
                                textShadow: '-1.0px -1.0px 0 #000, 1.0px -1.0px 0 #000, -1.0px 1.0px 0 #000, 1.0px 1.0px 0 #000',
                                transform: 'translateY(1px)'
                            }}
                        >
                            축
                        </span>
                    </div>
                </div>

                {/* Texture Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply"
                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }}
                />
            </div>
        </motion.div>
    );
};

export default RicoSlogan;
