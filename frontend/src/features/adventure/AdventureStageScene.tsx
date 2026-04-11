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

const GLOW_WIDTH = PLAYER_WIDTH * PLAYER_HITBOX_WIDTH_RATIO + 100;
const GLOW_HEIGHT = PLAYER_HEIGHT * PLAYER_HITBOX_HEIGHT_RATIO + 48;
const GLOW_LEFT =
  PLAYER_X + (PLAYER_WIDTH * (1 - PLAYER_HITBOX_WIDTH_RATIO)) / 2 - 50;

type Props = {
  stageViewportRef: RefObject<HTMLDivElement | null>;
  stageScale: number;
  trapStructure: Trap[];
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
  trapStructure,
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
  const trapDivRefsMap = useRef(new Map<number, HTMLDivElement>());
  const prevBgTierRef = useRef(-1);
  const prevFrameIndexRef = useRef(-1);

  // Register direct-DOM render callback with the game loop
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

      // Background — only update when tier changes
      const bgTier = Math.floor(score / 500);
      if (bgTier !== prevBgTierRef.current) {
        prevBgTierRef.current = bgTier;
        const hue = (bgTier * 137.5) % 360;
        const bg = `linear-gradient(180deg, #ffffff 0%, hsl(${hue}, 70%, 94%) 100%)`;
        const viewport = stageViewportRef.current;
        if (viewport) viewport.style.background = bg;
      }

      // Player position
      if (playerDivRef.current) {
        playerDivRef.current.style.transform = `translate(${PLAYER_X}px, ${playerTopBase - playerY}px) scale(${characterScale})`;
      }

      // Player sprite — only swap src when frame actually changes
      if (playerImgRef.current) {
        if (frameIndex !== prevFrameIndexRef.current) {
          prevFrameIndexRef.current = frameIndex;
          playerImgRef.current.src = ADVENTURE_PLAYER_FRAME_PATHS[frameIndex];
        }
        // Running ground-bob effect (cheap, no filter)
        playerImgRef.current.style.transform =
          state === "running" && playerY === 0
            ? "translateY(2px)"
            : "translateY(0)";
      }

      // Glow (1000+ score)
      if (glowDivRef.current) {
        if (score >= 1000) {
          const glowTopBase =
            WORLD_HEIGHT -
            egh -
            PLAYER_GROUND_OFFSET -
            PLAYER_HEIGHT * PLAYER_HITBOX_BOTTOM_OFFSET_RATIO +
            24 -
            GLOW_HEIGHT;
          glowDivRef.current.style.display = "";
          glowDivRef.current.style.transform = `translate(${GLOW_LEFT}px, ${glowTopBase - playerY}px)`;
        } else {
          glowDivRef.current.style.display = "none";
        }
      }

      // Trap positions
      for (const trap of traps) {
        const el = trapDivRefsMap.current.get(trap.id);
        if (el) {
          el.style.transform = `translate(${trap.x}px, ${trapTopBase - trap.bottomFromGround - trap.height}px) scale(${trapScale})`;
        }
      }
    };

    return () => {
      renderCallbackRef.current = null;
    };
  }, [
    renderCallbackRef,
    isMobileRef,
    playerYRef,
    playerFrameRef,
    trapsRef,
    scoreRef,
    runStateRef,
    stageViewportRef,
  ]);

  return (
    <div
      ref={stageViewportRef}
      className="relative h-full w-full overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        background:
          "linear-gradient(180deg, #ffffff 0%, hsl(0, 70%, 94%) 100%)",
        transition: "background 1s ease-in-out",
      }}
    >
      {/* Jump zone — fills area below the scaled world (visible on mobile square viewports) */}
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
            color: jumpZonePressed ? "rgba(255,247,239,0.5)" : "rgba(255,247,239,1)",
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
        {/* Ground */}
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

        {/* Traps — structure only; transform driven by render callback */}
        {trapStructure.map((trap) => {
          const isTwoCakes = trap.kind === "long";

          const renderCake = (idx: number, w: number, h: number) => (
            <img
              key={idx}
              src={ADVENTURE_CAKE_ASSET_PATHS[idx]}
              alt="함정"
              draggable={false}
              loading="eager"
              decoding="async"
              className="select-none object-contain"
              style={{ width: w, height: h }}
            />
          );

          return (
            <div
              key={trap.id}
              ref={(el) => {
                if (el) trapDivRefsMap.current.set(trap.id, el);
                else trapDivRefsMap.current.delete(trap.id);
              }}
              className={
                SHOW_COLLISION_DEBUG
                  ? "absolute border border-black/10"
                  : "absolute"
              }
              style={{
                top: 0,
                left: 0,
                width: trap.width,
                height: trap.height,
                transformOrigin: "bottom center",
                display: "flex",
                flexDirection: "row",
                // Initial off-screen position; overwritten immediately by render callback
                transform: `translate(${WORLD_WIDTH + 200}px, 0px)`,
              }}
            >
              {SHOW_COLLISION_DEBUG ? (
                <div
                  className="absolute bg-red-500/40 border border-red-600/60"
                  style={{
                    left: `${TRAP_HITBOX_HORIZONTAL_INSET_RATIO_MOBILE * 100}%`,
                    bottom: `${TRAP_HITBOX_BOTTOM_OFFSET_RATIO_MOBILE * 100}%`,
                    width: `${(1 - TRAP_HITBOX_HORIZONTAL_INSET_RATIO_MOBILE * 2) * 100}%`,
                    height: `${TRAP_HITBOX_HEIGHT_RATIO_MOBILE * 100}%`,
                  }}
                />
              ) : null}
              {isTwoCakes ? (
                <>
                  {renderCake(trap.cakeIndex, trap.width / 2, trap.height)}
                  {renderCake(
                    trap.cakeIndex2 ?? 1,
                    trap.width / 2,
                    trap.height,
                  )}
                </>
              ) : (
                renderCake(trap.cakeIndex, trap.width, trap.height)
              )}
            </div>
          );
        })}

        {/* Glow (1000+ score) — always rendered; visibility controlled by render callback */}
        <div
          ref={glowDivRef}
          className="pointer-events-none absolute"
          style={{
            top: 0,
            left: 0,
            width: GLOW_WIDTH,
            height: GLOW_HEIGHT,
            background:
              "radial-gradient(ellipse at center, rgba(134,239,172,0.72) 0%, rgba(74,222,128,0.32) 42%, rgba(134,239,172,0) 70%)",
            // Hidden until score >= 1000 (opacity toggled via parent score state)
            display: "none",
          }}
        />

        {/* Player — transform driven by render callback */}
        <div
          ref={playerDivRef}
          className="absolute"
          style={{
            top: 0,
            left: 0,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            transform: `translate(${PLAYER_X}px, ${initialPlayerTopBase}px) scale(${initialCharacterScale})`,
            transformOrigin: "bottom center",
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
            style={{ imageRendering: "auto" }}
          />
        </div>
      </div>
    </div>
  );
});
