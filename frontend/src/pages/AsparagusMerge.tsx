import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Board } from "../components/asparagus/Board";
import { Items } from "../components/asparagus/Items";
import { GameContainer } from "../components/common/GameContainer";
import { useAsparagusGame } from "../hooks/useAsparagusGame";
import { type Direction } from "../components/asparagus/types";
import { AppIcon } from "../components/common/AppIcon";
import { ASPARAGUS_TUTORIAL_SLIDES } from "../constants/tutorialSlides";

const ScoreCard = ({
  label,
  value,
  background,
  textColor,
}: {
  label: string;
  value: number;
  background: string;
  textColor: string;
}) => (
  <div
    className="flex min-w-[7rem] flex-1 flex-col items-center rounded-2xl border-2 px-4 py-2 shadow-sm sm:flex-none"
    style={{
      background,
      color: textColor,
      borderColor: "rgba(255,255,255,0.38)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
    }}
  >
    <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
      {label}
    </span>
    <span className="text-xl font-black leading-tight">{value}</span>
  </div>
);

const AsparagusMerge: React.FC = () => {
  const {
    grid,
    score,
    best,
    won,
    gameOver,
    continueAfterWin,
    debugMode,
    history,
    undoCount,
    swapCount,
    isSwapMode,
    selection,
    startGame,
    handleUndo,
    handleTileClick,
    move,
    setContinueAfterWin,
    setIsSwapMode,
    setSelection,
    startDebugGame,
    touchStart: touchStartRef,
  } = useAsparagusGame();

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      if (map[e.key]) {
        e.preventDefault();
        move(map[e.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  // Touch swipe — handlers for Board area only
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return;
    if (absDx > absDy) {
      move(dx > 0 ? "right" : "left");
    } else {
      move(dy > 0 ? "down" : "up");
    }
    touchStartRef.current = null;
  };

  return (
    <GameContainer
      title="아스파라거스 키우기"
      desc="아스파라거스도 리코도 건강만 해다오"
      gameName="아스파라거스 키우기"
      helpSlides={ASPARAGUS_TUTORIAL_SLIDES}
      className="select-none"
    >
      {/* ─── Main Content: Horizontal 3 DIV ─── */}
      <div className="flex-1 w-full grid grid-cols-1 gap-6 px-4 pb-12 pt-4 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:gap-8 lg:px-10">
        {/* [Center] Board: swipe only on the board element */}
        <div className="flex min-h-0 flex-col items-center justify-center gap-4 lg:min-h-[calc(100dvh-260px)]">
          <div className="flex w-full justify-center lg:justify-center">
            <div className="flex w-full max-w-[min(100%,520px)] items-end justify-end gap-3">
              <ScoreCard
                label="Score"
                value={debugMode ? 0 : score}
                background="#166D77"
                textColor="#FFFFF8"
              />
              <ScoreCard
                label="Best"
                value={best}
                background="#2d6a4f"
                textColor="#bef264"
              />
            </div>
          </div>
          <Board
            grid={grid}
            selection={selection}
            isSwapMode={isSwapMode}
            onTileClick={handleTileClick}
            onMove={move}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* [Right] Items */}
        <div className="flex min-h-0 flex-col items-center justify-center lg:min-h-[calc(100dvh-260px)]">
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <Items
              undoCount={undoCount}
              swapCount={swapCount}
              historyLength={history.length}
              isSwapMode={isSwapMode}
              debugMode={debugMode}
              onUndo={handleUndo}
              onToggleSwapMode={() => {
                setIsSwapMode(!isSwapMode);
                setSelection(null);
              }}
              onRestart={() => startGame()}
              onDebugStart={startDebugGame}
            />
          </div>
        </div>
      </div>

      {/* Win/Game Over Modals */}
      <AnimatePresence>
        {won && !continueAfterWin && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="rounded-3xl p-8 max-w-xs w-full mx-4 flex flex-col items-center gap-4 text-center"
              style={{
                background: "linear-gradient(135deg,#fffbe6,#fff9c4)",
                boxShadow: "0 0 40px rgba(255,200,0,0.4)",
              }}
            >
              <AppIcon name="Sword" size={56} className="text-[#166D77]" />
              <h2 className="font-black text-2xl" style={{ color: "#166D77" }}>
                성검 완성!
              </h2>
              <p className="text-sm font-bold" style={{ color: "#b45309" }}>
                축하합니다!
                <br />
                성검을 획득하셨습니다!
              </p>
              <p
                className="text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{ background: "#166D77", color: "#bef264" }}
              >
                최종 점수: {score}
              </p>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => setContinueAfterWin(true)}
                  className="w-full py-2.5 rounded-2xl font-bold text-sm bg-gray-100 text-gray-500"
                >
                  계속하기
                </button>
                <button
                  onClick={() => startGame()}
                  className="w-full py-2.5 rounded-2xl font-black text-sm bg-[#5EC7A5] text-white"
                >
                  새 게임
                </button>
                <button
                  onClick={() => (window.location.href = "/lobby")}
                  className="w-full py-2.5 rounded-2xl font-black text-sm bg-[#166D77] text-white"
                >
                  로비로 이동
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {gameOver && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="rounded-3xl p-8 max-w-xs w-full mx-4 flex flex-col items-center gap-4 text-center"
              style={{
                background: "#FFFFF8",
                boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
              }}
            >
              <AppIcon name="Flower2" size={50} className="text-[#9ca3af]" />
              <h2 className="font-black text-2xl" style={{ color: "#166D77" }}>
                아스파라거스가 시들었어
              </h2>
              <p className="text-sm font-bold" style={{ color: "#9ca3af" }}>
                괜찮아, 씨앗은 또 있어! 다시 키워볼래?
              </p>
              <p
                className="text-xs font-bold px-3 py-1.5 rounded-xl"
                style={{ background: "#166D77", color: "#bef264" }}
              >
                최종 점수: {score}
              </p>
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={() => startGame()}
                  className="flex-1 py-3 rounded-2xl font-black text-sm bg-[#5EC7A5] text-white"
                >
                  재도전
                </button>
                <button
                  onClick={() => (window.location.href = "/lobby")}
                  className="flex-1 py-3 rounded-2xl font-black text-sm bg-[#166D77] text-white"
                >
                  로비
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </GameContainer>
  );
};

export default AsparagusMerge;
