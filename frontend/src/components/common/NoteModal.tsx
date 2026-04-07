import type { ReactNode } from "react";
import { CommonModal } from "./CommonModal";
import { AppIcon } from "./AppIcon";
import type { AppIconName } from "./appIconRegistry";
import { PushableButton } from "./PushableButton";

export type NoteModalContent = {
  title: string;
  content: ReactNode;
  eyebrow?: string;
  signature?: string;
  icon?: AppIconName;
  accentColor?: string;
  backgroundColor?: string;
  bodyBackgroundColor?: string;
  iconBackgroundColor?: string;
};

type NoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  note: NoteModalContent | null;
};

export const NoteModal = ({ isOpen, onClose, note }: NoteModalProps) => {
  if (!note) {
    return null;
  }

  const adjustHex = (hex: string, factor: number) => {
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) {
      return hex;
    }

    const toChannel = (start: number) =>
      Math.max(
        0,
        Math.min(
          255,
          Math.round(parseInt(normalized.slice(start, start + 2), 16) * factor),
        ),
      )
        .toString(16)
        .padStart(2, "0");

    return `#${toChannel(0)}${toChannel(2)}${toChannel(4)}`;
  };

  const accentColor = note.accentColor ?? "#D8B98C";
  const backgroundColor = note.backgroundColor ?? "#FFF8EA";
  const bodyBackgroundColor =
    note.bodyBackgroundColor ?? "rgba(255,255,255,0.7)";
  const iconBackgroundColor = note.iconBackgroundColor ?? `${accentColor}22`;
  const textColor = adjustHex(accentColor, 0.58);
  const buttonBorderColor = adjustHex(accentColor, 0.82);
  const buttonBackgroundColor = `${accentColor}22`;
  const buttonShadowColor = adjustHex(accentColor, 0.7);

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      icon={
        <AppIcon
          name={note.icon ?? "StickyNote"}
          size={28}
          style={{ color: accentColor }}
        />
      }
      title={
        <div className="space-y-2">
          {note.eyebrow ? (
            <p
              className="text-[10px] font-black uppercase tracking-[0.24em] md:text-xs md:tracking-[0.28em]"
              style={{ color: textColor }}
            >
              {note.eyebrow}
            </p>
          ) : null}
          <p
            className="text-xl font-black md:text-2xl"
            style={{ color: textColor }}
          >
            {note.title}
          </p>
        </div>
      }
      panelMaxWidthClassName="max-w-none"
      panelClassName="flex max-h-[80vh] w-[90%] flex-col max-w-none px-5 py-6 text-left shadow-[0_22px_70px_rgba(92,63,28,0.2)] md:w-[40%] md:px-7 md:py-7"
      panelStyle={{
        borderColor: accentColor,
        backgroundColor,
      }}
      iconWrapperStyle={{
        backgroundColor: iconBackgroundColor,
        color: accentColor,
      }}
      titleClassName="mb-4"
      bodyClassName="flex-1 min-h-0 space-y-4 overflow-hidden"
      footerClassName="relative z-20 mt-6 flex justify-end overflow-visible"
      footer={
        <PushableButton
          onClick={onClose}
          className="relative z-20 min-w-20 rounded-xl border-2 px-4 py-2 text-xs shadow-[0_6px_0_var(--note-btn-shadow)] hover:shadow-[0_2px_0_var(--note-btn-shadow)] md:min-w-24 md:px-5 md:text-sm"
          style={{
            ["--note-btn-shadow" as string]: buttonShadowColor,
            borderColor: buttonBorderColor,
            backgroundColor: buttonBackgroundColor,
            color: textColor,
          }}
        >
          닫기
        </PushableButton>
      }
    >
      <div
        className="flex h-full min-h-0 flex-col rounded-[1.6rem] border-2 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:p-5"
        style={{
          borderColor: `${accentColor}55`,
          backgroundColor: bodyBackgroundColor,
        }}
      >
        <div
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 text-sm leading-6 md:text-[15px] md:leading-7"
          style={{ color: textColor }}
        >
          {note.content}
        </div>
        {note.signature ? (
          <p
            className="mt-4 text-right text-xs font-bold md:mt-5 md:text-sm"
            style={{ color: textColor }}
          >
            {note.signature}
          </p>
        ) : null}
      </div>
    </CommonModal>
  );
};
