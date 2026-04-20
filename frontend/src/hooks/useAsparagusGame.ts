import { useState, useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { fetchWithAuth } from "../utils/api";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import {
  addAchievementToast,
  parseAchievementAwardResponse,
} from "../utils/achievementAwards";
import { playDiriringSfx, preloadDiriringSfx } from "../utils/soundEffects";
import { type Grid, type Direction } from "../components/asparagus/types";
import {
  createEmptyGrid,
  addRandomTile,
  moveGrid,
  checkGameOver,
  checkWin,
} from "../components/asparagus/Logic";

const LEGEND_GARDENER_CODE = "LEGEND_GARDENER";

// Submit best score to server — called only on game over
const submitBestScore = (bestScore: number) => {
  fetchWithAuth(`/asparagus/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bestScore }),
  }).catch((err) => console.warn("Failed to save score to DB", err));
};

export const useAsparagusGame = () => {
  const token = useAuthStore((state) => state.token);
  const isGuest = useAuthStore((state) => state.isGuest);
  const addToast = useToastStore((state) => state.addToast);

  // ID for device
  const getUid = () => {
    let uid = localStorage.getItem("user-uid");
    if (!uid) {
      uid = Math.random().toString(36).substring(2, 10);
      localStorage.setItem("user-uid", uid);
    }
    return uid;
  };
  const uid = getUid();
  const bestScoreKey = `asparagus-best-${uid}`;

  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() =>
    Number(localStorage.getItem(bestScoreKey) ?? 0),
  );
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [continueAfterWin, setContinueAfterWin] = useState(false);

  // Items Logic
  const [history, setHistory] = useState<{ grid: Grid; score: number }[]>([]);
  const [undoCount, setUndoCount] = useState(5);
  const [swapCount, setSwapCount] = useState(5);
  const [shuffleCount, setShuffleCount] = useState(5);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [selection, setSelection] = useState<{ r: number; c: number } | null>(
    null,
  );
  const [debugMode, setDebugMode] = useState(false);

  // Touch tracking
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const legendAchievementAwardRequestedRef = useRef(false);

  const startGame = useCallback((debug = false) => {
    let g = createEmptyGrid();
    if (debug) {
      g[1][1] = 1024;
      g[2][2] = 1024;
    } else {
      g = addRandomTile(g);
      g = addRandomTile(g);
    }
    setGrid(g);
    setScore(0);
    setDebugMode(debug);
    setGameOver(false);
    setWon(false);
    setContinueAfterWin(false);
    setHistory([]);
    setUndoCount(5);
    setSwapCount(5);
    setShuffleCount(5);
    setIsSwapMode(false);
    setSelection(null);
  }, []);

  // Sync best score from server
  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await fetchWithAuth(`/asparagus/score`);
        if (res.ok) {
          const serverBest = await res.json();
          setBest((b) => {
            const highest = Math.max(b, serverBest);
            localStorage.setItem(bestScoreKey, String(highest));
            return highest;
          });
        }
      } catch (err) {
        console.warn("Failed to fetch best score from DB:", err);
      }
    };
    fetchScore();
  }, [bestScoreKey]);

  // Start immediately on mount
  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    preloadDiriringSfx();
  }, []);

  const awardLegendGardenerAchievement = useCallback(async () => {
    if (legendAchievementAwardRequestedRef.current || isGuest || !token) {
      return;
    }

    legendAchievementAwardRequestedRef.current = true;

    try {
      const response = await fetchWithAuth(
        `/achievements/award/${LEGEND_GARDENER_CODE}`,
        { method: "POST" },
      );
      const awardResult = await parseAchievementAwardResponse(response);

      if (awardResult?.awarded) {
        addAchievementToast(addToast, awardResult.achievement, "asparagus");
      }
    } catch (error) {
      legendAchievementAwardRequestedRef.current = false;
      console.error("Failed to award legend gardener achievement", error);
    }
  }, [addToast, isGuest, token]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#ffd700", "#bef264", "#5EC7A5", "#FFFFF8", "#ffaa00"],
    });
  };

  const handleUndo = useCallback(() => {
    if (undoCount <= 0 || history.length === 0) return;
    const last = history[history.length - 1];
    setGrid(last.grid);
    setScore(last.score);
    setHistory((prev) => prev.slice(0, -1));
    setUndoCount((c) => c - 1);
    setGameOver(false);
    setWon(false);
  }, [undoCount, history]);

  const handleShuffle = useCallback(() => {
    if (shuffleCount <= 0) return;
    setHistory((prev) => [...prev, { grid, score }]);
    const values: (number | null)[] = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) values.push(grid[r][c]);
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    const newGrid = createEmptyGrid();
    let idx = 0;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) newGrid[r][c] = values[idx++];
    setGrid(newGrid);
    setShuffleCount((c) => c - 1);
  }, [shuffleCount, grid, score]);

  const handleTileClick = (r: number, c: number) => {
    if (!isSwapMode || swapCount <= 0 || gameOver) return;

    if (!selection) {
      setSelection({ r, c });
    } else {
      if (selection.r === r && selection.c === c) {
        setSelection(null);
        return;
      }

      // Save history before swap
      setHistory((h) => [...h, { grid: grid, score: score }]);

      // Perform Swap
      setGrid((prev) => {
        const next = prev.map((row) => [...row]) as Grid;
        const temp = next[selection.r][selection.c];
        next[selection.r][selection.c] = next[r][c];
        next[r][c] = temp;
        return next;
      });

      setSwapCount((count) => count - 1);
      setIsSwapMode(false);
      setSelection(null);
    }
  };

  const move = useCallback(
    (dir: Direction) => {
      if (gameOver || (won && !continueAfterWin) || isSwapMode) return;

      const result = moveGrid(grid, dir);
      if (!result.moved) return;

      // 1. Save history (current state before it changes)
      setHistory((prev) => [...prev, { grid, score }]);

      // 2. Perform the movement and add new tile
      const nextGrid = addRandomTile(result.grid);
      setGrid(nextGrid);

      // 3. Update scores
      const addedScore = result.score;
      const newScore = debugMode ? 0 : score + addedScore;
      setScore(newScore);

      // 4. Check ending conditions
      const didWin = !continueAfterWin && checkWin(nextGrid);
      if (didWin) {
        setWon(true);
        void awardLegendGardenerAchievement();
        void playDiriringSfx();
        setTimeout(triggerConfetti, 200);
        setTimeout(() => {
          confetti({
            particleCount: 240,
            spread: 140,
            startVelocity: 55,
            origin: { y: 0.55 },
            colors: ["#ffd700", "#e0f2fe", "#38bdf8", "#bef264", "#FFFFF8"],
          });
        }, 350);
      } else if (checkGameOver(nextGrid)) {
        setGameOver(true);
        // Finalize best score locally and submit to server ONLY on game over
        const finalBest = Math.max(best, newScore);
        if (!debugMode && finalBest > best) {
          setBest(finalBest);
          localStorage.setItem(bestScoreKey, String(finalBest));
        }
        if (!debugMode) {
          submitBestScore(finalBest);
        }
      }
    },
    [
      best,
      bestScoreKey,
      continueAfterWin,
      debugMode,
      gameOver,
      grid,
      isSwapMode,
      score,
      awardLegendGardenerAchievement,
      won,
    ],
  );

  return {
    grid,
    score,
    best,
    gameOver,
    won,
    continueAfterWin,
    history,
    undoCount,
    swapCount,
    shuffleCount,
    isSwapMode,
    selection,
    debugMode,
    startGame,
    startDebugGame: () => startGame(true),
    handleUndo,
    handleShuffle,
    handleTileClick,
    move,
    setContinueAfterWin,
    setIsSwapMode,
    setSelection,
    touchStart,
  };
};
