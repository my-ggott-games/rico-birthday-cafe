import { type TutorialSlide } from "../common/TutorialBanner";

export const GRID_SIZE = 4;
export const WIN_VALUE = 2048;

export const STAGES: Record<
  number,
  { name: string; icon: string; bg: string; text: string; iconColor: string }
> = {
  1: {
    name: "씨앗",
    icon: "Sprout",
    bg: "#d4edda",
    text: "#2d6a4f",
    iconColor: "#2d6a4f",
  },
  2: {
    name: "어린 순",
    icon: "Leaf",
    bg: "#b7e4c7",
    text: "#1b4332",
    iconColor: "#1b4332",
  },
  4: {
    name: "줄기 성장",
    icon: "TrendingUp",
    bg: "#95d5b2",
    text: "#1b4332",
    iconColor: "#1b4332",
  },
  8: {
    name: "깃털 잎",
    icon: "Feather",
    bg: "#74c69d",
    text: "#FFFFF8",
    iconColor: "#FFFFF8",
  },
  16: {
    name: "푸른 덤불",
    icon: "Trees",
    bg: "#52b788",
    text: "#FFFFF8",
    iconColor: "#FFFFF8",
  },
  32: {
    name: "작은 꽃",
    icon: "Flower",
    bg: "#40916c",
    text: "#FFFFF8",
    iconColor: "#FFFFF8",
  },

  64: {
    name: "붉은 열매",
    icon: "CircleDot",
    bg: "linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)",
    text: "#FFFFF8",
    iconColor: "#ff4d4d",
  },
  128: {
    name: "아스파라거스 1년생",
    icon: "TreeDeciduous",
    bg: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
    text: "#FFFFF8",
    iconColor: "#a7c957",
  },
  256: {
    name: "아스파라거스 2년생",
    icon: "TreePine",
    bg: "linear-gradient(135deg, #081c15 0%, #1b4332 100%)",
    text: "#FFFFF8",
    iconColor: "#d4edda",
  },
  512: {
    name: "아스파라거스 3년생",
    icon: "Trees",
    bg: "linear-gradient(135deg, #b7e4c7 0%, #74c69d 100%)",
    text: "#1b4332",
    iconColor: "#1b4332",
  },
  1024: {
    name: "황금 아스파라거스",
    icon: "Crown",
    bg: "linear-gradient(135deg, #ffd700 0%, #b8860b 100%)",
    text: "#5a3d00",
    iconColor: "#fff3b0",
  },
  2048: {
    name: "성검 아스파라거스",
    icon: "Sword",
    bg: "linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%, #38bdf8 100%)",
    text: "#0369a1",
    iconColor: "#ffffff",
  },
};

export const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "아스파라거스를 키워보자",
    titleIcon: "Sprout",
    lines: ["화살표 버튼, 키보드, 모바일 스와이프 모두 OK!"],
    showArrows: true,
  },
  {
    title: "같은 단계를 합치면 성장해",
    titleIcon: "Leaf",
    lines: ["무럭무럭 잘 자란다구!"],
    highlight: { a: "새싹", b: "새싹", result: "아기 순" },
    showArrows: false,
  },
  {
    title: "아스파라거스를 키우기 힘들다면...",
    titleIcon: "Wrench",
    lines: [
      "비료를 사용해봐, 얼마 없으니 아껴써야 해!",
      "되돌리기: 시간을 되돌려요.",
      "바꾸기: 두 타일의 위치를 바꿔요.",
    ],
    showArrows: false,
  },
  {
    title: "여기 아스파라거스 씨앗, 잘 부탁해!",
    titleIcon: "Sprout",
    lines: ["아스파라거스를 끝까지 키우면 좋은 일이 생길지도?"],
    highlight: null,
    showArrows: false,
  },
];
