import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { BASE_URL } from "../utils/api";
import { GameContainer } from "../components/common/GameContainer";
import { AchievementIcon } from "../components/common/AchievementIcon";
import { AppIcon } from "../components/common/AppIcon";
import { ITABAG_TUTORIAL_SLIDES } from "../constants/tutorialSlides";

// ---------------------------------------------------------
// Typings
// ---------------------------------------------------------

interface Achievement {
  code: string;
  title: string;
  description: string;
  iconUrl: string;
  unlockedAt: string | null;
  earned: boolean;
}

interface PlacedBadge {
  id: string; // unique instance ID (in case they place multiples of same badge)
  code: string;
  iconUrl: string;
  x: number;
  y: number;
  rotation: number;
}

// ---------------------------------------------------------
// Component
// ---------------------------------------------------------

export default function ItabagGame() {
  const { token } = useAuthStore();
  const [earnedBadges, setEarnedBadges] = useState<Achievement[]>([]);
  const [placedBadges, setPlacedBadges] = useState<PlacedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initial Fetch
  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // 1. Fetch earned achievements to use as inventory
        const achRes = await fetch(`${BASE_URL}/achievements/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (achRes.ok) {
          const achievements = await achRes.json();
          setEarnedBadges(achievements);
        }

        // 2. Fetch saved Itabag layout
        const bagRes = await fetch(`${BASE_URL}/game/itabag/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (bagRes.ok) {
          const layoutDataStr = await bagRes.text();
          if (layoutDataStr && layoutDataStr !== "[]") {
            const parsed = JSON.parse(layoutDataStr);
            setPlacedBadges(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load Itabag data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [token]);

  // ---------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------

  const handleAddBadge = (badge: Achievement) => {
    const newId = `badge_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setPlacedBadges((prev) => [
      ...prev,
      {
        id: newId,
        code: badge.code,
        iconUrl: badge.iconUrl,
        // default spawn in center approx
        x: 0,
        y: 0,
        rotation: (Math.random() - 0.5) * 30, // random slight initial tilt
      },
    ]);
  };

  const handleRemoveBadge = (id: string) => {
    setPlacedBadges((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDragEnd = (id: string, info: any) => {
    setPlacedBadges((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            x: b.x + info.delta.x,
            y: b.y + info.delta.y,
          };
        }
        return b;
      }),
    );
  };

  const handleRotate = (id: string) => {
    setPlacedBadges((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return { ...b, rotation: (b.rotation + 15) % 360 };
        }
        return b;
      }),
    );
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`${BASE_URL}/game/itabag/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // Although it expects 'application/json', the body is just the stringified layout
        },
        body: JSON.stringify(placedBadges),
      });

      if (res.ok) {
        setSaveMessage("저장 완료!");
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage("저장 실패 😢");
      }
    } catch (error) {
      console.error("Failed to save Itabag", error);
      setSaveMessage("저장 실패 😢");
    } finally {
      setSaving(false);
    }
  };

  // Format mesh pattern CSS
  const meshStyle = {
    backgroundSize: "20px 20px",
    backgroundImage: `
            linear-gradient(to right, rgba(22, 109, 119, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(22, 109, 119, 0.1) 1px, transparent 1px)
        `,
    backgroundColor: "#FFFFF8",
  };

  return (
    <GameContainer
      title="Itabag Decoration"
      desc="나만의 이타백 꾸미기"
      gameName="이타백 꾸미기"
      helpSlides={ITABAG_TUTORIAL_SLIDES}
      className="bg-cream font-pretendard"
      mainClassName="overflow-hidden"
    >
      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6 lg:gap-10 pb-20 overflow-hidden">
        {/* Center Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
          {/* The Itabag Canvas Container */}
          <div
            ref={canvasRef}
            className="relative w-full max-w-2xl aspect-[4/3] rounded-[2rem] border-[12px] border-[#166D77] shadow-[inset_0_4px_20px_rgba(0,0,0,0.1),0_10px_30px_rgba(0,0,0,0.2)] bg-[#FFFFF8] overflow-hidden"
          >
            {/* Wire/Mesh Background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={meshStyle}
            />

            {/* Placed Badges */}
            <div className="absolute inset-0 p-4">
              {placedBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  drag
                  dragMomentum={false}
                  dragConstraints={canvasRef}
                  onDragEnd={(_e, info) => handleDragEnd(badge.id, info)}
                  initial={{
                    x: badge.x,
                    y: badge.y,
                    rotate: badge.rotation,
                    scale: 0,
                  }}
                  animate={{
                    x: badge.x,
                    y: badge.y,
                    rotate: badge.rotation,
                    scale: 1,
                  }}
                  onClick={() => handleRotate(badge.id)}
                  // Custom double-click to remove handler for mobile compatibility
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBadge(badge.id);
                  }}
                  className="absolute left-1/2 top-1/2 -ml-8 -mt-8 w-16 h-16 bg-white rounded-full border-4 border-[#166D77] flex items-center justify-center text-3xl shadow-lg cursor-grab active:cursor-grabbing hover:ring-4 hover:ring-[#5EC7A5] transition-shadow z-10"
                  style={{ touchAction: "none" }}
                  title="드래그로 이동, 탭으로 회전, 더블 탭으로 삭제"
                >
                  <AchievementIcon
                    code={badge.code}
                    iconUrl={badge.iconUrl}
                    size={34}
                  />
                </motion.div>
              ))}

              {placedBadges.length === 0 && !loading && (
                <div className="absolute inset-0 flex items-center justify-center text-[#166D77]/40 font-bold opacity-50 select-none pointer-events-none text-center px-4 z-0">
                  하단의 뱃지를 탭하여 가방에 추가하세요!
                  <br />
                  더블 탭으로 삭제, 탭으로 회전할 수 있습니다.
                </div>
              )}
            </div>

            {/* Loading State Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#5EC7A5] border-t-transparent" />
              </div>
            )}
          </div>
        </div>

        {/* Right/Bottom Inventory Pane */}
        <div className="w-full lg:w-80 flex flex-col gap-4 z-20">
          <div className="bg-pale-custard rounded-3xl p-6 border-4 border-[#D6C0B0] flex flex-col h-full max-h-[400px] lg:max-h-none shadow-xl">
            <div className="font-black text-xl text-[#166D77] mb-4 flex items-center gap-2 shrink-0">
              <AppIcon name="Medal" size={20} /> 내 뱃지 보관함
            </div>

            {/* Inventory Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-3 content-start">
              {earnedBadges.length === 0 && !loading ? (
                <p className="text-[#166D77]/60 text-sm font-bold text-center w-full py-8">
                  아직 획득한 뱃지가 없습니다.
                  <br />
                  다른 미니게임을 플레이해보세요!
                </p>
              ) : (
                earnedBadges.map((badge) => (
                  <button
                    key={badge.code}
                    onClick={() => handleAddBadge(badge)}
                    className="w-14 h-14 bg-white rounded-full border-2 border-[#166D77] flex items-center justify-center text-3xl shadow-sm hover:scale-105 active:scale-95 transition-transform shrink-0"
                    title={badge.title}
                  >
                    <AchievementIcon
                      code={badge.code}
                      iconUrl={badge.iconUrl}
                      size={32}
                    />
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-[#D6C0B0]/50 sticky bottom-0 bg-pale-custard shrink-0 z-10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving || loading}
                onClick={handleSave}
                className="w-full py-3 bg-[#5EC7A5] text-[#166D77] font-black rounded-xl border-2 border-[#166D77] shadow-[2px_2px_0_#166D77] hover:shadow-[1px_1px_0_#166D77] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="inline-flex items-center gap-2">
                  <AppIcon name="Save" size={16} />
                  {saving ? "저장 중..." : "가방 레이아웃 저장하기"}
                </span>
              </motion.button>
              {saveMessage && (
                <p className="text-center text-sm font-bold mt-2 text-[#5EC7A5] absolute w-full">
                  {saveMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </GameContainer>
  );
}
