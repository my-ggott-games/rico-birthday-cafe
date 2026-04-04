import React from "react";
import { AppIcon } from "../common/AppIcon";
import { PushableButton } from "../common/PushableButton";

type CodyActionBarProps = {
  isFinished: boolean;
  isCapturing: boolean;
  isMobile: boolean;
  showButtons: boolean;
  onReset: () => void;
  onPrimaryAction: () => void;
  onShare: () => void;
};

export const CodyActionBar: React.FC<CodyActionBarProps> = ({
  isFinished,
  isCapturing,
  isMobile,
  showButtons,
  onReset,
  onPrimaryAction,
  onShare,
}) => {
  return (
    <div
      className={`z-[100] flex gap-4 transition-opacity duration-1000 ${!showButtons ? "opacity-0 pointer-events-none" : "opacity-100"} ${isMobile ? "relative mt-2 mb-4 justify-center" : "relative mt-8"}`}
    >
      <PushableButton onClick={onReset}>
        다시하기
      </PushableButton>

      <PushableButton
        onClick={onPrimaryAction}
        disabled={isCapturing}
      >
        {isCapturing ? "작업 중..." : isFinished ? "이미지 저장" : "코디 끝!"}
      </PushableButton>

      {isFinished && (
        <PushableButton onClick={onShare} variant="cream">
          <span className="inline-flex items-center gap-2">
            <AppIcon name="Share2" size={16} />
            공유하기
          </span>
        </PushableButton>
      )}
    </div>
  );
};
