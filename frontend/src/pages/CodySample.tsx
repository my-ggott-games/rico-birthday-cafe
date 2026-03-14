import React from "react";
import { PolaroidFrame } from "../components/game/PolaroidFrame";
import { DroppableCharacter } from "../components/game/DroppableCharacter";

const AVAILABLE_BGS = [
  "1-1",
  "1-2",
  "1-3",
  "2-1",
  "2-2",
  "2-3",
  "2-4",
  "3-1",
  "3-2",
  "3-3",
  "3-4",
  "4-1",
  "4-2",
  "4-3",
  "4-4",
  "4-5",
  "4-6",
  "4-7",
];

// Sample equipped state, just to have a character on screen
const sampleEquippedIds = {
  hair: "hair-1",
  clothes: "clothes-1",
  hair_acc: null,
  clothes_acc: null,
  hand_acc: null,
  accessories: null,
};

const sampleAvailableItems = [
  {
    id: "hair-1",
    category: "hair",
    layers: {
      front: "/assets/codygame/rico_hair_front_long.png",
      back: "/assets/codygame/riko_hair_back_long.png",
    },
  },
  {
    id: "clothes-1",
    category: "clothes",
    layers: { main: "/assets/codygame/riko_clothes_training.png" },
  },
];

const CodySample: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFFFF8] p-8">
      <h1 className="text-4xl font-black text-[#166D77] mb-8 text-center">
        Background Samples
      </h1>
      <div className="flex flex-wrap gap-8 justify-center items-center">
        {AVAILABLE_BGS.map((bgId) => {
          const bgUrl = `/assets/codygame/background_${bgId}.jpg`;
          return (
            <div key={bgId} className="flex flex-col items-center">
              <h2 className="text-xl font-bold text-[#5EC7A5] mb-4">
                background_{bgId}.jpg
              </h2>
              <div className="w-[400px] h-[500px] relative flex items-center justify-center pointer-events-none scale-75 origin-top">
                <PolaroidFrame
                  isFlyAway={false}
                  activeBackground={undefined} // Just trick the frame into normal drawing
                  characterOffset={{ x: 0, y: 500 }}
                  isSquare={true}
                  hideShadow={false}
                  backgroundContent={
                    <div className="absolute inset-0 z-0">
                      <img
                        src={bgUrl}
                        className="w-full h-full object-cover object-[center_30%]"
                        alt={`bg-${bgId}`}
                      />
                    </div>
                  }
                  overlayContent={<></>}
                >
                  <div className="relative pointer-events-none">
                    <DroppableCharacter
                      equippedIds={sampleEquippedIds as any}
                      activeId={null}
                      isFinished={true}
                      resultImage={"/assets/codygame/riko_body_smile.png"}
                      scale={1.25}
                      isMobile={false}
                      availableItems={sampleAvailableItems as any}
                    />
                  </div>
                </PolaroidFrame>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CodySample;
