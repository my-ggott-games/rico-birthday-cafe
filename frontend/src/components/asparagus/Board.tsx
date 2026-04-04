import React from "react";
import { AnimatePresence } from "framer-motion";
import { Tile } from "./Tile";
import { type Grid, type Direction } from "./types";
import { GRID_SIZE, WIN_VALUE } from "./constants";
import { AppIcon } from "../common/AppIcon";
import { PushableButton } from "../common/PushableButton";

// Responsive board geometry for mobile-safe fit.

interface BoardProps {
  grid: Grid;
  selection: { r: number; c: number } | null;
  isSwapMode: boolean;
  onTileClick: (r: number, c: number) => void;
  onMove: (dir: Direction) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

const ArrowButton = ({
  dir,
  onClick,
}: {
  dir: Direction;
  onClick: () => void;
}) => {
  const icons: Record<
    Direction,
    "ArrowBigUp" | "ArrowBigDown" | "ArrowBigLeft" | "ArrowBigRight"
  > = {
    up: "ArrowBigUp",
    down: "ArrowBigDown",
    left: "ArrowBigLeft",
    right: "ArrowBigRight",
  };
  return (
    <PushableButton
      onClick={onClick}
      className="h-16 w-16 px-0 py-0 sm:h-[4.5rem] sm:w-[4.5rem]"
      aria-label={`${dir} 이동`}
    >
      <AppIcon name={icons[dir]} size={28} strokeWidth={2.6} />
    </PushableButton>
  );
};

export const Board: React.FC<BoardProps> = ({
  grid,
  selection,
  isSwapMode,
  onTileClick,
  onMove,
  onTouchStart,
  onTouchEnd,
}) => {
  const boardPadding = "clamp(10px, 2.4vw, 20px)";
  const cellRadius = "clamp(12px, 2.8vw, 20px)";
  const boardRadius = "calc(var(--cell-radius) + var(--board-padding))";
  const boardSize = "min(100%, clamp(340px, 92vw, 520px))";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        className="relative aspect-square flex items-center justify-center"
        style={
          {
            "--board-padding": boardPadding,
            "--cell-radius": cellRadius,
            width: boardSize,
            background:
              "linear-gradient(135deg, #73c5a8 0%, #7fd0a9 42%, #6fcbb3 100%)",
            borderRadius: boardRadius,
            padding: "var(--board-padding)",
            border: "3px solid rgba(18, 94, 91, 0.72)",
            boxShadow:
              "0 30px 80px rgba(84, 182, 160, 0.24)",
            touchAction: "pinch-zoom", // Keep swipe interactions while allowing browser zoom gestures
            marginInline: "auto",
          } as React.CSSProperties
        }
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="pointer-events-none absolute"
          style={{
            inset: "calc(var(--board-padding) * 0.55)",
            borderRadius: "calc(var(--cell-radius) + 6px)",
            border: "2px solid rgba(255,255,255,0.16)",
            boxShadow: "none",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            gap: "clamp(8px, 2.2vw, 18px)",
            width: "100%",
            height: "100%",
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  aspectRatio: "1 / 1",
                  overflow: cell === WIN_VALUE ? "visible" : "hidden",
                  zIndex: cell === WIN_VALUE ? 2 : 1,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)",
                    borderRadius: "var(--cell-radius)",
                    border: "2px solid rgba(244,255,249,0.78)",
                  }}
                />
                <AnimatePresence mode="popLayout">
                  <div className="absolute inset-0">
                    <Tile
                      value={cell}
                      isSwapMode={isSwapMode}
                      isSelected={selection?.r === r && selection?.c === c}
                      onClick={isSwapMode ? () => onTileClick(r, c) : undefined}
                    />
                  </div>
                </AnimatePresence>
              </div>
            )),
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex w-full justify-center">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:flex-nowrap">
          <ArrowButton dir="left" onClick={() => onMove("left")} />
          <ArrowButton dir="up" onClick={() => onMove("up")} />
          <ArrowButton dir="down" onClick={() => onMove("down")} />
          <ArrowButton dir="right" onClick={() => onMove("right")} />
        </div>
      </div>
    </div>
  );
};
