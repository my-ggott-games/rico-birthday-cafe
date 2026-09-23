import React, { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
  type TargetAndTransition,
} from "framer-motion";
import { AppIcon } from "../../../components/common/AppIcon";
import { getLobbyNoteTitle, type LobbyNoteKey } from "../lobbyNotes";
import {
  CHIKO_SPRITE_ASPECT,
  getChikoDirection,
  getNextTurnDirection,
  type ChikoDirection,
  type LobbyChikoGame,
} from "./chikoConfig";

const DRAG_THRESHOLD_PX = 6;
const DROP_RESUME_DELAY_MS = 2000;
const WALK_SPEED_PX_PER_SEC = 70;
const MIN_WALK_SEC = 1;
const MAX_WALK_SEC = 3;
const MIN_REST_MS = 2000;
const MAX_REST_MS = 5000;
const MAX_STEP_RATIO_X = 0.4;
const MAX_STEP_RATIO_Y = 0.5;
const FAR_SCALE = 0.8;
const BOTTOM_PADDING_PX = 8;
const TURN_STEP_MS = 90;

export type ChikoPosition = { rx: number; ry: number };

export type ChikoArea = {
  width: number;
  height: number;
  spriteHeight: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const getUsableBox = ({ width, height, spriteHeight }: ChikoArea) => {
  const spriteWidth = spriteHeight * CHIKO_SPRITE_ASPECT;
  return {
    left: spriteWidth / 2,
    top: spriteHeight,
    width: Math.max(width - spriteWidth, 0),
    height: Math.max(height - spriteHeight - BOTTOM_PADDING_PX, 0),
  };
};

const WALK_ANIMATION: TargetAndTransition = {
  y: [0, -7, 0],
  rotate: [-4, 4, -4],
  scaleX: 1,
  scaleY: 1,
  transition: {
    y: { duration: 0.42, repeat: Infinity, ease: "easeOut" },
    rotate: { duration: 0.84, repeat: Infinity, ease: "easeInOut" },
  },
};

const IDLE_ANIMATION: TargetAndTransition = {
  y: 0,
  rotate: 0,
  scaleX: [1, 1.02, 1],
  scaleY: [1, 0.97, 1],
  transition: {
    scaleX: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
    scaleY: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
};

const DRAG_ANIMATION: TargetAndTransition = {
  y: -14,
  rotate: 0,
  scaleX: 1.1,
  scaleY: 1.1,
  transition: { type: "spring", stiffness: 420, damping: 22 },
};

const STILL_ANIMATION: TargetAndTransition = {
  y: 0,
  rotate: 0,
  scaleX: 1,
  scaleY: 1,
  transition: { type: "spring", stiffness: 520, damping: 18 },
};

const DANGLE_ANGLE_DEG = 8;
const DANGLE_SWING_SEC = 1.6;
const DANGLE_HOLD_RATIO = 0.09;
const DANGLE_SWING_EASE = [0.45, 0, 0.55, 1] as const;

const useTurningDirection = (
  target: ChikoDirection,
  isInstant: boolean,
): ChikoDirection => {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    if (current === target) {
      return;
    }

    const timer = setTimeout(
      () =>
        setCurrent(isInstant ? target : getNextTurnDirection(current, target)),
      isInstant ? 0 : TURN_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [current, target, isInstant]);

  return current;
};

type ChikoActorProps = {
  game: LobbyChikoGame;
  area: ChikoArea;
  initialPosition: ChikoPosition;
  fixedPosition: ChikoPosition;
  isReducedMotion: boolean;
  isCoarsePointer: boolean;
  isMobile: boolean;
  isSelected: boolean;
  noteVisible: boolean;
  getAreaRect: () => DOMRect | null;
  onSelect: (id: LobbyNoteKey | null) => void;
  onEnter: (game: LobbyChikoGame) => void;
  onOpenNote: (key: LobbyNoteKey) => void;
};

export const ChikoActor: React.FC<ChikoActorProps> = ({
  game,
  area,
  initialPosition,
  fixedPosition,
  isReducedMotion,
  isCoarsePointer,
  isMobile,
  isSelected,
  noteVisible,
  getAreaRect,
  onSelect,
  onEnter,
  onOpenNote,
}) => {
  const rx = useMotionValue(initialPosition.rx);
  const ry = useMotionValue(initialPosition.ry);
  const areaWidth = useMotionValue(area.width);
  const areaHeight = useMotionValue(area.height);
  const spriteHeight = useMotionValue(area.spriteHeight);
  const dangleRotate = useMotionValue(0);
  const areaRef = useRef(area);
  const resumeDelayRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    isDragging: boolean;
  } | null>(null);

  const [direction, setDirection] = useState<ChikoDirection>("front");
  const [isWalking, setIsWalking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const x = useTransform(
    [rx, areaWidth, areaHeight, spriteHeight],
    ([ratio, width, height, sprite]: number[]) => {
      const box = getUsableBox({ width, height, spriteHeight: sprite });
      return box.left + ratio * box.width;
    },
  );
  const y = useTransform(
    [ry, areaWidth, areaHeight, spriteHeight],
    ([ratio, width, height, sprite]: number[]) => {
      const box = getUsableBox({ width, height, spriteHeight: sprite });
      return box.top + ratio * box.height;
    },
  );
  const depthScale = useTransform(
    ry,
    (ratio) => FAR_SCALE + (1 - FAR_SCALE) * ratio,
  );
  const zIndex = useTransform(ry, (ratio) => Math.round(ratio * 100));

  useEffect(() => {
    areaRef.current = area;
    areaWidth.set(area.width);
    areaHeight.set(area.height);
    spriteHeight.set(area.spriteHeight);
  }, [area, areaWidth, areaHeight, spriteHeight]);

  useEffect(() => {
    if (isReducedMotion) {
      rx.set(fixedPosition.rx);
      ry.set(fixedPosition.ry);
    }
  }, [isReducedMotion, fixedPosition.rx, fixedPosition.ry, rx, ry]);

  useEffect(() => {
    if (!isDragging) {
      const settle = animate(dangleRotate, 0, {
        type: "spring",
        stiffness: 260,
        damping: 14,
      });
      return () => settle.stop();
    }

    let swing: AnimationPlaybackControls | undefined;
    const lead = animate(dangleRotate, -DANGLE_ANGLE_DEG, {
      duration: DANGLE_SWING_SEC / 2,
      ease: "easeOut",
      onComplete: () => {
        swing = animate(
          dangleRotate,
          [
            -DANGLE_ANGLE_DEG,
            -DANGLE_ANGLE_DEG,
            DANGLE_ANGLE_DEG,
            DANGLE_ANGLE_DEG,
          ],
          {
            duration: DANGLE_SWING_SEC,
            times: [0, DANGLE_HOLD_RATIO, 1 - DANGLE_HOLD_RATIO, 1],
            ease: ["linear", DANGLE_SWING_EASE, "linear"],
            repeat: Infinity,
            repeatType: "mirror",
          },
        );
      },
    });

    return () => {
      lead.stop();
      swing?.stop();
    };
  }, [isDragging, dangleRotate]);

  const isLabelVisible = isHovered || isFocused || isSelected;
  const isPaused = isReducedMotion || isDragging || isLabelVisible;
  const isAreaReady = area.width > 0 && area.height > 0;

  useEffect(() => {
    if (isPaused || !isAreaReady) {
      return;
    }

    let isCancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let control: AnimationPlaybackControls | undefined;

    const rest = (delayMs: number) => {
      timer = setTimeout(walk, delayMs);
    };

    const walk = () => {
      const box = getUsableBox(areaRef.current);
      const fromX = rx.get();
      const fromY = ry.get();
      const toX = clamp(
        fromX + randomBetween(-MAX_STEP_RATIO_X, MAX_STEP_RATIO_X),
        0,
        1,
      );
      const toY = clamp(
        fromY + randomBetween(-MAX_STEP_RATIO_Y, MAX_STEP_RATIO_Y),
        0,
        1,
      );
      const dx = (toX - fromX) * box.width;
      const dy = (toY - fromY) * box.height;
      const distance = Math.hypot(dx, dy);

      if (distance < 12) {
        rest(randomBetween(MIN_REST_MS, MAX_REST_MS));
        return;
      }

      const duration = clamp(
        distance / WALK_SPEED_PX_PER_SEC,
        MIN_WALK_SEC,
        MAX_WALK_SEC,
      );
      setDirection(getChikoDirection(dx, dy));
      setIsWalking(true);
      control = animate(0, 1, {
        duration,
        ease: "linear",
        onUpdate: (progress) => {
          rx.set(fromX + (toX - fromX) * progress);
          ry.set(fromY + (toY - fromY) * progress);
        },
        onComplete: () => {
          if (isCancelled) {
            return;
          }
          setIsWalking(false);
          rest(randomBetween(MIN_REST_MS, MAX_REST_MS));
        },
      });
    };

    rest(resumeDelayRef.current ?? randomBetween(500, 3000));
    resumeDelayRef.current = null;

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      control?.stop();
      setIsWalking(false);
    };
  }, [isPaused, isAreaReady, rx, ry]);

  const moveToPointer = (clientX: number, clientY: number) => {
    const drag = dragRef.current;
    const rect = getAreaRect();
    if (!drag || !rect) {
      return;
    }

    const box = getUsableBox(areaRef.current);
    const feetX = clientX - rect.left + drag.offsetX;
    const feetY = clientY - rect.top + drag.offsetY;
    rx.set(box.width > 0 ? clamp((feetX - box.left) / box.width, 0, 1) : 0.5);
    ry.set(box.height > 0 ? clamp((feetY - box.top) / box.height, 0, 1) : 1);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    suppressClickRef.current = false;
    if (isReducedMotion || event.button !== 0) {
      return;
    }

    const rect = getAreaRect();
    if (!rect) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: x.get() - (event.clientX - rect.left),
      offsetY: y.get() - (event.clientY - rect.top),
      isDragging: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (!drag.isDragging) {
      const moved = Math.hypot(
        event.clientX - drag.startX,
        event.clientY - drag.startY,
      );
      if (moved < DRAG_THRESHOLD_PX) {
        return;
      }
      drag.isDragging = true;
      setIsDragging(true);
      if (isSelected) {
        onSelect(null);
      }
    }

    moveToPointer(event.clientX, event.clientY);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    if (drag.isDragging) {
      suppressClickRef.current = true;
      resumeDelayRef.current = DROP_RESUME_DELAY_MS;
      setIsDragging(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    const isKeyboardClick = event.detail === 0;
    if (isCoarsePointer && !isKeyboardClick && !isSelected) {
      onSelect(game.id);
      return;
    }

    onEnter(game);
  };

  const targetDirection: ChikoDirection =
    isReducedMotion || isDragging || isLabelVisible ? "front" : direction;
  const visibleDirection = useTurningDirection(
    targetDirection,
    isReducedMotion,
  );

  let bodyAnimation = STILL_ANIMATION;
  if (isDragging) {
    bodyAnimation = DRAG_ANIMATION;
  } else if (isWalking) {
    bodyAnimation = WALK_ANIMATION;
  } else if (!isReducedMotion) {
    bodyAnimation = IDLE_ANIMATION;
  }

  return (
    <motion.div
      className="absolute left-0 top-0 h-0 w-0"
      style={{ x, y, zIndex: isDragging || isLabelVisible ? 200 : zIndex }}
    >
      <div
        className={`relative -translate-x-1/2 -translate-y-full ${isMobile ? "h-20 w-[5.45rem]" : "h-28 w-[7.63rem]"}`}
      >
        <motion.div
          className="absolute inset-0 origin-bottom"
          style={{ scale: depthScale }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute bottom-[-0.3rem] left-1/2 h-3 w-3/5 -translate-x-1/2 rounded-[50%] bg-[#1a4e35]/25 blur-[1px]"
            animate={
              isDragging
                ? { scale: 0.7, opacity: 0.45 }
                : { scale: 1, opacity: 1 }
            }
          />
          <motion.button
            type="button"
            aria-label={`${game.name} 입장`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") {
                setIsHovered(true);
              }
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") {
                setIsHovered(false);
              }
            }}
            onFocus={(event) => {
              if (event.currentTarget.matches(":focus-visible")) {
                setIsFocused(true);
              }
            }}
            onBlur={() => setIsFocused(false)}
            onClick={handleClick}
            animate={bodyAnimation}
            className={`absolute inset-0 origin-bottom touch-none select-none rounded-[40%] border-0 bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-[#166D77]/40 ${isReducedMotion ? "cursor-pointer" : isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            <motion.div
              className="h-full w-full origin-top"
              style={{ rotate: dangleRotate }}
            >
              <img
                src={game.sprites[visibleDirection]}
                alt=""
                className="pointer-events-none h-full w-full select-none object-contain"
                draggable={false}
              />
            </motion.div>
          </motion.button>
        </motion.div>

        {isLabelVisible && (
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 flex-col items-center">
            <div
              className={`whitespace-nowrap rounded-xl border-2 border-[#D6C0B0] bg-pale-custard font-bold text-[#166D77] shadow-md ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"}`}
            >
              {game.name}
            </div>
            {isCoarsePointer && isSelected && (
              <div className="mt-1 whitespace-nowrap rounded-full bg-[#166D77]/80 px-2 py-0.5 text-[0.65rem] font-bold text-white">
                한 번 더 탭하면 입장
              </div>
            )}
          </div>
        )}

        {noteVisible && (
          <button
            type="button"
            aria-label={`${getLobbyNoteTitle(game.id)} 열기`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onOpenNote(game.id);
            }}
            className="absolute right-[-0.6rem] top-[-0.6rem] rounded-2xl border-2 border-[#D6B089] bg-[#FFF4D8] p-1.5 text-[#9B6A3D] shadow-[0_8px_18px_rgba(128,87,40,0.2)] transition-transform duration-150 hover:-translate-y-0.5"
          >
            <AppIcon name="StickyNote" size={isMobile ? 14 : 16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};
