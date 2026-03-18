export type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export type EdgeValue = -1 | 0 | 1;

export type EdgeTypes = {
  top: EdgeValue;
  right: EdgeValue;
  bottom: EdgeValue;
  left: EdgeValue;
};

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PiecePadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export interface PuzzlePiece {
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

export type SpawnZone = Bounds;
