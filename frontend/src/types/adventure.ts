export type Phase = {
  id: number;
  title: string;
  start: number;
  end: number;
  theme: string;
  skyColor: string;
  hazeColor: string;
  groundColor: string;
  pathColor: string;
  detailColor: string;
  accent: string;
  description: string;
};

export type Hole = {
  key: string;
  time: number;
  width: number;
  lengthType?: "short" | "long";
};

export type PositionedHole = Hole & { baseLeft: number; visualHeight: number };

export type RunState = "ready" | "running" | "paused" | "gameover" | "completed";
