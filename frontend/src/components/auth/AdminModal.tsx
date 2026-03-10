import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { BASE_URL } from '../../utils/api';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
    const [inputs, setInputs] = useState<string[]>(Array(7).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { login } = useAuthStore();
    const { addToast } = useToastStore();

    useEffect(() => {
        if (isOpen) {
            setInputs(Array(7).fill(''));
            setError(false);
            setIsSuccess(false);
        }
    }, [isOpen]);

    const KOREAN_TO_ENGLISH_MAP: Record<string, string> = {
        'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't', 'ㅛ': 'y', 'ㅕ': 'u', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
        'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g', 'ㅗ': 'h', 'ㅓ': 'j', 'ㅏ': 'k', 'ㅣ': 'l',
        'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v', 'ㅠ': 'b', 'ㅜ': 'n', 'ㅡ': 'm',
        'ㅃ': 'q', 'ㅉ': 'w', 'ㄸ': 'e', 'ㄲ': 'r', 'ㅆ': 't', 'ㅒ': 'o', 'ㅖ': 'p'
    };

    const handleKeyClick = (letter: string) => {
        if (loading || isSuccess) return;

        const firstEmptyIndex = inputs.findIndex(val => val === '');
        if (firstEmptyIndex === -1) return;

        const newInputs = [...inputs];
        newInputs[firstEmptyIndex] = letter.toLowerCase();
        setInputs(newInputs);
        setError(false);

        if (newInputs.every(val => val !== '')) {
            submitPasscode(newInputs);
        }
    };

    const handleBackspace = () => {
        if (loading || isSuccess) return;

        const lastFilledIndex = [...inputs].reverse().findIndex(val => val !== '');
        if (lastFilledIndex === -1) return;

        const actualIndex = 6 - lastFilledIndex;
        const newInputs = [...inputs];
        newInputs[actualIndex] = '';
        setInputs(newInputs);
        setError(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || loading || isSuccess) return;

            let key = e.key;

            if (key === 'Backspace') {
                handleBackspace();
                return;
            }

            if (KOREAN_TO_ENGLISH_MAP[key]) {
                key = KOREAN_TO_ENGLISH_MAP[key];
            } else if (key.length === 1 && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(key)) {
                return;
            }

            if (/^[a-zA-Z]$/.test(key)) {
                handleKeyClick(key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, inputs, loading, isSuccess]);

    const submitPasscode = async (currentInputs: string[]) => {
        const passcode = `${currentInputs[0]}${currentInputs[1]}${currentInputs[2]}_${currentInputs[3]}${currentInputs[4]}${currentInputs[5]}${currentInputs[6]}`;

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error();

            setIsSuccess(true);
            login(data.token);
            addToast({
                title: '시스템 권한 획득',
                description: '관리자 모드로 입장합니다.',
                icon: '🔑'
            });

            setTimeout(() => {
                onClose();
            }, 2000);
        } catch {
            setError(true);
            setTimeout(() => {
                setInputs(Array(7).fill(''));
                setError(false);
            }, 500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="admin-modal-overlay"
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

                    <motion.div
                        className="relative w-full max-w-xl bg-[#0a0a0a] rounded-[3rem] border border-white/5 shadow-2xl p-10 overflow-hidden"
                        initial={{ scale: 0.9, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 30, opacity: 0 }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#F43F5E] to-transparent opacity-50" />

                        <div className="text-center mb-10">
                            <h2 className="text-xl font-bold text-white/40 tracking-[0.3em] uppercase mb-1">
                                Who am I?
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-px w-8 bg-white/10" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#F43F5E] animate-pulse" />
                                <div className="h-px w-8 bg-white/10" />
                            </div>
                        </div>

                        <div className={`flex items-center justify-center gap-3 mb-12 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                            <div className="flex gap-2">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className={`w-12 h-16 bg-white/5 border-2 rounded-xl flex items-center justify-center text-2xl transition-all
                                    ${isSuccess ? 'border-green-500 bg-green-500/10' :
                                            error ? 'border-red-500' :
                                                inputs[i] ? 'border-[#F43F5E] bg-white/10' : 'border-white/5'}`}>
                                        <span className="text-white mt-1">
                                            {inputs[i] ? '*' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-white/10 text-2xl font-black">_</div>

                            <div className="flex gap-2">
                                {[3, 4, 5, 6].map((i) => (
                                    <div key={i} className={`w-12 h-16 bg-white/5 border-2 rounded-xl flex items-center justify-center text-2xl transition-all
                                    ${isSuccess ? 'border-green-500 bg-green-500/10' :
                                            error ? 'border-red-500' :
                                                inputs[i] ? 'border-[#F43F5E] bg-white/10' : 'border-white/5'}`}>
                                        <span className="text-white mt-1">
                                            {inputs[i] ? '*' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center">
                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 font-black tracking-widest text-sm underline underline-offset-8">
                                        ACCESS GRANTED
                                    </motion.span>
                                ) : loading ? (
                                    <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-1">
                                        {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 bg-[#F43F5E] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                                    </motion.div>
                                ) : error ? (
                                    <motion.span key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-bold text-xs tracking-widest">
                                        VERIFICATION FAILED
                                    </motion.span>
                                ) : (
                                    <motion.span key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/10 text-[10px] uppercase font-mono tracking-[0.4em]">
                                        Awaiting Sequence
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
            `}</style>
        </AnimatePresence>
    );
};
