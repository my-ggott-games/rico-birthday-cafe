import type { LobbyNoteKey } from "../lobbyNotes";

export type ChikoDirection =
  | "front"
  | "back"
  | "side-right"
  | "side-left"
  | "diag-front-right"
  | "diag-front-left"
  | "diag-back-right"
  | "diag-back-left";

export type ChikoSpriteSet = Record<ChikoDirection, string>;

const CHIKO_DIRECTIONS: ChikoDirection[] = [
  "front",
  "back",
  "side-right",
  "side-left",
  "diag-front-right",
  "diag-front-left",
  "diag-back-right",
  "diag-back-left",
];

const createSpriteSet = (basePath: string): ChikoSpriteSet =>
  Object.fromEntries(
    CHIKO_DIRECTIONS.map((direction) => [
      direction,
      `${basePath}/${direction}.webp`,
    ]),
  ) as ChikoSpriteSet;

const DEFAULT_CHIKO_SPRITES = createSpriteSet("/pages/lobby/chiko");

export const CHIKO_SPRITE_ASPECT = 349 / 320;

export type LobbyChikoGame = {
  id: LobbyNoteKey;
  name: string;
  to: string;
  sprites: ChikoSpriteSet;
};

export const LOBBY_CHIKO_GAMES: LobbyChikoGame[] = [
  {
    id: "cody",
    name: "리코의 외출 준비",
    to: "/game/cody",
    sprites: DEFAULT_CHIKO_SPRITES,
  },
  {
    id: "puzzle",
    name: "퍼즐 맞추기",
    to: "/game/puzzle",
    sprites: DEFAULT_CHIKO_SPRITES,
  },
  {
    id: "asparagus",
    name: "아스파라거스 키우기",
    to: "/game/asparagus",
    sprites: DEFAULT_CHIKO_SPRITES,
  },
  {
    id: "adventure",
    name: "용사 리코 이야기",
    to: "/game/adventure",
    sprites: DEFAULT_CHIKO_SPRITES,
  },
];

const DIRECTIONS_BY_OCTANT: ChikoDirection[] = [
  "side-right",
  "diag-front-right",
  "front",
  "diag-front-left",
  "side-left",
  "diag-back-left",
  "back",
  "diag-back-right",
];

export const getChikoDirection = (dx: number, dy: number): ChikoDirection => {
  const angle = Math.atan2(dy, dx);
  const octant = Math.round(angle / (Math.PI / 4));
  return DIRECTIONS_BY_OCTANT[(octant + 8) % 8];
};

export const getNextTurnDirection = (
  current: ChikoDirection,
  target: ChikoDirection,
): ChikoDirection => {
  const from = DIRECTIONS_BY_OCTANT.indexOf(current);
  const to = DIRECTIONS_BY_OCTANT.indexOf(target);
  const clockwiseSteps = (to - from + 8) % 8;
  if (clockwiseSteps === 0) {
    return current;
  }
  const step = clockwiseSteps <= 4 ? 1 : -1;
  return DIRECTIONS_BY_OCTANT[(from + step + 8) % 8];
};
