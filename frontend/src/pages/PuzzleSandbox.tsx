import React, { useEffect, useState } from "react";

import { GameContainer } from "../components/common/GameContainer";
import type { TutorialSlide } from "../components/common/TutorialBanner";
import PuzzleGame from "./PuzzleGame";

const SANDBOX_SLIDES: TutorialSlide[] = [
  {
    title: "Viewport Check",
    lines: [
      "GameContainer 헤더와 퍼즐 보드 간격을 모바일/데스크톱에서 확인해.",
      "좌우 스폰 영역과 하단 영역의 밸런스를 같이 봐줘.",
    ],
    showArrows: false,
  },
  {
    title: "Sensor Flow",
    lines: [
      "Start Game 버튼으로 센서 권한 요청과 초기 진입 UX를 확인해.",
      "완료 후 홀로그램 색 이동이 자연스러운지 봐줘.",
    ],
    showArrows: false,
  },
  {
    title: "Scaling",
    lines: ["보드 스케일이 작아질 때 슬롯 가이드가 또렷한지 체크해."],
    showArrows: false,
  },
];

const getViewportLabel = (width: number) => {
  if (width >= 1280) return "Desktop";
  if (width >= 768) return "Tablet";
  return "Mobile";
};

const PuzzleSandbox: React.FC = () => {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerWidth,
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <GameContainer
      title="Puzzle Sandbox"
      desc="GameContainer scaling and photocard verification"
      gameName="퍼즐 샌드박스"
      helpSlides={SANDBOX_SLIDES}
      className="bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6fff8_34%,#edf5f2_100%)]"
      mainClassName="relative overflow-hidden"
      headerRight={
        <div className="rounded-[1.4rem] border border-[#166D77]/12 bg-white/80 px-4 py-3 text-left text-xs text-[#166D77] shadow-[0_14px_30px_rgba(22,109,119,0.1)] backdrop-blur-md">
          <div className="font-black uppercase tracking-[0.24em] text-[#5EC7A5]">
            Dev View
          </div>
          <div className="mt-2 font-semibold">
            {getViewportLabel(viewportWidth)} · {viewportWidth}px
          </div>
          <div className="mt-1 text-[#166D77]/68">
            Use this page to verify responsive framing.
          </div>
        </div>
      }
    >
      <PuzzleGame embedInContainer={false} />
    </GameContainer>
  );
};

export default PuzzleSandbox;
