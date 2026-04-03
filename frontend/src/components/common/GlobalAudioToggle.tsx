import React from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useAudioStore } from "../../store/useAudioStore";
import { AppIcon } from "./AppIcon";

const AUDIO_ENABLED_ROUTES = [
  "/lobby",
  "/game/cody",
  "/game/itabag",
  "/game/puzzle",
  "/game/adventure",
  "/game/fortune",
  "/game/asparagus",
  "/credits",
];

export const GlobalAudioToggle: React.FC = () => {
  const location = useLocation();
  const isMuted = useAudioStore((state) => state.isMuted);
  const toggleMuted = useAudioStore((state) => state.toggleMuted);

  const isVisible = AUDIO_ENABLED_ROUTES.some((route) =>
    matchPath(route, location.pathname),
  );

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleMuted}
      className="fixed bottom-4 right-4 z-[9998] flex items-center gap-2 rounded-2xl border-2 border-[#5EC7A5] bg-white/90 px-4 py-3 text-sm font-black text-[#166D77] shadow-[0_10px_30px_rgba(22,109,119,0.14)] backdrop-blur-sm transition-transform hover:-translate-y-0.5"
      aria-label={isMuted ? "Unmute audio" : "Mute audio"}
    >
      <AppIcon
        name={isMuted ? "VolumeX" : "Volume2"}
        size={18}
        strokeWidth={2.2}
      />
      <span className="inline-block w-[3.75rem] text-center">
        {isMuted ? "Unmute" : "Mute"}
      </span>
    </button>
  );
};
