import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { BASE_URL } from '../../utils/api';

interface Achievement {
    code: string;
    title: string;
    description: string;
    iconUrl: string;
    unlockedAt: string;
}

interface AchievementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose }) => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuthStore();

    useEffect(() => {
        if (isOpen && token) {
            fetchAchievements();
        }
    }, [isOpen, token]);

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/achievements/mine`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setAchievements(data);
            }
        } catch (error) {
            console.error("Failed to fetch achievements", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-[#FFFDF7] w-full max-w-2xl rounded-[3rem] border-8 border-[#D6C0B0] shadow-2xl p-6 md:p-10 relative max-h-[85vh] flex flex-col"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-8 text-[#4A3b32]/60 hover:text-[#F43F5E] font-black text-3xl transition-colors bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-sm border-2 border-[#D6C0B0]"
                    >
                        ✕
                    </button>

                    <div className="text-center mb-8 shrink-0">
                        <span className="text-5xl drop-shadow-md mb-2 inline-block">🏆</span>
                        <h2 className="text-4xl font-black text-[#4A3b32] uppercase tracking-wider">
                            My Achievements
                        </h2>
                        <p className="text-[#F43F5E] font-bold mt-2">
                            {achievements.length} Badges Collected
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F43F5E] border-t-transparent" />
                            </div>
                        ) : achievements.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-3xl border-4 border-dashed border-[#D6C0B0]">
                                <span className="text-6xl grayscale opacity-50 block mb-4">🎖️</span>
                                <p className="text-[#4A3b32] font-bold text-xl">No achievements yet.</p>
                                <p className="text-[#4A3b32]/60 mt-2">Play games to unlock special badges!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {achievements.map((ach) => (
                                    <div key={ach.code} className="bg-white p-4 rounded-2xl border-4 border-[#F43F5E]/20 shadow-sm flex items-center gap-4 hover:border-[#F43F5E] hover:-translate-y-1 transition-all">
                                        <div className="w-16 h-16 bg-[#FFE4E6] rounded-full flex items-center justify-center text-3xl shrink-0 border-2 border-[#F43F5E]">
                                            {ach.iconUrl || '⭐'}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-[#4A3b32] text-lg truncate">{ach.title}</h4>
                                            <p className="text-sm font-medium text-[#4A3b32]/70 leading-tight">{ach.description}</p>
                                            <p className="text-[10px] text-[#4A3b32]/40 mt-2 font-bold uppercase tracking-wider">
                                                Unlocked: {new Date(ach.unlockedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
