import React from "react";
import { AppIcon } from "../../common/AppIcon";
import { PushableButton } from "../../common/PushableButton";

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
        onClick={onReset}
        className={actionButtonClassName}
      >
        다시하기
      </PushableButton>

      <PushableButton
        onClick={onPrimaryAction}
        disabled={isCapturing}
        className={actionButtonClassName}
      >
        {isCapturing ? "작업 중..." : isFinished ? "이미지 저장" : "코디 끝!"}
      </PushableButton>

      {isFinished && (
        <PushableButton
          onClick={onShare}
          variant="cream"
          className={actionButtonClassName}
        >
          <span
            className={`inline-flex items-center whitespace-nowrap ${isMobile ? "gap-1.5" : "gap-2"}`}
          >
            <AppIcon name="Share2" size={16} />
            공유하기
          </span>
        </PushableButton>
      )}
    </div>
  );
};
