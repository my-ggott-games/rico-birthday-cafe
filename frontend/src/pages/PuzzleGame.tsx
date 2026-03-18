import React, { useEffect, useRef, useState } from "react";

import { GameContainer } from "../components/common/GameContainer";
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
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { BASE_URL } from "../utils/api";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { HolographicOverlay } from "../components/game/HolographicOverlay";
import { ActionButton } from "../components/common/ActionButton";
import { MuseumPlaque } from "../components/game/MuseumPlaque";
import { MagnifyingGlass } from "../components/game/MagnifyingGlass";
import {
  PUZZLE_ACHIEVEMENT_CODE,
  PUZZLE_IMAGE_URL,
  PUZZLE_MUSEUM_UNLOCK_EVENT,
  PUZZLE_MUSEUM_UNLOCK_KEY,
} from "../constants/puzzle";
import {
  BOARD_SIZE,
  COLS,
  CORNER_PETAL_ROTATIONS,
  PIECE_RENDER_BLEED,
  PIECE_SIZE,
  PUZZLE_TUTORIAL_SLIDES,
  ROWS,
  MOUSE_DRAG_DISTANCE_PX,
  TAP_ROTATE_MAX_MS,
  TOUCH_DRAG_ACTIVATION_DELAY_MS,
  TOUCH_DRAG_TOLERANCE_PX,
} from "../features/puzzle/constants";
import {
  assignSpawnPositions,
  clamp,
  clampPiecePosition,
  createGuidelinePath,
  createPieces,
  getDisplayPieceSize,
  getScaledBounds,
  requestSensorPermission,
} from "../features/puzzle/helpers";
import type { PuzzlePiece } from "../features/puzzle/types";

// --- Components ---
type PuzzlePieceComponentProps = {
  piece: PuzzlePiece;
  displayPieceSize: number;
  className?: string;
  showOutline?: boolean;
};

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
        touchAction: "pinch-zoom",
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
          filter: "none",
        }}
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={piece.shapePath} />
          </clipPath>
        </defs>
        <image
          href={PUZZLE_IMAGE_URL}
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
      {placedPiece && (
        <PuzzlePieceComponent
          piece={placedPiece}
          displayPieceSize={displayPieceSize}
          showOutline={false}
        />
      )}
      {slotPiece && !completed && (
        <div className="pointer-events-none absolute inset-0 z-[3]">
          <PuzzleSlotShape
            piece={slotPiece}
            displayPieceSize={displayPieceSize}
            highlighted={isOver && !placedPiece}
          />
        </div>
      )}
    </div>
  );
};

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
  const [photocardModeEnabled, setPhotocardModeEnabled] = useState(false);
  const [isOpeningPhotocard, setIsOpeningPhotocard] = useState(false);
  const [sensorUnavailable, setSensorUnavailable] = useState(false);
  const [orientationEnabled, setOrientationEnabled] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [magnifierPoint, setMagnifierPoint] = useState({ x: 0, y: 0 });
  const [displayPieceSize, setDisplayPieceSize] = useState(() =>
    typeof window === "undefined"
      ? PIECE_SIZE
      : getDisplayPieceSize(window.innerWidth, window.innerHeight),
  );
  const playAreaRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const puzzleAchievementAwardedRef = useRef(false);
  const completionMetaTriggeredRef = useRef(false);
  const { token } = useAuthStore();
  const { addToast } = useToastStore();
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
    if (!completed || completionMetaTriggeredRef.current) {
      return;
    }

    completionMetaTriggeredRef.current = true;
    window.localStorage.setItem(PUZZLE_MUSEUM_UNLOCK_KEY, "true");
    window.dispatchEvent(new Event(PUZZLE_MUSEUM_UNLOCK_EVENT));
    window.dispatchEvent(
      new CustomEvent("achievement-unlocked", {
        detail: { code: PUZZLE_ACHIEVEMENT_CODE },
      }),
    );
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
    if (photocardModeEnabled) {
      setPhotocardModeEnabled(false);
      setOrientationEnabled(false);
      setSensorUnavailable(false);
      setIsOpeningPhotocard(false);
      return;
    }

    if (
      typeof window === "undefined" ||
      !isCoarsePointerDevice ||
      !("DeviceOrientationEvent" in window)
    ) {
      setPhotocardModeEnabled(false);
      setOrientationEnabled(false);
      setSensorUnavailable(true);
      return;
    }

    setIsOpeningPhotocard(true);

    try {
      const permissionGranted = await requestSensorPermission();
      const canUseOrientation = window.isSecureContext && permissionGranted;

      setPhotocardModeEnabled(canUseOrientation);
      setOrientationEnabled(canUseOrientation);
      setSensorUnavailable(!canUseOrientation);
    } finally {
      setIsOpeningPhotocard(false);
    }
  }, [isCoarsePointerDevice, photocardModeEnabled]);

  const handleReplay = React.useCallback(() => {
    setCompleted(false);
    setPhotocardModeEnabled(false);
    setIsOpeningPhotocard(false);
    setSensorUnavailable(false);
    setOrientationEnabled(false);
    setIsMagnifierActive(false);
    setMagnifierPoint({ x: 0, y: 0 });
    setPieces([]);
    setLayoutVersion((prev) => prev + 1);
  }, []);

  const updateMagnifierPoint = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!artworkRef.current) {
        return;
      }

      const rect = artworkRef.current.getBoundingClientRect();
      setMagnifierPoint({
        x: clamp(clientX - rect.left, 0, rect.width),
        y: clamp(clientY - rect.top, 0, rect.height),
      });
    },
    [],
  );

  useEffect(() => {
    if (!isMagnifierActive) {
      return;
    }

    const handlePointerRelease = () => setIsMagnifierActive(false);

    window.addEventListener("mouseup", handlePointerRelease);
    window.addEventListener("touchend", handlePointerRelease);
    window.addEventListener("touchcancel", handlePointerRelease);

    return () => {
      window.removeEventListener("mouseup", handlePointerRelease);
      window.removeEventListener("touchend", handlePointerRelease);
      window.removeEventListener("touchcancel", handlePointerRelease);
    };
  }, [isMagnifierActive]);

  useEffect(() => {
    if (pieces.length > 0 && pieces.every((piece) => piece.isPlaced)) {
      setCompleted(true);
    }
  }, [pieces]);

  useEffect(() => {
    if (!completed) {
      setIsMagnifierActive(false);
    }
  }, [completed]);

  const mobilePhotocardActive =
    isCoarsePointerDevice && photocardModeEnabled && orientationEnabled;
  const hologramVisible = completed;
  const desktopSweepEnabled = completed && !mobilePhotocardActive;

  const content = (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={playAreaRef}
        className="w-full h-full bg-[#FFFFF8] relative overflow-hidden select-none flex flex-col"
        style={{ touchAction: "pinch-zoom" }}
      >
        <div className="flex w-full flex-1 overflow-hidden">
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
                  <div
                    ref={artworkRef}
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
                      visible={hologramVisible}
                      mobileInteractive={mobilePhotocardActive}
                      orientationEnabled={orientationEnabled}
                      desktopSweep={desktopSweepEnabled}
                      imageUrl={PUZZLE_IMAGE_URL}
                    />
                    {completed && (
                      <>
                        <div
                          className="absolute inset-0 z-[5] cursor-zoom-in"
                          onMouseDown={(event) => {
                            updateMagnifierPoint(event.clientX, event.clientY);
                            setIsMagnifierActive(true);
                          }}
                          onMouseMove={(event) => {
                            if (!isMagnifierActive) return;
                            updateMagnifierPoint(event.clientX, event.clientY);
                          }}
                          onMouseLeave={() => setIsMagnifierActive(false)}
                          onTouchStart={(event) => {
                            const touch = event.touches[0];
                            if (!touch) return;
                            updateMagnifierPoint(touch.clientX, touch.clientY);
                            setIsMagnifierActive(true);
                          }}
                          onTouchMove={(event) => {
                            const touch = event.touches[0];
                            if (!touch) return;
                            event.preventDefault();
                            updateMagnifierPoint(touch.clientX, touch.clientY);
                          }}
                          onTouchEnd={() => setIsMagnifierActive(false)}
                          onTouchCancel={() => setIsMagnifierActive(false)}
                          aria-label="완성된 그림 확대해서 보기"
                        />
                        <MagnifyingGlass
                          visible={isMagnifierActive}
                          imageUrl={PUZZLE_IMAGE_URL}
                          boardWidth={displayPieceSize * COLS}
                          boardHeight={displayPieceSize * ROWS}
                          pointerX={magnifierPoint.x}
                          pointerY={magnifierPoint.y}
                        />
                      </>
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
                    {isCoarsePointerDevice && (
                      <ActionButton
                        onClick={() => void handlePhotocardMode()}
                        disabled={isOpeningPhotocard}
                        className="flex-1 shadow-none hover:shadow-none"
                        variant="teal"
                        size="md"
                      >
                        {isOpeningPhotocard
                          ? "준비 중..."
                          : photocardModeEnabled
                            ? "홀로그램 끄기"
                            : "홀로그램 모드"}
                      </ActionButton>
                    )}
                    <ActionButton
                      onClick={handleReplay}
                      className={
                        isCoarsePointerDevice
                          ? "flex-1 shadow-none hover:shadow-none"
                          : "w-full shadow-none hover:shadow-none"
                      }
                      variant="sage"
                      size="md"
                    >
                      다시 하기
                    </ActionButton>
                  </div>
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
                  {isCoarsePointerDevice && (
                    <ActionButton
                      onClick={() => void handlePhotocardMode()}
                      disabled={isOpeningPhotocard}
                      className="w-full shadow-none hover:shadow-none"
                      variant="teal"
                      size="md"
                    >
                      {isOpeningPhotocard
                        ? "준비 중..."
                        : photocardModeEnabled
                          ? "홀로그램 끄기"
                          : "홀로그램 모드"}
                    </ActionButton>
                  )}
                  <ActionButton
                    onClick={handleReplay}
                    className="w-full shadow-none hover:shadow-none"
                    variant="sage"
                    size="md"
                  >
                    다시 하기
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="relative flex h-[180px] w-full items-end justify-center bg-[rgba(240,253,244,0.1)] px-4 pb-6 sm:h-[200px]"
          id="area-bottom"
        >
          {completed && (
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex w-full max-w-md flex-col items-center gap-3 lg:hidden"
            >
              {sensorUnavailable && (
                <p className="rounded-full bg-[#fff1f1]/92 px-4 py-2 text-center text-xs leading-5 text-[#A14646] backdrop-blur-sm">
                  센서 권한을 받지 못했거나 HTTPS 환경이 아니라서 기울임 효과를
                  켤 수 없어.
                </p>
              )}
            </motion.div>
          )}
        </div>

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

        {!completed && (
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
