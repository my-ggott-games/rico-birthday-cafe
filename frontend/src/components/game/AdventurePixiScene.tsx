import { Application, extend, useTick } from "@pixi/react";
import { Container, Graphics, Sprite, Texture } from "pixi.js";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { Phase, PositionedHole, RunState } from "../../types/adventure";

extend({ Container, Graphics });
extend({ Sprite });

const GROUND_RATIO = 0.9;
const PLAYER_CENTER_X = 32;
const PLAYER_SPRITE_PATH = "/assets/adventure_character_sample.png";

type AdventurePixiSceneProps = {
  phase: Phase;
  holes: PositionedHole[];
  runState: RunState;
  playerX: number;
  pixelsPerSecond: number;
  courseTimeRef: MutableRefObject<number>;
  playerYRef: MutableRefObject<number>;
  onJumpInput: () => void;
};

type Size = {
  width: number;
  height: number;
};

type StageProps = Omit<AdventurePixiSceneProps, "onJumpInput" | "runState"> &
  Size;

const colorToNumber = (color: string): number =>
  Number.parseInt(color.replace("#", ""), 16);

function useElementSize() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size>({ width: 1, height: 1 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      const nextWidth = Math.max(1, Math.round(element.clientWidth));
      const nextHeight = Math.max(1, Math.round(element.clientHeight));
      setSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { containerRef, size };
}

function AdventurePixiStage({
  width,
  height,
  phase,
  holes,
  playerX,
  pixelsPerSecond,
  courseTimeRef,
  playerYRef,
}: StageProps) {
  const groundRef = useRef<Graphics | null>(null);
  const playerContainerRef = useRef<Container | null>(null);
  const shadowRef = useRef<Graphics | null>(null);
  const playerTexture = useMemo(() => Texture.from(PLAYER_SPRITE_PATH), []);
  const groundY = height * GROUND_RATIO;

  const redrawGround = useCallback(() => {
    const graphics = groundRef.current;
    if (!graphics) {
      return;
    }

    const phaseGround = colorToNumber(phase.groundColor);
    const phasePath = colorToNumber(phase.pathColor);
    const phaseDetail = colorToNumber(phase.detailColor);
    const horizonY = groundY - 18;
    const currentCourseTime = courseTimeRef.current;
    const visibleHoles = holes
      .map((hole) => ({
        x: hole.baseLeft - currentCourseTime * pixelsPerSecond,
        width: hole.width,
      }))
      .filter((hole) => hole.x + hole.width > -40 && hole.x < width + 40)
      .sort((a, b) => a.x - b.x);

    graphics.clear();

    visibleHoles.forEach((hole) => {
      graphics.roundRect(hole.x, groundY - 2, hole.width, height - groundY + 14, 18).fill(
        {
          color: 0x020617,
          alpha: 0.98,
        },
      );
      graphics.rect(hole.x + 8, groundY + 6, Math.max(hole.width - 16, 0), height - groundY).fill(
        {
          color: 0x0f172a,
          alpha: 0.96,
        },
      );
    });

    let segmentStart = 0;
    visibleHoles.forEach((hole) => {
      const segmentWidth = Math.max(0, hole.x - segmentStart);
      if (segmentWidth > 0) {
        graphics.roundRect(segmentStart, horizonY, segmentWidth, height - horizonY, 20).fill(
          {
            color: phaseGround,
          },
        );
        graphics.rect(segmentStart, groundY - 10, segmentWidth, 22).fill({
          color: phasePath,
          alpha: 0.94,
        });
        graphics.rect(segmentStart, groundY + 12, segmentWidth, height - groundY).fill(
          {
            color: phaseGround,
            alpha: 0.92,
          },
        );
      }
      segmentStart = Math.max(segmentStart, hole.x + hole.width);
    });

    if (segmentStart < width) {
      const segmentWidth = width - segmentStart;
      graphics.roundRect(segmentStart, horizonY, segmentWidth, height - horizonY, 20).fill(
        {
          color: phaseGround,
        },
      );
      graphics.rect(segmentStart, groundY - 10, segmentWidth, 22).fill({
        color: phasePath,
        alpha: 0.94,
      });
      graphics.rect(segmentStart, groundY + 12, segmentWidth, height - groundY).fill(
        {
          color: phaseGround,
          alpha: 0.92,
        },
      );
    }

    const markerOffset = (currentCourseTime * pixelsPerSecond) % 34;
    for (let x = -markerOffset; x < width; x += 34) {
      const centerX = x + 10;
      const insideHole = visibleHoles.some(
        (hole) => centerX >= hole.x && centerX <= hole.x + hole.width,
      );
      if (insideHole) {
        continue;
      }

      graphics.roundRect(x, groundY - 4, 20, 3, 2).fill({
        color: phaseDetail,
        alpha: 0.55,
      });
    }

    const pebbleOffset = (currentCourseTime * pixelsPerSecond * 0.45) % 72;
    for (let x = 12 - pebbleOffset; x < width; x += 72) {
      const insideHole = visibleHoles.some(
        (hole) => x >= hole.x && x <= hole.x + hole.width,
      );
      if (insideHole) {
        continue;
      }

      graphics.circle(x, groundY + 24, 4).fill({
        color: phaseDetail,
        alpha: 0.26,
      });
    }
  }, [
    courseTimeRef,
    groundY,
    height,
    holes,
    phase.detailColor,
    phase.groundColor,
    phase.pathColor,
    pixelsPerSecond,
    width,
  ]);

  const drawShadow = useCallback((graphics: Graphics) => {
    graphics.clear();
    graphics.ellipse(0, 0, 24, 8).fill({ color: 0x000000, alpha: 0.2 });
  }, []);
  const drawGroundPlaceholder = useCallback((graphics: Graphics) => {
    graphics.clear();
  }, []);

  const syncScene = useCallback(() => {
    redrawGround();

    if (playerContainerRef.current) {
      playerContainerRef.current.x = playerX;
      playerContainerRef.current.y = groundY - playerYRef.current;
      playerContainerRef.current.rotation =
        playerYRef.current < -6 ? Math.max(-1.05, playerYRef.current / 220) : 0;
    }

    if (shadowRef.current) {
      const airborneDistance = Math.max(playerYRef.current, 0);
      const scaleX = Math.max(0.52, 1 - airborneDistance / 240);
      const scaleY = Math.max(0.42, 1 - airborneDistance / 320);
      shadowRef.current.x = playerX + PLAYER_CENTER_X;
      shadowRef.current.y = groundY + 11;
      shadowRef.current.alpha = Math.max(0.08, 0.22 - airborneDistance / 1400);
      shadowRef.current.scale.set(scaleX, scaleY);
    }
  }, [groundY, playerX, playerYRef, redrawGround]);

  useEffect(() => {
    syncScene();
  }, [syncScene]);

  useTick(syncScene);

  return (
    <>
      <pixiGraphics ref={groundRef} draw={drawGroundPlaceholder} />
      <pixiGraphics ref={shadowRef} draw={drawShadow} />
      <pixiContainer ref={playerContainerRef}>
        <pixiSprite
          texture={playerTexture}
          x={40}
          y={76}
          width={112}
          height={112}
          anchor={{ x: 0.5, y: 1 }}
        />
      </pixiContainer>
    </>
  );
}

export function AdventurePixiScene({
  phase,
  holes,
  runState,
  playerX,
  pixelsPerSecond,
  courseTimeRef,
  playerYRef,
  onJumpInput,
}: AdventurePixiSceneProps) {
  const { containerRef, size } = useElementSize();

  return (
    <div
      ref={containerRef}
      onPointerDown={onJumpInput}
      className={`absolute inset-0 overflow-hidden ${
        runState === "running" ? "cursor-pointer" : ""
      }`}
    >
      <Application
        width={size.width}
        height={size.height}
        autoDensity
        antialias
        backgroundAlpha={0}
        className="h-full w-full pointer-events-none"
      >
        <AdventurePixiStage
          width={size.width}
          height={size.height}
          phase={phase}
          holes={holes}
          playerX={playerX}
          pixelsPerSecond={pixelsPerSecond}
          courseTimeRef={courseTimeRef}
          playerYRef={playerYRef}
        />
      </Application>
    </div>
  );
}
