import {
  PUZZLE_GRID_OPTIONS,
  type PuzzleGridSize,
} from "./constants";

const PUZZLE_PROGRESS_STORAGE_KEY = "puzzle_game_progress_v1";
export const GUEST_PUZZLE_OWNER_ID = "__guest__";

export type StoredPuzzlePiece = {
  id: number;
  rotation: number;
  isPlaced: boolean;
  currentXRatio: number | null;
  currentYRatio: number | null;
};

export type StoredPuzzleProgress = {
  ownerId: string | null;
  gridSize: PuzzleGridSize;
  pieces: StoredPuzzlePiece[];
};

export const getPuzzleOwnerId = (uid: string | null, isGuest: boolean) =>
  uid ?? (isGuest ? GUEST_PUZZLE_OWNER_ID : null);

const isPuzzleGridSize = (value: unknown): value is PuzzleGridSize =>
  typeof value === "number" &&
  PUZZLE_GRID_OPTIONS.includes(value as PuzzleGridSize);

export const readStoredPuzzleProgress = (
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

export const clearStoredPuzzleProgress = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PUZZLE_PROGRESS_STORAGE_KEY);
};

export const writeStoredPuzzleProgress = (progress: StoredPuzzleProgress) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    PUZZLE_PROGRESS_STORAGE_KEY,
    JSON.stringify(progress),
  );
};
