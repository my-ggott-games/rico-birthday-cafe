import type { ReactNode } from "react";
import { CommonModal } from "./CommonModal";
import { AppIcon, type AppIconName } from "./AppIcon";
import { PushableButton } from "./PushableButton";

export type NoteModalContent = {
  title: string;
  content: ReactNode;
  eyebrow?: string;
  signature?: string;
  icon?: AppIconName;
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

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      icon={<AppIcon name={note.icon ?? "StickyNote"} size={28} />}
      title={
        <div className="space-y-2">
          {note.eyebrow ? (
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9E7A56]">
              {note.eyebrow}
            </p>
          ) : null}
          <p className="text-2xl font-black text-[#7A5430]">{note.title}</p>
        </div>
      }
      panelClassName="max-w-md border-[#D8B98C] bg-[#FFF8EA] px-6 py-7 text-left shadow-[0_22px_70px_rgba(92,63,28,0.2)]"
      titleClassName="mb-4"
      bodyClassName="space-y-4"
      footerClassName="mt-6 flex justify-end"
      footer={
        <PushableButton
          onClick={onClose}
          variant="cream"
          className="min-w-24 rounded-xl px-5 py-2"
        >
          닫기
        </PushableButton>
      }
    >
      <div className="rounded-[1.6rem] border-2 border-[#E7CCAA] bg-white/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div className="space-y-3 text-[15px] leading-7 text-[#6A4A2B]">
          {note.content}
        </div>
        {note.signature ? (
          <p className="mt-5 text-right text-sm font-bold text-[#9E7A56]">
            {note.signature}
          </p>
        ) : null}
      </div>
    </CommonModal>
  );
};
