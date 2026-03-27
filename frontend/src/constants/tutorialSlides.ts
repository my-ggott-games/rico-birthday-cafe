import type { TutorialSlide } from "../components/common/TutorialBanner";

export const ADVENTURE_SAMPLE_HELP_SLIDES: TutorialSlide[] = [
  {
    title: "용사 리코 이야기",
    lines: [
      "이세계 주민들은 리코 덕분에 행복을 되찾았어!",
      "그들은 용사를 영원히 기억하기 위해",
      "용사의 모험을 이야기로 남겼어",
      "이세계 구전설화를 게임으로 즐겨보자",
    ],
    showArrows: false,
  },
  {
    title: "멋진 용사는 점프를 잘한대",
    lines: [
      "클릭 또는 스페이스바로 점프할 수 있어",
      "2단 점프도 가능하니까, 타이밍을 잘 맞춰보자",
      "힘내서 마왕을 무찌르자!",
    ],
    showArrows: false,
  },
  {
    title: "함정에 빠지지 않게 조심해!",
    lines: ["함정에 빠지면 이야기가 끝나버려...", "함정을 잘 피해서 달려보자!"],
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
    lines: ["제한 시간은 없으니", "여유롭게 즐겨줘!"],
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
    lines: [
      "PC: 아이템을 드래그해서 코디 존에 넣어봐!",
      "모바일: 아이템을 탭해봐!",
    ],
    showArrows: false,
  },
  {
    title: "코디가 끝났다면",
    lines: ['"코디 끝!" 버튼을 눌러줘.', "사진을 찍어줄게!"],
    showArrows: false,
  },
  {
    title: "사진을 저장하자!",
    lines: ["코디가 끝나면 이미지 저장 버튼으로", "추억을 남기자!"],
    showArrows: false,
  },
  {
    title: "장착 규칙 확인",
    lines: [
      "dress는 top, skirt와 함께 입을 수 없어.",
      "deco는 같은 번호끼리만 서로 교체돼.",
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
