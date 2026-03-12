import React from 'react';
import { motion } from 'framer-motion';

interface ItemsProps {
    undoCount: number;
    swapCount: number;
    historyLength: number;
    isSwapMode: boolean;
    onUndo: () => void;
    onToggleSwapMode: () => void;
    onRestart: () => void;
}

// Unified button size so text never wraps on mobile
const BTN_BASE = `w-[96px] h-[96px] rounded-2xl font-black text-sm border-2 flex flex-col items-center justify-center transition-all`;

export const Items: React.FC<ItemsProps> = ({
    undoCount,
    swapCount,
    historyLength,
    isSwapMode,
    onUndo,
    onToggleSwapMode,
    onRestart
}) => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="flex flex-row items-center gap-4">
                {/* Undo */}
                <motion.button
                    whileHover={undoCount > 0 && historyLength > 0 ? { scale: 1.05, y: -5 } : {}}
                    whileTap={undoCount > 0 && historyLength > 0 ? { scale: 0.95 } : {}}
                    onClick={onUndo}
                    disabled={undoCount <= 0 || historyLength === 0}
                    className={`${BTN_BASE} ${undoCount > 0 && historyLength > 0
                            ? 'bg-white text-rico-dark-teal border-[#bef264] shadow-lg'
                            : 'bg-gray-200 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed'
                        }`}
                >
                    <span className="text-2xl mb-0.5">🔙</span>
                    <span className="text-[9px] opacity-50 uppercase tracking-tighter">Undo</span>
                    <span className="text-xs mt-0.5 leading-tight text-center">되돌리기<br />({undoCount})</span>
                </motion.button>

                {/* Swap */}
                <motion.button
                    whileHover={swapCount > 0 ? { scale: 1.05, y: -5 } : {}}
                    whileTap={swapCount > 0 ? { scale: 0.95 } : {}}
                    onClick={onToggleSwapMode}
                    disabled={swapCount <= 0}
                    className={`${BTN_BASE} ${swapCount > 0
                            ? (isSwapMode ? 'bg-[#5EC7A5] text-white border-[#166D77] shadow-inner' : 'bg-white text-rico-dark-teal border-[#bef264] shadow-lg')
                            : 'bg-gray-200 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed'
                        }`}
                >
                    <span className="text-2xl mb-0.5">🔄</span>
                    <span className="text-[9px] opacity-50 uppercase tracking-tighter">Swap</span>
                    <span className="text-xs mt-0.5 leading-tight text-center">바꾸기<br />({swapCount})</span>
                </motion.button>

                {/* Restart */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRestart}
                    className={`${BTN_BASE} bg-[#166D77] text-white shadow-md border-white/20 hover:bg-[#2d6a4f]`}
                >
                    <span className="text-2xl mb-0.5">🔁</span>
                    <span className="text-[9px] opacity-50 uppercase tracking-tighter">Restart</span>
                    <span className="text-xs mt-0.5 leading-tight text-center">다시하기<br />(∞)</span>
                </motion.button>
            </div>
        </div>
    );
};
