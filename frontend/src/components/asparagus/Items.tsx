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
                <motion.button
                    whileHover={undoCount > 0 && historyLength > 0 ? { scale: 1.05, y: -5 } : {}}
                    whileTap={undoCount > 0 && historyLength > 0 ? { scale: 0.95 } : {}}
                    onClick={onUndo}
                    disabled={undoCount <= 0 || historyLength === 0}
                    className={`px-4 py-3 rounded-2xl font-black text-sm border-2 flex flex-col items-center transition-all min-w-[100px]
                        ${undoCount > 0 && historyLength > 0
                            ? 'bg-white text-rico-dark-teal border-[#bef264] shadow-lg'
                            : 'bg-gray-200 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed'}`}
                >
                    <span className="text-2xl mb-1">🔙</span>
                    <span className="text-[10px] opacity-50 uppercase tracking-tighter">Undo</span>
                    <span className="mt-1">되돌리기 ({undoCount})</span>
                </motion.button>

                <motion.button
                    whileHover={swapCount > 0 ? { scale: 1.05, y: -5 } : {}}
                    whileTap={swapCount > 0 ? { scale: 0.95 } : {}}
                    onClick={onToggleSwapMode}
                    disabled={swapCount <= 0}
                    className={`px-4 py-3 rounded-2xl font-black text-sm border-2 flex flex-col items-center transition-all min-w-[100px]
                        ${swapCount > 0
                            ? (isSwapMode ? 'bg-[#5EC7A5] text-white border-[#166D77] shadow-inner' : 'bg-white text-rico-dark-teal border-[#bef264] shadow-lg')
                            : 'bg-gray-200 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed'}`}
                >
                    <span className="text-2xl mb-1">🔄</span>
                    <span className="text-[10px] opacity-50 uppercase tracking-tighter">Swap</span>
                    <span className="mt-1">바꾸기 ({swapCount})</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRestart}
                    className="px-4 py-3 rounded-2xl font-black text-sm bg-[#166D77] text-white shadow-md flex flex-col items-center justify-center border-2 border-white/20 hover:bg-[#2d6a4f] transition-all min-w-[100px]"
                >
                    <span className="text-2xl mb-1">🔁</span>
                    <span className="text-[10px] opacity-50 uppercase tracking-tighter">Restart</span>
                    <span className="mt-1">다시하기</span>
                </motion.button>
            </div>
        </div>
    );
};
