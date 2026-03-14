import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { BASE_URL } from "../../utils/api";

interface Achievement {
  code: string;
  title: string;
  description: string;
  iconUrl: string;
  unlockedAt: string | null;
  earned: boolean;
}

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Retrieve or create a persistent UID for this device
const getUid = (): string => {
  let uid = localStorage.getItem("user-uid");
  if (!uid) {
    uid = Math.random().toString(36).substring(2, 10);
    localStorage.setItem("user-uid", uid);
  }
  return uid;
};

export const AchievementModal: React.FC<AchievementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { token } = useAuthStore();
  const uid = getUid();

  useEffect(() => {
    if (isOpen && token) {
      fetchAchievements();
    }
  }, [isOpen, token]);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/achievements/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAchievements(data);
      }
    } catch (error) {
      console.error("Failed to fetch achievements", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUid = async () => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = uid;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-[#FFFFF8] w-full max-w-2xl rounded-[3rem] border-8 border-[#D6C0B0] shadow-2xl p-6 md:p-10 relative max-h-[90vh] flex flex-col"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-8 text-[#166D77]/60 hover:text-[#5EC7A5] font-black text-3xl transition-colors bg-pale-custard rounded-full w-12 h-12 flex items-center justify-center shadow-sm border-2 border-[#D6C0B0]"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center mb-5 shrink-0">
            <span className="text-5xl drop-shadow-md mb-2 inline-block">
              🪪
            </span>
            <h2 className="text-4xl font-black text-[#166D77] uppercase tracking-wider">
              프로필
            </h2>
          </div>

          {/* UID Section */}
          <div className="mb-5 shrink-0 bg-pale-custard rounded-2xl border-2 border-[#D6C0B0] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#166D77]/50 mb-2">
              내 디바이스 ID
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono font-bold text-[#166D77] text-base tracking-widest bg-white px-3 py-2 rounded-xl border border-[#D6C0B0] truncate">
                {uid}
              </code>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleCopyUid}
                className="shrink-0 px-4 py-2 rounded-xl font-black text-sm transition-all border-2"
                style={
                  copied
                    ? {
                        background: "#5EC7A5",
                        color: "#FFFFF8",
                        borderColor: "#5EC7A5",
                      }
                    : {
                        background: "#166D77",
                        color: "#bef264",
                        borderColor: "#166D77",
                      }
                }
              >
                {copied ? "✓ 복사됨" : "복사"}
              </motion.button>
            </div>
          </div>

          {/* Achievements Section Header */}
          <div className="shrink-0 mb-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-[#166D77]">🏆 업적</h3>
              <span className="text-sm font-bold text-[#5EC7A5]">
                {earnedCount} / {achievements.length} 달성
              </span>
            </div>
          </div>

          {/* Achievement Scroll List */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#5EC7A5] border-t-transparent" />
              </div>
            ) : !token ? (
              <div className="text-center py-10 bg-pale-custard rounded-3xl border-4 border-dashed border-[#D6C0B0]">
                <span className="text-5xl grayscale opacity-40 block mb-3">
                  🔒
                </span>
                <p className="text-[#166D77] font-bold">
                  로그인 후 업적을 확인하세요!
                </p>
              </div>
            ) : achievements.length === 0 ? (
              <div className="text-center py-10 bg-pale-custard rounded-3xl border-4 border-dashed border-[#D6C0B0]">
                <span className="text-6xl grayscale opacity-50 block mb-4">
                  🎖️
                </span>
                <p className="text-[#166D77] font-bold text-xl">
                  아직 업적이 없어요.
                </p>
                <p className="text-[#166D77]/60 mt-2">
                  게임을 플레이해서 특별한 배지를 획득하세요!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {achievements.map((ach) =>
                  ach.earned ? (
                    /* ── EARNED: full colour card ── */
                    <div
                      key={ach.code}
                      className="bg-pale-custard p-4 rounded-2xl border-2 border-[#5EC7A5]/20 shadow-sm flex items-center gap-4 hover:border-[#5EC7A5] hover:-translate-y-0.5 transition-all"
                    >
                      <div className="w-14 h-14 bg-[#FFE4E6] rounded-full flex items-center justify-center text-2xl shrink-0 border-2 border-[#5EC7A5]">
                        {ach.iconUrl || "⭐"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-[#166D77] text-base truncate">
                          {ach.title}
                        </h4>
                        <p className="text-sm font-medium text-[#166D77]/70 leading-tight mt-0.5">
                          {ach.description}
                        </p>
                        {ach.unlockedAt && (
                          <p className="text-[10px] text-[#166D77]/40 mt-1.5 font-bold uppercase tracking-wider">
                            Unlocked:{" "}
                            {new Date(ach.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── UNEARNED: greyed-out, masked ── */
                    <div
                      key={ach.code}
                      className="bg-[#f3f4f6] p-4 rounded-2xl border-2 border-[#D6C0B0]/40 shadow-sm flex items-center gap-4 opacity-60 select-none"
                    >
                      <div className="w-14 h-14 bg-[#e5e7eb] rounded-full flex items-center justify-center text-2xl shrink-0 border-2 border-[#D6C0B0] grayscale">
                        🔒
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-[#9ca3af] text-base">
                          ???
                        </h4>
                        <p className="text-sm font-medium text-[#9ca3af] leading-tight mt-0.5">
                          아직 잠겨 있어요.
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
