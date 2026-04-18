import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { fetchWithAuth } from "../../utils/api";
import { AchievementIcon } from "./AchievementIcon";
import { AppIcon } from "./AppIcon";
import { PushableButton } from "./PushableButton";

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
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
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

  const visibleAchievements = achievements.filter(
    (a) => a.code !== "WHO_ARE_YOU",
  );
  const earnedCount = visibleAchievements.filter((a) => a.earned).length;
  const sortedAchievements = [...visibleAchievements].sort((a, b) => {
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
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[3rem] border-8 border-[#5EC7A5] bg-[#F7FFF9] p-6 shadow-2xl md:p-10"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-8 top-6 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#5EC7A5] bg-[#ECFFF2] text-3xl font-black text-[#166D77]/70 shadow-sm transition-colors hover:text-[#5EC7A5]"
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
          <div className="mb-5 shrink-0 rounded-2xl border-2 border-[#5EC7A5]/40 bg-[#ECFFF2] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#166D77]/50 mb-2">
              내 티켓
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 truncate rounded-xl border border-[#5EC7A5]/40 bg-white px-3 py-2 font-mono text-base font-bold tracking-widest text-[#166D77]">
                {hasUid ? uid : "티켓 정보 없음"}
              </code>
              <PushableButton
                onClick={handleCopyUid}
                disabled={!hasUid}
                variant="cream"
                className="shrink-0 rounded-xl px-4 py-2 text-sm"
              >
                {copied ? "✓ 복사됨" : hasUid ? "복사" : "없음"}
              </PushableButton>
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
                {earnedCount} / {visibleAchievements.length} 달성
              </span>
            </div>
          </div>

          {/* Achievement Scroll List */}
          <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1 pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#5EC7A5] border-t-transparent" />
              </div>
            ) : !token ? (
              <div className="rounded-3xl border-4 border-dashed border-[#5EC7A5]/40 bg-[#ECFFF2] py-10 text-center">
                <span className="mb-3 inline-flex text-[#166D77]/40">
                  <AppIcon name="Lock" size={42} />
                </span>
                <p className="text-[#166D77] font-bold">
                  로그인 후 업적을 확인하세요!
                </p>
              </div>
            ) : achievements.length === 0 ? (
              <div className="rounded-3xl border-4 border-dashed border-[#5EC7A5]/40 bg-[#ECFFF2] py-10 text-center">
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
                      className={`flex w-full items-center gap-4 rounded-2xl border-2 bg-[#F2FFF6] p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 ${
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
                    /* ── UNEARNED: greyed-out, description masked ── */
                    <div
                      key={ach.code}
                      className="flex select-none items-center gap-4 rounded-2xl border-2 border-[#9BD8B0]/40 bg-[#EAF8EF] p-4 opacity-70 shadow-sm"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#9BD8B0] bg-[#DDEFE4] text-2xl grayscale">
                        <AppIcon
                          name="Lock"
                          size={26}
                          className="text-[#7BA08A]"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-black text-[#7BA08A]">
                          {ach.title}
                        </h4>
                        <p className="mt-0.5 text-sm font-medium leading-tight text-[#7BA08A]">
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
