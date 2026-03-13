import React, { useState, useEffect, useRef } from 'react';
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
    const [authStatus, setAuthStatus] = useState<'idle' | 'admin' | 'easter_egg'>('idle');

    const { login } = useAuthStore();
    const { addToast } = useToastStore();
    const { token } = useAuthStore();

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setInputs(Array(7).fill(''));
            setError(false);
            setAuthStatus('idle');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const KOREAN_TO_ENGLISH_MAP: Record<string, string> = {
        'ㅂ': 'q', 'ㅈ': 'w', 'ㄷ': 'e', 'ㄱ': 'r', 'ㅅ': 't', 'ㅛ': 'y', 'ㅕ': 'u', 'ㅑ': 'i', 'ㅐ': 'o', 'ㅔ': 'p',
        'ㅁ': 'a', 'ㄴ': 's', 'ㅇ': 'd', 'ㄹ': 'f', 'ㅎ': 'g', 'ㅗ': 'h', 'ㅓ': 'j', 'ㅏ': 'k', 'ㅣ': 'l',
        'ㅋ': 'z', 'ㅌ': 'x', 'ㅊ': 'c', 'ㅍ': 'v', 'ㅠ': 'b', 'ㅜ': 'n', 'ㅡ': 'm',
        'ㅃ': 'q', 'ㅉ': 'w', 'ㄸ': 'e', 'ㄲ': 'r', 'ㅆ': 't', 'ㅒ': 'o', 'ㅖ': 'p'
    };

    const handleKeyClick = (letter: string) => {
        if (loading || authStatus !== 'idle') return;

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
        if (loading || authStatus !== 'idle') return;

        const lastFilledIndex = [...inputs].reverse().findIndex(val => val !== '');
        if (lastFilledIndex === -1) return;

        const actualIndex = 6 - lastFilledIndex;
        const newInputs = [...inputs];
        newInputs[actualIndex] = '';
        setInputs(newInputs);
        setError(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (loading || authStatus !== 'idle') return;
        const val = e.target.value;
        const currentLength = inputs.filter(x => x !== '').length;

        if (val.length < currentLength) {
            handleBackspace();
            return;
        }

        const newChar = val[val.length - 1];
        if (!newChar) return;

        let key = newChar;
        if (KOREAN_TO_ENGLISH_MAP[key]) {
            key = KOREAN_TO_ENGLISH_MAP[key];
        }

        // We only allow ascii letters and numbers to trigger our manual insert logic
        if (/^[a-zA-Z0-9]$/.test(key)) {
            handleKeyClick(key);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || loading || authStatus !== 'idle') return;

            // Give priority to the input field if it's focused,
            // otherwise global keys might double-trigger.
            // But since the input captures onChange, we can safely ignore global A-Z keys 
            // if the active element is our input to avoid double entries.
            if (document.activeElement === inputRef.current) {
                // If it's a Backspace or letter, let onChange/onKeyDown of input handle it, 
                // OR we just use this handler. Actually, if we use handleInputChange, 
                // it's better to prevent global listener from duplicating letters.
                if (e.key === 'Backspace' || /^[a-zA-Z0-9]$/.test(e.key) || KOREAN_TO_ENGLISH_MAP[e.key]) {
                    return;
                }
            }

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

            if (/^[a-zA-Z0-9]$/.test(key)) {
                e.preventDefault();
                handleKeyClick(key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, inputs, loading, authStatus]);

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

            if (data.message === 'easter_egg') {
                setAuthStatus('easter_egg');

                // Trigger achievement for Easter Egg
                if (token) {
                    fetch(`${BASE_URL}/achievements/award/RICO_DEBUT_DATE`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(console.error);
                }

                addToast({
                    title: '관리자 권한에 접근한 자',
                    description: '정답은 리코 데뷔 날짜였습니다~',
                    icon: '👀'
                });

                setTimeout(() => {
                    onClose();
                }, 3000);
                return;
            }

            setAuthStatus('admin');
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
                        className="relative w-full max-w-xl bg-[#0a0a0a] rounded-[3rem] border border-pale-custard/5 shadow-2xl p-10 overflow-hidden"
                        initial={{ scale: 0.9, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 30, opacity: 0 }}
                        onClick={() => inputRef.current?.focus()}
                    >
                        <input
                            ref={inputRef}
                            className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-text text-transparent bg-transparent"
                            value={inputs.join('')}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace') {
                                    handleBackspace();
                                }
                            }}
                            autoFocus
                            autoCapitalize="none"
                            autoComplete="off"
                            spellCheck="false"
                        />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#5EC7A5] to-transparent opacity-50" />

                        <div className="text-center mb-10">
                            <h2 className="text-xl font-bold text-pale-custard/40 tracking-[0.3em] uppercase mb-1">
                                Who am I?
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-px w-8 bg-pale-custard/10" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[#5EC7A5] animate-pulse" />
                                <div className="h-px w-8 bg-pale-custard/10" />
                            </div>
                        </div>

                        <div className={`flex items-center justify-center gap-3 mb-12 ${error ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                            <div className="flex gap-2">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className={`w-12 h-16 bg-pale-custard/5 border-2 rounded-xl flex items-center justify-center text-2xl transition-all
                                    ${authStatus === 'easter_egg' ? 'border-[#5FC7A5] bg-[#5FC7A5]/10 text-[#5FC7A5]' :
                                            authStatus === 'admin' ? 'border-[#010799] bg-[#010799]/10 text-[#010799]' :
                                                error ? 'border-red-500 text-red-500' :
                                                    inputs[i] ? 'border-[#5EC7A5] bg-pale-custard/10' : 'border-pale-custard/5'}`}>
                                        <span className={authStatus !== 'idle' ? 'mt-1' : 'text-pale-custard mt-1'}>
                                            {inputs[i] ? '*' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-pale-custard/10 text-2xl font-black mb-2 flex items-end">_</div>

                            <div className="flex gap-2">
                                {[3, 4, 5, 6].map((i) => (
                                    <div key={i} className={`w-12 h-16 bg-pale-custard/5 border-2 rounded-xl flex items-center justify-center text-2xl transition-all
                                    ${authStatus === 'easter_egg' ? 'border-[#5FC7A5] bg-[#5FC7A5]/10 text-[#5FC7A5]' :
                                            authStatus === 'admin' ? 'border-[#010799] bg-[#010799]/10 text-[#010799]' :
                                                error ? 'border-red-500 text-red-500' :
                                                    inputs[i] ? 'border-[#5EC7A5] bg-pale-custard/10' : 'border-pale-custard/5'}`}>
                                        <span className={authStatus !== 'idle' ? 'mt-1' : 'text-pale-custard mt-1'}>
                                            {inputs[i] ? '*' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center">
                            <AnimatePresence mode="wait">
                                {authStatus === 'admin' ? (
                                    <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#010799] font-black tracking-widest text-sm underline underline-offset-8">
                                        ACCESS GRANTED
                                    </motion.span>
                                ) : authStatus === 'easter_egg' ? (
                                    <motion.span key="egg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#5FC7A5] font-black tracking-widest text-[10px] uppercase font-mono">
                                        EASTER EGG FOUND
                                    </motion.span>
                                ) : loading ? (
                                    <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-1">
                                        {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 bg-[#5EC7A5] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                                    </motion.div>
                                ) : error ? (
                                    <motion.span key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-bold text-xs tracking-widest">
                                        VERIFICATION FAILED
                                    </motion.span>
                                ) : (
                                    <motion.span key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-pale-custard/10 text-xs uppercase font-mono tracking-[0.4em]">
                                        관리자 모드로 전환합니다.
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
