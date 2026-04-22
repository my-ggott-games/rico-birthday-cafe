import React, { useState, useRef, useEffect } from "react";
import { Link2 } from "lucide-react";
import { PushableButton } from "./PushableButton";
import { useToastStore } from "../../store/useToastStore";
import { pushEvent } from "../../utils/analytics";

// Custom SVG Icons
const KakaoIcon = () => (
  <svg viewBox="0 0 32 32" className="w-5 h-5 fill-[#3C1E1E]">
    <path d="M16 4.643c-6.892 0-12.482 4.417-12.482 9.866 0 3.513 2.316 6.592 5.86 8.329l-1.21 4.502c-.088.33.284.58.556.37l5.356-3.69c.62.08 1.26.12 1.92.12 6.892 0 12.482-4.416 12.482-9.865C28.482 9.06 22.892 4.643 16 4.643z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

interface ShareButtonGroupProps {
  urlToShare: string;
  gameName: string;
  onCapturePolaroid?: () => Promise<void>;
  buttonClassName?: string;
}

export const ShareButtonGroup: React.FC<ShareButtonGroupProps> = ({
  urlToShare,
  gameName,
  onCapturePolaroid,
  buttonClassName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [isExpanded]);

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (navigator.share && isMobile) {
      pushEvent("click_share_menu", { game_name: gameName, method: "native" });
      try {
        await navigator.share({
          title: gameName,
          text: `나만의 리코 외출 준비를 해봤어요! 여러분도 함께 축하해주세요.`,
          url: urlToShare
        });
      } catch (err) {
        console.error("Native share failed:", err);
      }
    } else {
      if (!isExpanded) {
        pushEvent("click_share_menu", { game_name: gameName, method: "manual" });
      }
      setIsExpanded(!isExpanded);
    }
  };

  const shareMethods = {
    copyLink: async () => {
      pushEvent("share_game", { method: "copy_link", game_name: gameName });
      try {
        await navigator.clipboard.writeText(urlToShare);
        addToast({
          title: "공유 링크 복사",
          description: "링크를 복사했어요. 친구에게 뽐내보세요!",
          icon: "Share2",
        });
      } catch {
        addToast({
          title: "공유 링크 복사 실패",
          description: "링크 복사에 실패했습니다. 직접 복사해주세요.",
          icon: "AlertCircle",
        });
      }
      setIsExpanded(false);
    },
    x: () => {
      pushEvent("share_game", { method: "x", game_name: gameName });
      const text = `${gameName} - 리코 생일을 함께 축하해주세요!`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(urlToShare)}`);
      setIsExpanded(false);
    },
    kakao: () => {
      pushEvent("share_game", { method: "kakao", game_name: gameName });
      
      // Feature detect Kakao SDK
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kakaoWin = window as any;
      if (kakaoWin.Kakao && kakaoWin.Kakao.isInitialized()) {
        kakaoWin.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: gameName,
            description: '나만의 리코 외출 준비를 해봤어요! 여러분도 함께 축하해주세요.',
            imageUrl: 'https://rico-birthday-cafe.netlify.app/assets/codygame/riko_body_default.png',
            link: {
              mobileWebUrl: urlToShare,
              webUrl: urlToShare,
            },
          },
        });
      } else if (navigator.share) {
        navigator.share({
          title: gameName,
          text: `나만의 리코 외출 준비를 해봤어요! 여러분도 함께 축하해주세요.`,
          url: urlToShare
        }).catch(console.error);
      } else {
        addToast({
          title: "카카오톡 공유",
          description: "지원하지 않는 브라우저이거나, 설정이 필요합니다. 링크를 복사해주세요.",
          icon: "Share2",
        });
        void shareMethods.copyLink();
      }
      setIsExpanded(false);
    },
    instagram: async () => {
      pushEvent("share_game", { method: "instagram", game_name: gameName });
      if (onCapturePolaroid) {
        addToast({
          title: "인스타그램 공유",
          description: "이미지 저장 후, 인스타그램 앱에서 공유해주세요!",
          icon: "Download",
        });
        await onCapturePolaroid();
      } else {
        addToast({
          title: "인스타그램 공유",
          description: "링크를 복사해서 공유해주세요!",
          icon: "Share2",
        });
        void shareMethods.copyLink();
      }
      setIsExpanded(false);
    }
  };

  return (
    <div className="relative flex items-center" ref={containerRef}>
      {/* Base Share Button */}
      <PushableButton
        variant="light"
        onClick={handleShareClick}
        className={`relative z-10 ${buttonClassName}`}
      >
        공유하기
      </PushableButton>

      {/* Expanded Menu Container */}
      <div
        className={`absolute left-full ml-2 flex items-center bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 h-[48px] z-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]`}
        style={{
          width: isExpanded ? "200px" : "0px",
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? "auto" : "none",
        }}
      >
        <div className="flex w-[200px] justify-around items-center px-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); shareMethods.kakao(); }}
            className="w-10 h-10 rounded-full bg-[#FEE500] flex items-center justify-center hover:scale-110 shadow-sm transition-transform"
            aria-label="카카오톡 공유"
          >
            <KakaoIcon />
          </button>
          <button
             onClick={(e) => { e.stopPropagation(); shareMethods.x(); }}
            className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:scale-110 shadow-sm transition-transform"
            aria-label="X 공유"
          >
            <XIcon />
          </button>
          <button
             onClick={(e) => { e.stopPropagation(); void shareMethods.instagram(); }}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] text-white flex items-center justify-center hover:scale-110 shadow-sm transition-transform"
            aria-label="인스타그램 공유"
          >
            <InstagramIcon />
          </button>
          <button
             onClick={(e) => { e.stopPropagation(); void shareMethods.copyLink(); }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200 text-gray-600 hover:scale-110 hover:bg-gray-50 shadow-sm transition-all"
            aria-label="링크 복사"
          >
            <Link2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
