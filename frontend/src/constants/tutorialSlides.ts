import type { TutorialSlide } from "../components/common/TutorialBanner";

export const ADVENTURE_HELP_SLIDES: TutorialSlide[] = [
  {
    title: "무한 달리기",
    titleIcon: "Sword",
    lines: [
      "이번엔 긴 이야기 없이 바로 달린다!",
      "스테이지 없이 마법 함정이 나올 때까지",
      "리코가 계속 전진하는 간단한 러너 모드야",
    ],
    showArrows: false,
  },
  {
    title: "점프로 버티기",
    titleIcon: "Sparkles",
    lines: [
      "클릭, 탭, 스페이스바로 점프할 수 있어",
      "2단 점프가 가능하니까 함정 높이에 맞춰 써보자",
      "속도가 빨라질수록 점프 템포도 같이 빨라져",
    ],
    showArrows: false,
  },
  {
    title: "100점마다 더 빠르게",
    titleIcon: "Shield",
    lines: [
      "점수는 1초당 10점씩 올라가",
      "100점마다 맵 속도와 리코 애니메이션이 조금씩 빨라져",
      "1000점 이상에서 게임오버 되면 R전드 용사 업적을 얻어",
    ],
    showArrows: false,
  },
];

export const ASPARAGUS_TUTORIAL_SLIDES: TutorialSlide[] = [
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
    highlight: { a: "씨앗", b: "씨앗", result: "어린 순" },
    showArrows: false,
  },
  {
    title: "처음엔 많이 어려울거야.",
    titleIcon: "Wrench",
    lines: [
      "비료를 사용해봐, 얼마 없으니 아껴써야 해!",
      "되돌리기: 마지막 이동을 되돌릴 수 있어",
      "바꾸기: 두 타일의 위치를 바꿀 수 있어",
    ],
    showArrows: false,
  },
  {
    title: "그럼 잘 부탁해!",
    titleIcon: "Sprout",
    lines: ["아스파라거스를 끝까지 키우면 좋은 일이 생길지도?"],
    highlight: null,
    showArrows: false,
  },
];

export const PUZZLE_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "퍼즐 맞추기",
    titleIcon: "Puzzle",
    lines: ["조각을 꾸~욱 눌러 퍼즐을 맞추자", "알맞은 위치에 놓아줘!"],
    showArrows: false,
  },
  {
    title: "탭하면 회전",
    titleIcon: "RefreshCw",
    lines: ["조각을 탭해서 올바른 방향으로 바꾸자"],
    showArrows: false,
  },
  {
    title: "어떤 그림일까?",
    lines: ["제한 시간은 없으니 여유롭게 즐겨줘!"],
    showArrows: false,
  },
];

export const FORTUNE_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "오늘의 운세",
    titleIcon: "ScrollText",
    lines: ["통을 클릭하거나 버튼을 눌러 운세를 뽑아보세요."],
    showArrows: false,
  },
  {
    title: "대길 업적",
    titleIcon: "Sparkles",
    lines: [
      "대길을 뽑으면 업적이 지급돼요.",
      "원할 때 다시 뽑아서 오늘의 기분을 확인해요.",
    ],
    showArrows: false,
  },
];

export const CODY_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "옷을 고르자!",
    titleIcon: "Shirt",
    lines: [
      "PC: 아이템을 드래그해서 리코에게 전해주자",
      "모바일: 아이템을 탭해봐!",
    ],
    showArrows: false,
  },
  {
    title: "코디가 끝났다면",
    titleIcon: "Camera",
    lines: ['"코디 끝!" 버튼을 눌러줘', "사진을 찍어줄게!"],
    showArrows: false,
  },
  {
    title: "사진을 저장하자!",
    titleIcon: "Save",
    lines: ["코디가 끝나면 이미지 저장 버튼으로", "추억을 남기자!"],
    showArrows: false,
  },
  {
    title: "특별한 조합을 찾아보자",
    titleIcon: "Sparkles",
    lines: [
      "특별한 조합은 총 6가지야.",
      "모든 조합을 찾으면 좋은 일이 생길지도?",
    ],
    showArrows: false,
  },
];

export const ITABAG_TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: "이타백 꾸미기",
    titleIcon: "Ribbon",
    lines: [
      "아래 뱃지를 눌러 가방에 추가해요.",
      "드래그해서 원하는 위치로 이동해요.",
    ],
    showArrows: false,
  },
  {
    title: "배치 편집",
    titleIcon: "WandSparkles",
    lines: [
      "탭하면 회전하고, 더블탭하면 삭제해요.",
      "완성 후 저장 버튼으로 레이아웃을 보관해요.",
    ],
    showArrows: false,
  },
];
