import React, { useEffect, useRef, useState } from "react";

import { GameContainer } from "../components/common/GameContainer";
import type { TutorialSlide } from "../components/common/TutorialBanner";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { BASE_URL } from "../utils/api";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { HolographicOverlay } from "../components/game/HolographicOverlay";
import { ActionButton } from "../components/common/ActionButton";

const PUZZLE_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "🧩 퍼즐 맞추기",
    lines: ["조각을 꾸~욱 눌러 퍼즐을 맞추자", "알맞은 위치에 놓아줘!"],
    showArrows: false,
  },
  {
    title: "🔄 탭하면 회전",
    lines: ["조각을 탭해서 올바른 방향으로 바꾸자"],
    showArrows: false,
  },
  {
    title: "어떤 그림일까?",
    lines: ["제한 시간은 없으니", "여유롭게 즐겨줘!"],
    showArrows: false,
  },
];

// --- Constants ---
const ROWS = 10;
const COLS = 10;
const PIECE_SIZE = 100;
const CONNECTOR_NECK = 16;
const CONNECTOR_DEPTH = 16;
const BOARD_SIZE = {
  width: COLS * PIECE_SIZE,
  height: ROWS * PIECE_SIZE,
};
const MIN_DISPLAY_PIECE_SIZE = 24;
const MOBILE_BOARD_HORIZONTAL_PADDING = 96;
const DESKTOP_BOARD_HORIZONTAL_PADDING = 96;
const MOBILE_BOARD_VERTICAL_PADDING = 360;
const DESKTOP_BOARD_VERTICAL_PADDING = 180;
const MOUSE_DRAG_DISTANCE_PX = 4;
const TOUCH_DRAG_ACTIVATION_DELAY_MS = 90;
const TOUCH_DRAG_TOLERANCE_PX = 10;
const TAP_ROTATE_MAX_MS = 180;
const IMAGE_URL = "/assets/rico_puzzle_birthday_banquet.png";
const PUZZLE_ACHIEVEMENT_CODE = "FIRST_PUZZLE";

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// --- Types ---
type EdgeValue = -1 | 0 | 1;

type EdgeTypes = {
  top: EdgeValue;
  right: EdgeValue;
  bottom: EdgeValue;
  left: EdgeValue;
};

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PiecePadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

interface PuzzlePiece {
  id: number;
  correctX: number;
  correctY: number;
  currentX: number;
  currentY: number;
  rotation: number;
  isPlaced: boolean;
  shapePath: string;
  edgeTypes: EdgeTypes;
  padding: PiecePadding;
  expandedBounds: Bounds;
  cropArea: Bounds;
}

// --- Helpers ---
const getDisplayPieceSize = (viewportWidth: number, viewportHeight: number) => {
  const isDesktop = viewportWidth >= 1024;
  const availableBoardWidth =
    (isDesktop ? viewportWidth * 0.42 : viewportWidth) -
    (isDesktop
      ? DESKTOP_BOARD_HORIZONTAL_PADDING
      : MOBILE_BOARD_HORIZONTAL_PADDING);
  const availableBoardHeight =
    viewportHeight -
    (isDesktop
      ? DESKTOP_BOARD_VERTICAL_PADDING
      : MOBILE_BOARD_VERTICAL_PADDING);

  return Math.max(
    MIN_DISPLAY_PIECE_SIZE,
    Math.min(
      PIECE_SIZE,
      Math.floor(availableBoardWidth / COLS),
      Math.floor(availableBoardHeight / ROWS),
    ),
  );
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const requestSensorPermission = async () => {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return true;
  }

  if (!window.isSecureContext) {
    return false;
  }

  const orientationEvent = window.DeviceOrientationEvent as
    | DeviceOrientationEventWithPermission
    | undefined;
  const motionEvent = window.DeviceMotionEvent as
    | DeviceMotionEventWithPermission
    | undefined;

  const permissionRequests: Array<Promise<"granted" | "denied">> = [];

  if (typeof orientationEvent?.requestPermission === "function") {
    permissionRequests.push(orientationEvent.requestPermission());
  }

  if (typeof motionEvent?.requestPermission === "function") {
    permissionRequests.push(motionEvent.requestPermission());
  }

  if (permissionRequests.length === 0) {
    return true;
  }

  try {
    const results = await Promise.all(permissionRequests);
    return results.every((result) => result === "granted");
  } catch (error) {
    console.error("Device sensor permission request failed", error);
    return false;
  }
};

const getNodeEnv = () =>
  (
    globalThis as typeof globalThis & {
      process?: { env?: { NODE_ENV?: string } };
    }
  ).process?.env?.NODE_ENV;

const createInterlockingPath = (
  edges: PuzzlePiece["edgeTypes"],
  padding: PiecePadding,
) => {
  const x0 = padding.left;
  const y0 = padding.top;
  const x1 = x0 + PIECE_SIZE;
  const y1 = y0 + PIECE_SIZE;
  const midX = x0 + PIECE_SIZE / 2;
  const midY = y0 + PIECE_SIZE / 2;

  const neck = CONNECTOR_NECK;
  const depth = CONNECTOR_DEPTH;

  const top =
    edges.top === 0
      ? `L ${x1} ${y0}`
      : `L ${midX - neck} ${y0}
         C ${midX - neck} ${y0 + edges.top * -depth * 0.45},
           ${midX - neck * 0.55} ${y0 + edges.top * -depth},
           ${midX} ${y0 + edges.top * -depth}
         C ${midX + neck * 0.55} ${y0 + edges.top * -depth},
           ${midX + neck} ${y0 + edges.top * -depth * 0.45},
           ${midX + neck} ${y0}
         L ${x1} ${y0}`;

  const right =
    edges.right === 0
      ? `L ${x1} ${y1}`
      : `L ${x1} ${midY - neck}
         C ${x1 + edges.right * depth * 0.45} ${midY - neck},
           ${x1 + edges.right * depth} ${midY - neck * 0.55},
           ${x1 + edges.right * depth} ${midY}
         C ${x1 + edges.right * depth} ${midY + neck * 0.55},
           ${x1 + edges.right * depth * 0.45} ${midY + neck},
           ${x1} ${midY + neck}
         L ${x1} ${y1}`;

  const bottom =
    edges.bottom === 0
      ? `L ${x0} ${y1}`
      : `L ${midX + neck} ${y1}
         C ${midX + neck} ${y1 + edges.bottom * depth * 0.45},
           ${midX + neck * 0.55} ${y1 + edges.bottom * depth},
           ${midX} ${y1 + edges.bottom * depth}
         C ${midX - neck * 0.55} ${y1 + edges.bottom * depth},
           ${midX - neck} ${y1 + edges.bottom * depth * 0.45},
           ${midX - neck} ${y1}
         L ${x0} ${y1}`;

  const left =
    edges.left === 0
      ? `L ${x0} ${y0}`
      : `L ${x0} ${midY + neck}
         C ${x0 + edges.left * -depth * 0.45} ${midY + neck},
           ${x0 + edges.left * -depth} ${midY + neck * 0.55},
           ${x0 + edges.left * -depth} ${midY}
         C ${x0 + edges.left * -depth} ${midY - neck * 0.55},
           ${x0 + edges.left * -depth * 0.45} ${midY - neck},
           ${x0} ${midY - neck}
         L ${x0} ${y0}`;

  return `M ${x0} ${y0} ${top} ${right} ${bottom} ${left} Z`
    .replace(/\s+/g, " ")
    .trim();
};

const createGuidelinePath = (
  piece: Pick<PuzzlePiece, "edgeTypes" | "padding" | "correctX" | "correctY">,
) => {
  const { edgeTypes: edges, padding, correctX, correctY } = piece;
  const x0 = padding.left;
  const y0 = padding.top;
  const x1 = x0 + PIECE_SIZE;
  const y1 = y0 + PIECE_SIZE;
  const midX = x0 + PIECE_SIZE / 2;
  const midY = y0 + PIECE_SIZE / 2;

  const neck = CONNECTOR_NECK;
  const depth = CONNECTOR_DEPTH;

  const top =
    edges.top === 0
      ? `L ${x1} ${y0}`
      : `L ${midX - neck} ${y0}
         C ${midX - neck} ${y0 + edges.top * -depth * 0.45},
           ${midX - neck * 0.55} ${y0 + edges.top * -depth},
           ${midX} ${y0 + edges.top * -depth}
         C ${midX + neck * 0.55} ${y0 + edges.top * -depth},
           ${midX + neck} ${y0 + edges.top * -depth * 0.45},
           ${midX + neck} ${y0}
         L ${x1} ${y0}`;

  const right =
    edges.right === 0
      ? `L ${x1} ${y1}`
      : `L ${x1} ${midY - neck}
         C ${x1 + edges.right * depth * 0.45} ${midY - neck},
           ${x1 + edges.right * depth} ${midY - neck * 0.55},
           ${x1 + edges.right * depth} ${midY}
         C ${x1 + edges.right * depth} ${midY + neck * 0.55},
           ${x1 + edges.right * depth * 0.45} ${midY + neck},
           ${x1} ${midY + neck}
         L ${x1} ${y1}`;

  const bottom =
    edges.bottom === 0
      ? `L ${x0} ${y1}`
      : `L ${midX + neck} ${y1}
         C ${midX + neck} ${y1 + edges.bottom * depth * 0.45},
           ${midX + neck * 0.55} ${y1 + edges.bottom * depth},
           ${midX} ${y1 + edges.bottom * depth}
         C ${midX - neck * 0.55} ${y1 + edges.bottom * depth},
           ${midX - neck} ${y1 + edges.bottom * depth * 0.45},
           ${midX - neck} ${y1}
         L ${x0} ${y1}`;

  const left =
    edges.left === 0
      ? `L ${x0} ${y0}`
      : `L ${x0} ${midY + neck}
         C ${x0 + edges.left * -depth * 0.45} ${midY + neck},
           ${x0 + edges.left * -depth} ${midY + neck * 0.55},
           ${x0 + edges.left * -depth} ${midY}
         C ${x0 + edges.left * -depth} ${midY - neck * 0.55},
           ${x0 + edges.left * -depth * 0.45} ${midY - neck},
           ${x0} ${midY - neck}
         L ${x0} ${y0}`;

  const segments = [`M ${x0} ${y0} ${top}`, `M ${x0} ${y1} ${left}`];

  if (correctX === COLS - 1) {
    segments.push(`M ${x1} ${y0} ${right}`);
  }

  if (correctY === ROWS - 1) {
    segments.push(`M ${x1} ${y1} ${bottom}`);
  }

  return segments.join(" ").replace(/\s+/g, " ").trim();
};

const createPieces = () => {
  const internalVertical = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS - 1 }, () => (Math.random() > 0.5 ? 1 : -1)),
  );
  const internalHorizontal = Array.from({ length: ROWS - 1 }, () =>
    Array.from({ length: COLS }, () => (Math.random() > 0.5 ? 1 : -1)),
  );

  const pieces: PuzzlePiece[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const top =
        row === 0 ? 0 : internalHorizontal[row - 1][col] === 1 ? -1 : 1;
      const right = col === COLS - 1 ? 0 : internalVertical[row][col];
      const bottom = row === ROWS - 1 ? 0 : internalHorizontal[row][col];
      const left =
        col === 0 ? 0 : internalVertical[row][col - 1] === 1 ? -1 : 1;
      const padding = {
        top: top === 1 ? CONNECTOR_DEPTH : 0,
        right: right === 1 ? CONNECTOR_DEPTH : 0,
        bottom: bottom === 1 ? CONNECTOR_DEPTH : 0,
        left: left === 1 ? CONNECTOR_DEPTH : 0,
      } satisfies PiecePadding;
      const baseX = col * PIECE_SIZE;
      const baseY = row * PIECE_SIZE;
      const expandedBounds = {
        x: baseX - padding.left,
        y: baseY - padding.top,
        width: PIECE_SIZE + padding.left + padding.right,
        height: PIECE_SIZE + padding.top + padding.bottom,
      };
      const edgeTypes = { top, right, bottom, left } satisfies EdgeTypes;

      pieces.push({
        id: row * COLS + col,
        correctX: col,
        correctY: row,
        currentX: 0,
        currentY: 0,
        rotation: Math.floor(Math.random() * 4) * 90,
        isPlaced: false,
        shapePath: createInterlockingPath(edgeTypes, padding),
        edgeTypes,
        padding,
        expandedBounds,
        cropArea: { ...expandedBounds },
      });
    }
  }

  return pieces;
};

type SpawnZone = Bounds;

const getLocalBounds = (childRect: DOMRect, parentRect: DOMRect): Bounds => ({
  x: childRect.left - parentRect.left,
  y: childRect.top - parentRect.top,
  width: childRect.width,
  height: childRect.height,
});

const getScaledBounds = (piece: PuzzlePiece, scale: number) => ({
  renderWidth: piece.expandedBounds.width * scale,
  renderHeight: piece.expandedBounds.height * scale,
  offsetX: piece.padding.left * scale,
  offsetY: piece.padding.top * scale,
});

const clampPiecePosition = (
  piece: PuzzlePiece,
  nextBaseX: number,
  nextBaseY: number,
  containerWidth: number,
  containerHeight: number,
  scale: number,
) => {
  const { renderWidth, renderHeight, offsetX, offsetY } = getScaledBounds(
    piece,
    scale,
  );
  const margin = 12;
  const expandedLeft = clamp(
    nextBaseX - offsetX,
    margin,
    Math.max(margin, containerWidth - renderWidth - margin),
  );
  const expandedTop = clamp(
    nextBaseY - offsetY,
    margin,
    Math.max(margin, containerHeight - renderHeight - margin),
  );

  return {
    currentX: expandedLeft + offsetX,
    currentY: expandedTop + offsetY,
  };
};

const buildSpawnZones = (
  containerBounds: Bounds,
  boardBounds: Bounds,
): SpawnZone[] => {
  const margin = 16;

  return [
    {
      x: margin,
      y: margin,
      width: boardBounds.x - margin * 2,
      height: containerBounds.height - margin * 2,
    },
    {
      x: boardBounds.x + boardBounds.width + margin,
      y: margin,
      width:
        containerBounds.width -
        (boardBounds.x + boardBounds.width) -
        margin * 2,
      height: containerBounds.height - margin * 2,
    },
    {
      x: margin,
      y: margin,
      width: containerBounds.width - margin * 2,
      height: boardBounds.y - margin * 2,
    },
    {
      x: margin,
      y: boardBounds.y + boardBounds.height + margin,
      width: containerBounds.width - margin * 2,
      height:
        containerBounds.height -
        (boardBounds.y + boardBounds.height) -
        margin * 2,
    },
  ].filter((zone) => zone.width > 24 && zone.height > 24);
};

const overlapsTooMuch = (a: Bounds, b: Bounds) => {
  const inset = 0.28;
  const ax1 = a.x + a.width * inset;
  const ay1 = a.y + a.height * inset;
  const ax2 = a.x + a.width * (1 - inset);
  const ay2 = a.y + a.height * (1 - inset);
  const bx1 = b.x + b.width * inset;
  const by1 = b.y + b.height * inset;
  const bx2 = b.x + b.width * (1 - inset);
  const by2 = b.y + b.height * (1 - inset);

  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
};

const assignSpawnPositions = (
  basePieces: PuzzlePiece[],
  containerEl: HTMLDivElement,
  boardEl: HTMLDivElement,
  scale: number,
) => {
  const containerRect = containerEl.getBoundingClientRect();
  const boardRect = getLocalBounds(
    boardEl.getBoundingClientRect(),
    containerRect,
  );
  const zones = buildSpawnZones(
    {
      x: 0,
      y: 0,
      width: containerRect.width,
      height: containerRect.height,
    },
    boardRect,
  );
  const placedRects: Bounds[] = [];
  const fallbackZone = zones.reduce<SpawnZone | null>((largest, zone) => {
    if (!largest) return zone;
    return zone.width * zone.height > largest.width * largest.height
      ? zone
      : largest;
  }, null) ?? {
    x: 16,
    y: 16,
    width: Math.max(containerRect.width - 32, 1),
    height: Math.max(containerRect.height - 32, 1),
  };

  return basePieces.map((piece) => {
    const { renderWidth, renderHeight, offsetX, offsetY } = getScaledBounds(
      piece,
      scale,
    );

    let position: { currentX: number; currentY: number } | null = null;

    for (let i = 0; i < 100; i++) {
      const zone =
        zones[Math.floor(Math.random() * zones.length)] ?? fallbackZone;
      const maxLeft = Math.max(zone.x, zone.x + zone.width - renderWidth);
      const maxTop = Math.max(zone.y, zone.y + zone.height - renderHeight);
      const expandedLeft =
        zone.width <= renderWidth
          ? zone.x
          : zone.x + Math.random() * (maxLeft - zone.x);
      const expandedTop =
        zone.height <= renderHeight
          ? zone.y
          : zone.y + Math.random() * (maxTop - zone.y);
      const candidate = {
        x: expandedLeft,
        y: expandedTop,
        width: renderWidth,
        height: renderHeight,
      };

      if (!placedRects.some((rect) => overlapsTooMuch(candidate, rect))) {
        placedRects.push(candidate);
        position = {
          currentX: expandedLeft + offsetX,
          currentY: expandedTop + offsetY,
        };
        break;
      }
    }

    if (!position) {
      const expandedLeft = clamp(
        fallbackZone.x +
          Math.random() * Math.max(fallbackZone.width - renderWidth, 1),
        12,
        Math.max(12, containerRect.width - renderWidth - 12),
      );
      const expandedTop = clamp(
        fallbackZone.y +
          Math.random() * Math.max(fallbackZone.height - renderHeight, 1),
        12,
        Math.max(12, containerRect.height - renderHeight - 12),
      );
      position = {
        currentX: expandedLeft + offsetX,
        currentY: expandedTop + offsetY,
      };
      placedRects.push({
        x: expandedLeft,
        y: expandedTop,
        width: renderWidth,
        height: renderHeight,
      });
    }

    return {
      ...piece,
      ...position,
    };
  });
};

// --- Components ---
type PuzzlePieceComponentProps = {
  piece: PuzzlePiece;
  displayPieceSize: number;
  className?: string;
  showOutline?: boolean;
};

const PIECE_RENDER_BLEED = 3;

const PuzzlePieceComponent = ({
  piece,
  displayPieceSize,
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
        touchAction: "none",
        overflow: "visible",
      }}
      className={`flex items-center justify-center ${className || ""}`}
    >
      <svg
        viewBox={`${-PIECE_RENDER_BLEED} ${-PIECE_RENDER_BLEED} ${piece.expandedBounds.width + PIECE_RENDER_BLEED * 2} ${piece.expandedBounds.height + PIECE_RENDER_BLEED * 2}`}
        style={{
          position: "absolute",
          left: `${-offsetX - bleed}px`,
          top: `${-offsetY - bleed}px`,
          width: `${renderWidth}px`,
          height: `${renderHeight}px`,
          filter: piece.isPlaced
            ? "brightness(1.06) saturate(1.08) drop-shadow(0 10px 16px rgba(22,109,119,0.14))"
            : "drop-shadow(0 8px 12px rgba(22,109,119,0.12))",
        }}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={piece.shapePath} />
          </clipPath>
        </defs>
        <image
          href={IMAGE_URL}
          x={-piece.expandedBounds.x}
          y={-piece.expandedBounds.y}
          width={BOARD_SIZE.width}
          height={BOARD_SIZE.height}
          preserveAspectRatio="none"
          clipPath={`url(#${clipId})`}
        />
        {showOutline && (
          <>
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
          </>
        )}
      </svg>
    </div>
  );
};

const PuzzleSlotShape = ({
  piece,
  displayPieceSize,
  highlighted = false,
}: {
  piece: PuzzlePiece;
  displayPieceSize: number;
  highlighted?: boolean;
}) => {
  const scale = displayPieceSize / PIECE_SIZE;
  const bleed = PIECE_RENDER_BLEED * scale;
  const width = piece.expandedBounds.width * scale + bleed * 2;
  const height = piece.expandedBounds.height * scale + bleed * 2;
  const offsetX = piece.padding.left * scale;
  const offsetY = piece.padding.top * scale;
  const guidelinePath = createGuidelinePath(piece);

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
};

const DroppableCell = ({
  id,
  slotPiece,
  placedPiece,
  completed,
  displayPieceSize,
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
      {!placedPiece && slotPiece && (
        <PuzzleSlotShape
          piece={slotPiece}
          displayPieceSize={displayPieceSize}
          highlighted={isOver && !completed}
        />
      )}
      {placedPiece && (
        <PuzzlePieceComponent
          piece={placedPiece}
          displayPieceSize={displayPieceSize}
          showOutline={!completed}
        />
      )}
    </div>
  );
};

const CORNER_PETAL_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];

const FrameCorner = ({
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
        {CORNER_PETAL_ROTATIONS.map((rotation) => (
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

const MuseumPlaque = ({ className = "mt-5" }: { className?: string }) => (
  <div className={`${className} flex justify-center`}>
    <div
      className="w-full rounded-[1.35rem] p-[6px]"
      style={{
        background:
          "linear-gradient(145deg, #4B331C 0%, #7D5A35 22%, #BC9159 48%, #E8D2A8 76%, #8D673F 100%)",
      }}
    >
      <div
        className="pointer-events-none rounded-[1.05rem] border border-[#fff6df]/35 p-[3px]"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255, 247, 235, 0.32), inset 0 -8px 14px rgba(75, 51, 28, 0.14)",
        }}
      >
        <div className="rounded-[0.9rem] border border-[#fff7eb] bg-[linear-gradient(180deg,#f8f4ea_0%,#ede5d3_100%)] px-6 py-4 text-center text-[#4b331c]">
          <h3 className="mt-2 text-2xl font-semibold tracking-[0.02em]">
            Birthday Banquet
          </h3>
          <p className="mt-2 text-sm tracking-[0.12em] text-[#6f5130]">
            상승새 (2026)
          </p>
        </div>
      </div>
    </div>
  </div>
);

const DraggablePiece = React.memo(
  ({
    piece,
    onRotate,
    displayPieceSize,
  }: {
    piece: PuzzlePiece;
    onRotate: (id: number) => void;
    displayPieceSize: number;
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
          touchAction: "none",
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
          />
        </motion.div>
      </div>
    );
  },
  (prev, next) =>
    prev.piece === next.piece &&
    prev.displayPieceSize === next.displayPieceSize,
);

type PuzzleGameProps = {
  embedInContainer?: boolean;
};

const PuzzleGame: React.FC<PuzzleGameProps> = ({ embedInContainer = true }) => {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [completed, setCompleted] = useState(false);
  const [isOpeningPhotocard, setIsOpeningPhotocard] = useState(false);
  const [sensorUnavailable, setSensorUnavailable] = useState(false);
  const [orientationEnabled, setOrientationEnabled] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [displayPieceSize, setDisplayPieceSize] = useState(() =>
    typeof window === "undefined"
      ? PIECE_SIZE
      : getDisplayPieceSize(window.innerWidth, window.innerHeight),
  );
  const playAreaRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const puzzleAchievementAwardedRef = useRef(false);
  const { token } = useAuthStore();
  const { addToast } = useToastStore();
  const isDevelopment = getNodeEnv() === "development" || import.meta.env.DEV;
  const isCoarsePointerDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  const triggerFireworks = () => {
    const burstColors = [
      "#5EC7A5",
      "#7DD3FC",
      "#C4B5FD",
      "#F9A8D4",
      "#FDE68A",
      "#FB7185",
      "#F97316",
      "#A3E635",
      "#F8FAFC",
    ];

    confetti({
      particleCount: 140,
      spread: 108,
      startVelocity: 46,
      decay: 0.94,
      gravity: 0.95,
      scalar: 1,
      ticks: 180,
      zIndex: 0,
      colors: burstColors,
      origin: { x: 0.5, y: 0.42 },
    });

    confetti({
      particleCount: 70,
      angle: 60,
      spread: 72,
      startVelocity: 42,
      decay: 0.94,
      gravity: 1,
      scalar: 0.9,
      ticks: 160,
      zIndex: 0,
      colors: burstColors,
      origin: { x: 0.06, y: 0.72 },
    });

    confetti({
      particleCount: 70,
      angle: 120,
      spread: 72,
      startVelocity: 42,
      decay: 0.94,
      gravity: 1,
      scalar: 0.9,
      ticks: 160,
      zIndex: 0,
      colors: burstColors,
      origin: { x: 0.94, y: 0.72 },
    });
  };

  useEffect(() => {
    if (completed) {
      triggerFireworks();
    }
  }, [completed]);

  useEffect(() => {
    if (!completed || !token || puzzleAchievementAwardedRef.current) {
      return;
    }

    const awardPuzzleAchievement = async () => {
      puzzleAchievementAwardedRef.current = true;

      try {
        const response = await fetch(
          `${BASE_URL}/achievements/award/${PUZZLE_ACHIEVEMENT_CODE}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          return;
        }

        const newlyAwarded = (await response.json()) === true;
        if (newlyAwarded) {
          addToast({
            title: "퍼즐 완성",
            description: "퍼즐을 처음으로 완성했다!",
            icon: "🧩",
          });
        }
      } catch (error) {
        console.error("Failed to award puzzle achievement", error);
      }
    };

    void awardPuzzleAchievement();
  }, [addToast, completed, token]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: MOUSE_DRAG_DISTANCE_PX,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_DRAG_ACTIVATION_DELAY_MS,
        tolerance: TOUCH_DRAG_TOLERANCE_PX,
      },
    }),
  );

  useEffect(() => {
    const updateDisplaySize = () =>
      setDisplayPieceSize(
        getDisplayPieceSize(window.innerWidth, window.innerHeight),
      );

    updateDisplaySize();
    window.addEventListener("resize", updateDisplaySize);

    return () => window.removeEventListener("resize", updateDisplaySize);
  }, []);

  useEffect(() => {
    if (!playAreaRef.current || !boardRef.current) return;

    const observer = new ResizeObserver(() => {
      setLayoutVersion((prev) => prev + 1);
    });

    observer.observe(playAreaRef.current);
    observer.observe(boardRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!playAreaRef.current || !boardRef.current) return;

      const scale = displayPieceSize / PIECE_SIZE;

      if (pieces.length === 0) {
        setPieces(
          assignSpawnPositions(
            createPieces(),
            playAreaRef.current,
            boardRef.current,
            scale,
          ),
        );
        return;
      }

      setPieces((prev) =>
        prev.map((piece) =>
          piece.isPlaced
            ? piece
            : {
                ...piece,
                ...clampPiecePosition(
                  piece,
                  piece.currentX,
                  piece.currentY,
                  playAreaRef.current!.clientWidth,
                  playAreaRef.current!.clientHeight,
                  scale,
                ),
              },
        ),
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [displayPieceSize, layoutVersion, pieces.length]);

  const handleDragStart = (_event: DragStartEvent) => {};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const id = Number(active.id);
    const scale = displayPieceSize / PIECE_SIZE;
    const containerWidth =
      playAreaRef.current?.clientWidth ?? window.innerWidth;
    const containerHeight =
      playAreaRef.current?.clientHeight ?? window.innerHeight;

    setPieces((prev) =>
      prev.map((piece) => {
        if (piece.id !== id) return piece;

        if (over && String(over.id).startsWith("cell-")) {
          const [, cx, cy] = String(over.id).split("-").map(Number);
          if (
            piece.correctX === cx &&
            piece.correctY === cy &&
            piece.rotation % 360 === 0
          ) {
            return {
              ...piece,
              isPlaced: true,
              currentX: -999,
              currentY: -999,
            };
          }
        }

        return {
          ...piece,
          ...clampPiecePosition(
            piece,
            piece.currentX + delta.x,
            piece.currentY + delta.y,
            containerWidth,
            containerHeight,
            scale,
          ),
        };
      }),
    );
  };

  const lastRotateTime = React.useRef(0);
  const handleRotate = React.useCallback((id: number) => {
    const now = Date.now();
    if (now - lastRotateTime.current < 800) return;
    lastRotateTime.current = now;

    setPieces((prev) =>
      prev.map((piece) =>
        piece.id === id ? { ...piece, rotation: piece.rotation + 90 } : piece,
      ),
    );
  }, []);

  const handleDebugComplete = React.useCallback(() => {
    setPieces((prev) =>
      prev.map((piece) => ({
        ...piece,
        isPlaced: true,
        rotation: 0,
        currentX: -999,
        currentY: -999,
      })),
    );
  }, []);

  const handlePhotocardMode = React.useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !isCoarsePointerDevice ||
      !("DeviceOrientationEvent" in window)
    ) {
      setOrientationEnabled(false);
      setSensorUnavailable(true);
      return;
    }

    setIsOpeningPhotocard(true);

    try {
      const permissionGranted = await requestSensorPermission();
      const canUseOrientation = window.isSecureContext && permissionGranted;

      setOrientationEnabled(canUseOrientation);
      setSensorUnavailable(!canUseOrientation);
    } finally {
      setIsOpeningPhotocard(false);
    }
  }, [isCoarsePointerDevice]);

  useEffect(() => {
    if (pieces.length > 0 && pieces.every((piece) => piece.isPlaced)) {
      setCompleted(true);
    }
  }, [pieces]);

  const content = (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={playAreaRef}
        className="w-full h-full bg-[#FFFFF8] relative overflow-hidden select-none touch-none flex flex-col"
      >
        <div className="flex w-full flex-1 overflow-hidden">
          <div
            className="flex-1 relative bg-[rgba(239,246,255,0.1)] hidden lg:block"
            id="area-left"
          />

          <div className="z-10 flex flex-1 items-center justify-center my-8 p-3 sm:p-4">
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
                  <div
                    className="relative overflow-hidden border border-[#e8ddc6] bg-[#faf8f1]"
                    style={{
                      width: `${displayPieceSize * COLS}px`,
                      height: `${displayPieceSize * ROWS}px`,
                    }}
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
                        gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: ROWS * COLS }).map((_, index) => {
                        const col = index % COLS;
                        const row = Math.floor(index / COLS);
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
                          />
                        );
                      })}
                    </div>
                    <HolographicOverlay
                      visible={completed}
                      orientationEnabled={orientationEnabled}
                      imageUrl={IMAGE_URL}
                    />
                  </div>
                </div>
              </div>
              {completed && (
                <MuseumPlaque className="mt-5 w-full max-w-[19rem] lg:hidden" />
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
                  <MuseumPlaque className="mt-0" />
                  <ActionButton
                    onClick={() => window.location.reload()}
                    className="w-full"
                    variant="sage"
                    size="lg"
                  >
                    다시 하기
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="relative h-[180px] w-full bg-[rgba(240,253,244,0.1)] sm:h-[200px]"
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
              />
            ))}
          </div>
        </div>

        {isDevelopment && !completed && (
          <button
            type="button"
            onClick={handleDebugComplete}
            className="fixed right-4 top-4 z-[120] rounded-full border border-[#166D77]/30 bg-[#166D77] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#FFFFF8] shadow-[0_12px_26px_rgba(22,109,119,0.28)] transition-transform hover:scale-[1.04] active:scale-[0.98]"
          >
            DEBUG: COMPLETE PUZZLE
          </button>
        )}

        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="fixed bottom-8 left-1/2 z-[90] flex w-[min(calc(100%-1.5rem),34rem)] -translate-x-1/2 flex-col items-center gap-3 px-3"
            >
              <div className="flex w-full flex-wrap items-center justify-center gap-3 rounded-[1.8rem] bg-[#fffaf0]/92 px-4 py-4 shadow-[0_18px_38px_rgba(75,51,28,0.12)] backdrop-blur-md lg:hidden">
                <ActionButton
                  onClick={() => window.location.reload()}
                  variant="sage"
                  size="md"
                >
                  다시 하기
                </ActionButton>
                {isCoarsePointerDevice && (
                  <ActionButton
                    onClick={() => void handlePhotocardMode()}
                    disabled={isOpeningPhotocard}
                    variant="teal"
                    size="md"
                  >
                    {isOpeningPhotocard ? "열는 중..." : "Photocard Mode"}
                  </ActionButton>
                )}
              </div>
              {isCoarsePointerDevice && (
                <p className="rounded-full bg-[#fffaf0]/88 px-4 py-2 text-center text-xs leading-5 text-[#166D77]/70 backdrop-blur-sm lg:hidden">
                  `Photocard Mode`를 누르면 모바일에서 자이로스코프 권한을
                  요청해.
                </p>
              )}
              {sensorUnavailable && (
                <p className="rounded-full bg-[#fff1f1]/92 px-4 py-2 text-center text-xs leading-5 text-[#A14646] backdrop-blur-sm lg:hidden">
                  센서 권한을 받지 못했거나 HTTPS 환경이 아니라서 기울임 효과를
                  켤 수 없어.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DndContext>
  );

  if (!embedInContainer) {
    return content;
  }

  return (
    <GameContainer
      title="퍼즐 맞추기"
      desc="리코야 생일상 차려놨어 밥 굶으면 안돼"
      gameName="퍼즐 맞추기"
      helpSlides={PUZZLE_TUTORIAL_SLIDES}
      className="bg-[#FFFFF8]"
      mainClassName="relative overflow-hidden"
    >
      {content}
    </GameContainer>
  );
};

export default PuzzleGame;
