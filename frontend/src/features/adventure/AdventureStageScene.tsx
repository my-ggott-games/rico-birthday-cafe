import {
  Application,
  Assets,
  Container,
  Sprite,
  Texture,
  type ApplicationOptions,
} from "pixi.js";
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
  GROUND_HEIGHT,
  TRAP_MOBILE_SCALE,
} from "./adventureConstants";
import {
  ADVENTURE_CAKE_ASSET_PATHS,
  ADVENTURE_PLAYER_FRAME_PATHS,
} from "./adventureAssets";

const GLOW_WIDTH = PLAYER_WIDTH * PLAYER_HITBOX_WIDTH_RATIO + 100;
const GLOW_HEIGHT = PLAYER_HEIGHT * PLAYER_HITBOX_HEIGHT_RATIO + 48;
const GLOW_LEFT =
  PLAYER_X + (PLAYER_WIDTH * (1 - PLAYER_HITBOX_WIDTH_RATIO)) / 2 - 50;
const TRAP_POOL_SIZE = 20;

const getBackgroundGradient = (score: number) => {
  const hue = (Math.floor(score / 500) * 137.5) % 360;
  return `linear-gradient(180deg, hsl(${hue}, 70%, 94%) 0%, #ffffff 100%)`;
};

const isLowEndMobileDevice = () => {
  if (typeof navigator === "undefined") return false;

  const deviceMemory = "deviceMemory" in navigator
    ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    : undefined;
  const hardwareConcurrency = navigator.hardwareConcurrency;

  return (
    (typeof deviceMemory === "number" && deviceMemory <= 4) ||
    (typeof hardwareConcurrency === "number" && hardwareConcurrency <= 4)
  );
};

type TrapSpriteSlot = {
  container: Container;
  primary: Sprite;
  secondary: Sprite;
  trapId: number | null;
  cakeIndex: number | null;
  cakeIndex2: number | null;
  kind: Trap["kind"] | null;
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
  const pixiMountRef = useRef<HTMLDivElement | null>(null);
  const glowDivRef = useRef<HTMLDivElement | null>(null);
  const prevBgTierRef = useRef(-1);
  const prevFrameIndexRef = useRef(-1);

  useEffect(() => {
    const mountNode = pixiMountRef.current;
    if (!mountNode) return;

    let isDisposed = false;
    let app: Application | null = null;

    const boot = async () => {
      const lowEndMobile = isMobileRef.current && isLowEndMobileDevice();
      const resolution = lowEndMobile
        ? 1
        : Math.min(window.devicePixelRatio || 1, 2);

      const nextApp = new Application();
      const appOptions: Partial<ApplicationOptions> = {
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        antialias: false,
        autoStart: false,
        backgroundAlpha: 0,
        hello: false,
        preference: "webgl",
        powerPreference: "high-performance",
        resolution,
        sharedTicker: false,
        textureGCActive: false,
        textureGCCheckCountMax: Number.MAX_SAFE_INTEGER,
        textureGCMaxIdle: Number.MAX_SAFE_INTEGER,
      };

      await nextApp.init(appOptions);
      if (isDisposed) {
        nextApp.destroy(true, {
          children: true,
          texture: false,
          textureSource: false,
        });
        return;
      }

      app = nextApp;
      mountNode.appendChild(nextApp.canvas);
      nextApp.canvas.style.width = "100%";
      nextApp.canvas.style.height = "100%";
      nextApp.canvas.style.display = "block";
      nextApp.canvas.style.pointerEvents = "none";

      const [playerTextures, cakeTextures] = await Promise.all([
        Promise.all(
          ADVENTURE_PLAYER_FRAME_PATHS.map(
            async (path) => (await Assets.load(path)) as Texture,
          ),
        ),
        Promise.all(
          ADVENTURE_CAKE_ASSET_PATHS.map(
            async (path) => (await Assets.load(path)) as Texture,
          ),
        ),
      ]);

      if (isDisposed || !app) return;

      const playerContainer = new Container();
      playerContainer.pivot.set(PLAYER_WIDTH / 2, PLAYER_HEIGHT);
      playerContainer.position.set(
        PLAYER_X + PLAYER_WIDTH / 2,
        WORLD_HEIGHT - GROUND_HEIGHT - PLAYER_GROUND_OFFSET,
      );

      const playerSprite = new Sprite(playerTextures[0]);
      playerSprite.width = PLAYER_WIDTH;
      playerSprite.height = PLAYER_HEIGHT;
      playerContainer.addChild(playerSprite);

      const trapLayer = new Container();
      const trapSlots: TrapSpriteSlot[] = Array.from(
        { length: TRAP_POOL_SIZE },
        () => {
          const container = new Container();
          const primary = new Sprite(cakeTextures[0]);
          const secondary = new Sprite(cakeTextures[1]);

          primary.visible = true;
          secondary.visible = false;
          container.visible = false;
          container.addChild(primary);
          container.addChild(secondary);
          trapLayer.addChild(container);

          return {
            container,
            primary,
            secondary,
            trapId: null,
            cakeIndex: null,
            cakeIndex2: null,
            kind: null,
          };
        },
      );

      const trapIdToSlotIndex = new Map<number, number>();

      app.stage.addChild(trapLayer);
      app.stage.addChild(playerContainer);

      const renderScene = () => {
        const playerY = playerYRef.current;
        const frameIndex = playerFrameRef.current;
        const traps = trapsRef.current;
        const score = scoreRef.current;
        const isRunning = runStateRef.current === "running";
        const mobile = isMobileRef.current;
        const characterScale = mobile ? PLAYER_MOBILE_SCALE : 1;
        const trapScale = mobile ? TRAP_MOBILE_SCALE : 1;
        const trapTopBase = WORLD_HEIGHT - GROUND_HEIGHT;
        const playerTopBase =
          WORLD_HEIGHT - GROUND_HEIGHT - PLAYER_GROUND_OFFSET - PLAYER_HEIGHT;

        const bgTier = Math.floor(score / 500);
        if (bgTier !== prevBgTierRef.current) {
          prevBgTierRef.current = bgTier;
          const viewport = stageViewportRef.current;
          if (viewport) {
            viewport.style.background = getBackgroundGradient(score);
          }
        }

        if (frameIndex !== prevFrameIndexRef.current) {
          prevFrameIndexRef.current = frameIndex;
          playerSprite.texture = playerTextures[frameIndex];
        }

        playerContainer.position.set(
          PLAYER_X + PLAYER_WIDTH / 2,
          playerTopBase - playerY + PLAYER_HEIGHT,
        );
        playerContainer.scale.set(characterScale);
        playerSprite.position.set(0, 0);
        playerSprite.y = isRunning && playerY === 0 ? 2 : 0;

        if (glowDivRef.current) {
          if (score >= 1000) {
            const glowTopBase =
              WORLD_HEIGHT -
              GROUND_HEIGHT -
              PLAYER_GROUND_OFFSET -
              PLAYER_HEIGHT * PLAYER_HITBOX_BOTTOM_OFFSET_RATIO +
              24 -
              GLOW_HEIGHT;
            glowDivRef.current.style.opacity = "1";
            glowDivRef.current.style.transform = `translate(${GLOW_LEFT}px, ${glowTopBase - playerY}px)`;
          } else {
            glowDivRef.current.style.opacity = "0";
          }
        }

        const activeTrapIds = new Set<number>();

        for (const trap of traps) {
          activeTrapIds.add(trap.id);
          let slotIndex = trapIdToSlotIndex.get(trap.id);
          if (slotIndex == null) {
            slotIndex = trapSlots.findIndex((slot) => slot.trapId == null);
            if (slotIndex === -1) continue;
            trapIdToSlotIndex.set(trap.id, slotIndex);
          }

          const slot = trapSlots[slotIndex];
          const isNewAssignment = slot.trapId !== trap.id;
          const isTwoCakes = trap.kind === "long";

          slot.container.visible = true;
          slot.container.pivot.set(trap.width / 2, trap.height);
          slot.container.position.set(
            trap.x + trap.width / 2,
            trapTopBase - trap.bottomFromGround,
          );
          slot.container.scale.set(trapScale);

          if (isNewAssignment || slot.cakeIndex !== trap.cakeIndex) {
            slot.primary.texture = cakeTextures[trap.cakeIndex];
          }
          slot.primary.position.set(0, 0);
          slot.primary.width = isTwoCakes ? trap.width / 2 : trap.width;
          slot.primary.height = trap.height;

          if (isTwoCakes) {
            if (isNewAssignment || slot.cakeIndex2 !== (trap.cakeIndex2 ?? 1)) {
              slot.secondary.texture = cakeTextures[trap.cakeIndex2 ?? 1];
            }
            slot.secondary.visible = true;
            slot.secondary.position.set(trap.width / 2, 0);
            slot.secondary.width = trap.width / 2;
            slot.secondary.height = trap.height;
          } else {
            slot.secondary.visible = false;
          }

          slot.trapId = trap.id;
          slot.cakeIndex = trap.cakeIndex;
          slot.cakeIndex2 = trap.cakeIndex2 ?? null;
          slot.kind = trap.kind;
        }

        for (const slot of trapSlots) {
          if (slot.trapId == null || activeTrapIds.has(slot.trapId)) {
            continue;
          }

          trapIdToSlotIndex.delete(slot.trapId);
          slot.trapId = null;
          slot.cakeIndex = null;
          slot.cakeIndex2 = null;
          slot.kind = null;
          slot.container.visible = false;
          slot.secondary.visible = false;
        }

        app?.render();
      };

      renderCallbackRef.current = renderScene;
      renderScene();
    };

    void boot();

    return () => {
      isDisposed = true;
      renderCallbackRef.current = null;
      prevBgTierRef.current = -1;
      prevFrameIndexRef.current = -1;

      if (app) {
        app.destroy(true, {
          children: true,
          texture: false,
          textureSource: false,
        });
      }
    };
  }, [
    isMobile,
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
          style={{ height: GROUND_HEIGHT * 0.84, backgroundColor: "#8b5a2b" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 border-t-[10px] border-[#59a94a]"
          style={{ height: GROUND_HEIGHT, backgroundColor: "#8b5a2b" }}
        />
        <div
          className="absolute inset-x-0 bg-[#59a94a]"
          style={{ bottom: GROUND_HEIGHT, height: 4 }}
        />

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
          ref={pixiMountRef}
          className="absolute inset-0 pointer-events-none"
        />
      </div>
    </div>
  );
});
