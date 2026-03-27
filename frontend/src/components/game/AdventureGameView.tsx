import type { MutableRefObject } from "react";
import { GameContainer } from "../common/GameContainer";
import type { TutorialSlide } from "../common/TutorialBanner";
import { AdventureModal, type AdventureModalAction } from "./AdventureModal";
import { AdventurePixiScene } from "./AdventurePixiScene";
import type { Phase, PositionedHole, RunState } from "../../types/adventure";

type AdventureGameViewProps = {
  statusLabel: string;
  bestScore: number;
  currentScore: number;
  hudCourseTime: number;
  totalDuration: number;
  courseLength: number;
  phase: Phase;
  overallCourseProgress: number;
  runState: RunState;
  pauseModalActions: AdventureModalAction[];
  gameOverModalActions: AdventureModalAction[];
  onPauseToggle: () => void;
  onJumpInput: () => void;
  onStart: () => void;
  deathMessage: string;
  holes: PositionedHole[];
  courseTimeRef: MutableRefObject<number>;
  playerYRef: MutableRefObject<number>;
  phaseProgress: number;
  helpSlides: TutorialSlide[];
  formatTime: (seconds: number) => string;
  playerX: number;
  pixelsPerSecond: number;
  phases: Phase[];
  unlockedPhaseId: number;
};

export function AdventureGameView({
  statusLabel,
  bestScore,
  currentScore,
  hudCourseTime,
  totalDuration,
  courseLength,
  phase,
  overallCourseProgress,
  runState,
  pauseModalActions,
  gameOverModalActions,
  onPauseToggle,
  onJumpInput,
  onStart,
  deathMessage,
  holes,
  courseTimeRef,
  playerYRef,
  phaseProgress,
  helpSlides,
  formatTime,
  playerX,
  pixelsPerSecond,
  phases,
  unlockedPhaseId,
}: AdventureGameViewProps) {
  return (
    <GameContainer
      title="용사 리코 이야기"
      desc="라떼는 말이야 검 하나로 마왕을 잡았다고"
      gameName="용사 리코 이야기"
      helpSlides={helpSlides}
      className="relative overflow-hidden bg-[#f7f2e8] text-[#1d3557] select-none"
      mainClassName="px-4 pb-10 sm:px-8"
      showDesktopHelp
      headerRight={
        <div className="flex -translate-y-1 items-center gap-3">
          <div
            className="flex min-w-[92px] flex-col items-center rounded-2xl border-2 px-4 py-2 shadow-[0_10px_24px_rgba(16,37,66,0.16)]"
            style={{
              background: "#102542",
              color: "#FFFFF8",
              borderColor: "var(--color-pale-custard)",
              fontFamily: "OneStoreMobilePop",
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
              Score
            </span>
            <span className="text-xl font-black leading-tight">
              {currentScore}
            </span>
          </div>
          <div
            className="flex min-w-[92px] flex-col items-center rounded-2xl border-2 px-4 py-2 shadow-[0_10px_24px_rgba(16,37,66,0.16)]"
            style={{
              background: "#2a9d8f",
              color: "#fefae0",
              borderColor: "var(--color-pale-custard)",
              fontFamily: "OneStoreMobilePop",
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">
              Best
            </span>
            <span className="text-xl font-black leading-tight">
              {bestScore}
            </span>
          </div>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.5fr_0.7fr]">
          <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-[#102542]">
                Runner Status
              </h3>
              <div className="rounded-[1.2rem] bg-[#102542] px-4 py-3 text-sm font-black text-white">
                {statusLabel}
              </div>
              <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#365486]">
                비디오/싱크 관련 코드는 잠시 제거했고, 배경 이동과 구멍 지형만
                남긴 최소 러너 루프입니다.
              </div>
              <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#365486]">
                코스가 오른쪽에서 왼쪽으로 흐르고, 캐릭터는 항상 같은 위치를
                지킵니다.
              </div>
              <div className="rounded-[1.2rem] border border-[#102542]/10 bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#365486]">
                {formatTime(hudCourseTime)} / {formatTime(totalDuration)}
              </div>
            </div>
          </section>

          <div
            className="relative overflow-hidden rounded-[2rem] border-4 border-white/70 p-4 shadow-[0_25px_80px_rgba(17,24,39,0.16)]"
            style={{ backgroundColor: phase.skyColor }}
          >
            <div
              className="absolute left-8 top-8 h-24 w-24 rounded-full opacity-45 blur-2xl"
              style={{ backgroundColor: phase.hazeColor }}
            />
            <div
              className="absolute right-12 top-14 h-16 w-28 rounded-full opacity-35 blur-xl"
              style={{ backgroundColor: phase.hazeColor }}
            />

            <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p
                  className="text-sm font-black uppercase tracking-[0.28em]"
                  style={{ color: phase.accent }}
                >
                  {phase.title}
                </p>
                <h2 className="text-2xl font-black text-[#102542] sm:text-3xl">
                  {phase.description}
                </h2>
              </div>
              <div className="rounded-full bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#102542]">
                {statusLabel}
              </div>
            </div>

            <div
              className="relative h-[360px] w-full overflow-hidden rounded-[1.6rem] border border-white/60 text-left sm:h-[420px]"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.12)" }}
            >
              <AdventurePixiScene
                phase={phase}
                holes={holes}
                runState={runState}
                playerX={playerX}
                pixelsPerSecond={pixelsPerSecond}
                courseTimeRef={courseTimeRef}
                playerYRef={playerYRef}
                onJumpInput={onJumpInput}
              />

              <div className="absolute inset-x-0 bottom-[10%] z-[1] border-t-2 border-dashed border-[#102542]/45" />

              <div className="absolute left-0 right-0 top-4 flex justify-center">
                <div className="rounded-full bg-[#102542]/70 px-4 py-2 text-sm font-bold text-white">
                  Course {Math.round(overallCourseProgress * courseLength)}m /{" "}
                  {courseLength}m
                </div>
              </div>

              {(runState === "running" || runState === "paused") && (
                <button
                  type="button"
                  onClick={onPauseToggle}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="absolute right-4 top-4 z-20 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-[#102542] text-xl font-black text-white shadow-[0_16px_32px_rgba(0,0,0,0.28)] transition-transform hover:scale-[1.02]"
                  aria-label={runState === "paused" ? "Continue" : "Pause"}
                >
                  {runState === "paused" ? "▶" : "Ⅱ"}
                </button>
              )}

              {runState === "paused" && (
                <AdventureModal
                  title={phase.title}
                  status="용사에게도 휴식이 필요해"
                  description="다시 마왕을 무찌르러 가볼까?"
                  actions={pauseModalActions}
                  embedded
                />
              )}

              {runState === "gameover" && (
                <AdventureModal
                  title={phase.title}
                  status="함정에 빠졌어..."
                  description={deathMessage}
                  actions={gameOverModalActions}
                  embedded
                />
              )}

              {(runState === "ready" || runState === "completed") && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={onStart}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="pointer-events-auto rounded-full bg-[#102542]/88 px-7 py-4 text-base font-black text-white shadow-[0_18px_36px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-transform hover:scale-[1.01]"
                  >
                    {runState === "completed" ? "Restart" : "Start"}
                  </button>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/10">
                <div
                  className="h-full rounded-full bg-[#102542]"
                  style={{ width: `${Math.max(phaseProgress * 100, 2)}%` }}
                />
              </div>
            </div>
          </div>

          <section className="rounded-[2rem] border-4 border-[#102542]/10 bg-white/80 p-5 shadow-[0_18px_40px_rgba(17,24,39,0.08)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-[#102542]">
                Phase Preview
              </h3>
              <span className="rounded-full bg-[#2a9d8f] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
                {Math.round(overallCourseProgress * 100)}%
              </span>
            </div>
            <div className="space-y-2">
              {phases.map((item) => {
                const active = item.id === phase.id;
                const unlocked = item.id <= unlockedPhaseId;

                return (
                  <div
                    key={item.id}
                    className={`w-full rounded-[1.2rem] border px-4 py-3 ${
                      active
                        ? "border-[#102542] bg-[#102542] text-white"
                        : unlocked
                          ? "border-[#102542]/10 bg-[#fffaf2] text-[#102542]"
                          : "border-[#9ca3af]/40 bg-[#e5e7eb] text-[#6b7280]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
                          {item.title}
                        </p>
                        <p className="text-base font-black">{item.theme}</p>
                      </div>
                      <p className="text-sm font-bold">
                        {formatTime(item.start)} - {formatTime(item.end)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      </div>
    </GameContainer>
  );
}
