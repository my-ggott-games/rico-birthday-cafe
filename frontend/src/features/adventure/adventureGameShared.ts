import type { RunState } from "../../types/adventure";

export { type RunState };

export const ADVENTURE_BEST_SCORE_KEY = "birthday-cafe-adventure-best";
export const ADVENTURE_PLAYER_ELEMENT_ID = "rico-adventure-player";
export const YOUTUBE_VIDEO_ID = "J3B0k47f0Fs";

export const ADVENTURE_PHASES = [
  {
    id: 1,
    title: "1장 - 용사 리코 이야기",
    start: 0,
    end: 39,
    theme: "서막",
    description: "옛날옛날 아주 먼 옛날에...",
  },
  {
    id: 2,
    title: "2장 - 모험의 시작",
    start: 39,
    end: 120,
    theme: "모험의 시작",
    description: "마왕을 잡으러 가자",
  },
  {
    id: 3,
    title: "3장 - 숲에서 만난 친구",
    start: 120,
    end: 224,
    theme: "숲",
    description: "치코등장",
  },
  {
    id: 4,
    title: "4장",
    start: 224,
    end: 274,
    theme: "던전",
    description: "치코뭔가하고죽음",
  },
  {
    id: 5,
    title: "5장",
    start: 274,
    end: 310,
    theme: "결투",
    description: "짧고 거대한 결전 구간입니다.",
  },
  {
    id: 6,
    title: "6장",
    start: 310,
    end: 388,
    theme: "승리",
    description: "치코뭔가함",
  },
  {
    id: 7,
    title: "7장",
    start: 388,
    end: 433,
    theme: "엔딩",
    description: "이야기 끝",
  },
] as const;

export const TOTAL_DURATION = ADVENTURE_PHASES[ADVENTURE_PHASES.length - 1].end;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getPhaseAtTime = (time: number) =>
  ADVENTURE_PHASES.find((phase) => time >= phase.start && time < phase.end) ??
  ADVENTURE_PHASES[ADVENTURE_PHASES.length - 1];

export const getClearedPhaseId = (time: number) =>
  ADVENTURE_PHASES.reduce(
    (highest, phase) => (time >= phase.end ? phase.id : highest),
    0,
  );

export const getRetryPhase = (time: number) => {
  const clearedPhaseId = getClearedPhaseId(time);
  const retryPhaseId = Math.min(clearedPhaseId + 1, ADVENTURE_PHASES.length);
  return (
    ADVENTURE_PHASES.find((phase) => phase.id === retryPhaseId) ??
    ADVENTURE_PHASES[0]
  );
};
