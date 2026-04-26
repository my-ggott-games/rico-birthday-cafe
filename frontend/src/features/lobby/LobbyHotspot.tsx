import React from "react";
import { Link } from "react-router-dom";
import { AppIcon } from "../../components/common/AppIcon";
import type { AppIconName } from "../../components/common/appIconRegistry";
import { darkenHex } from "./colorUtils";
import { getLobbyNoteTitle, type LobbyNoteKey } from "./lobbyNotes";

type LobbyIconTileProps = {
  name: string;
  icon: AppIconName;
  isMobile: boolean;
  bgColor: string;
  borderColor?: string;
  iconColor?: string;
};

export const LobbyIconTile: React.FC<LobbyIconTileProps> = ({
  name,
  icon,
  isMobile,
  bgColor,
  borderColor,
  iconColor,
}) => {
  const resolvedBorder = borderColor ?? darkenHex(bgColor, 14);
  const resolvedIcon = iconColor ?? darkenHex(bgColor, 42);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex items-center justify-center rounded-[1.35rem] border-4 opacity-100 shadow-xl transition-transform group-hover:-translate-y-0.5 ${isMobile ? "h-20 w-20" : "h-24 w-24"}`}
        style={{ backgroundColor: `${bgColor}d9`, borderColor: resolvedBorder }}
      >
        <AppIcon
          name={icon}
          size={isMobile ? 28 : 34}
          style={{ color: resolvedIcon }}
        />
      </div>
      <div
        className={`mt-2 rounded-xl border-2 border-[#D6C0B0] bg-pale-custard opacity-100 font-bold text-[#166D77] shadow-md transition-colors ${isMobile ? "px-3 py-1 text-xs" : "px-4 py-2"}`}
      >
        {name}
      </div>
    </div>
  );
};

type LobbyHotspotProps = {
  to: string;
  noteKey: LobbyNoteKey;
  noteVisible: boolean;
  onOpenNote: (key: LobbyNoteKey) => void;
  children: React.ReactNode;
  isMobile: boolean;
};

export const LobbyHotspot: React.FC<LobbyHotspotProps> = ({
  to,
  noteKey,
  noteVisible,
  onOpenNote,
  children,
  isMobile,
}) => {
  return (
    <div
      className="relative flex w-full justify-center"
      style={{ width: isMobile ? undefined : "auto" }}
    >
      <Link to={to} className="relative group flex w-full justify-center">
        {children}
      </Link>
      {noteVisible && (
        <button
          type="button"
          aria-label={`${getLobbyNoteTitle(noteKey)} 열기`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpenNote(noteKey);
          }}
          className="absolute right-[calc(50%-3.6rem)] top-[-0.7rem] z-10 rounded-2xl border-2 border-[#D6B089] bg-[#FFF4D8] p-2 text-[#9B6A3D] shadow-[0_8px_18px_rgba(128,87,40,0.2)] transition-transform duration-150 hover:-translate-y-0.5"
        >
          <AppIcon name="StickyNote" size={isMobile ? 16 : 18} />
        </button>
      )}
    </div>
  );
};
