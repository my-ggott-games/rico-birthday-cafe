import React from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useAudioStore } from "../../store/useAudioStore";
import { pushEvent } from "../../utils/analytics";
import { AppIcon } from "./AppIcon";
import { NoteModal, type NoteModalContent } from "./NoteModal";

const AUDIO_ENABLED_ROUTES = [
  "/lobby",
  "/game/cody",
  "/game/puzzle",
  "/game/adventure",
  "/game/asparagus",
  "/credits",
];

const AUDIO_NOTE_BY_BGM: Record<string, NoteModalContent> = {
  "/sound/lobby-bgm.m4a": {
    title: "감자튀김 옴뇸뇸",
    eyebrow: "로비 BGM",
    icon: "StickyNote",
    accentColor: "#D8B98C",
    backgroundColor: "#FFF8EA",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    iconBackgroundColor: "rgba(216,185,140,0.18)",
    content: (
      <>
        <p>감 자 튀 김 옴뇸뇸~</p>
        <p>감 자 튀김 옴뇸뇸~</p>
        <p>감 자 튀 김 옴뇸뇸~</p>
        <p>옴뇸뇸~ 옴뇸뇸~</p>
        <p>감 자 튀 김 옴뇸뇸~</p>
        <p>감 자 튀김 옴뇸뇸~</p>
        <p>감 자 튀 김 옴뇸뇸~</p>
        <p>옴뇸뇸~ 옴뇸뇸~</p>
      </>
    ),
    signature: "Special thanks to 「U+003AU+27B4」",
  },
  "/sound/activity-bgm-1.m4a": {
    title: "꽃 하나 aka. 밤바밤바",
    eyebrow: "게임 BGM 1",
    icon: "StickyNote",
    accentColor: "#5EC7A5",
    backgroundColor: "#F1FFFA",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    iconBackgroundColor: "rgba(94,199,165,0.18)",
    content: (
      <>
        <p>밤바밤바~ 밤바밤바~ 밤바밤바~ 밤바밤바~</p>
        <p>밤바밤바~ 밤바밤바~ 밤바밤바~ 밤바밤바~</p>
        <p>그대가 준 꽃 하나~</p>
        <p style={{ opacity: 0.6 }}>(가사를 마음대로 완성해봐!)</p>
        <p style={{ opacity: 0.6 }}>(가사를 마음대로 완성해봐!)</p>
        <p style={{ opacity: 0.6 }}>(가사를 마음대로 완성해봐!)</p>
        <p>아 그대여 한 발 다가와주오</p>
        <p style={{ opacity: 0.6 }}>(가사를 마음대로 완성해봐!)</p>
        <p>아 그대여 한 발 다가와주오</p>
        <p style={{ opacity: 0.6 }}>(가사를 마음대로 완성해봐!)</p>
      </>
    ),
    signature: "Special thanks to 「U+003AU+27B4」",
  },
  "/sound/activity-bgm-2.m4a": {
    title: "그 날, 감자튀김",
    eyebrow: "게임 BGM 2",
    icon: "StickyNote",
    accentColor: "#AEBED7",
    backgroundColor: "#F2F6FC",
    bodyBackgroundColor: "rgba(255,255,255,0.82)",
    iconBackgroundColor: "rgba(174,190,215,0.18)",
    content: (
      <>
        <p>그 날 너와 함께 먹던</p>
        <p>길고 긴 감자튀김이</p>
        <p>나의 귓가에 남아있네</p>
        <p>그래서 너가… (어어어...) 떼줬네! (??)</p>
        <p>감자 튀김 세상달아 이게 맞나 싶은데… 요</p>
        <p>감자 튀김 세상좋아 나도 먹고 싶어</p>
      </>
    ),
    signature: "Special thanks to 「U+003AU+27B4」",
  },
};

const AUDIO_NOTE_BY_ROUTE: Record<string, NoteModalContent> = {
  "/lobby": AUDIO_NOTE_BY_BGM["/sound/lobby-bgm.m4a"],
};

export const GlobalAudioToggle: React.FC = () => {
  const location = useLocation();
  const isMuted = useAudioStore((state) => state.isMuted);
  const currentBgmSrc = useAudioStore((state) => state.currentBgmSrc);
  const toggleMuted = useAudioStore((state) => state.toggleMuted);
  const [isNoteOpen, setIsNoteOpen] = React.useState(false);
  const isCodyGame = location.pathname === "/game/cody";

  const isVisible = AUDIO_ENABLED_ROUTES.some((route) =>
    matchPath(route, location.pathname),
  );
  const currentAudioNote =
    (currentBgmSrc ? AUDIO_NOTE_BY_BGM[currentBgmSrc] : null) || null;
  const fallbackAudioNote = AUDIO_NOTE_BY_ROUTE[location.pathname] ?? null;
  const resolvedAudioNote = currentAudioNote ?? fallbackAudioNote;

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[9998] flex items-center gap-2">
        {resolvedAudioNote ? (
          <button
            type="button"
            onClick={() => setIsNoteOpen(true)}
            className={`inline-flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 backdrop-blur-sm border-[#5EC7A5] bg-white/90 text-[#166D77]`}
            aria-label="현재 배경음악 비하인드 열기"
          >
            <AppIcon name="StickyNote" size={18} strokeWidth={2.2} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            pushEvent("toggle_audio", { is_muted: !isMuted });
            toggleMuted();
          }}
          className={`flex select-none items-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-black backdrop-blur-sm transition-transform hover:-translate-y-0.5 border-[#5EC7A5] bg-white/90 text-[#166D77]`}
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
      </div>

      <NoteModal
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        note={resolvedAudioNote}
      />
    </>
  );
};
