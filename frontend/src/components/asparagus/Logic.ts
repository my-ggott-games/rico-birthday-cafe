import { type Grid, type Direction } from "./types";
import { GRID_SIZE, WIN_VALUE } from "./constants";

export const createEmptyGrid = (): Grid =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

export const addRandomTile = (grid: Grid): Grid => {
  const empty: [number, number][] = [];
  grid.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (!cell) empty.push([r, c]);
    }),
  );
  if (!empty.length) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((row) => [...row]) as Grid;
  next[r][c] = Math.random() < 0.9 ? 1 : 2;
  return next;
};

export const slideRow = (
  row: (number | null)[],
): { row: (number | null)[]; score: number } => {
  const vals = row.filter(Boolean) as number[];
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < vals.length) {
    if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
      const sum = vals[i] * 2;
      merged.push(sum);
      score += sum;
      i += 2;
    } else {
      merged.push(vals[i]);
      i++;
    }
  }
  while (merged.length < GRID_SIZE) merged.push(0);
  return { row: merged.map((v) => v || null), score };
};

export const moveGrid = (
  grid: Grid,
  dir: Direction,
): { grid: Grid; score: number; moved: boolean } => {
  let totalScore = 0;
  let moved = false;
  let next: Grid = createEmptyGrid();

  const processRow = (row: (number | null)[]) => {
    const result = slideRow(row);
    totalScore += result.score;
    if (JSON.stringify(row) !== JSON.stringify(result.row)) moved = true;
    return result.row;
  };

  if (dir === "left") {
    next = grid.map((row) => processRow([...row]));
  } else if (dir === "right") {
    next = grid.map((row) => processRow([...row].reverse()).reverse());
  } else if (dir === "up") {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = grid.map((row) => row[c]);
      const result = processRow([...col]);
      result.forEach((v, r) => {
        next[r][c] = v;
      });
    }
  } else {
    // down
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = grid.map((row) => row[c]).reverse();
      const result = processRow([...col]).reverse();
      result.forEach((v, r) => {
        next[r][c] = v;
      });
    }
  }

  return { grid: next, score: totalScore, moved };
};

export const checkGameOver = (grid: Grid): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) return false;
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
};

export const checkWin = (grid: Grid): boolean =>
  grid.some((row) => row.some((cell) => cell === WIN_VALUE));
