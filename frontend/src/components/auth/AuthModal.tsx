import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { BASE_URL } from '../../utils/api';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [uidInput, setUidInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [guestId, setGuestId] = useState('');

    const { login } = useAuthStore();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('번호표를 복사했어요! 잃어버리면 새 번호표를 뽑아야 해요.');
    };

    const handleExistingTicketLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!uidInput.trim()) {
            setError('번호표를 입력해주세요.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: uidInput.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || '인증 실패: 유효하지 않은 번호표입니다.');
            }

            login(data.token);
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${BASE_URL}/auth/guest`, {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || '게스트 로그인 실패');

            setGuestId(data.username);
            login(data.token);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="auth-modal-overlay"
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-[#FFFDF7] w-full max-w-sm rounded-[2rem] border-4 border-[#F43F5E] shadow-xl p-8 relative"
                        initial={{ scale: 0.8, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 50 }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-[#4A3b32]/60 hover:text-[#F43F5E] font-bold text-xl"
                        >
                            ✕
                        </button>

                        {guestId ? (
                            <div className="text-center py-4">
                                <h2 className="text-2xl font-black text-[#4A3b32] mb-4 break-keep">
                                    번호표를 발급받았어요!
                                </h2>
                                <p className="text-[#4A3b32]/60 text-sm mb-6 break-keep">
                                    잃어버리면 누군지 알 수 없으니까 새로 뽑아야 해요.
                                </p>

                                <div className="bg-[#FFE4E6] p-4 rounded-2xl border-2 border-[#F43F5E] mb-6 flex flex-col gap-2">
                                    <span className="text-[#F43F5E] font-black text-xl tracking-wider">{guestId}</span>
                                    <button
                                        onClick={() => copyToClipboard(guestId)}
                                        className="text-xs font-bold text-[#4A3b32]/50 hover:text-[#F43F5E] transition-colors"
                                    >
                                        클릭하여 복사하기
                                    </button>
                                </div>

                                <button
                                    onClick={onSuccess}
                                    className="w-full bg-[#F43F5E] text-white font-black py-4 rounded-xl shadow-[0_4px_0_#be123c] hover:translate-y-1 hover:shadow-[0_0px_0_#be123c] transition-all"
                                >
                                    여기요!
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-black text-[#4A3b32] text-center mb-6 break-keep">
                                    번호표 보여주세요!
                                </h2>

                                {error && (
                                    <div className="p-3 rounded-xl mb-4 text-center font-bold text-sm bg-red-100 text-red-600">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <form onSubmit={handleExistingTicketLogin} className="flex flex-col gap-3">
                                        <input
                                            type="text"
                                            placeholder="번호표 입력"
                                            value={uidInput}
                                            onChange={(e) => setUidInput(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-[#4A3b32]/10 focus:border-[#F43F5E] outline-none font-bold text-[#4A3b32] text-center tracking-wider"
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-white text-[#4A3b32] border-2 border-[#4A3b32]/20 font-black py-3 rounded-xl hover:bg-[#FFE4E6] hover:border-[#F43F5E] transition-all disabled:opacity-50 text-sm"
                                        >
                                            {loading && uidInput ? '확인 중...' : '여기요!'}
                                        </button>
                                    </form>

                                    <div className="relative flex items-center py-4">
                                        <div className="flex-grow border-t border-[#4A3b32]/10"></div>
                                        <span className="flex-shrink-0 mx-4 text-[#4A3b32]/20 text-[10px] font-bold uppercase tracking-widest">번호표가 없으신가요?</span>
                                        <div className="flex-grow border-t border-[#4A3b32]/10"></div>
                                    </div>
                                    <button
                                        onClick={handleGuestLogin}
                                        disabled={loading}
                                        className="w-full bg-[#F43F5E] text-white font-black py-5 rounded-2xl shadow-[0_6px_0_#be123c] hover:translate-y-1 hover:shadow-[0_2px_0_#be123c] active:translate-y-1.5 active:shadow-none transition-all disabled:opacity-50 text-xl"
                                    >
                                        {loading && !uidInput ? '처리 중...' : '새 번호표 뽑기'}
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
