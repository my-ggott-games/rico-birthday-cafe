import React, { useState } from "react";
import { CopyCheck } from "lucide-react";
import { PushableButton } from "./PushableButton";
import { pushEvent } from "../../utils/analytics";

interface ShareButtonGroupProps {
  urlToShare: string;
  gameName: string;
  buttonClassName?: string;
}

export const ShareButtonGroup: React.FC<ShareButtonGroupProps> = ({
  urlToShare,
  gameName,
  buttonClassName,
}) => {
  const [copied, setCopied] = useState(false);

  const isMobileDevice = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(urlToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 10_000);
    } catch {
      // clipboard unavailable — silent fail
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (navigator.share && isMobileDevice()) {
      pushEvent("click_share_menu", { game_name: gameName, method: "native" });
      try {
        await navigator.share({ title: gameName, url: urlToShare });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          await copyToClipboard();
        }
      }
    } else {
      pushEvent("click_share_menu", { game_name: gameName, method: "copy_link" });
      await copyToClipboard();
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      {copied && (
        <span className="absolute bottom-full mb-2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white">
          링크 복사 완료!
        </span>
      )}
      <PushableButton
        variant="light"
        onClick={handleShareClick}
        className={buttonClassName}
      >
        <span className="relative inline-flex items-center justify-center">
          <span className={copied ? "invisible" : ""}>공유하기</span>
          <CopyCheck className={`w-4 h-4 absolute ${copied ? "" : "invisible"}`} />
        </span>
      </PushableButton>
    </div>
  );
};
