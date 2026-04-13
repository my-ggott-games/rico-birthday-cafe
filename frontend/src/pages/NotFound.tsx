import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchWithAuth } from "../utils/api";
import { useAuthStore } from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";
import { PushableButton } from "../components/common/PushableButton";
import {
  addAchievementToast,
  parseAchievementAwardResponse,
} from "../utils/achievementAwards";

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const uid = useAuthStore((state) => state.uid);
  const addToast = useToastStore((state) => state.addToast);
  const hasRequestedAwardRef = useRef(false);
  const awardStorageKey = uid ? `achievement-awarded-LOST_IN_THE_WAY-${uid}` : "";

  useEffect(() => {
    if (
      !token ||
      hasRequestedAwardRef.current ||
      (awardStorageKey &&
        window.localStorage.getItem(awardStorageKey) === "true")
    ) {
      return;
    }

    const awardNotFoundAchievement = async () => {
      if (hasRequestedAwardRef.current) return;
      hasRequestedAwardRef.current = true;

      try {
        const response = await fetchWithAuth(
          "/achievements/award/LOST_IN_THE_WAY",
          {
            method: "POST",
          },
        );

        if (!response.ok) {
          return;
        }

        const awardResult = await parseAchievementAwardResponse(response);
        if (awardResult?.awarded) {
          if (awardStorageKey) {
            window.localStorage.setItem(awardStorageKey, "true");
          }
          addAchievementToast(addToast, awardResult.achievement);
        }
      } catch (error) {
        console.error("Failed to award not-found achievement", error);
      }
    };

    // 브라우저의 오디오 자동재생(Autoplay) 정책으로 인해
    // 화면 마운트 시점에 바로 소리를 재생하면 차단됩니다.
    // 첫 화면 터치/클릭 등의 유저 인터랙션이 발생할 때 업적을 지급하여 효과음이 정상 재생되도록 합니다.
    const handleInteraction = () => {
      void awardNotFoundAchievement();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [addToast, awardStorageKey, token]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FFFFF8] flex flex-col items-center justify-center font-handwriting">
      {/* Striped Awning Effect at top */}
      <div className="absolute top-0 w-full h-16 bg-[repeating-linear-gradient(45deg,#5EC7A5,#5EC7A5_20px,#FFFFF8_20px,#FFFFF8_40px)] shadow-lg z-10" />
      <div className="absolute top-16 w-full h-3 bg-pale-custard/20 z-10 rounded-b-xl" />

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="relative z-10 flex flex-col items-center justify-center p-8 bg-pale-custard rounded-3xl border-4 border-[#5EC7A5] shadow-2xl mx-4 text-center max-w-lg"
      >
        {/* 404 text */}
        <h1 className="text-8xl md:text-9xl text-[#166D77] font-black tracking-tight drop-shadow-sm rotate-[-2deg] mb-4">
          404
        </h1>

        {/* Error message */}
        <div className="text-2xl md:text-3xl text-[#5EC7A5] font-bold mb-6">
          길을 잃었구나!
        </div>

        <p className="text-[#166D77] text-lg md:text-xl font-medium mb-8 leading-relaxed">
          여긴 아무것도 없어...
          <br />
          같이 로비로 돌아가자!
        </p>

        {/* Return Button */}
        <PushableButton
          onClick={() => navigate("/lobby")}
          className="px-8 py-4 text-xl"
        >
          로비로 돌아가기
        </PushableButton>
      </motion.div>
    </div>
  );
};

export default NotFound;
