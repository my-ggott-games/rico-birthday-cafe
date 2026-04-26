import type { NoteModalContent } from "../../components/common/NoteModal";

export type LobbyNoteKey = "cody" | "puzzle" | "asparagus" | "adventure";

const LOBBY_NOTE_CONTENT: Record<LobbyNoteKey, NoteModalContent> = {
  cody: {
    title: "비하인드 스토리",
    eyebrow: "리코의 외출 준비",
    icon: "StickyNote",
    accentColor: "#e7bcc2",
    backgroundColor: "#FFF1F3",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    content: (
      <>
        <p>
          눈치 챘나요? 동물농장 미니게임 크라라의 외출을 모티브로 만들었어요.
        </p>
        <p>일러스트 작가님과 함께 작업하니 마마와 파파가 된 기분이네요!</p>
        <p>작가님... 한복 패턴 한땀한땀 작업하느라 힘드셨죠...</p>
        <p>제가 그림에 무지해서 복잡한 패턴을 생각 못 했어요...</p>
      </>
    ),
    signature: "CODE NAME: G",
  },
  puzzle: {
    title: "비하인드 스토리",
    eyebrow: "퍼즐 맞추기",
    icon: "StickyNote",
    accentColor: "#ddd1bf",
    backgroundColor: "#F7F0E6",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    iconBackgroundColor: "rgba(221,209,191,0.25)",
    content: (
      <>
        <p>한국인은 밥심이죠. 한국에 있는 이세계인에게도 예외는 없어요.</p>
        <p>맛있는 음식 많이 먹고 행복한 하루 보냈으면 좋겠어요.</p>
        <p>
          뭘 좋아할지 몰라 다 차려봤어요. 제일 먼저 먹고싶은 음식은 무엇인가요?
        </p>
      </>
    ),
    signature: "CODE NAME: G",
  },
  asparagus: {
    title: "비하인드 스토리",
    eyebrow: "아스파라거스 키우기",
    icon: "StickyNote",
    accentColor: "#aad0b2",
    backgroundColor: "#EFF8F1",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    content: (
      <>
        <p>아스파라거스의 실제 성장 과정을 참고해 단계를 구상했어요.</p>
        <p>사실 성검 아스파라거스... 저도 못 만들었어요... 너무 어렵네요.</p>
        <p>아이템 사용도 3번까지였는데 5번으로 늘렸어요.</p>
        <p>언젠가 어디선가 누군가 나타나서 어떻게든 깨주지 않으려나...</p>
      </>
    ),
    signature: "CODE NAME: G",
  },
  adventure: {
    title: "비하인드 스토리",
    eyebrow: "용사 리코 이야기 1",
    icon: "StickyNote",
    accentColor: "#aebed7",
    backgroundColor: "#EEF3FB",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    content: (
      <>
        <p>치코는 오케스트라 소속 단원으로 활동하고 있어요.</p>
        <p>한 OST 악보를 받아 합주하던 그 순간,</p>
        <p>리코가 이세계에서 마왕을 잡는 이야기가 떠올랐어요.</p>
        <p>상상하던 이야기의 프롤로그입니다.</p>
      </>
    ),
    signature: "CODE NAME: G",
  },
};

export const getLobbyNoteContent = (
  noteKey: LobbyNoteKey,
  isPuzzleMuseumUnlocked: boolean,
): NoteModalContent => {
  if (noteKey !== "puzzle") {
    return LOBBY_NOTE_CONTENT[noteKey];
  }

  if (isPuzzleMuseumUnlocked) {
    return LOBBY_NOTE_CONTENT.puzzle;
  }

  return {
    ...LOBBY_NOTE_CONTENT.puzzle,
    accentColor: "#84bf2e",
    backgroundColor: "#F2F9E5",
    iconBackgroundColor: "rgba(132,191,46,0.18)",
  };
};

export const getLobbyNoteTitle = (noteKey: LobbyNoteKey): string =>
  LOBBY_NOTE_CONTENT[noteKey].title;
