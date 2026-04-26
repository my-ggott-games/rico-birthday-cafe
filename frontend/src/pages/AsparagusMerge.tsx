import React, { useEffect } from "react";

import { Board } from "../components/asparagus/Board";
import { Items } from "../components/asparagus/Items";
import { CommonModal } from "../components/common/CommonModal";
import { GameContainer } from "../components/common/GameContainer";
import { PushableButton } from "../components/common/PushableButton";
import { ScoreStatGroup } from "../components/common/ScoreStatGroup";
import { ShareButtonGroup } from "../components/common/ShareButtonGroup";
import { useAsparagusGame } from "../hooks/useAsparagusGame";
import { usePageBgm } from "../hooks/usePageBgm";
import { type Direction } from "../components/asparagus/types";
import { AppIcon } from "../components/common/AppIcon";
import { ASPARAGUS_TUTORIAL_SLIDES } from "../constants/tutorialSlides";
import { pickRandomActivityBgm } from "../utils/bgm";
import { useAuthStore } from "../store/useAuthStore";
import { pushEvent } from "../utils/analytics";
import { useViewEvent } from "../hooks/usePageTracking";

const AsparagusMerge: React.FC = () => {
  const [bgmSrc] = React.useState(() => pickRandomActivityBgm());
  const isAdmin = useAuthStore((state) => state.isAdmin);

  usePageBgm(bgmSrc);
  useViewEvent("view_game", { game_name: "아스파라거스 키우기" });

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
    shuffleCount,
    isSwapMode,
    selection,
    startGame,
    handleUndo,
    handleShuffle,
    handleTileClick,
    move,
    setContinueAfterWin,
    setIsSwapMode,
    setSelection,
    startDebugGame,
    touchStart: touchStartRef,
  } = useAsparagusGame();

  useEffect(() => {
    pushEvent("start_game", { game_name: "아스파라거스 키우기" });
  }, []);

  useEffect(() => {
    if (won) {
      pushEvent("complete_game", { game_name: "아스파라거스 키우기", score });
    }
  }, [won, score]);

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
      autoShowHelpKey="game_help_seen_asparagus"
      className="select-none"
    >
      {/* ─── Main Content ─── */}
      <div className="flex flex-1 w-full items-center justify-center px-4 pb-12 pt-4 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-16">
          {/* Board + Score */}
          <div className="flex w-full max-w-[520px] flex-col gap-4 lg:w-[520px]">
            <div className="flex w-full items-center justify-between gap-2 px-4">
              <PushableButton
                variant="teal"
                onClick={() => {
                  pushEvent("retry_game", { game_name: "아스파라거스 키우기" });
                  startGame();
                }}
                className="h-14 shrink-0 rounded-2xl px-0 py-0 lg:px-4"
                aria-label="다시하기"
              >
                <span className="flex items-center lg:hidden">
                  <AppIcon name="RefreshCw" size={18} />
                </span>
                <span className="hidden lg:flex lg:flex-col lg:items-center lg:gap-0.5">
                  <span className="text-[9px] opacity-60 uppercase tracking-tighter">
                    Reset
                  </span>
                  <span className="text-sm">다시하기</span>
                </span>
              </PushableButton>
              <ScoreStatGroup
                className="justify-end"
                items={[
                  {
                    label: "Score",
                    value: debugMode ? 0 : score,
                    background: "#166D77",
                    className: "min-w-[7rem] flex-1 sm:flex-none",
                  },
                  {
                    label: "Best",
                    value: best,
                    background: "#5EC7A5",
                    className: "min-w-[7rem] flex-1 sm:flex-none",
                    labelClassName: "opacity-80",
                  },
                ]}
              />
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

          {/* Items */}
          <Items
            undoCount={undoCount}
            swapCount={swapCount}
            shuffleCount={shuffleCount}
            historyLength={history.length}
            isSwapMode={isSwapMode}
            isAdmin={isAdmin}
            debugMode={debugMode}
            onUndo={handleUndo}
            onToggleSwapMode={() => {
              setIsSwapMode(!isSwapMode);
              setSelection(null);
            }}
            onShuffle={handleShuffle}
            onDebugStart={startDebugGame}
          />
        </div>
      </div>

      <CommonModal
        isOpen={won && !continueAfterWin}
        onClose={() => setContinueAfterWin(true)}
        icon={<AppIcon name="Sword" size={32} />}
        title="성검 아스파라거스 등장"
        panelClassName="border-[#F2C94C] bg-[linear-gradient(135deg,#fffbe6,#fff4b8)] px-8 py-8 shadow-[0_0_40px_rgba(255,200,0,0.28)]"
        iconWrapperStyle={{
          backgroundColor: "rgba(255,248,210,0.95)",
          color: "#166D77",
        }}
        titleClassName="mb-4 text-2xl"
        bodyClassName="space-y-3 text-center"
        footerClassName="mt-6 flex flex-col gap-3"
        footer={
          <>
            <PushableButton
              onClick={() => setContinueAfterWin(true)}
              variant="light"
              className="w-full px-0 py-3 text-[#6b7280]"
            >
              계속하기
            </PushableButton>
            <PushableButton
              onClick={() => {
                pushEvent("retry_game", { game_name: "아스파라거스 키우기" });
                startGame();
              }}
              variant="teal"
              className="w-full px-0 py-3"
            >
              다시 키우기
            </PushableButton>
            <div className="flex">
              <ShareButtonGroup
                urlToShare={`${window.location.origin}/game/asparagus?score=${score}`}
                gameName="아스파라거스 키우기"
                buttonClassName="w-full px-0 py-3"
              />
            </div>
          </>
        }
      >
        <p className="text-sm font-bold text-[#b45309]">
          대단해, 너라면 해낼 줄 알았어!
        </p>
        <p className="inline-flex rounded-xl bg-[#166D77] px-3 py-1.5 text-xs font-bold text-[#FFF8EA]">
          최종 점수: {score}
        </p>
      </CommonModal>

      <CommonModal
        isOpen={gameOver}
        onClose={() => {
          pushEvent("retry_game", { game_name: "아스파라거스 키우기" });
          startGame();
        }}
        icon={<AppIcon name="Flower2" size={32} />}
        title="아스파라거스가 시들었어"
        panelClassName="border-[#5EC7A5] px-8 py-8 shadow-[0_30px_80px_rgba(22,109,119,0.16)]"
        titleClassName="mb-4 text-2xl"
        bodyClassName="space-y-3 text-center"
        footerClassName="mt-6 flex flex-col gap-3"
        footer={
          <>
            <div className="flex">
              <ShareButtonGroup
                urlToShare={`${window.location.origin}/game/asparagus?score=${score}`}
                gameName="아스파라거스 키우기"
                buttonClassName="w-full px-0 py-3"
              />
            </div>
          </>
        }
      >
        <p className="text-sm font-bold text-[#7f8a8f]">
          괜찮아, 씨앗은 더 있어! 다시 키워볼래?
        </p>
        <p className="inline-flex rounded-xl bg-[#166D77] px-3 py-1.5 text-xs font-bold text-[#FFF8EA]">
          최종 점수: {score}
        </p>
      </CommonModal>
    </GameContainer>
  );
};

export default AsparagusMerge;
