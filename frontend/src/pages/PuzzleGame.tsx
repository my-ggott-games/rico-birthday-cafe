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
const ROWS = 4;
const COLS = 4;
const PIECE_SIZE = 100;
const CONNECTOR_NECK = 16;
const CONNECTOR_DEPTH = 16;
const BOARD_SIZE = {
  width: COLS * PIECE_SIZE,
  height: ROWS * PIECE_SIZE,
};
const MIN_DISPLAY_PIECE_SIZE = 64;
const MOUSE_DRAG_DISTANCE_PX = 4;
const TOUCH_DRAG_ACTIVATION_DELAY_MS = 90;
const TOUCH_DRAG_TOLERANCE_PX = 10;
const TAP_ROTATE_MAX_MS = 180;
const IMAGE_URL = "/assets/rico_puzzle_sample.png";
const PUZZLE_ACHIEVEMENT_CODE = "FIRST_PUZZLE";

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
const getDisplayPieceSize = (viewportWidth: number) =>
  Math.max(
    MIN_DISPLAY_PIECE_SIZE,
    Math.min(PIECE_SIZE, Math.floor(viewportWidth * 0.18)),
  );

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
      const top = row === 0 ? 0 : internalHorizontal[row - 1][col] === 1 ? -1 : 1;
      const right = col === COLS - 1 ? 0 : internalVertical[row][col];
      const bottom = row === ROWS - 1 ? 0 : internalHorizontal[row][col];
      const left = col === 0 ? 0 : internalVertical[row][col - 1] === 1 ? -1 : 1;
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
        containerBounds.width - (boardBounds.x + boardBounds.width) - margin * 2,
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
        containerBounds.height - (boardBounds.y + boardBounds.height) - margin * 2,
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
  const fallbackZone =
    zones.reduce<SpawnZone | null>((largest, zone) => {
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
      const zone = zones[Math.floor(Math.random() * zones.length)] ?? fallbackZone;
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
};

const PuzzlePieceComponent = ({
  piece,
  displayPieceSize,
  className,
}: PuzzlePieceComponentProps) => {
  const scale = displayPieceSize / PIECE_SIZE;
  const clipId = React.useId().replace(/:/g, "");
  const renderWidth = piece.expandedBounds.width * scale;
  const renderHeight = piece.expandedBounds.height * scale;
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
        viewBox={`0 0 ${piece.expandedBounds.width} ${piece.expandedBounds.height}`}
        style={{
          position: "absolute",
          left: `${-offsetX}px`,
          top: `${-offsetY}px`,
          width: `${renderWidth}px`,
          height: `${renderHeight}px`,
          filter: piece.isPlaced
            ? "brightness(1.05)"
            : "drop-shadow(0 8px 18px rgba(15,23,42,0.18)) drop-shadow(0 2px 5px rgba(15,23,42,0.12))",
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
  const width = piece.expandedBounds.width * scale;
  const height = piece.expandedBounds.height * scale;
  const offsetX = piece.padding.left * scale;
  const offsetY = piece.padding.top * scale;

  return (
    <svg
      viewBox={`0 0 ${piece.expandedBounds.width} ${piece.expandedBounds.height}`}
      style={{
        position: "absolute",
        left: `${-offsetX}px`,
        top: `${-offsetY}px`,
        width: `${width}px`,
        height: `${height}px`,
        overflow: "visible",
      }}
      aria-hidden
    >
      <path
        d={piece.shapePath}
        fill={
          highlighted ? "rgba(94,199,165,0.24)" : "rgba(22,109,119,0.08)"
        }
        stroke={
          highlighted ? "rgba(94,199,165,0.75)" : "rgba(22,109,119,0.24)"
        }
        strokeWidth={2}
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
        />
      )}
    </div>
  );
};

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
          <PuzzlePieceComponent piece={piece} displayPieceSize={displayPieceSize} />
        </motion.div>
      </div>
    );
  },
  (prev, next) =>
    prev.piece === next.piece &&
    prev.displayPieceSize === next.displayPieceSize,
);

const PuzzleGame: React.FC = () => {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [completed, setCompleted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [displayPieceSize, setDisplayPieceSize] = useState(() =>
    typeof window === "undefined"
      ? PIECE_SIZE
      : getDisplayPieceSize(window.innerWidth),
  );
  const playAreaRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const puzzleAchievementAwardedRef = useRef(false);
  const { token } = useAuthStore();
  const { addToast } = useToastStore();

  const triggerFireworks = () => {
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 45,
      spread: 360,
      ticks: 100,
      zIndex: 0,
      colors: ["#5EC7A5", "#bef264", "#FFD700", "#FFFFF8"],
    };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: ReturnType<typeof setInterval> = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 70 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 },
      });
    }, 300);
  };

  useEffect(() => {
    if (completed) {
      triggerFireworks();
      setShowPopup(true);
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
            title: "퍼즐 첫 완성",
            description: "퍼즐놀이를 처음으로 완성했다!",
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
      setDisplayPieceSize(getDisplayPieceSize(window.innerWidth));

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
    const containerWidth = playAreaRef.current?.clientWidth ?? window.innerWidth;
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
        piece.id === id
          ? { ...piece, rotation: piece.rotation + 90 }
          : piece,
      ),
    );
  }, []);

  useEffect(() => {
    if (pieces.length > 0 && pieces.every((piece) => piece.isPlaced)) {
      setCompleted(true);
    }
  }, [pieces]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <GameContainer
        title="퍼즐놀이"
        desc="어떤 그림이 나올까?"
        gameName="퍼즐놀이"
        helpSlides={PUZZLE_TUTORIAL_SLIDES}
        className="bg-[#FFFFF8]"
        mainClassName="relative overflow-hidden"
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

            <div className="z-10 flex flex-1 items-center justify-center p-3 sm:p-4">
              <div
                ref={boardRef}
                className="relative bg-pale-custard/50 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-[#166D77] rounded-3xl p-6"
              >
                <div
                  className="relative bg-[#fafafa] overflow-hidden"
                  style={{
                    width: `${displayPieceSize * COLS}px`,
                    height: `${displayPieceSize * ROWS}px`,
                  }}
                >
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-0">
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
                </div>
              </div>
            </div>

            <div
              className="flex-1 relative bg-[rgba(254,242,242,0.1)] hidden lg:block"
              id="area-right"
            />
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

          <AnimatePresence>
            {showPopup && (
              <div className="fixed inset-x-0 bottom-10 z-[100] flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 100 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 100 }}
                  className="bg-pale-custard/95 backdrop-blur-md p-4 rounded-[30px] text-center shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-[#FFFFF8] pointer-events-auto relative max-w-lg mx-4"
                >
                  <div className="absolute -top-6 -left-6 text-4xl animate-bounce">
                    🎈
                  </div>
                  <div className="absolute -top-6 -right-6 text-4xl animate-bounce delay-100">
                    🎁
                  </div>

                  <h1 className="font-handwriting text-6xl text-[#5EC7A5] mb-3 drop-shadow-sm select-none">
                    Happy Birthday!
                  </h1>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-[#bef264] hover:bg-[#a8e04b] text-[#166D77] px-8 py-3 rounded-2xl font-black text-xl shadow-lg transition-all hover:scale-105 active:scale-95 border-b-4 border-black/10"
                    >
                      다시 하기
                    </button>
                    <button
                      onClick={() => setShowPopup(false)}
                      className="bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#6b7280] px-6 py-3 rounded-2xl font-bold text-lg transition-all border-b-4 border-black/5"
                    >
                      닫기
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {completed && !showPopup && (
              <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => window.location.reload()}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] bg-[#5EC7A5] text-pale-custard px-10 py-4 rounded-full font-black text-2xl shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:scale-110 active:scale-95 transition-all border-b-4 border-black/20"
              >
                다시하기
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </GameContainer>
    </DndContext>
  );
};

export default PuzzleGame;
