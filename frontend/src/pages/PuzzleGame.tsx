import React, { useEffect, useRef, useState } from "react";

import { GameContainer } from "../components/common/GameContainer";
import { MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import confetti from "canvas-confetti";
import { BASE_URL } from "../utils/api";
import { playDiriringSfx, preloadDiriringSfx } from "../utils/soundEffects";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import {
  addAchievementToast,
  parseAchievementAwardResponse,
} from "../utils/achievementAwards";
import {
  PUZZLE_ACHIEVEMENT_CODE,
  PUZZLE_MUSEUM_UNLOCK_EVENT,
  PUZZLE_MUSEUM_UNLOCK_KEY,
} from "../constants/puzzle";
import {
  PIECE_SIZE,
  MOUSE_DRAG_DISTANCE_PX,
  TOUCH_DRAG_ACTIVATION_DELAY_MS,
  TOUCH_DRAG_TOLERANCE_PX,
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
  requestSensorPermission,
} from "../features/puzzle/helpers";
import type { PuzzlePiece } from "../features/puzzle/types";
import { pickRandomActivityBgm } from "../utils/bgm";
import { pushEvent } from "../utils/analytics";
import { useViewEvent } from "../hooks/usePageTracking";
import {
  clearStoredPuzzleProgress,
  getPuzzleOwnerId,
  readStoredPuzzleProgress,
  type StoredPuzzleProgress,
  writeStoredPuzzleProgress,
} from "../features/puzzle/puzzleProgress";
import { PuzzleGameBoardView } from "../features/puzzle/PuzzleGameBoardView";

type PuzzleGameProps = {
  embedInContainer?: boolean;
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
        setSensorUnavailable(true);
        return;
      }

      const permissionGranted = await requestSensorPermission();
      const canUseOrientation = window.isSecureContext && permissionGranted;

      // Even when denied, enable photocard mode so the overlay (Case 3) shows
      // and the button flips to "홀로그램 끄기".
      setPhotocardModeEnabled(true);
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

    writeStoredPuzzleProgress(storedProgress);
  }, [currentOwnerId, gridSize, pieces]);

  useEffect(() => {
    if (!completed) {
      setIsMagnifierActive(false);
    }
  }, [completed]);



  const content = (
    <PuzzleGameBoardView
      sensors={sensors}
      handleDragStart={handleDragStart}
      handleDragEnd={handleDragEnd}
      playAreaRef={playAreaRef}
      boardRef={boardRef}
      artworkRef={artworkRef}
      gridSize={gridSize}
      handleGridSizeChange={handleGridSizeChange}
      displayPieceSize={displayPieceSize}
      cols={cols}
      rows={rows}
      boardWidth={boardWidth}
      boardHeight={boardHeight}
      completed={completed}
      pieces={pieces}
      boardConfig={boardConfig}
      sensorUnavailable={sensorUnavailable}
      isMagnifierActive={isMagnifierActive}
      magnifierPoint={magnifierPoint}
      updateMagnifierPoint={updateMagnifierPoint}
      setIsMagnifierActive={setIsMagnifierActive}
      photocardModeEnabled={photocardModeEnabled}
      isOpeningPhotocard={isOpeningPhotocard}
      handlePhotocardMode={handlePhotocardMode}
      handleReplay={handleReplay}
      handleRotate={handleRotate}
      isAdmin={isAdmin}
      handleDebugComplete={handleDebugComplete}
    />
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
      autoShowHelpKey="game_help_seen_puzzle"
      className="bg-[#FFFFF8]"
      mainClassName="relative overflow-hidden"
    >
      {content}
    </GameContainer>
  );
};

export default PuzzleGame;
