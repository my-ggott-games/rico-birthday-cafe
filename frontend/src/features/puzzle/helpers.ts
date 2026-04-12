import {
  CONNECTOR_DEPTH,
  CONNECTOR_NECK,
  DESKTOP_BOARD_HORIZONTAL_PADDING,
  DESKTOP_BOARD_VERTICAL_PADDING,
  MIN_DISPLAY_PIECE_SIZE,
  MOBILE_BOARD_HORIZONTAL_PADDING,
  MOBILE_BOARD_VERTICAL_PADDING,
  PIECE_SIZE,
  type PuzzleBoardConfig,
  type PuzzleGridSize,
  getPuzzleBoardConfig,
} from "./constants";
import type {
  Bounds,
  DeviceMotionEventWithPermission,
  DeviceOrientationEventWithPermission,
  EdgeTypes,
  PiecePadding,
  PuzzlePiece,
  SpawnZone,
} from "./types";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getDisplayPieceSize = (
  viewportWidth: number,
  viewportHeight: number,
  gridSize: PuzzleGridSize,
) => {
  const { cols, rows } = getPuzzleBoardConfig(gridSize);
  const isDesktop = viewportWidth >= 1024;
  const availableBoardWidth =
    (isDesktop ? viewportWidth * 0.42 : viewportWidth) -
    (isDesktop
      ? DESKTOP_BOARD_HORIZONTAL_PADDING
      : MOBILE_BOARD_HORIZONTAL_PADDING);
  const availableBoardHeight =
    viewportHeight -
    (isDesktop
      ? DESKTOP_BOARD_VERTICAL_PADDING
      : MOBILE_BOARD_VERTICAL_PADDING);

  return Math.max(
    MIN_DISPLAY_PIECE_SIZE,
    Math.min(
      PIECE_SIZE,
      Math.floor(availableBoardWidth / cols),
      Math.floor(availableBoardHeight / rows),
    ),
  );
};

export const requestSensorPermission = async () => {
  if (typeof window === "undefined" || !window.isSecureContext) {
    return false;
  }

  if (!("DeviceOrientationEvent" in window)) {
    return false;
  }

  const orientationEvent = window.DeviceOrientationEvent as
    | DeviceOrientationEventWithPermission
    | undefined;
  const motionEvent = window.DeviceMotionEvent as
    | DeviceMotionEventWithPermission
    | undefined;

  if (typeof orientationEvent?.requestPermission !== "function") {
    return true;
  }

  try {
    const orientationPermission = await orientationEvent.requestPermission();

    if (orientationPermission !== "granted") {
      return false;
    }

    if (typeof motionEvent?.requestPermission === "function") {
      const motionPermission = await motionEvent.requestPermission();
      if (motionPermission !== "granted") {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Device sensor permission request failed", error);
    return false;
  }
};

export const createInterlockingPath = (
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

export const createGuidelinePath = (
  piece: Pick<PuzzlePiece, "edgeTypes" | "padding" | "correctX" | "correctY">,
  boardConfig: PuzzleBoardConfig,
) => {
  const { edgeTypes: edges, padding, correctX, correctY } = piece;
  const { cols, rows } = boardConfig;
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

  const segments = [`M ${x0} ${y0} ${top}`, `M ${x0} ${y1} ${left}`];

  if (correctX === cols - 1) {
    segments.push(`M ${x1} ${y0} ${right}`);
  }

  if (correctY === rows - 1) {
    segments.push(`M ${x1} ${y1} ${bottom}`);
  }

  return segments.join(" ").replace(/\s+/g, " ").trim();
};

export const createPieces = (gridSize: PuzzleGridSize) => {
  const { cols, rows } = getPuzzleBoardConfig(gridSize);
  const internalVertical = Array.from({ length: rows }, () =>
    Array.from({ length: cols - 1 }, () => (Math.random() > 0.5 ? 1 : -1)),
  );
  const internalHorizontal = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: cols }, () => (Math.random() > 0.5 ? 1 : -1)),
  );

  const pieces: PuzzlePiece[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const top =
        row === 0 ? 0 : internalHorizontal[row - 1][col] === 1 ? -1 : 1;
      const right = col === cols - 1 ? 0 : internalVertical[row][col];
      const bottom = row === rows - 1 ? 0 : internalHorizontal[row][col];
      const left =
        col === 0 ? 0 : internalVertical[row][col - 1] === 1 ? -1 : 1;
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
        id: row * cols + col,
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

export const getLocalBounds = (
  childRect: DOMRect,
  parentRect: DOMRect,
): Bounds => ({
  x: childRect.left - parentRect.left,
  y: childRect.top - parentRect.top,
  width: childRect.width,
  height: childRect.height,
});

export const getScaledBounds = (piece: PuzzlePiece, scale: number) => ({
  renderWidth: piece.expandedBounds.width * scale,
  renderHeight: piece.expandedBounds.height * scale,
  offsetX: piece.padding.left * scale,
  offsetY: piece.padding.top * scale,
});

export const clampPiecePosition = (
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

export const buildSpawnZones = (
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
        containerBounds.width -
        (boardBounds.x + boardBounds.width) -
        margin * 2,
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
        containerBounds.height -
        (boardBounds.y + boardBounds.height) -
        margin * 2,
    },
  ].filter((zone) => zone.width > 24 && zone.height > 24);
};

export const overlapsTooMuch = (a: Bounds, b: Bounds) => {
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

export const assignSpawnPositions = (
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
  const fallbackZone = zones.reduce<SpawnZone | null>((largest, zone) => {
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
      const zone =
        zones[Math.floor(Math.random() * zones.length)] ?? fallbackZone;
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
