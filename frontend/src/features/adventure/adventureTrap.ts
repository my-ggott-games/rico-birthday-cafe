import {
  MOBILE_WORLD_SCALE,
  TRAP_MOBILE_SCALE,
  WORLD_WIDTH,
  getPlayAreaHeight,
} from "./adventureConstants";

export type TrapKind = "small" | "long" | "big";

export type Trap = {
  id: number;
  x: number;
  width: number;
  height: number;
  bottomFromGround: number;
  kind: TrapKind;
  pulseOffset: number;
  cakeIndex: number;
  cakeIndex2?: number;
};

const TRAP_WIDTH = 64;
const TRAP_HEIGHT = 64;
const LONG_TRAP_WIDTH = TRAP_WIDTH * 2;
const LONG_TRAP_HEIGHT = TRAP_HEIGHT;
const BIG_TRAP_WIDTH = TRAP_WIDTH * 2;
const BIG_TRAP_HEIGHT = TRAP_HEIGHT * 2;

const SPAWN_POSITIONS_PCT = [0, 0.13, 0.39, 0.53];
const SPAWN_X = WORLD_WIDTH + 100;

export const createTrap = (
  id: number,
  kind: TrapKind,
  speedTier: number,
  isMobile: boolean,
): Trap => {
  const playAreaHeight = getPlayAreaHeight(isMobile);
  const verticalScale = isMobile ? MOBILE_WORLD_SCALE : 1;
  const randomCake = () => Math.floor(Math.random() * 12) + 1;
  const getSpawnHeight = (trapHeight: number) => {
    const baseHeight =
      SPAWN_POSITIONS_PCT[Math.floor(Math.random() * SPAWN_POSITIONS_PCT.length)] *
      playAreaHeight;
    const scaledHeight = baseHeight * verticalScale;
    const scaledTrapHeight = trapHeight * (isMobile ? TRAP_MOBILE_SCALE : 1);
    return Math.min(scaledHeight, playAreaHeight - scaledTrapHeight);
  };

  const base = {
    id,
    x: SPAWN_X,
    kind,
    pulseOffset: Math.random() * Math.PI * 2,
  };

  switch (kind) {
    case "big": {
      // Pick random from 0-12. If speedTier < 10, pick from 1-12.
      let cakeIndex = Math.floor(Math.random() * 13);
      if (speedTier < 10 && cakeIndex === 0) {
        cakeIndex = randomCake();
      }
      return {
        ...base,
        width: BIG_TRAP_WIDTH,
        height: BIG_TRAP_HEIGHT,
        bottomFromGround: 0,
        cakeIndex,
      };
    }
    case "long":
      return {
        ...base,
        width: LONG_TRAP_WIDTH,
        height: LONG_TRAP_HEIGHT,
        bottomFromGround: getSpawnHeight(LONG_TRAP_HEIGHT),
        cakeIndex: randomCake(),
        cakeIndex2: randomCake(),
      };
    case "small":
    default:
      return {
        ...base,
        width: TRAP_WIDTH,
        height: TRAP_HEIGHT,
        bottomFromGround: getSpawnHeight(TRAP_HEIGHT),
        cakeIndex: randomCake(),
      };
  }
};

export const pickTrapKind = (speedTier: number): TrapKind => {
  const roll = Math.random();
  if (speedTier >= 10) {
    if (roll < 0.3) return "big";
    if (roll < 0.6) return "long";
    return "small";
  }
  if (roll < 0.2) return "big";
  if (roll < 0.5) return "long";
  return "small";
};

export const getNextSpawnDelay = (speedTier: number) =>
  Math.max(speedTier >= 10 ? 0.25 : 0.4, 1.15 - speedTier * 0.04) +
  Math.random() * 0.4;
