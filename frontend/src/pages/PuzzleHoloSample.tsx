import React from "react";
import { GameContainer } from "../components/common/GameContainer";
import { HolographicCard } from "../components/common/HolographicCard";
import type { TutorialSlide } from "../components/common/TutorialBanner";

const PUZZLE_IMAGE = "/assets/puzzlegame/riko_puzzle_birthday_banquet.png";

const helpSlides: TutorialSlide[] = [
  {
    title: "홀로그램 카드",
    lines: [
      "Pokemon Card 스타일의 3D 홀로그램 카드 이펙트 샘플입니다.",
      "데스크탑: 마우스 호버 및 이동을 통해 빛의 반사를 확인하세요.",
      "모바일: 기기를 들고 상하좌우로 기울이며 자이로(Gyro) 센서 효과를 확인하세요.",
    ],
    showArrows: false,
  },
];

const PuzzleHoloSample: React.FC = () => {
  return (
    <GameContainer
      title="Puzzle Holographic Cards"
      desc="Puzzle Game - Holographic effects using pointer and device orientation (gyro)"
      gameName="Pokemon Card Holo"
      helpSlides={helpSlides}
      className="bg-[#141517] text-white min-h-screen"
    >
      <div className="flex flex-col items-center gap-12 py-10 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-white">완성 퍼즐 홀로그램 샘플</h1>
          <p className="text-gray-400">PC: 마우스 호버 / 모바일: 기기 기울임(자이로센서)</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-12 max-w-6xl">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400">
                디폴트 홀로그램 (Rainbow Holo Sweep)
              </h2>
              <p className="text-sm text-gray-500 mt-2">레어 카드에 사용되는 가장 일반적인 무지개빛 홀로 스윕</p>
            </div>
            <HolographicCard 
              imageSrc={PUZZLE_IMAGE} 
              foilType="holo" 
            />
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-white">
                래디언트 포일 (Radiant / Star)
              </h2>
              <p className="text-sm text-gray-500 mt-2">반짝이는 별/이미지 레이어가 위에 덧씌워진 유니크한 효과</p>
            </div>
            <HolographicCard 
              imageSrc={PUZZLE_IMAGE} 
              foilType="radiant" 
            />
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                갤럭시 포일 (Galaxy / Noise)
              </h2>
              <p className="text-sm text-gray-500 mt-2">거친 노이즈 입자와 우주빛 컬러 도지가 적용된 특수 포일</p>
            </div>
            <HolographicCard 
              imageSrc={PUZZLE_IMAGE} 
              foilType="galaxy" 
            />
          </div>
        </div>
      </div>
    </GameContainer>
  );
};

export default PuzzleHoloSample;
