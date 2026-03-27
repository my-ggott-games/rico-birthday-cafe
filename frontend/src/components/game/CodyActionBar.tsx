import React from "react";
import { AppIcon } from "../common/AppIcon";

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
      className={`z-[100] flex gap-4 transition-opacity duration-1000 ${!showButtons ? "opacity-0 pointer-events-none" : "opacity-100"} ${isMobile ? "fixed bottom-4 left-0 right-0 justify-center" : "relative mt-8"}`}
    >
      <button onClick={onReset} className="btn-secondary">
        다시하기
      </button>

      <button
        onClick={onPrimaryAction}
        className={isCapturing ? "btn-disabled" : "btn-primary"}
      >
        {isCapturing ? "작업 중..." : isFinished ? "이미지 저장" : "코디 끝!"}
      </button>

      {isFinished && (
        <button onClick={onShare} className="btn-secondary">
          <span className="inline-flex items-center gap-2">
            <AppIcon name="Share2" size={16} />
            공유하기
          </span>
        </button>
      )}
    </div>
  );
};
