import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { fetchWithAuth } from "../../utils/api";
import { AchievementIcon } from "./AchievementIcon";
import { AppIcon } from "./AppIcon";

interface Achievement {
  code: string;
  title: string;
  description: string;
  iconUrl: string;
  unlockedAt: string | null;
  earned: boolean;
  active: boolean;
}

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [activatingCode, setActivatingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { token, uid: authUid } = useAuthStore();
  const uid = authUid ?? "";
  const hasUid = uid.length > 0;

  useEffect(() => {
    if (isOpen && token) {
      fetchAchievements();
    }
  }, [isOpen, token]);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/achievements/all");
      if (res.ok) {
        const data = await res.json();
        setAchievements(data);
      } else {
        setAchievements([]);
      }
    } catch (error) {
      console.error("Failed to fetch achievements", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUid = async () => {
    if (!hasUid) {
      return;
    }

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

  const handleActivateAchievement = async (code: string) => {
    if (!token || activatingCode || loading) {
      return;
    }

    setActivatingCode(code);
    try {
      const res = await fetchWithAuth(`/achievements/active/${code}`, {
        method: "POST",
      });

      if (!res.ok) {
        return;
      }

      const updated = await res.json();
      if (!updated) {
        return;
      }

      setAchievements((current) =>
        current.map((achievement) => ({
          ...achievement,
          active: achievement.code === code,
        })),
      );
    } catch (error) {
      console.error("Failed to set active achievement", error);
    } finally {
      setActivatingCode(null);
    }
  };

  if (!isOpen) return null;

  const earnedCount = achievements.filter((a) => a.earned).length;
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.earned !== b.earned) {
      return a.earned ? -1 : 1;
    }

    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }

    const aUnlocked = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
    const bUnlocked = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;

    return bUnlocked - aUnlocked;
  });
  const maskAchievementText = (text: string) => text.replace(/[^\s.]/g, "?");

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
            <span className="mb-2 inline-flex rounded-full bg-[#e9fff0] p-3 text-[#166D77] shadow-sm">
              <AppIcon name="IdCardLanyard" size={34} />
            </span>
            <h2 className="text-4xl font-black text-[#166D77] uppercase tracking-wider">
              프로필
            </h2>
          </div>

          {/* UID Section */}
          <div className="mb-5 shrink-0 bg-pale-custard rounded-2xl border-2 border-[#D6C0B0] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#166D77]/50 mb-2">
              내 번호표
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono font-bold text-[#166D77] text-base tracking-widest bg-white px-3 py-2 rounded-xl border border-[#D6C0B0] truncate">
                {hasUid ? uid : "번호표 정보 없음"}
              </code>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleCopyUid}
                disabled={!hasUid}
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
                {copied ? "✓ 복사됨" : hasUid ? "복사" : "없음"}
              </motion.button>
            </div>
          </div>

          {/* Achievements Section Header */}
          <div className="shrink-0 mb-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-black text-lg text-[#166D77]">
                <AppIcon name="Trophy" size={18} />
                업적
              </h3>
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
                <span className="mb-3 inline-flex text-[#166D77]/40">
                  <AppIcon name="Lock" size={42} />
                </span>
                <p className="text-[#166D77] font-bold">
                  로그인 후 업적을 확인하세요!
                </p>
              </div>
            ) : achievements.length === 0 ? (
              <div className="text-center py-10 bg-pale-custard rounded-3xl border-4 border-dashed border-[#D6C0B0]">
                <span className="mb-4 inline-flex text-[#166D77]/50">
                  <AppIcon name="Medal" size={48} />
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
                {sortedAchievements.map((ach) =>
                  ach.earned ? (
                    <button
                      type="button"
                      key={ach.code}
                      onClick={() => void handleActivateAchievement(ach.code)}
                      disabled={activatingCode !== null}
                      className={`w-full bg-pale-custard p-4 rounded-2xl border-2 shadow-sm flex items-center gap-4 text-left transition-all hover:-translate-y-0.5 ${
                        ach.active
                          ? "border-[#5EC7A5] ring-2 ring-[#5EC7A5]/20"
                          : "border-[#5EC7A5]/20 hover:border-[#5EC7A5]"
                      } ${activatingCode !== null ? "cursor-wait" : ""}`}
                    >
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shrink-0 border-2 border-[#5EC7A5]">
                        <AchievementIcon
                          code={ach.code}
                          iconUrl={ach.iconUrl}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-black text-[#166D77] text-base truncate">
                            {ach.title}
                          </h4>
                          {(ach.active || activatingCode === ach.code) && (
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                                ach.active
                                  ? "bg-[#5EC7A5] text-white"
                                  : "bg-[#166D77]/8 text-[#166D77]/70"
                              }`}
                            >
                              {ach.active ? "대표 업적" : "설정 중"}
                            </span>
                          )}
                        </div>
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
                    </button>
                  ) : (
                    /* ── UNEARNED: greyed-out, masked ── */
                    <div
                      key={ach.code}
                      className="bg-[#f3f4f6] p-4 rounded-2xl border-2 border-[#D6C0B0]/40 shadow-sm flex items-center gap-4 opacity-60 select-none"
                    >
                      <div className="w-14 h-14 bg-[#e5e7eb] rounded-full flex items-center justify-center text-2xl shrink-0 border-2 border-[#D6C0B0] grayscale">
                        <AppIcon
                          name="Lock"
                          size={26}
                          className="text-[#9ca3af]"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-[#9ca3af] text-base">
                          {maskAchievementText(ach.title)}
                        </h4>
                        <p className="text-sm font-medium text-[#9ca3af] leading-tight mt-0.5">
                          {maskAchievementText(ach.description)}
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
