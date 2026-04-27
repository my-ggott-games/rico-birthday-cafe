import React from "react";
import { motion } from "framer-motion";
import { AppIcon } from "../common/AppIcon";
import { PushableButton } from "../common/PushableButton";

interface ItemsProps {
  undoCount: number;
  swapCount: number;
  shuffleCount: number;
  historyLength: number;
  isSwapMode: boolean;
  isAdmin: boolean;
  debugMode: boolean;
  gameOver: boolean;
  onUndo: () => void;
  onToggleSwapMode: () => void;
  onShuffle: () => void;
  onDebugStart: () => void;
}

const ITEM_BTN =
  "w-24 h-24 lg:w-32 lg:h-32 rounded-2xl lg:rounded-3xl flex-col gap-0.5 px-0 py-0";

export const Items: React.FC<ItemsProps> = ({
  undoCount,
  swapCount,
  shuffleCount,
  historyLength,
  isSwapMode,
  isAdmin,
  debugMode,
  gameOver,
  onUndo,
  onToggleSwapMode,
  onShuffle,
  onDebugStart,
}) => {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-row flex-wrap items-center justify-center gap-4 lg:flex-col lg:flex-nowrap">
        {/* Undo */}
        <PushableButton
          variant="navy"
          onClick={onUndo}
          disabled={gameOver || undoCount <= 0 || historyLength === 0}
          className={ITEM_BTN}
        >
          <AppIcon name="RotateCcw" size={24} className="mb-1" />
          <span className="text-[9px] opacity-50 uppercase tracking-tighter">
            Undo
          </span>
          <span className="text-xs mt-0.5 leading-tight text-center">
            되돌리기
            <br />({undoCount})
          </span>
        </PushableButton>

        {/* Swap */}
        <PushableButton
          variant={isSwapMode ? "teal" : "light"}
          onClick={onToggleSwapMode}
          disabled={gameOver || swapCount <= 0}
          className={ITEM_BTN}
        >
          <AppIcon name="ArrowLeftRight" size={24} className="mb-1" />
          <span className="text-[9px] opacity-50 uppercase tracking-tighter">
            Swap
          </span>
          <span className="text-xs mt-0.5 leading-tight text-center">
            바꾸기
            <br />({swapCount})
          </span>
        </PushableButton>

        {/* Shuffle */}
        <PushableButton
          variant="mint"
          onClick={onShuffle}
          disabled={gameOver || shuffleCount <= 0}
          className={ITEM_BTN}
        >
          <AppIcon name="Shuffle" size={24} className="mb-1" />
          <span className="text-[9px] opacity-50 uppercase tracking-tighter">
            Shuffle
          </span>
          <span className="text-xs mt-0.5 leading-tight text-center">
            갈아엎기
            <br />({shuffleCount})
          </span>
        </PushableButton>

        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDebugStart}
            className={`w-24 h-24 lg:w-32 lg:h-32 rounded-2xl lg:rounded-3xl font-black text-sm border-2 flex flex-col items-center justify-center transition-all ${debugMode ? "bg-[#f59e0b] text-[#1f2937] border-[#92400e]" : "bg-[#fff7db] text-[#166D77] border-[#f59e0b] shadow-lg"}`}
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
        )}
      </div>
    </div>
  );
};
