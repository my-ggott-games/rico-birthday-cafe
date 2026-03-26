import React from "react";
import { motion } from "framer-motion";
import { AppIcon } from "../common/AppIcon";

interface ItemsProps {
  undoCount: number;
  swapCount: number;
  historyLength: number;
  isSwapMode: boolean;
  debugMode: boolean;
  onUndo: () => void;
  onToggleSwapMode: () => void;
  onRestart: () => void;
  onDebugStart: () => void;
}

// Unified button size so text never wraps on mobile
const BTN_BASE = `w-[96px] h-[96px] rounded-2xl font-black text-sm border-2 flex flex-col items-center justify-center transition-all`;

export const Items: React.FC<ItemsProps> = ({
  undoCount,
  swapCount,
  historyLength,
  isSwapMode,
  debugMode,
  onUndo,
  onToggleSwapMode,
  onRestart,
  onDebugStart,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="flex flex-wrap items-center justify-center gap-4 max-w-[320px]">
        {/* Undo */}
        <motion.button
          whileHover={
            undoCount > 0 && historyLength > 0 ? { scale: 1.05, y: -5 } : {}
          }
          whileTap={undoCount > 0 && historyLength > 0 ? { scale: 0.95 } : {}}
          onClick={onUndo}
          disabled={undoCount <= 0 || historyLength === 0}
          className={`${BTN_BASE} ${
            undoCount > 0 && historyLength > 0
              ? "bg-white text-rico-dark-teal border-[#bef264] shadow-lg"
              : "bg-gray-200 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed"
          }`}
        >
          <AppIcon name="RotateCcw" size={24} className="mb-1" />
          <span className="text-[9px] opacity-50 uppercase tracking-tighter">
            Undo
          </span>
          <span className="text-xs mt-0.5 leading-tight text-center">
            되돌리기
            <br />({undoCount})
          </span>
        </motion.button>

        {/* Swap */}
        <motion.button
          whileHover={swapCount > 0 ? { scale: 1.05, y: -5 } : {}}
          whileTap={swapCount > 0 ? { scale: 0.95 } : {}}
          onClick={onToggleSwapMode}
          disabled={swapCount <= 0}
          className={`${BTN_BASE} ${
            swapCount > 0
              ? isSwapMode
                ? "bg-[#5EC7A5] text-white border-[#166D77] shadow-inner"
                : "bg-white text-rico-dark-teal border-[#bef264] shadow-lg"
              : "bg-gray-200 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed"
          }`}
        >
          <AppIcon name="ArrowLeftRight" size={24} className="mb-1" />
          <span className="text-[9px] opacity-50 uppercase tracking-tighter">
            Swap
          </span>
          <span className="text-xs mt-0.5 leading-tight text-center">
            바꾸기
            <br />({swapCount})
          </span>
        </motion.button>

        {/* Restart */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className={`${BTN_BASE} bg-[#166D77] text-white shadow-md border-white/20 hover:bg-[#2d6a4f]`}
        >
          <AppIcon name="RefreshCw" size={24} className="mb-1" />
          <span className="text-[9px] opacity-50 uppercase tracking-tighter">
            Restart
          </span>
          <span className="text-xs mt-0.5 leading-tight text-center">
            다시하기
            <br />
            (∞)
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDebugStart}
          className={`${BTN_BASE} ${debugMode ? "bg-[#f59e0b] text-[#1f2937] border-[#92400e]" : "bg-[#fff7db] text-[#166D77] border-[#f59e0b] shadow-lg"}`}
        >
          <AppIcon name="Wrench" size={24} className="mb-1" />
          <span className="text-[9px] opacity-50 uppercase tracking-tighter">
            Debug
          </span>
          <span className="text-xs mt-0.5 leading-tight text-center">
            황금검
            <br />
            시작
          </span>
        </motion.button>
      </div>
    </div>
  );
};
