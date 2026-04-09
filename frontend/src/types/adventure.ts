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

export type AdventureGameOverReason =
  | "pit"
  | "spike"
  | "lava"
  | "slime"
  | "magic";

export type AdventureRuntimeHole = {
  id: number;
  x: number;
  width: number;
  gapAfter: number;
  kind: "pit" | "spike" | "lava" | "slime" | "magic";
  height?: number;
  y?: number;
};

export type AdventureRunnerSnapshot = {
  playerY: number;
  velocity: number;
  rotation: number;
  jumpCount: number;
  coyoteTime: number;
  score: number;
  scoreTickTimer: number;
  animationElapsed: number;
  runElapsed: number;
  fallingHole: boolean;
  nextHoleId: number;
  holes: AdventureRuntimeHole[];
};
