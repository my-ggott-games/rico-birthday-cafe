import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#FFFDF7] flex flex-col items-center justify-center font-handwriting">
            {/* Striped Awning Effect at top */}
            <div className="absolute top-0 w-full h-16 bg-[repeating-linear-gradient(45deg,#F43F5E,#F43F5E_20px,white_20px,white_40px)] shadow-lg z-10" />
            <div className="absolute top-16 w-full h-3 bg-white/20 z-10 rounded-b-xl" />

            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="relative z-10 flex flex-col items-center justify-center p-8 bg-white rounded-3xl border-4 border-[#F43F5E] shadow-2xl mx-4 text-center max-w-lg"
            >
                {/* 404 text */}
                <h1 className="text-8xl md:text-9xl text-[#4A3b32] font-black tracking-tight drop-shadow-sm rotate-[-2deg] mb-4">
                    404
                </h1>

                {/* Error message */}
                <div className="text-2xl md:text-3xl text-[#F43F5E] font-bold mb-6">
                    이런! 길을 잃으셨나요?
                </div>

                <p className="text-[#4A3b32] text-lg md:text-xl font-medium mb-8 leading-relaxed">
                    요청하신 페이지를 찾을 수 없어요.
                    <br />
                    리코의 메인 홀로 돌아가볼까요?
                </p>

                {/* Return Button */}
                <button
                    onClick={() => navigate('/')}
                    className="relative group bg-white border-4 border-[#D6C0B0] rounded-[24px] px-8 py-4 shadow-[4px_4px_0px_0px_#D6C0B0] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:scale-95"
                >
                    <span className="text-[#4A3b32] font-black text-xl flex items-center gap-2 group-hover:text-[#F43F5E] transition-colors">
                        🏠 메인으로 돌아가기
                    </span>
                </button>
            </motion.div>
        </div>
    );
};

export default NotFound;
