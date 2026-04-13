import React, { useEffect, useRef, useState } from "react";

import { GameContainer } from "../components/common/GameContainer";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { BASE_URL } from "../utils/api";
import { playDiriringSfx, preloadDiriringSfx } from "../utils/soundEffects";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import {
  addAchievementToast,
  parseAchievementAwardResponse,
} from "../utils/achievementAwards";
import { PolaroidHolographicOverlay } from "../components/game/cody/polaroidEffects/PolaroidHolographicOverlay";
import { PushableButton } from "../components/common/PushableButton";
import { MagnifyingGlass } from "../components/game/puzzle/MagnifyingGlass";
import { MuseumPlaque } from "../components/game/puzzle/MuseumPlaque";
import {
  DraggablePiece,
  DroppableCell,
  FrameCorner,
} from "../components/game/puzzle/PuzzleBoardElements";
import {
  PUZZLE_ACHIEVEMENT_CODE,
  PUZZLE_IMAGE_URL,
  PUZZLE_MUSEUM_UNLOCK_EVENT,
  PUZZLE_MUSEUM_UNLOCK_KEY,
} from "../constants/puzzle";
import {
  PIECE_SIZE,
  MOUSE_DRAG_DISTANCE_PX,
  TOUCH_DRAG_ACTIVATION_DELAY_MS,
  TOUCH_DRAG_TOLERANCE_PX,
  PUZZLE_GRID_OPTIONS,
  type PuzzleGridSize,
  getPuzzleBoardConfig,
} from "../features/puzzle/constants";
import { PUZZLE_TUTORIAL_SLIDES } from "../constants/tutorialSlides";
import { usePageBgm } from "../hooks/usePageBgm";
import {
  assignSpawnPositions,
  clamp,
  clampPiecePosition,
  createPieces,
  getDisplayPieceSize,
} from "../features/puzzle/helpers";
import type { PuzzlePiece } from "../features/puzzle/types";
import { pickRandomActivityBgm } from "../utils/bgm";
import { pushEvent } from "../utils/analytics";
import { useViewEvent } from "../hooks/usePageTracking";

type PuzzleGameProps = {
  embedInContainer?: boolean;
};

const PUZZLE_PROGRESS_STORAGE_KEY = "puzzle_game_progress_v1";

type StoredPuzzlePiece = {
  id: number;
  rotation: number;
  isPlaced: boolean;
  currentXRatio: number | null;
  currentYRatio: number | null;
};

type StoredPuzzleProgress = {
  ownerId: string | null;
  gridSize: PuzzleGridSize;
  pieces: StoredPuzzlePiece[];
};

const GUEST_PUZZLE_OWNER_ID = "__guest__";

const getPuzzleOwnerId = (uid: string | null, isGuest: boolean) =>
  uid ?? (isGuest ? GUEST_PUZZLE_OWNER_ID : null);

const isPuzzleGridSize = (value: unknown): value is PuzzleGridSize =>
  typeof value === "number" &&
  PUZZLE_GRID_OPTIONS.includes(value as PuzzleGridSize);

const readStoredPuzzleProgress = (
  expectedOwnerId?: string | null,
): StoredPuzzleProgress | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PUZZLE_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredPuzzleProgress>;
    const storedOwnerId =
      typeof parsed.ownerId === "string" ? parsed.ownerId : null;

    if (
      !isPuzzleGridSize(parsed.gridSize) ||
      !Array.isArray(parsed.pieces) ||
      (expectedOwnerId !== undefined && storedOwnerId !== expectedOwnerId)
    ) {
      return null;
    }

    return {
      ownerId: storedOwnerId,
      gridSize: parsed.gridSize,
      pieces: parsed.pieces.flatMap((piece) => {
        if (
          typeof piece?.id !== "number" ||
          typeof piece.rotation !== "number" ||
          typeof piece.isPlaced !== "boolean"
        ) {
          return [];
        }

        const currentXRatio =
          typeof piece.currentXRatio === "number" ? piece.currentXRatio : null;
        const currentYRatio =
          typeof piece.currentYRatio === "number" ? piece.currentYRatio : null;

        return [
          {
            id: piece.id,
            rotation: piece.rotation,
            isPlaced: piece.isPlaced,
            currentXRatio,
            currentYRatio,
          },
        ];
      }),
    };
  } catch (error) {
    console.error("Failed to read stored puzzle progress", error);
    return null;
  }
};

const clearStoredPuzzleProgress = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PUZZLE_PROGRESS_STORAGE_KEY);
};

const PuzzleGame: React.FC<PuzzleGameProps> = ({ embedInContainer = true }) => {
  const [bgmSrc] = useState(() => pickRandomActivityBgm());
  const { token, uid, isAdmin, isGuest } = useAuthStore();
  const currentOwnerId = getPuzzleOwnerId(uid, isGuest);
  const [gridSize, setGridSize] = useState<PuzzleGridSize>(() => {
    const storedProgress = readStoredPuzzleProgress(currentOwnerId);
    return storedProgress?.gridSize ?? 10;
  });

  usePageBgm(bgmSrc);
  useViewEvent("view_game", { game_name: "퍼즐 맞추기" });

  useEffect(() => {
    pushEvent("start_game", { game_name: "퍼즐 맞추기" });
  }, []);

  const boardConfig = getPuzzleBoardConfig(gridSize);
  const { cols, rows, boardWidth, boardHeight } = boardConfig;

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
      : getDisplayPieceSize(window.innerWidth, window.innerHeight, gridSize),
  );
  const [isNarrowViewport, setIsNarrowViewport] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  );
  const playAreaRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const ownerIdRef = useRef(
    readStoredPuzzleProgress()?.ownerId ?? currentOwnerId,
  );
  const puzzleAchievementAwardedRef = useRef(false);
  const completionWhileAuthenticatedRef = useRef(false);
  const completionMetaTriggeredRef = useRef(false);
  const storedProgressRef = useRef<StoredPuzzleProgress | null>(
    readStoredPuzzleProgress(currentOwnerId),
  );
  const { addToast } = useToastStore();
  const isCoarsePointerDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    if (ownerIdRef.current === currentOwnerId) {
      return;
    }

    ownerIdRef.current = currentOwnerId;
    clearStoredPuzzleProgress();
    storedProgressRef.current = null;
    puzzleAchievementAwardedRef.current = false;
    completionWhileAuthenticatedRef.current = false;
    completionMetaTriggeredRef.current = false;
    setGridSize(10);
    setCompleted(false);
    setPhotocardModeEnabled(false);
    setIsOpeningPhotocard(false);
    setSensorUnavailable(false);
    setOrientationEnabled(false);
    setIsMagnifierActive(false);
    setMagnifierPoint({ x: 0, y: 0 });
    setPieces([]);
    setLayoutVersion((prev) => prev + 1);
  }, [currentOwnerId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setIsNarrowViewport(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    preloadDiriringSfx();
  }, []);

  useEffect(() => {
    if (completed) {
      pushEvent("complete_game", { game_name: "퍼즐 맞추기" });
      triggerFireworks();
      void playDiriringSfx();
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
    if (
      !completed ||
      !token ||
      !completionWhileAuthenticatedRef.current ||
      puzzleAchievementAwardedRef.current
    ) {
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

        const awardResult = await parseAchievementAwardResponse(response);
        if (awardResult?.awarded) {
          addAchievementToast(addToast, awardResult.achievement, "puzzle");
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
        getDisplayPieceSize(window.innerWidth, window.innerHeight, gridSize),
      );

    updateDisplaySize();
    window.addEventListener("resize", updateDisplaySize);

    return () => window.removeEventListener("resize", updateDisplaySize);
  }, [gridSize]);

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
        const spawnedPieces = assignSpawnPositions(
          createPieces(gridSize),
          playAreaRef.current,
          boardRef.current,
          scale,
        );
        const storedProgress = storedProgressRef.current;

        if (storedProgress?.gridSize === gridSize) {
          const storedPieces = new Map(
            storedProgress.pieces.map((piece) => [piece.id, piece]),
          );

          const restoredPieces = spawnedPieces.map((piece) => {
            const storedPiece = storedPieces.get(piece.id);
            if (!storedPiece) {
              return piece;
            }

            if (storedPiece.isPlaced) {
              return {
                ...piece,
                isPlaced: true,
                rotation: storedPiece.rotation,
                currentX: -999,
                currentY: -999,
              };
            }

            if (
              storedPiece.currentXRatio === null ||
              storedPiece.currentYRatio === null
            ) {
              return {
                ...piece,
                rotation: storedPiece.rotation,
              };
            }

            const containerWidth = playAreaRef.current!.clientWidth;
            const containerHeight = playAreaRef.current!.clientHeight;
            const restoredX = storedPiece.currentXRatio * containerWidth;
            const restoredY = storedPiece.currentYRatio * containerHeight;

            return {
              ...piece,
              rotation: storedPiece.rotation,
              ...clampPiecePosition(
                piece,
                restoredX,
                restoredY,
                containerWidth,
                containerHeight,
                scale,
              ),
            };
          });

          storedProgressRef.current = null;
          setPieces(restoredPieces);
          return;
        }

        setPieces(spawnedPieces);
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
  }, [displayPieceSize, gridSize, layoutVersion, pieces.length]);

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

    setIsOpeningPhotocard(true);

    try {
      const hasDeviceOrientation =
        typeof window !== "undefined" &&
        "DeviceOrientationEvent" in window &&
        (isCoarsePointerDevice || isNarrowViewport);

      if (!hasDeviceOrientation) {
        setPhotocardModeEnabled(true);
        setOrientationEnabled(false);
        setSensorUnavailable(true);
        return;
      }

      // Gyro sensor permission flow is intentionally disabled for now.
      // Revisit this later when we want to restore DeviceOrientation access.
      //
      // const permissionGranted = await requestSensorPermission();
      // const canUseOrientation = window.isSecureContext && permissionGranted;
      const canUseOrientation = false;

      // Even when denied, enable photocard mode so the overlay (Case 3) shows
      // and the button flips to "홀로그램 끄기".
      setPhotocardModeEnabled(true);
      setOrientationEnabled(canUseOrientation);
      setSensorUnavailable(!canUseOrientation);
    } finally {
      setIsOpeningPhotocard(false);
    }
  }, [isCoarsePointerDevice, isNarrowViewport, photocardModeEnabled]);

  const handleReplay = React.useCallback(() => {
    clearStoredPuzzleProgress();
    storedProgressRef.current = null;
    completionWhileAuthenticatedRef.current = false;
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

  const handleGridSizeChange = React.useCallback(
    (nextGridSize: PuzzleGridSize) => {
      clearStoredPuzzleProgress();
      storedProgressRef.current = null;
      completionWhileAuthenticatedRef.current = false;
      setGridSize(nextGridSize);
      setCompleted(false);
      setPhotocardModeEnabled(false);
      setIsOpeningPhotocard(false);
      setSensorUnavailable(false);
      setOrientationEnabled(false);
      setIsMagnifierActive(false);
      setMagnifierPoint({ x: 0, y: 0 });
      setPieces([]);
      setLayoutVersion((prev) => prev + 1);
    },
    [],
  );

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
      completionWhileAuthenticatedRef.current = Boolean(token);
      setCompleted(true);
    }
  }, [pieces, token]);

  useEffect(() => {
    if (typeof window === "undefined" || pieces.length === 0) {
      return;
    }

    const containerWidth = playAreaRef.current?.clientWidth;
    const containerHeight = playAreaRef.current?.clientHeight;

    if (!containerWidth || !containerHeight) {
      return;
    }

    const storedProgress: StoredPuzzleProgress = {
      ownerId: currentOwnerId,
      gridSize,
      pieces: pieces.map((piece) => ({
        id: piece.id,
        rotation: piece.rotation,
        isPlaced: piece.isPlaced,
        currentXRatio: piece.isPlaced ? null : piece.currentX / containerWidth,
        currentYRatio: piece.isPlaced ? null : piece.currentY / containerHeight,
      })),
    };

    window.localStorage.setItem(
      PUZZLE_PROGRESS_STORAGE_KEY,
      JSON.stringify(storedProgress),
    );
  }, [currentOwnerId, gridSize, pieces]);

  useEffect(() => {
    if (!completed) {
      setIsMagnifierActive(false);
    }
  }, [completed]);

  const mobilePhotocardActive =
    (isCoarsePointerDevice || isNarrowViewport) && photocardModeEnabled;
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
              href={PUZZLE_IMAGE_URL}
              width={boardWidth}
              height={boardHeight}
              preserveAspectRatio="none"
            />
          </defs>
        </svg>
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
                    ref={artworkRef}
                    className="relative overflow-hidden border border-[#e8ddc6] bg-[#faf8f1]"
                    style={{
                      width: `${displayPieceSize * cols}px`,
                      height: `${displayPieceSize * rows}px`,
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
                          />
                        );
                      })}
                    </div>
                    <PolaroidHolographicOverlay
                      visible={hologramVisible}
                      mobileInteractive={mobilePhotocardActive}
                      orientationEnabled={orientationEnabled}
                      desktopSweep={desktopSweepEnabled}
                      imageUrl={PUZZLE_IMAGE_URL}
                      permissionDenied={sensorUnavailable}
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
                          boardWidth={displayPieceSize * cols}
                          boardHeight={displayPieceSize * rows}
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
                    {(isCoarsePointerDevice || isNarrowViewport) && (
                      <PushableButton
                        onClick={() => void handlePhotocardMode()}
                        disabled={isOpeningPhotocard}
                        className="flex-1 justify-center"
                        variant="mint"
                      >
                        {isOpeningPhotocard
                          ? "준비 중..."
                          : photocardModeEnabled
                            ? "홀로그램 끄기"
                            : "홀로그램 모드"}
                      </PushableButton>
                    )}
                    <PushableButton
                      onClick={handleReplay}
                      className={
                        isCoarsePointerDevice || isNarrowViewport
                          ? "flex-1 justify-center"
                          : "w-full justify-center"
                      }
                      variant="cream"
                    >
                      다시하기
                    </PushableButton>
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
                  {(isCoarsePointerDevice || isNarrowViewport) && (
                    <PushableButton
                      onClick={() => void handlePhotocardMode()}
                      disabled={isOpeningPhotocard}
                      className="w-full justify-center"
                      variant="mint"
                    >
                      {isOpeningPhotocard
                        ? "준비 중..."
                        : photocardModeEnabled
                          ? "홀로그램 끄기"
                          : "홀로그램 모드"}
                    </PushableButton>
                  )}
                  <PushableButton
                    onClick={handleReplay}
                    className="w-full justify-center"
                    variant="cream"
                  >
                    다시 하기
                  </PushableButton>
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
                boardConfig={boardConfig}
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

  if (!embedInContainer) {
    return content;
  }

  return (
    <GameContainer
      title="퍼즐 맞추기"
      desc="리코야 생일상 차려놨어 밥 굶으면 안 돼"
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
