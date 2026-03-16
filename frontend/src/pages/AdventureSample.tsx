import { useState, useEffect, useCallback, useRef } from "react";
import { Application, useTick, extend } from "@pixi/react";
import { Container, Graphics, Sprite, Text, Assets, Texture } from "pixi.js";

// ✅ 1. 컴포넌트 등록 (파일 최상단)
// JSX 태그 <pixiContainer />, <pixiSprite /> 등을 사용하기 위해 등록합니다.
extend({
  Container,
  Graphics,
  Sprite,
  Text,
});

// ✅ 2. 게임 설정 상수
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 400;
const GROUND_Y = 320;
const PLAYER_X = 100;
const PLAYER_SIZE = 64;
const GRAVITY = 0.8;
const JUMP_FORCE = 15;
const MAX_JUMPS = 2;
const COYOTE_TIME_TICKS = 8;
const PLAYER_IMAGE = "/assets/adventure_character_sample.png";
const SCROLL_SPEED = 5;
const HOLE_MIN_WIDTH = 120;
const HOLE_MAX_WIDTH = 190;
const HOLE_SPAWN_DISTANCE = 280;
const FALL_OUT_THRESHOLD = 200;

type Hole = {
  id: number;
  x: number;
  width: number;
};

const isPlayerOverHole = (holes: Hole[], playerX: number): boolean =>
  holes.some((hole) => hole.x < playerX && playerX < hole.x + hole.width);

const createHole = (id: number): Hole => ({
  id,
  x: STAGE_WIDTH,
  width:
    HOLE_MIN_WIDTH + Math.round(Math.random() * (HOLE_MAX_WIDTH - HOLE_MIN_WIDTH)),
});

// ✅ 3. 게임 로직 컴포넌트 (Application 컨텍스트 내부에서 동작)
const GameScene = () => {
  const [texture, setTexture] = useState<Texture | null>(null);
  const [playerY, setPlayerY] = useState(0);
  const [playerRotation, setPlayerRotation] = useState(0);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const playerYRef = useRef(0);
  const velocityRef = useRef(0);
  const scoreRef = useRef(0);
  const isGameOverRef = useRef(false);
  const isOverHoleRef = useRef(false);
  const jumpCountRef = useRef(0);
  const coyoteTimerRef = useRef(COYOTE_TIME_TICKS);
  const jumpTiltRef = useRef(0);
  const nextHoleIdRef = useRef(1);

  // 구멍 관리를 위한 Ref
  const holesRef = useRef<Hole[]>([]);
  const [holes, setHoles] = useState<Hole[]>([]);

  // A. 에셋 로딩
  useEffect(() => {
    Assets.load(PLAYER_IMAGE).then((tex) => {
      setTexture(tex);
    });
  }, []);

  // B. 점프 입력 처리
  const jump = useCallback(() => {
    if (isGameOverRef.current) {
      // 게임 오버 시 리셋 로직
      playerYRef.current = 0;
      velocityRef.current = 0;
      scoreRef.current = 0;
      isOverHoleRef.current = false;
      jumpCountRef.current = 0;
      coyoteTimerRef.current = COYOTE_TIME_TICKS;
      jumpTiltRef.current = 0;
      nextHoleIdRef.current = 1;
      setPlayerY(0);
      setPlayerRotation(0);
      setScore(0);
      holesRef.current = [];
      setHoles([]);
      isGameOverRef.current = false;
      setIsGameOver(false);
      return;
    }

    const canGroundJump = playerYRef.current <= 0.01 && !isOverHoleRef.current;
    const canCoyoteJump =
      jumpCountRef.current === 0 && coyoteTimerRef.current > 0;
    const canAirJump =
      jumpCountRef.current > 0 && jumpCountRef.current < MAX_JUMPS;

    if (canGroundJump || canCoyoteJump || canAirJump) {
      if (jumpCountRef.current > 0) {
        jumpTiltRef.current = 0.35;
      }

      jumpCountRef.current += 1;
      coyoteTimerRef.current = 0;
      velocityRef.current = JUMP_FORCE;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  // C. 메인 게임 루프 (useTick)
  const updateScene = useCallback(
    (ticker: { deltaTime: number }) => {
      if (isGameOverRef.current || !texture) {
        return;
      }

      const deltaTime = ticker.deltaTime;

      // 1. 구멍 이동 및 생성
      const currentHoles = holesRef.current
        .map((hole) => ({ ...hole, x: hole.x - SCROLL_SPEED * deltaTime }))
        .filter((hole) => hole.x + hole.width > -40);

      if (
        currentHoles.length === 0 ||
        currentHoles[currentHoles.length - 1].x < STAGE_WIDTH - HOLE_SPAWN_DISTANCE
      ) {
        currentHoles.push(createHole(nextHoleIdRef.current));
        nextHoleIdRef.current += 1;
      }

      holesRef.current = currentHoles;
      setHoles(currentHoles);

      // 2. 중력 및 플레이어 위치 계산
      const isOverHole = isPlayerOverHole(currentHoles, PLAYER_X);
      isOverHoleRef.current = isOverHole;
      const hasGroundSupport = playerYRef.current <= 0.01 && !isOverHole;

      if (hasGroundSupport) {
        coyoteTimerRef.current = COYOTE_TIME_TICKS;
      } else if (coyoteTimerRef.current > 0) {
        coyoteTimerRef.current = Math.max(
          0,
          coyoteTimerRef.current - deltaTime,
        );
      }

      let nextVel = velocityRef.current - GRAVITY * deltaTime;
      let nextY = playerYRef.current + nextVel * deltaTime;

      if (!isOverHole && nextY <= 0) {
        nextY = 0;
        nextVel = 0;
        jumpCountRef.current = 0;
        coyoteTimerRef.current = COYOTE_TIME_TICKS;
      }

      playerYRef.current = nextY;
      velocityRef.current = nextVel;
      setPlayerY(nextY);
      jumpTiltRef.current *= 0.82;
      const fallingRotation =
        isOverHole && nextY < -8 ? Math.max(-1.15, nextY / 180) : 0;
      setPlayerRotation(fallingRotation + jumpTiltRef.current);

      // 3. 구멍 밖으로 충분히 떨어지면 게임 오버
      if (nextY < -FALL_OUT_THRESHOLD) {
        isGameOverRef.current = true;
        setIsGameOver(true);
        return;
      }

      // 4. 점수 증가
      scoreRef.current += 1;
      setScore(scoreRef.current);
    },
    [texture],
  );

  useTick(updateScene);

  if (!texture)
    return (
      <pixiText
        text="Loading Assets..."
        x={STAGE_WIDTH / 2 - 50}
        y={STAGE_HEIGHT / 2}
      />
    );

  return (
    <pixiContainer sortableChildren>
      {/* 배경 */}
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT).fill(0x87ceeb); // 하늘

          // 구멍 바닥의 어두운 배경
          holes.forEach((hole) => {
            g.rect(hole.x, GROUND_Y, hole.width, STAGE_HEIGHT - GROUND_Y).fill({
              color: 0x0f172a,
              alpha: 0.95,
            });
          });

          // 구멍을 제외한 땅 세그먼트
          let segmentStart = 0;
          const sortedHoles = [...holes].sort((a, b) => a.x - b.x);
          sortedHoles.forEach((hole) => {
            if (hole.x > segmentStart) {
              g.rect(segmentStart, GROUND_Y, hole.x - segmentStart, STAGE_HEIGHT - GROUND_Y).fill(
                0x7c5c3b,
              );
              g.rect(segmentStart, GROUND_Y, hole.x - segmentStart, 10).fill(
                0x9a7b4f,
              );
            }
            segmentStart = Math.max(segmentStart, hole.x + hole.width);
          });

          if (segmentStart < STAGE_WIDTH) {
            g.rect(segmentStart, GROUND_Y, STAGE_WIDTH - segmentStart, STAGE_HEIGHT - GROUND_Y).fill(
              0x7c5c3b,
            );
            g.rect(segmentStart, GROUND_Y, STAGE_WIDTH - segmentStart, 10).fill(
              0x9a7b4f,
            );
          }
        }}
      />

      {/* 플레이어 캐릭터 */}
      <pixiSprite
        texture={texture}
        x={PLAYER_X}
        y={GROUND_Y - playerY}
        anchor={{ x: 0.5, y: 1 }}
        width={PLAYER_SIZE}
        height={PLAYER_SIZE}
        rotation={playerRotation}
      />

      {/* UI 영역 */}
      <pixiText
        text={`Score: ${Math.floor(score / 10)}`}
        x={20}
        y={20}
        style={{ fill: 0xffffff, fontSize: 24, fontWeight: "bold" }}
      />

      {isGameOver && (
        <pixiContainer x={STAGE_WIDTH / 2} y={STAGE_HEIGHT / 2}>
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.roundRect(-150, -50, 300, 100, 15).fill({
                color: 0x000000,
                alpha: 0.8,
              });
            }}
          />
          <pixiText
            text="GAME OVER"
            anchor={0.5}
            y={-10}
            style={{ fill: 0xff4444, fontSize: 32, fontWeight: "bold" }}
          />
          <pixiText
            text={`Fell into a hole - ${MAX_JUMPS} jumps ready`}
            anchor={0.5}
            y={25}
            style={{ fill: 0xffffff, fontSize: 16 }}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

// ✅ 4. 메인 익스포트 컴포넌트
export default function AdventureRunner() {
  return (
    <div
      onPointerDown={() => window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space" }))}
      className="flex h-screen w-full flex-col items-center justify-center bg-slate-100 p-4"
    >
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-black text-slate-800">PixiJS v8 Runner</h1>
        <p className="text-slate-500">Space to Jump</p>
      </div>

      <div className="overflow-hidden rounded-3xl border-8 border-white shadow-2xl">
        <Application
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          background="#87ceeb"
          antialias
        >
          <GameScene />
        </Application>
      </div>
    </div>
  );
}
