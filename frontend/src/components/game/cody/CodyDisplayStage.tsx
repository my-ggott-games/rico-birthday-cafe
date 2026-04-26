import React from "react";
import { DroppableCharacter } from "./DroppableCharacter";
import { PolaroidFrame } from "./PolaroidFrame";
import { PolaroidGlitchOverlay } from "./polaroidEffects/PolaroidGlitchOverlay";
import { PolaroidBlossomOverlay } from "./polaroidEffects/PolaroidBlossomOverlay";
import { PolaroidButterflyOverlay } from "./polaroidEffects/PolaroidButterflyOverlay";
import { PolaroidFireflyOverlay } from "./polaroidEffects/PolaroidFireflyOverlay";
import { PolaroidHexOverlay } from "./polaroidEffects/PolaroidHexOverlay";
import { PolaroidRainOverlay } from "./polaroidEffects/PolaroidRainOverlay";
import {
  getCodyCharacterScale,
  getCodyDisplayStageHeight,
  getCodyMannequinScale,
  getCodyPolaroidCharacterOffset,
  getCodyPolaroidCharacterStageClassName,
} from "./codyStageLayout";
import {
  INVALID_POLAROID_SCALE,
  VALID_POLAROID_SCALE,
} from "../../../features/cody/codyGameData";
import { useCodyGameStore } from "../../../store/useCodyGameStore";

type CodyDisplayStageProps = {
  polaroidRef: React.RefObject<HTMLDivElement | null>;
};

export const CodyDisplayStage: React.FC<CodyDisplayStageProps> = ({
  polaroidRef,
}) => {
  const {
    activeBackground,
    contentVisible,
    formattedDate,
    isCapturing,
    isFinished,
    isFlyAway,
    windowWidth,
    orientalBgUrl,
    springBgUrl,
    trainingBgUrl,
  } = useCodyGameStore();

  const isMobile = windowWidth < 768;
  const characterScale = getCodyCharacterScale({ isMobile, windowWidth });
  const mannequinScale = getCodyMannequinScale({ isMobile, windowWidth });
  const scaleWhenFinished =
    characterScale *
    (activeBackground?.startsWith("linear-gradient")
      ? INVALID_POLAROID_SCALE
      : VALID_POLAROID_SCALE);
  const stageHeight = getCodyDisplayStageHeight({ isMobile, isFinished });
  const characterOffset = getCodyPolaroidCharacterOffset({
    activeBackground,
    isFinished,
    isMobile,
  });
  const characterStageClassName =
    getCodyPolaroidCharacterStageClassName(activeBackground);

  return (
    <div
      className={`relative z-10 flex w-full items-center justify-center ${isMobile ? "" : "h-[80%]"}`}
      style={isMobile && stageHeight ? { height: stageHeight } : undefined}
    >
      {isFinished ? (
        <PolaroidFrame
          isFlyAway={isFlyAway}
          activeBackground={activeBackground}
          formattedDate={formattedDate}
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
                      src={
                        trainingBgUrl || "/assets/codygame/background_5-1.jpg"
                      }
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
                      src={
                        orientalBgUrl || "/assets/codygame/background_3-1.jpg"
                      }
                      className="h-full w-full object-cover object-[center_10%]"
                      alt="background-scene"
                    />
                  </div>
                )}
            </>
          }
          underlayContent={
            <>
              {!isCapturing && activeBackground === "rain" && (
                <PolaroidRainOverlay />
              )}
            </>
          }
          overlayContent={
            <>
              {!isCapturing && activeBackground === "spring" && (
                <PolaroidFireflyOverlay isFinished={true} />
              )}
              {!isCapturing && activeBackground === "knight" && (
                <PolaroidButterflyOverlay />
              )}
              {!isCapturing && activeBackground === "oriental" && (
                <PolaroidBlossomOverlay
                  isFinished={true}
                  isFlyAway={isFlyAway}
                />
              )}
              {!isCapturing && activeBackground === "beer" && (
                <PolaroidHexOverlay />
              )}
              {!isCapturing && activeBackground === "training" && (
                <PolaroidGlitchOverlay />
              )}
            </>
          }
        >
          <div className="relative">
            <DroppableCharacter scale={scaleWhenFinished} />
          </div>
        </PolaroidFrame>
      ) : (
        <div
          className={`transition-opacity duration-300 ${contentVisible ? "opacity-100" : "opacity-0"}`}
        >
          <DroppableCharacter scale={mannequinScale} />
        </div>
      )}
    </div>
  );
};
