import { useMemo, useState } from "react";
import { GameContainer } from "../components/common/GameContainer";
import { ScoreStatCard } from "../components/common/ScoreStatCard";
import { ScoreStatGroup } from "../components/common/ScoreStatGroup";
import { AdventureModal } from "../components/game/adventure/AdventureModal";
import { AdventureGamePanel } from "../components/game/adventure/AdventureGamePanel";
import { ADVENTURE_HELP_SLIDES } from "../constants/tutorialSlides";
import { AdventureStageScene } from "../features/adventure/AdventureStageScene";
import { useAdventureGame } from "../features/adventure/useAdventureGame";
import { usePageBgm } from "../hooks/usePageBgm";
import { pickRandomActivityBgm } from "../utils/bgm";

export default function AdventureGame() {
  const [bgmSrc] = useState(() => pickRandomActivityBgm());
  usePageBgm(bgmSrc, { volume: 0.48 });

  const {
    runState,
    score,
    bestScore,
    displaySpeedTier,
    resultScore,
    stageScale,
    introInstructionMessage,
    stageViewportRef,
    isMobile,
    playerYRef,
    playerFrameRef,
    trapsRef,
    scoreRef,
    renderCallbackRef,
    isMobileRef,
    runStateRef,
    startGame,
    restartGame,
    resumeGame,
    togglePause,
    handleStagePointerDown,
    handleStagePointerUp,
  } = useAdventureGame();

  const targetProgress = Math.min(100, (score / 1000) * 100);

  // stageScene is stable: only re-creates when structural/layout props change
  const stageScene = useMemo(
    () => (
      <AdventureStageScene
        stageViewportRef={stageViewportRef}
        stageScale={stageScale}
        playerYRef={playerYRef}
        playerFrameRef={playerFrameRef}
        trapsRef={trapsRef}
        scoreRef={scoreRef}
        renderCallbackRef={renderCallbackRef}
        isMobileRef={isMobileRef}
        runStateRef={runStateRef}
        isMobile={isMobile}
        onPointerDown={handleStagePointerDown}
        onPointerUp={handleStagePointerUp}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stageScale, isMobile, handleStagePointerDown, handleStagePointerUp],
  );

  const overlayModal =
    runState === "ready" ? (
      <AdventureModal
        embedded
        status="유산소 시작이다!"
        title="준비됐어?"
        description="마왕을 물리치려면 이 정도는 기본이지"
        actions={[{ label: "시작하기", onClick: startGame }]}
      />
    ) : runState === "paused" ? (
      <AdventureModal
        embedded
        status={`${score}점`}
        title="용사에게도 휴식이 필요해"
        description="다시 훈련에 집중해볼까?"
        actions={[
          { label: "이어서 달리기", onClick: resumeGame },
          { label: "처음부터", onClick: restartGame, tone: "secondary" },
        ]}
      />
    ) : runState === "gameover" ? (
      <AdventureModal
        embedded
        status={`${resultScore}점`}
        title={
          resultScore >= 1000
            ? "오늘 운동도 알찼다"
            : "케이크 한 조각 정도는..."
        }
        description={
          resultScore >= 1000 ? "줄여서 오운R" : "안 돼! 정신 차려!!"
        }
        actions={[{ label: "다시 달리기", onClick: restartGame }]}
      >
        <div className="grid grid-cols-2 gap-3">
          <ScoreStatCard
            label="Best"
            value={Math.max(bestScore, resultScore)}
            background="#102542"
            className="rounded-xl"
            valueClassName="text-lg"
          />
          <ScoreStatCard
            label="Speed"
            value={Math.floor(resultScore / 100)}
            background="#166D77"
            className="rounded-xl"
            valueClassName="text-lg"
          />
        </div>
      </AdventureModal>
    ) : null;

  const headerStats = useMemo(
    () => (
      <ScoreStatGroup
        items={[
          {
            label: "Score",
            value: score,
            background: "#102542",
            className: "min-w-[80px] sm:min-w-[96px]",
          },
          {
            label: "Best",
            value: bestScore,
            background: "#166D77",
            className: "min-w-[80px] sm:min-w-[96px]",
          },
          {
            label: "Speed",
            value: displaySpeedTier,
            background: "#f97316",
            textColor: "#fff7ef",
            className: "min-w-[80px] sm:min-w-[96px]",
          },
        ]}
      />
    ),
    [bestScore, displaySpeedTier, score],
  );

  return (
    <GameContainer
      title="용사 리코 이야기 1"
      desc="용사의 훈련은 계속된다"
      gameName="용사 리코 이야기 1"
      helpSlides={ADVENTURE_HELP_SLIDES}
      className="bg-[linear-gradient(180deg,#fffdf7_0%,#fff6e2_100%)]"
      mainClassName="px-4 pb-10 sm:px-6"
      returnButtonVariant="mint"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="flex flex-col items-center justify-between gap-2 rounded-2xl border-2 border-[#102542]/10 bg-white/80 p-3 sm:gap-3 sm:p-4 lg:flex-row">
          <div className="select-none">{headerStats}</div>
          <div className="select-none w-full max-w-full lg:max-w-[18rem]">
            <div className="mb-1.5 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-[#166D77] sm:mb-2 text-center lg:text-left">
              <span>R전드 게이지</span>
              <span>{Math.min(score, 1000)} / 1000</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#d9efe8] sm:h-3">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#5EC7A5_0%,#f59e0b_100%)] transition-[width] duration-200"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div>
          <AdventureGamePanel
            runState={runState}
            introInstructionMessage={introInstructionMessage}
            introOverlayOpacity={1}
            introMessageOpacity={1}
            showMapVolumeUi={false}
            onPauseToggle={togglePause}
            gameCanvas={stageScene}
            mapVolumeControls={null}
            overlayModal={overlayModal}
          />
        </div>
      </div>
    </GameContainer>
  );
}
