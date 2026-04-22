import React from "react";
import { PushableButton } from "../../common/PushableButton";
import { ShareButtonGroup } from "../../common/ShareButtonGroup";
import { useCodyGameStore } from "../../../store/useCodyGameStore";

type CodyActionBarProps = {
  onReset: () => void;
  onPrimaryAction: () => void;
  onCapturePolaroid?: () => Promise<void>;
};

export const CodyActionBar: React.FC<CodyActionBarProps> = ({
  onReset,
  onPrimaryAction,
  onCapturePolaroid,
}) => {
  const { isFinished, isCapturing, windowWidth, showButtons, equippedIds, formattedDate } =
    useCodyGameStore();
  const isMobile = windowWidth < 768;

  const equippedIdsList = Object.values(equippedIds).filter(Boolean) as string[];
  const shareParams = new URLSearchParams({
    items: equippedIdsList.join(","),
    formattedDate,
  });
  const urlToShare = `${window.location.origin}/game/cody/shared?${shareParams.toString()}`;

  const mobileButtonClassName =
    "min-w-0 whitespace-nowrap px-3 py-2 text-[12px] leading-none tracking-[-0.01em] sm:px-4";
  const desktopButtonClassName = "whitespace-nowrap";
  const actionButtonClassName = isMobile
    ? mobileButtonClassName
    : desktopButtonClassName;

  return (
    <div
      className={`z-[100] flex transition-opacity duration-1000 ${!showButtons ? "opacity-0 pointer-events-none" : "opacity-100"} ${isMobile ? "relative mt-2 mb-4 w-full justify-center gap-2 px-4 sm:px-6" : "relative mt-8 gap-4"}`}
    >
      <PushableButton
        variant="teal"
        onClick={onReset}
        className={actionButtonClassName}
      >
        다시하기
      </PushableButton>

      <PushableButton
        variant="mint"
        onClick={onPrimaryAction}
        disabled={isCapturing}
        className={actionButtonClassName}
      >
        {isCapturing ? "작업 중..." : isFinished ? "이미지 저장" : "코디 끝!"}
      </PushableButton>

      {isFinished && (
        <ShareButtonGroup
          urlToShare={urlToShare}
          gameName="리코의 외출 준비"
          onCapturePolaroid={onCapturePolaroid}
          buttonClassName={actionButtonClassName}
        />
      )}
    </div>
  );
};
