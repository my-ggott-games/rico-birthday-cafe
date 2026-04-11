import {
  memo,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import type { RunState } from "./adventureConstants";
import type { Trap } from "./adventureTrap";
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_MOBILE_SCALE,
  PLAYER_HITBOX_WIDTH_RATIO,
  PLAYER_HITBOX_HEIGHT_RATIO,
  PLAYER_HITBOX_BOTTOM_OFFSET_RATIO,
  PLAYER_GROUND_OFFSET,
  TRAP_HITBOX_BOTTOM_OFFSET_RATIO_MOBILE,
  TRAP_HITBOX_HEIGHT_RATIO_MOBILE,
  TRAP_HITBOX_HORIZONTAL_INSET_RATIO_MOBILE,
  TRAP_MOBILE_SCALE,
  getEffectiveGroundHeight,
} from "./adventureConstants";
import {
  ADVENTURE_CAKE_ASSET_PATHS,
  ADVENTURE_PLAYER_FRAME_PATHS,
} from "./adventureAssets";

const SHOW_COLLISION_DEBUG = import.meta.env.DEV;
const TRAP_POOL_SIZE = 20;

const GLOW_WIDTH = PLAYER_WIDTH * PLAYER_HITBOX_WIDTH_RATIO + 100;
const GLOW_HEIGHT = PLAYER_HEIGHT * PLAYER_HITBOX_HEIGHT_RATIO + 48;
const GLOW_LEFT =
  PLAYER_X + (PLAYER_WIDTH * (1 - PLAYER_HITBOX_WIDTH_RATIO)) / 2 - 50;

const getBackgroundGradient = (score: number) => {
  const hue = (Math.floor(score / 500) * 137.5) % 360;
  return `linear-gradient(180deg, hsl(${hue}, 70%, 94%) 0%, #ffffff 100%)`;
};

type TrapSlotRefs = {
  container: HTMLDivElement | null;
  cakePrimary: HTMLImageElement | null;
  cakeSecondary: HTMLImageElement | null;
  hitbox: HTMLDivElement | null;
};

type TrapSlotSnapshot = {
  trapId: number | null;
  kind: Trap["kind"] | null;
  cakeIndex: number | null;
  cakeIndex2: number | null;
};

type Props = {
  stageViewportRef: RefObject<HTMLDivElement | null>;
  stageScale: number;
  playerYRef: RefObject<number>;
  playerFrameRef: RefObject<number>;
  trapsRef: RefObject<Trap[]>;
  scoreRef: RefObject<number>;
  renderCallbackRef: RefObject<(() => void) | null>;
  isMobileRef: RefObject<boolean>;
  runStateRef: RefObject<RunState>;
  isMobile: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export const AdventureStageScene = memo(function AdventureStageScene({
  stageViewportRef,
  stageScale,
  playerYRef,
  playerFrameRef,
  trapsRef,
  scoreRef,
  renderCallbackRef,
  isMobileRef,
  runStateRef,
  isMobile,
  onPointerDown,
  onPointerUp,
}: Props) {
  const [jumpZonePressed, setJumpZonePressed] = useState(false);
  const effectiveGroundHeight = getEffectiveGroundHeight(isMobile);
  const initialPlayerTopBase =
    WORLD_HEIGHT - effectiveGroundHeight - PLAYER_GROUND_OFFSET - PLAYER_HEIGHT;
  const initialCharacterScale = isMobile ? PLAYER_MOBILE_SCALE : 1;

  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerImgRef = useRef<HTMLImageElement>(null);
  const glowDivRef = useRef<HTMLDivElement>(null);
  const trapSlotRefs = useRef<TrapSlotRefs[]>(
    Array.from({ length: TRAP_POOL_SIZE }, () => ({
      container: null,
      cakePrimary: null,
      cakeSecondary: null,
      hitbox: null,
    })),
  );
  const trapSlotSnapshots = useRef<TrapSlotSnapshot[]>(
    Array.from({ length: TRAP_POOL_SIZE }, () => ({
      trapId: null,
      kind: null,
      cakeIndex: null,
      cakeIndex2: null,
    })),
  );
  const trapIdToSlotIndexRef = useRef(new Map<number, number>());
  const prevBgTierRef = useRef(-1);
  const prevFrameIndexRef = useRef(-1);

  useEffect(() => {
    renderCallbackRef.current = () => {
      const mobile = isMobileRef.current;
      const egh = getEffectiveGroundHeight(mobile);
      const trapTopBase = WORLD_HEIGHT - egh;
      const playerTopBase =
        WORLD_HEIGHT - egh - PLAYER_GROUND_OFFSET - PLAYER_HEIGHT;
      const characterScale = mobile ? PLAYER_MOBILE_SCALE : 1;
      const trapScale = mobile ? TRAP_MOBILE_SCALE : 1;

      const playerY = playerYRef.current;
      const frameIndex = playerFrameRef.current;
      const traps = trapsRef.current;
      const score = scoreRef.current;
      const state = runStateRef.current;

      const bgTier = Math.floor(score / 500);
      if (bgTier !== prevBgTierRef.current) {
        prevBgTierRef.current = bgTier;
        const viewport = stageViewportRef.current;
        if (viewport) {
          viewport.style.background = getBackgroundGradient(score);
        }
      }

      if (playerDivRef.current) {
        playerDivRef.current.style.transform = `translate3d(${PLAYER_X}px, ${playerTopBase - playerY}px, 0) scale(${characterScale})`;
      }

      if (playerImgRef.current) {
        if (frameIndex !== prevFrameIndexRef.current) {
          prevFrameIndexRef.current = frameIndex;
          playerImgRef.current.src = ADVENTURE_PLAYER_FRAME_PATHS[frameIndex];
        }
        playerImgRef.current.style.transform =
          state === "running" && playerY === 0
            ? "translate3d(0, 2px, 0)"
            : "translate3d(0, 0, 0)";
      }

      if (glowDivRef.current) {
        if (score >= 1000) {
          const glowTopBase =
            WORLD_HEIGHT -
            egh -
            PLAYER_GROUND_OFFSET -
            PLAYER_HEIGHT * PLAYER_HITBOX_BOTTOM_OFFSET_RATIO +
            24 -
            GLOW_HEIGHT;
          glowDivRef.current.style.opacity = "1";
          glowDivRef.current.style.transform = `translate3d(${GLOW_LEFT}px, ${glowTopBase - playerY}px, 0)`;
        } else {
          glowDivRef.current.style.opacity = "0";
        }
      }

      const activeTrapIds = new Set<number>();

      for (const trap of traps) {
        activeTrapIds.add(trap.id);

        let slotIndex = trapIdToSlotIndexRef.current.get(trap.id);
        if (slotIndex == null) {
          slotIndex = trapSlotSnapshots.current.findIndex(
            (snapshot) => snapshot.trapId == null,
          );
          if (slotIndex === -1) {
            continue;
          }
          trapIdToSlotIndexRef.current.set(trap.id, slotIndex);
        }

        const slot = trapSlotRefs.current[slotIndex];
        const snapshot = trapSlotSnapshots.current[slotIndex];
        const container = slot.container;

        if (!container) {
          continue;
        }

        const isTwoCakes = trap.kind === "long";
        container.style.opacity = "1";
        container.style.transform = `translate3d(${trap.x}px, ${trapTopBase - trap.bottomFromGround - trap.height}px, 0) scale(${trapScale})`;

        if (slot.hitbox) {
          slot.hitbox.style.display = SHOW_COLLISION_DEBUG ? "" : "none";
        }

        const isNewTrapAssignment = snapshot.trapId !== trap.id;
        if (isNewTrapAssignment) {
          container.style.width = `${trap.width}px`;
          container.style.height = `${trap.height}px`;
        }

        if (slot.cakePrimary) {
          if (isNewTrapAssignment || snapshot.cakeIndex !== trap.cakeIndex) {
            slot.cakePrimary.src = ADVENTURE_CAKE_ASSET_PATHS[trap.cakeIndex];
          }
          if (isNewTrapAssignment || snapshot.kind !== trap.kind) {
            slot.cakePrimary.style.width = isTwoCakes
              ? `${trap.width / 2}px`
              : `${trap.width}px`;
            slot.cakePrimary.style.height = `${trap.height}px`;
          }
        }

        if (slot.cakeSecondary) {
          if (isTwoCakes) {
            if (isNewTrapAssignment || snapshot.cakeIndex2 !== (trap.cakeIndex2 ?? 1)) {
              slot.cakeSecondary.src =
                ADVENTURE_CAKE_ASSET_PATHS[trap.cakeIndex2 ?? 1];
            }
            if (isNewTrapAssignment || snapshot.kind !== trap.kind) {
              slot.cakeSecondary.style.display = "block";
              slot.cakeSecondary.style.width = `${trap.width / 2}px`;
              slot.cakeSecondary.style.height = `${trap.height}px`;
            }
          } else if (snapshot.kind === "long" || isNewTrapAssignment) {
            slot.cakeSecondary.style.display = "none";
          }
        }

        snapshot.trapId = trap.id;
        snapshot.kind = trap.kind;
        snapshot.cakeIndex = trap.cakeIndex;
        snapshot.cakeIndex2 = trap.cakeIndex2 ?? null;
      }

      for (let index = 0; index < trapSlotRefs.current.length; index += 1) {
        const snapshot = trapSlotSnapshots.current[index];
        if (snapshot.trapId == null || activeTrapIds.has(snapshot.trapId)) {
          continue;
        }

        trapIdToSlotIndexRef.current.delete(snapshot.trapId);
        snapshot.trapId = null;
        snapshot.kind = null;
        snapshot.cakeIndex = null;
        snapshot.cakeIndex2 = null;

        const slot = trapSlotRefs.current[index];
        const container = slot.container;
        if (container) {
          container.style.opacity = "0";
          container.style.transform = `translate3d(${WORLD_WIDTH + 200}px, 0, 0)`;
        }
        if (slot.cakeSecondary) {
          slot.cakeSecondary.style.display = "none";
        }
      }
    };

    return () => {
      renderCallbackRef.current = null;
    };
  }, [
    isMobileRef,
    playerFrameRef,
    playerYRef,
    renderCallbackRef,
    runStateRef,
    scoreRef,
    stageViewportRef,
    trapsRef,
  ]);

  return (
    <div
      ref={stageViewportRef}
      className="relative h-full w-full overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        background: getBackgroundGradient(0),
        transition: isMobile ? "none" : "background 1s ease-in-out",
        contain: "layout paint",
      }}
    >
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center"
        style={{
          top: `calc(50% + ${(WORLD_HEIGHT * stageScale) / 2}px)`,
          backgroundColor: "#5EC7A5",
        }}
        onPointerDown={() => setJumpZonePressed(true)}
        onPointerUp={() => setJumpZonePressed(false)}
        onPointerCancel={() => setJumpZonePressed(false)}
      >
        <span
          className="select-none font-black tracking-widest transition-opacity duration-75"
          style={{
            fontSize: `${Math.max(stageScale * 36, 14)}px`,
            letterSpacing: "0.2em",
            color: jumpZonePressed
              ? "rgba(255,247,239,0.5)"
              : "rgba(255,247,239,1)",
          }}
        >
          JUMP!
        </span>
      </div>

      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: effectiveGroundHeight * 0.84,
            backgroundColor: "#8b5a2b",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 border-t-[10px] border-[#59a94a]"
          style={{ height: effectiveGroundHeight, backgroundColor: "#8b5a2b" }}
        />
        <div
          className="absolute inset-x-0 bg-[#59a94a]"
          style={{ bottom: effectiveGroundHeight, height: 4 }}
        />

        {Array.from({ length: TRAP_POOL_SIZE }, (_, index) => (
          <div
            key={index}
            ref={(element) => {
              trapSlotRefs.current[index].container = element;
            }}
            className={
              SHOW_COLLISION_DEBUG
                ? "absolute border border-black/10"
                : "absolute"
            }
            style={{
              top: 0,
              left: 0,
              width: 64,
              height: 64,
              opacity: 0,
              display: "flex",
              flexDirection: "row",
              transform: `translate3d(${WORLD_WIDTH + 200}px, 0, 0)`,
              transformOrigin: "bottom center",
              willChange: "transform, opacity",
            }}
          >
            {SHOW_COLLISION_DEBUG ? (
              <div
                ref={(element) => {
                  trapSlotRefs.current[index].hitbox = element;
                }}
                className="absolute bg-red-500/40 border border-red-600/60"
                style={{
                  left: `${TRAP_HITBOX_HORIZONTAL_INSET_RATIO_MOBILE * 100}%`,
                  bottom: `${TRAP_HITBOX_BOTTOM_OFFSET_RATIO_MOBILE * 100}%`,
                  width: `${(1 - TRAP_HITBOX_HORIZONTAL_INSET_RATIO_MOBILE * 2) * 100}%`,
                  height: `${TRAP_HITBOX_HEIGHT_RATIO_MOBILE * 100}%`,
                }}
              />
            ) : null}
            <img
              ref={(element) => {
                trapSlotRefs.current[index].cakePrimary = element;
              }}
              src={ADVENTURE_CAKE_ASSET_PATHS[0]}
              alt="함정"
              draggable={false}
              loading="eager"
              decoding="async"
              className="select-none object-contain"
              style={{ width: 64, height: 64 }}
            />
            <img
              ref={(element) => {
                trapSlotRefs.current[index].cakeSecondary = element;
              }}
              src={ADVENTURE_CAKE_ASSET_PATHS[1]}
              alt="함정"
              draggable={false}
              loading="eager"
              decoding="async"
              className="select-none object-contain"
              style={{ display: "none", width: 64, height: 64 }}
            />
          </div>
        ))}

        <div
          ref={glowDivRef}
          className="pointer-events-none absolute"
          style={{
            top: 0,
            left: 0,
            width: GLOW_WIDTH,
            height: GLOW_HEIGHT,
            opacity: 0,
            background:
              "radial-gradient(ellipse at center, rgba(134,239,172,1) 0%, rgba(74,222,128,0.32) 42%, rgba(134,239,172,0) 70%)",
            willChange: "transform, opacity",
          }}
        />

        <div
          ref={playerDivRef}
          className="absolute"
          style={{
            top: 0,
            left: 0,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            transform: `translate3d(${PLAYER_X}px, ${initialPlayerTopBase}px, 0) scale(${initialCharacterScale})`,
            transformOrigin: "bottom center",
            willChange: "transform",
          }}
        >
          {SHOW_COLLISION_DEBUG ? (
            <div
              className="absolute bg-blue-500/30 border border-blue-500/50"
              style={{
                left: `${((1 - PLAYER_HITBOX_WIDTH_RATIO) / 2) * 100}%`,
                bottom: `${PLAYER_HITBOX_BOTTOM_OFFSET_RATIO * 100}%`,
                width: `${PLAYER_HITBOX_WIDTH_RATIO * 100}%`,
                height: `${PLAYER_HITBOX_HEIGHT_RATIO * 100}%`,
              }}
            />
          ) : null}
          <img
            ref={playerImgRef}
            src={ADVENTURE_PLAYER_FRAME_PATHS[0]}
            alt="달리는 리코"
            draggable={false}
            className="relative z-[1] h-full w-full select-none object-contain"
            style={{ imageRendering: "auto", willChange: "transform" }}
          />
        </div>
      </div>
    </div>
  );
});
