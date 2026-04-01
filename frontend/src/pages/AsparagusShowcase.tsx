import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Board } from "../components/asparagus/Board";
import { Items } from "../components/asparagus/Items";
import { Tile } from "../components/asparagus/Tile";
import { STAGES } from "../components/asparagus/constants";
import { type Grid } from "../components/asparagus/types";
import { GameContainer } from "../components/common/GameContainer";
import { ASPARAGUS_TUTORIAL_SLIDES } from "../constants/tutorialSlides";

const STAGE_VALUES = Object.keys(STAGES)
  .map(Number)
  .sort((a, b) => a - b);

const INITIAL_PREVIEW_GRID: Grid = [
  [1, 2, 4, 8],
  [16, 32, 64, 128],
  [256, 512, 1024, 2048],
  [null, 8, null, 64],
];

const cloneGrid = (grid: Grid): Grid => grid.map((row) => [...row]) as Grid;

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

const StagePreviewCard = ({
  value,
  isSwapMode,
}: {
  value: number;
  isSwapMode: boolean;
}) => {
  const stage = STAGES[value];

  return (
    <div className="rounded-[1.75rem] border border-white/55 bg-white/55 p-4 shadow-[0_18px_45px_rgba(20,91,96,0.08)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#4f9384]">
            Stage {value}
          </p>
          <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-[#154d54]">
            {stage.name}
          </h3>
        </div>
        <span className="rounded-full border border-[#b9e6da] bg-[#f3fffb] px-3 py-1 text-xs font-black text-[#2d6a4f]">
          {value}
        </span>
      </div>

      <div className="mt-4 rounded-[1.35rem] border-2 border-[#e8fff7] bg-[linear-gradient(180deg,rgba(255,255,255,0.48)_0%,rgba(255,255,255,0.2)_100%)] p-3">
        <div className="aspect-square w-full">
          <Tile value={value} isSwapMode={isSwapMode} />
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-xs font-bold text-[#4d6b68]">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7fffc] px-3 py-2">
          <dt>Background</dt>
          <dd className="truncate text-right text-[#1f6760]">{stage.bg}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7fffc] px-3 py-2">
          <dt>Text</dt>
          <dd className="font-mono text-[#1f6760]">{stage.text}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f7fffc] px-3 py-2">
          <dt>Icon</dt>
          <dd className="font-mono text-[#1f6760]">{stage.iconColor}</dd>
        </div>
      </dl>
    </div>
  );
};

const AsparagusShowcase: React.FC = () => {
  const [previewGrid, setPreviewGrid] = useState<Grid>(() =>
    cloneGrid(INITIAL_PREVIEW_GRID),
  );
  const [selection, setSelection] = useState<{ r: number; c: number } | null>(
    null,
  );
  const [isSwapMode, setIsSwapMode] = useState(false);

  const resetPreview = () => {
    setPreviewGrid(cloneGrid(INITIAL_PREVIEW_GRID));
    setSelection(null);
    setIsSwapMode(false);
  };

  const handleTileClick = (r: number, c: number) => {
    if (!isSwapMode) return;

    if (!selection) {
      setSelection({ r, c });
      return;
    }

    if (selection.r === r && selection.c === c) {
      setSelection(null);
      return;
    }

    setPreviewGrid((prev) => {
      const next = cloneGrid(prev);
      const temp = next[selection.r][selection.c];
      next[selection.r][selection.c] = next[r][c];
      next[r][c] = temp;
      return next;
    });
    setSelection(null);
  };

  return (
    <GameContainer
      title="아스파라거스 UI 샘플"
      desc="성장 단계, 보드 border, 배경 컬러를 한 번에 점검하는 페이지"
      gameName="아스파라거스 UI 샘플"
      helpSlides={ASPARAGUS_TUTORIAL_SLIDES}
      className="bg-[linear-gradient(180deg,#f6fff9_0%,#effcf6_42%,#e8fafb_100%)] text-[#123f46] select-none"
      mainClassName="pb-16"
      headerRight={
        <Link
          to="/game/asparagus"
          className="rounded-full border border-[#b6e6da] bg-white/80 px-4 py-2 text-sm font-black text-[#166D77] shadow-[0_10px_30px_rgba(44,119,111,0.08)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white"
        >
          실게임 보기
        </Link>
      }
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-4 sm:px-6 lg:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/65 bg-white/55 p-6 shadow-[0_24px_80px_rgba(20,91,96,0.12)] backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-x-[-12%] top-[-18%] h-56 rounded-full bg-[radial-gradient(circle,rgba(122,214,177,0.34)_0%,rgba(122,214,177,0)_72%)]" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#54a691]">
                Stage Gallery
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#154d54] sm:text-4xl">
                모든 성장 단계 미리보기
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#476865] sm:text-base">
                타일별 배경, 테두리, 아이콘 컬러를 한 화면에서 확인할 수
                있습니다. 오른쪽 프리뷰에서 `바꾸기`를 켜면 모든 단계 카드도
                같은 강조 상태로 함께 보입니다.
              </p>
            </div>

            <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {STAGE_VALUES.map((value) => (
                <StagePreviewCard
                  key={value}
                  value={value}
                  isSwapMode={isSwapMode}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-white/65 bg-white/60 p-5 shadow-[0_20px_65px_rgba(20,91,96,0.1)] backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#54a691]">
                Board Preview
              </p>
              <div className="mt-4 flex gap-3">
                <ScoreCard
                  label="Score"
                  value={9876}
                  background="#166D77"
                  textColor="#FFFFF8"
                />
                <ScoreCard
                  label="Best"
                  value={2048}
                  background="#2d6a4f"
                  textColor="#bef264"
                />
              </div>

              <div className="mt-5">
                <Board
                  grid={previewGrid}
                  selection={selection}
                  isSwapMode={isSwapMode}
                  onTileClick={handleTileClick}
                  onMove={() => undefined}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/65 bg-white/60 p-5 shadow-[0_20px_65px_rgba(20,91,96,0.1)] backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#54a691]">
                Control Preview
              </p>
              <p className="mt-3 text-sm leading-6 text-[#4a6d69]">
                실제 버튼 border와 활성 상태를 바로 볼 수 있습니다. `되돌리기`
                는 프리뷰 보드를 초기 상태로 되돌리고, `바꾸기`는 강조선을
                토글합니다.
              </p>

              <div className="mt-4">
                <Items
                  undoCount={1}
                  swapCount={1}
                  historyLength={1}
                  isSwapMode={isSwapMode}
                  debugMode={false}
                  onUndo={resetPreview}
                  onToggleSwapMode={() => {
                    setIsSwapMode((prev) => !prev);
                    setSelection(null);
                  }}
                  onRestart={resetPreview}
                  onDebugStart={() =>
                    setPreviewGrid([
                      [256, 512, 1024, 2048],
                      [128, 256, 512, 1024],
                      [32, 64, 128, 256],
                      [null, 8, 16, 32],
                    ])
                  }
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/65 bg-white/60 p-5 shadow-[0_20px_65px_rgba(20,91,96,0.1)] backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#54a691]">
                State Check
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-[1.4rem] border border-[#dff7ef] bg-[#f7fffc] p-3">
                  <p className="mb-3 text-xs font-black text-[#3f6e68]">
                    Empty
                  </p>
                  <div className="aspect-square">
                    <Tile value={null} />
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-[#dff7ef] bg-[#f7fffc] p-3">
                  <p className="mb-3 text-xs font-black text-[#3f6e68]">
                    Empty + Swap
                  </p>
                  <div className="aspect-square">
                    <Tile value={null} isSwapMode />
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-[#dff7ef] bg-[#f7fffc] p-3">
                  <p className="mb-3 text-xs font-black text-[#3f6e68]">
                    Filled + Swap
                  </p>
                  <div className="aspect-square">
                    <Tile value={64} isSwapMode />
                  </div>
                </div>
                <div className="rounded-[1.4rem] border border-[#dff7ef] bg-[#f7fffc] p-3">
                  <p className="mb-3 text-xs font-black text-[#3f6e68]">
                    Selected
                  </p>
                  <div className="aspect-square">
                    <Tile value={64} isSwapMode isSelected />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </GameContainer>
  );
};

export default AsparagusShowcase;
