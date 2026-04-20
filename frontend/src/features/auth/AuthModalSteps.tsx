import React from "react";
import { AppIcon } from "../../components/common/AppIcon";
import { PushableButton } from "../../components/common/PushableButton";

type SetPinStepProps = {
  issuedUid: string;
  copied: boolean;
  pinError: string;
  showGuestEntry: boolean;
  newPin: string;
  confirmPin: string;
  loading: boolean;
  onCopy: () => void;
  onEnterGuestMode: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onNewPinKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onNewPinPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onConfirmPinKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onConfirmPinPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  renderLoadingLabel: (baseText: string) => React.ReactNode;
};

export const AuthModalSetPinStep: React.FC<SetPinStepProps> = ({
  issuedUid,
  copied,
  pinError,
  showGuestEntry,
  newPin,
  confirmPin,
  loading,
  onCopy,
  onEnterGuestMode,
  onSubmit,
  onNewPinKeyDown,
  onNewPinPaste,
  onConfirmPinKeyDown,
  onConfirmPinPaste,
  renderLoadingLabel,
}) => {
  return (
    <div className="text-center py-2">
      <h2 className="mb-2 break-keep text-2xl font-black text-[#166D77] md:text-3xl">
        티켓을 발급받았어요!
      </h2>
      <p className="mb-1 break-keep text-sm text-[#166D77]/60 md:text-base">
        잃어버리면 누군지 알 수 없으니 새로 뽑아야 해요.
      </p>

      <div className="mb-5 flex flex-col gap-2 rounded-2xl border-2 border-[#5EC7A5] bg-pale-custard p-4">
        <span className="text-xl font-black tracking-wider text-[#5EC7A5] md:text-2xl">
          {issuedUid}
        </span>
        <PushableButton
          onClick={onCopy}
          variant="mint"
          className="mx-auto gap-1.5 rounded-xl px-4 py-2 text-xs md:text-sm"
        >
          <AppIcon
            name={copied ? "BadgeCheck" : "Copy"}
            size={14}
            className="text-current"
          />
          <span>{copied ? "복사 완료" : "클릭하여 복사하기"}</span>
        </PushableButton>
      </div>

      <p className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#166D77] md:text-base">
        <AppIcon name="LockKeyhole" size={16} />
        <span>비밀번호를 설정해주세요</span>
      </p>

      {pinError && (
        <div className="mb-4 whitespace-pre-line rounded-xl border border-[#e7c0c0] bg-[#f8e8e8] p-3 text-center text-sm font-bold text-red-700 md:text-base">
          {pinError}
        </div>
      )}
      {showGuestEntry && (
        <PushableButton
          onClick={onEnterGuestMode}
          variant="cream"
          fullWidth
          className="mb-4 py-3 text-sm md:text-base"
        >
          게스트 모드로 입장하기
        </PushableButton>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="숫자 4자리 비밀번호"
          value={"*".repeat(newPin.length)}
          onKeyDown={onNewPinKeyDown}
          onPaste={onNewPinPaste}
          onChange={() => undefined}
          className="w-full rounded-xl border-2 border-[#166D77]/10 px-4 py-3 text-center font-bold tracking-wider text-[#166D77] outline-none focus:border-[#5EC7A5] md:text-lg"
          autoComplete="new-password"
        />
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="비밀번호 확인"
          value={"*".repeat(confirmPin.length)}
          onKeyDown={onConfirmPinKeyDown}
          onPaste={onConfirmPinPaste}
          onChange={() => undefined}
          className="w-full rounded-xl border-2 border-[#166D77]/10 px-4 py-3 text-center font-bold tracking-wider text-[#166D77] outline-none focus:border-[#5EC7A5] md:text-lg"
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border-2 border-[#3f9e80] bg-[#5EC7A5] py-4 text-base font-black text-pale-custard shadow-[0_4px_0_#3f9e80] transition-all hover:translate-y-1 hover:shadow-[0_0px_0_#3f9e80] disabled:opacity-50 md:text-lg"
        >
          {loading ? renderLoadingLabel("확인 중") : "입장하기"}
        </button>
      </form>
    </div>
  );
};

type MainStepProps = {
  error: string;
  showGuestEntry: boolean;
  uidInput: string;
  pinInput: string;
  loading: boolean;
  isIssueCooldownActive: boolean;
  cooldownLabel: string;
  onUidChange: (value: string) => void;
  onLoginSubmit: (event: React.FormEvent) => void;
  onPinKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onPinPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
  onIssueUid: () => void;
  onEnterGuestMode: () => void;
  renderLoadingLabel: (baseText: string) => React.ReactNode;
};

export const AuthModalMainStep: React.FC<MainStepProps> = ({
  error,
  showGuestEntry,
  uidInput,
  pinInput,
  loading,
  isIssueCooldownActive,
  cooldownLabel,
  onUidChange,
  onLoginSubmit,
  onPinKeyDown,
  onPinPaste,
  onIssueUid,
  onEnterGuestMode,
  renderLoadingLabel,
}) => {
  return (
    <>
      <h2 className="mb-4 break-keep text-center text-3xl font-black text-[#166D77] md:text-4xl">
        티켓 보여주세요!
      </h2>

      {error && (
        <div className="mb-4 whitespace-pre-line rounded-xl border border-[#e7c0c0] bg-[#f8e8e8] p-3 text-center text-sm font-bold text-red-700 md:text-base">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-4">
        <form onSubmit={onLoginSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="티켓 입력"
            value={uidInput}
            onChange={(e) => onUidChange(e.target.value)}
            className="w-full rounded-xl border-2 border-[#166D77]/10 px-4 py-3 text-center font-bold tracking-wider text-[#166D77] outline-none focus:border-[#5EC7A5] md:text-lg"
            autoComplete="username"
          />
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="비밀번호 (숫자 4자리)"
            value={"*".repeat(pinInput.length)}
            onKeyDown={onPinKeyDown}
            onPaste={onPinPaste}
            onChange={() => undefined}
            className="w-full rounded-xl border-2 border-[#166D77]/10 px-4 py-3 text-center font-bold tracking-wider text-[#166D77] outline-none focus:border-[#5EC7A5] md:text-lg"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border-2 border-[#166D77]/20 bg-pale-custard py-3 text-sm font-black text-[#166D77] transition-all hover:border-[#5EC7A5] disabled:opacity-50 md:text-base"
          >
            {loading && uidInput ? renderLoadingLabel("확인 중") : "여기요!"}
          </button>
        </form>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-[#166D77]/10"></div>
          <span className="mx-4 flex-shrink-0 text-sm font-bold uppercase tracking-widest text-[#166D77]/50 md:text-base">
            티켓이 없으신가요?
          </span>
          <div className="flex-grow border-t border-[#166D77]/10"></div>
        </div>

        <PushableButton
          onClick={onIssueUid}
          disabled={loading || isIssueCooldownActive}
          fullWidth
          className="py-5 text-xl md:text-2xl"
        >
          {loading && !uidInput
            ? renderLoadingLabel("잠시만요")
            : isIssueCooldownActive
              ? `새 티켓 뽑기 (${cooldownLabel})`
              : "새 티켓 뽑기"}
        </PushableButton>

        {showGuestEntry && (
          <PushableButton
            onClick={onEnterGuestMode}
            variant="cream"
            fullWidth
            className="py-3 text-sm md:text-base"
          >
            게스트 모드로 입장하기
          </PushableButton>
        )}
      </div>
    </>
  );
};
