import React from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type SensorDescriptor,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { PushableButton } from "../../components/common/PushableButton";
import { ShareButtonGroup } from "../../components/common/ShareButtonGroup";
import { MagnifyingGlass } from "../../components/game/puzzle/MagnifyingGlass";
import { MuseumPlaque } from "../../components/game/puzzle/MuseumPlaque";
import {
  DraggablePiece,
  DroppableCell,
  FrameCorner,
} from "../../components/game/puzzle/PuzzleBoardElements";
import { HolographicCard } from "../../components/common/HolographicCard";
import { HoloPointerHint } from "../../components/game/puzzle/HoloPointerHint";
import { PolaroidHolographicOverlay } from "../../components/game/cody/polaroidEffects/PolaroidHolographicOverlay";
import {
  PUZZLE_GRID_OPTIONS,
  type PuzzleGridSize,
  type PuzzleBoardConfig,
} from "./constants";
import type { PuzzlePiece } from "./types";

type PuzzleGameBoardViewProps = {
  sensors: SensorDescriptor<any>[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  playAreaRef: React.RefObject<HTMLDivElement | null>;
  boardRef: React.RefObject<HTMLDivElement | null>;
  artworkRef: React.RefObject<HTMLDivElement | null>;
  gridSize: PuzzleGridSize;
  handleGridSizeChange: (gridSize: PuzzleGridSize) => void;
  displayPieceSize: number;
  cols: number;
  rows: number;
  boardWidth: number;
  boardHeight: number;
  completed: boolean;
  pieces: PuzzlePiece[];
  boardConfig: PuzzleBoardConfig;
  gameplayImageUrl: string;
  detailImageUrl: string;
  isMagnifierActive: boolean;
  magnifierPoint: { x: number; y: number };
  updateMagnifierPoint: (clientX: number, clientY: number) => void;
  setIsMagnifierActive: React.Dispatch<React.SetStateAction<boolean>>;
  photocardModeEnabled: boolean;
  handlePhotocardMode: () => void;
  handleReplay: () => void;
  handleRotate: (id: number) => void;
  isAdmin: boolean;
  handleDebugComplete: () => void;
};

export const PuzzleGameBoardView: React.FC<PuzzleGameBoardViewProps> = ({
  sensors,
  handleDragStart,
  handleDragEnd,
  playAreaRef,
  boardRef,
  artworkRef,
  gridSize,
  handleGridSizeChange,
  displayPieceSize,
  cols,
  rows,
  boardWidth,
  boardHeight,
  completed,
  pieces,
  boardConfig,
  gameplayImageUrl,
  detailImageUrl,
  isMagnifierActive,
  magnifierPoint,
  updateMagnifierPoint,
  setIsMagnifierActive,
  photocardModeEnabled,
  handlePhotocardMode,
  handleReplay,
  handleRotate,
  isAdmin,
  handleDebugComplete,
}) => {
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={playAreaRef}
        className="relative flex h-full min-h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-[#FFFFF8] pb-[calc(env(safe-area-inset-bottom)+6.5rem)] select-none lg:overflow-hidden lg:pb-0"
        style={{ touchAction: "pinch-zoom" }}
      >
        <svg
          style={{
            width: 0,
            height: 0,
            position: "absolute",
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <defs>
            <image
              id="shared-puzzle-img"
              href={gameplayImageUrl}
              width={boardWidth}
              height={boardHeight}
              preserveAspectRatio="none"
            />
          </defs>
        </svg>
        <div className="flex w-full flex-1 overflow-visible lg:overflow-hidden">
          <div
            className="flex-1 relative bg-[rgba(239,246,255,0.1)] hidden lg:block"
            id="area-left"
          />

          <div className="z-10 flex flex-1 items-center justify-center my-2 px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex w-full flex-col items-center">
              <div
                ref={boardRef}
                className="relative rounded-[2.3rem] p-[14px]"
                style={{
                  background:
                    "linear-gradient(145deg, #4B331C 0%, #7D5A35 22%, #BC9159 48%, #E8D2A8 76%, #8D673F 100%)",
                }}
              >
                <FrameCorner className="-left-4 -top-4 sm:-left-5 sm:-top-5 lg:-left-6 lg:-top-6" />
                <FrameCorner className="-right-4 -top-4 sm:-right-5 sm:-top-5 lg:-right-6 lg:-top-6" />
                <FrameCorner
                  className="-bottom-4 -left-4 sm:-bottom-5 sm:-left-5 lg:-bottom-6 lg:-left-6"
                  shadowDirection="up"
                />
                <FrameCorner
                  className="-bottom-4 -right-4 sm:-bottom-5 sm:-right-5 lg:-bottom-6 lg:-right-6"
                  shadowDirection="up"
                />
                <div className="pointer-events-none absolute inset-[6px] rounded-[2rem] border border-[#fff6df]/35" />

                <div className="relative rounded-[1.7rem] border border-[#fff7eb] bg-[linear-gradient(180deg,#f8f4ea_0%,#ede5d3_100%)] p-4 sm:p-5">
                  {!completed && (
                    <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                      {PUZZLE_GRID_OPTIONS.map((option) => (
                        <PushableButton
                          key={option}
                          type="button"
                          onClick={() => handleGridSizeChange(option)}
                          variant={gridSize === option ? "mint" : "cream"}
                          className="min-w-[4.75rem] justify-center px-4 py-2 text-xs"
                        >
                          {option} x {option}
                        </PushableButton>
                      ))}
                    </div>
                  )}
                  <div
                    className="relative"
                    style={{
                      width: `${displayPieceSize * cols}px`,
                      height: `${displayPieceSize * rows}px`,
                    }}
                  >
                    <div
                      ref={artworkRef}
                      className="relative w-full h-full overflow-hidden border border-[#e8ddc6] bg-[#faf8f1]"
                    >
                      <div className="pointer-events-none absolute inset-0 z-[1] border border-white/35" />
                      {!completed && (
                        <div
                          className="pointer-events-none absolute inset-0 z-[1]"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0) 20%, rgba(68,46,24,0.04) 100%)",
                          }}
                        />
                      )}
                      <div
                        className="absolute inset-0 z-[2] grid gap-0"
                        style={{
                          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: rows * cols }).map((_, index) => {
                          const col = index % cols;
                          const row = Math.floor(index / cols);
                          const cellId = `cell-${col}-${row}`;
                          const slotPiece = pieces.find(
                            (piece) =>
                              piece.correctX === col && piece.correctY === row,
                          );
                          const placedPiece = pieces.find(
                            (piece) =>
                              piece.isPlaced &&
                              piece.correctX === col &&
                              piece.correctY === row,
                          );

                          return (
                            <DroppableCell
                              key={index}
                              id={cellId}
                              slotPiece={slotPiece}
                              placedPiece={placedPiece}
                              completed={completed}
                              displayPieceSize={displayPieceSize}
                              boardConfig={boardConfig}
                              imageUrl={gameplayImageUrl}
                            />
                          );
                        })}
                      </div>
                      {completed && !photocardModeEnabled && (
                        <PolaroidHolographicOverlay
                          visible={true}
                          mobileInteractive={false}
                          orientationEnabled={false}
                          desktopSweep={true}
                          imageUrl={detailImageUrl}
                        />
                      )}
                      {completed && (
                        <>
                          <div
                            className="absolute inset-0 z-[5] cursor-zoom-in"
                            onMouseDown={(event) => {
                              updateMagnifierPoint(
                                event.clientX,
                                event.clientY,
                              );
                              setIsMagnifierActive(true);
                            }}
                            onMouseMove={(event) => {
                              if (!isMagnifierActive) return;
                              updateMagnifierPoint(
                                event.clientX,
                                event.clientY,
                              );
                            }}
                            onMouseLeave={() => setIsMagnifierActive(false)}
                            onTouchStart={(event) => {
                              const touch = event.touches[0];
                              if (!touch) return;
                              updateMagnifierPoint(
                                touch.clientX,
                                touch.clientY,
                              );
                              setIsMagnifierActive(true);
                            }}
                            onTouchMove={(event) => {
                              const touch = event.touches[0];
                              if (!touch) return;
                              event.preventDefault();
                              updateMagnifierPoint(
                                touch.clientX,
                                touch.clientY,
                              );
                            }}
                            onTouchEnd={() => setIsMagnifierActive(false)}
                            onTouchCancel={() => setIsMagnifierActive(false)}
                            aria-label="완성된 그림 확대해서 보기"
                          />
                          <MagnifyingGlass
                            visible={isMagnifierActive}
                            imageUrl={detailImageUrl}
                            boardWidth={displayPieceSize * cols}
                            boardHeight={displayPieceSize * rows}
                            pointerX={magnifierPoint.x}
                            pointerY={magnifierPoint.y}
                          />
                        </>
                      )}
                    </div>
                    {photocardModeEnabled && (
                      <div className="absolute inset-0 z-[60] flex items-center justify-center">
                        <div
                          className="relative"
                          style={{
                            width: `${displayPieceSize * cols}px`,
                            height: `${displayPieceSize * rows}px`,
                          }}
                        >
                          <HolographicCard
                            imageSrc={detailImageUrl}
                            width={`${displayPieceSize * cols}px`}
                            height={`${displayPieceSize * rows}px`}
                            foilType="holo"
                          />
                          <HoloPointerHint active={photocardModeEnabled} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {completed && (
                <div className="mt-5 flex w-full max-w-[19rem] flex-col items-center gap-4 lg:hidden">
                  <motion.div
                    initial={{ opacity: 0, y: -24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="w-full"
                  >
                    <MuseumPlaque className="mt-0 w-full max-w-none" />
                  </motion.div>
                  <div className="flex w-full items-center gap-3">
                    <PushableButton
                      onClick={handlePhotocardMode}
                      className="flex-1 justify-center"
                      variant="mint"
                    >
                      {photocardModeEnabled ? "홀로그램 끄기" : "홀로그램 모드"}
                    </PushableButton>
                    <PushableButton
                      onClick={handleReplay}
                      className="flex-1 justify-center"
                      variant="cream"
                    >
                      다시하기
                    </PushableButton>
                  </div>
                  <ShareButtonGroup
                    urlToShare={`${window.location.origin}/game/puzzle`}
                    gameName="퍼즐 맞추기"
                  />
                </div>
              )}
            </div>
          </div>

          <div
            className="relative hidden flex-1 bg-[rgba(254,242,242,0.1)] lg:block"
            id="area-right"
          >
            {completed && (
              <div className="absolute inset-0 flex items-center justify-center px-8">
                <div className="flex w-full max-w-[19rem] flex-col items-center gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -36 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full"
                  >
                    <MuseumPlaque className="mt-0" />
                  </motion.div>
                  <PushableButton
                    onClick={handlePhotocardMode}
                    className="w-full justify-center"
                    variant="mint"
                  >
                    {photocardModeEnabled ? "홀로그램 끄기" : "홀로그램 모드"}
                  </PushableButton>
                  <PushableButton
                    onClick={handleReplay}
                    className="w-full justify-center"
                    variant="cream"
                  >
                    다시 하기
                  </PushableButton>
                  <ShareButtonGroup
                    urlToShare={`${window.location.origin}/game/puzzle`}
                    gameName="퍼즐 맞추기"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="relative flex h-[180px] w-full items-end justify-center bg-[rgba(240,253,244,0.1)] px-4 pb-6 sm:h-[200px]"
          id="area-bottom"
        />

        <div className="absolute inset-0 pointer-events-none z-[30]">
          <div className="pointer-events-auto">
            {pieces.map((piece) => (
              <DraggablePiece
                key={piece.id}
                piece={piece}
                onRotate={handleRotate}
                displayPieceSize={displayPieceSize}
                boardConfig={boardConfig}
                imageUrl={gameplayImageUrl}
              />
            ))}
          </div>
        </div>

        {!completed && isAdmin && (
          <div className="fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[120] flex justify-end px-0">
            <button
              type="button"
              onClick={handleDebugComplete}
              className="rounded-full border border-[#166D77]/30 bg-[#166D77] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#FFFFF8] shadow-[0_12px_26px_rgba(22,109,119,0.28)] transition-transform hover:scale-[1.04] active:scale-[0.98] sm:text-xs sm:tracking-[0.22em]"
            >
              DEBUG: COMPLETE PUZZLE
            </button>
          </div>
        )}
      </div>
    </DndContext>
  );
};
