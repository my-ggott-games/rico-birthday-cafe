import React from "react";
import { BlueButterflyOverlay } from "./ButterflyEffect";
import { CMYGlitchOverlay } from "./CMYGlitchOverlay";
import { DroppableCharacter } from "./DroppableCharacter";
import { FireflyOverlay } from "./FireflyEffect";
import { PolaroidFrame } from "./PolaroidFrame";
import { RainOverlay } from "./RainEffect";
import { BlossomPetalOverlay } from "./SpringEffect";
import type { CodyItem, EquippedState } from "./codyTypes";

type CodyDisplayStageProps = {
  activeBackground: string | null;
  activeId: string | null;
  availableItems: CodyItem[];
  characterScale: number;
  characterStageClassName: string;
  characterOffset: { x?: number; y?: number };
  contentVisible: boolean;
  equippedIds: EquippedState;
  isCapturing: boolean;
  isFinished: boolean;
  isFlyAway: boolean;
  isMobile: boolean;
  polaroidRef: React.RefObject<HTMLDivElement | null>;
  resultImage: string | null;
  scaleWhenFinished: number;
  springBgUrl: string | null;
  stageHeight?: string;
  trainingBgUrl: string;
  orientalBgUrl: string | null;
};

export const CodyDisplayStage: React.FC<CodyDisplayStageProps> = ({
  activeBackground,
  activeId,
  availableItems,
  characterScale,
  characterStageClassName,
  characterOffset,
  contentVisible,
  equippedIds,
  isCapturing,
  isFinished,
  isFlyAway,
  isMobile,
  polaroidRef,
  resultImage,
  scaleWhenFinished,
  springBgUrl,
  stageHeight,
  trainingBgUrl,
  orientalBgUrl,
}) => {
  return (
    <div
      className={`relative z-10 flex w-full items-center justify-center ${isMobile ? "" : "h-[80%]"}`}
      style={isMobile && stageHeight ? { height: stageHeight } : undefined}
    >
      {isFinished ? (
        <PolaroidFrame
          isFlyAway={isFlyAway}
          activeBackground={activeBackground}
          characterOffset={characterOffset}
          characterStageClassName={characterStageClassName}
          polaroidRef={polaroidRef}
          hideAnimations={isCapturing}
          backgroundContent={
            <>
              {activeBackground?.startsWith("linear-gradient") && (
                <div className="absolute inset-0 z-0 bg-transparent" />
              )}

              {!activeBackground?.startsWith("linear-gradient") &&
                activeBackground === "spring" && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={springBgUrl || "/assets/codygame/background_1-1.jpg"}
                      className="h-full w-full object-cover object-[center_30%]"
                      alt="background-scene"
                    />
                  </div>
                )}

              {!activeBackground?.startsWith("linear-gradient") &&
                activeBackground === "training" && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={trainingBgUrl}
                      className="h-full w-full object-cover object-center"
                      alt="background-training"
                    />
                  </div>
                )}

              {!activeBackground?.startsWith("linear-gradient") &&
                ["oriental", "rain", "beer", "knight"].includes(
                  activeBackground || "",
                ) && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={orientalBgUrl || "/assets/codygame/background_3-1.jpg"}
                      className="h-full w-full object-cover object-[center_10%]"
                      alt="background-scene"
                    />
                  </div>
                )}
            </>
          }
          underlayContent={
            <>
              {!isCapturing && activeBackground === "rain" && <RainOverlay />}
            </>
          }
          overlayContent={
            <>
              {!isCapturing && activeBackground === "spring" && (
                <FireflyOverlay isFinished={true} />
              )}
              {!isCapturing && activeBackground === "knight" && (
                <BlueButterflyOverlay />
              )}
              {!isCapturing && activeBackground === "oriental" && (
                <BlossomPetalOverlay isFinished={true} isFlyAway={isFlyAway} />
              )}
              {!isCapturing && activeBackground === "training" && (
                <CMYGlitchOverlay />
              )}
            </>
          }
        >
          <div className="relative">
            <DroppableCharacter
              equippedIds={equippedIds}
              activeId={activeId}
              isFinished={isFinished}
              resultImage={resultImage}
              scale={scaleWhenFinished}
              isMobile={isMobile}
              availableItems={availableItems}
            />
          </div>
        </PolaroidFrame>
      ) : (
        <div
          className={`transition-opacity duration-300 ${contentVisible ? "opacity-100" : "opacity-0"}`}
        >
          <DroppableCharacter
            equippedIds={equippedIds}
            activeId={activeId}
            isFinished={isFinished}
            resultImage={resultImage}
            scale={characterScale}
            isMobile={isMobile}
            availableItems={availableItems}
          />
        </div>
      )}
    </div>
  );
};

