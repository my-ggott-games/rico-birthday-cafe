import React from "react";
import { motion } from "framer-motion";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  CORNER_PETAL_ROTATIONS,
  PIECE_RENDER_BLEED,
  PIECE_SIZE,
  TAP_ROTATE_MAX_MS,
  type PuzzleBoardConfig,
} from "../../../features/puzzle/constants";
import {
  createGuidelinePath,
  getScaledBounds,
} from "../../../features/puzzle/helpers";
import type { PuzzlePiece } from "../../../features/puzzle/types";

type PuzzlePieceComponentProps = {
  piece: PuzzlePiece;
  displayPieceSize: number;
  boardConfig: PuzzleBoardConfig;
  imageUrl: string;
  className?: string;
  showOutline?: boolean;
};

const PuzzlePieceComponent = ({
  piece,
  displayPieceSize,
  boardConfig,
  imageUrl,
  className,
  showOutline = true,
}: PuzzlePieceComponentProps) => {
  const scale = displayPieceSize / PIECE_SIZE;
  const clipId = React.useId().replace(/:/g, "");
  const bleed = PIECE_RENDER_BLEED * scale;
  const renderWidth = piece.expandedBounds.width * scale + bleed * 2;
  const renderHeight = piece.expandedBounds.height * scale + bleed * 2;
  const offsetX = piece.padding.left * scale;
  const offsetY = piece.padding.top * scale;

  return (
    <div
      style={{
        width: `${displayPieceSize}px`,
        height: `${displayPieceSize}px`,
        position: "relative",
        touchAction: "pinch-zoom",
        overflow: "visible",
      }}
      className={`flex items-center justify-center ${className || ""}`}
    >
      <svg
        style={{ width: 0, height: 0, position: "absolute", pointerEvents: "none" }}
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <path
              d={piece.shapePath}
              transform={`translate(${bleed}, ${bleed}) scale(${scale})`}
            />
          </clipPath>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          left: `${-offsetX - bleed}px`,
          top: `${-offsetY - bleed}px`,
          width: `${renderWidth}px`,
          height: `${renderHeight}px`,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${boardConfig.boardWidth * scale}px ${boardConfig.boardHeight * scale}px`,
          backgroundPosition: `${-piece.expandedBounds.x * scale + bleed}px ${-piece.expandedBounds.y * scale + bleed}px`,
          backgroundRepeat: "no-repeat",
          clipPath: `url(#${clipId})`,
          WebkitClipPath: `url(#${clipId})`,
          willChange: "transform",
        }}
      />
      {showOutline && (
        <svg
          viewBox={`${-PIECE_RENDER_BLEED} ${-PIECE_RENDER_BLEED} ${piece.expandedBounds.width + PIECE_RENDER_BLEED * 2} ${piece.expandedBounds.height + PIECE_RENDER_BLEED * 2}`}
          style={{
            position: "absolute",
            left: `${-offsetX - bleed}px`,
            top: `${-offsetY - bleed}px`,
            width: `${renderWidth}px`,
            height: `${renderHeight}px`,
            pointerEvents: "none",
          }}
        >
          <path
            d={piece.shapePath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.88)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={piece.shapePath}
            fill="none"
            stroke="rgba(22, 109, 119, 1)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
};

const PuzzleSlotShape = ({
  piece,
  displayPieceSize,
  boardConfig,
  highlighted = false,
}: {
  piece: PuzzlePiece;
  displayPieceSize: number;
  boardConfig: PuzzleBoardConfig;
  highlighted?: boolean;
}) => {
  const scale = displayPieceSize / PIECE_SIZE;
  const bleed = PIECE_RENDER_BLEED * scale;
  const width = piece.expandedBounds.width * scale + bleed * 2;
  const height = piece.expandedBounds.height * scale + bleed * 2;
  const offsetX = piece.padding.left * scale;
  const offsetY = piece.padding.top * scale;
  const guidelinePath = createGuidelinePath(piece, boardConfig);

  return (
    <svg
      viewBox={`${-PIECE_RENDER_BLEED} ${-PIECE_RENDER_BLEED} ${piece.expandedBounds.width + PIECE_RENDER_BLEED * 2} ${piece.expandedBounds.height + PIECE_RENDER_BLEED * 2}`}
      style={{
        position: "absolute",
        left: `${-offsetX - bleed}px`,
        top: `${-offsetY - bleed}px`,
        width: `${width}px`,
        height: `${height}px`,
        overflow: "visible",
        shapeRendering: "geometricPrecision",
      }}
      aria-hidden
    >
      <path
        d={guidelinePath}
        fill="none"
        stroke={highlighted ? "#1B7C87" : "#166D77"}
        strokeWidth={1.0}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

type DroppableCellProps = {
  id: string;
  slotPiece?: PuzzlePiece;
  placedPiece?: PuzzlePiece | null;
  completed: boolean;
  displayPieceSize: number;
  boardConfig: PuzzleBoardConfig;
  imageUrl: string;
};

export const DroppableCell = ({
  id,
  slotPiece,
  placedPiece,
  completed,
  displayPieceSize,
  boardConfig,
  imageUrl,
}: DroppableCellProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex items-center justify-center transition-all duration-500"
      style={{
        width: `${displayPieceSize}px`,
        height: `${displayPieceSize}px`,
        overflow: "visible",
        position: "relative",
      }}
    >
      {placedPiece && (
        <PuzzlePieceComponent
          piece={placedPiece}
          displayPieceSize={displayPieceSize}
          boardConfig={boardConfig}
          imageUrl={imageUrl}
          showOutline={false}
        />
      )}
      {slotPiece && !completed && (
        <div className="pointer-events-none absolute inset-0 z-[3]">
          <PuzzleSlotShape
            piece={slotPiece}
            displayPieceSize={displayPieceSize}
            boardConfig={boardConfig}
            highlighted={isOver && !placedPiece}
          />
        </div>
      )}
    </div>
  );
};

export const FrameCorner = ({
  className,
  shadowDirection = "down",
}: {
  className: string;
  shadowDirection?: "down" | "up";
}) => (
  <div
    className={`pointer-events-none absolute z-[12] h-11 w-11 overflow-visible sm:h-12 sm:w-12 lg:h-14 lg:w-14 ${className}`}
  >
    <div
      className="absolute inset-[3px] rounded-full sm:inset-[3.5px] lg:inset-[4px]"
      style={{
        background:
          "radial-gradient(circle at 34% 30%, #fffaf0 0%, #f4e4c0 38%, #d4a466 68%, #8d673f 100%)",
        boxShadow:
          shadowDirection === "up"
            ? "0 -14px 24px rgba(75,51,28,0.24), 0 0 0 1px rgba(255,247,235,0.55)"
            : "0 14px 24px rgba(75,51,28,0.26), 0 0 0 1px rgba(255,247,235,0.55)",
      }}
    />
    <svg viewBox="0 0 56 56" className="relative h-full w-full" aria-hidden>
      <g transform="translate(28 28)">
        <circle
          r="25.4"
          fill="rgba(255, 249, 237, 0.58)"
          stroke="#b98b4a"
          strokeWidth="1.2"
        />
        <circle
          r="21.2"
          fill="none"
          stroke="rgba(125, 90, 53, 0.92)"
          strokeWidth="0.9"
        />
        <circle
          r="17.2"
          fill="rgba(255, 247, 232, 0.92)"
          stroke="#c89d60"
          strokeWidth="0.8"
        />
        {CORNER_PETAL_ROTATIONS.map((rotation: number) => (
          <path
            key={rotation}
            d="M 0 -19 C 3.4 -15.5 3.8 -9.5 0 -5.7 C -3.8 -9.5 -3.4 -15.5 0 -19 Z"
            fill="rgba(200, 157, 96, 0.9)"
            stroke="#7d5a35"
            strokeWidth="0.7"
            transform={`rotate(${rotation})`}
          />
        ))}
        <circle
          r="8.2"
          fill="rgba(247, 237, 220, 0.96)"
          stroke="#7d5a35"
          strokeWidth="0.8"
        />
        <circle r="4.3" fill="#b98b4a" />
        <circle r="2.1" fill="#fff7e8" />
        <circle cx="0" cy="-13" r="1.3" fill="#7d5a35" />
        <circle cx="13" cy="0" r="1.3" fill="#7d5a35" />
        <circle cx="0" cy="13" r="1.3" fill="#7d5a35" />
        <circle cx="-13" cy="0" r="1.3" fill="#7d5a35" />
      </g>
    </svg>
  </div>
);

export const DraggablePiece = React.memo(
  ({
    piece,
    onRotate,
    displayPieceSize,
    boardConfig,
    imageUrl,
  }: {
    piece: PuzzlePiece;
    onRotate: (id: number) => void;
    displayPieceSize: number;
    boardConfig: PuzzleBoardConfig;
    imageUrl: string;
  }) => {
    const { attributes, listeners, setNodeRef, isDragging, transform } =
      useDraggable({
        id: piece.id,
        disabled: piece.isPlaced,
      });

    const startRef = React.useRef<{
      x: number;
      y: number;
      time: number;
    } | null>(null);
    const movedRef = React.useRef(false);

    if (piece.isPlaced) return null;

    const { onPointerDown: dndOnPointerDown, ...otherListeners } =
      listeners || {};
    const scale = displayPieceSize / PIECE_SIZE;
    const { renderWidth, renderHeight, offsetX, offsetY } = getScaledBounds(
      piece,
      scale,
    );

    return (
      <div
        ref={setNodeRef}
        style={{
          position: "absolute",
          left: `${piece.currentX - offsetX}px`,
          top: `${piece.currentY - offsetY}px`,
          width: `${renderWidth}px`,
          height: `${renderHeight}px`,
          zIndex: isDragging ? 60 : 20,
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
          willChange: isDragging ? "transform" : undefined,
          touchAction: "pinch-zoom",
        }}
        {...attributes}
        {...otherListeners}
        onPointerDown={(e) => {
          startRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
          movedRef.current = false;

          if (dndOnPointerDown) dndOnPointerDown(e);
        }}
        onPointerMove={(e) => {
          if (!startRef.current) return;

          const deltaX = Math.abs(e.clientX - startRef.current.x);
          const deltaY = Math.abs(e.clientY - startRef.current.y);

          if (deltaX > 3 || deltaY > 3) {
            movedRef.current = true;
          }
        }}
        onPointerUp={() => {
          if (!startRef.current) return;

          const deltaTime = Date.now() - startRef.current.time;

          if (isDragging || movedRef.current) {
            startRef.current = null;
            return;
          }

          if (deltaTime <= TAP_ROTATE_MAX_MS) {
            onRotate(piece.id);
          }

          startRef.current = null;
        }}
        onPointerCancel={() => {
          startRef.current = null;
          movedRef.current = false;
        }}
        className="cursor-pointer"
      >
        <motion.div
          initial={false}
          animate={{ rotate: piece.rotation }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <PuzzlePieceComponent
            piece={piece}
            displayPieceSize={displayPieceSize}
            boardConfig={boardConfig}
            imageUrl={imageUrl}
          />
        </motion.div>
      </div>
    );
  },
  (prev, next) =>
    prev.piece === next.piece &&
    prev.displayPieceSize === next.displayPieceSize &&
    prev.boardConfig === next.boardConfig &&
    prev.imageUrl === next.imageUrl,
);
