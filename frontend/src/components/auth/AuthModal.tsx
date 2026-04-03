import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { BASE_URL } from "../../utils/api";
import { AppIcon } from "../common/AppIcon";
import { PushableButton } from "../common/PushableButton";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type AuthApiResponse = {
  code?: number;
  token?: string | null;
  message?: string;
  username?: string | null;
};

type Step = "main" | "set-pin";

const PIN_REGEX = /^[0-9]{4}$/;
const MAX_PIN_LENGTH = 4;
const PIN_NAV_KEYS = new Set([
  "Tab",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

const getFriendlyErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.trim();

  if (!message) {
    return fallbackMessage;
  }

  if (/expected pattern|load failed|failed to fetch/i.test(message)) {
    return fallbackMessage;
  }

  if (/[a-zA-Z]/.test(message) && !/[가-힣]/.test(message)) {
    return fallbackMessage;
  }

  return message;
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>("main");

  // Main step state
  const [uidInput, setUidInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // PIN setup step state (after issue-uid)
  const [issuedUid, setIssuedUid] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);

  const { login } = useAuthStore();

  const sanitizePin = (value: string) =>
    value.replace(/\D/g, "").slice(0, MAX_PIN_LENGTH);

  const handleMaskedPinKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      setValue(currentValue.slice(0, -1));
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      setValue("");
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      if (currentValue.length < MAX_PIN_LENGTH) {
        setValue(`${currentValue}${event.key}`);
      }
      return;
    }

    if (PIN_NAV_KEYS.has(event.key)) {
      return;
    }

    if (
      (event.metaKey || event.ctrlKey) &&
      ["a", "c", "v", "x"].includes(event.key.toLowerCase())
    ) {
      return;
    }

    event.preventDefault();
  };

  const handleMaskedPinPaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    currentValue: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    event.preventDefault();
    const pastedDigits = sanitizePin(event.clipboardData.getData("text"));

    if (!pastedDigits) {
      return;
    }

    setValue(`${currentValue}${pastedDigits}`.slice(0, MAX_PIN_LENGTH));
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copyResetTimerRef.current = null;
    }, 1800);
  };

  const getLoginErrorMessage = (code?: number) => {
    switch (code) {
      case 400:
        return "번호표를 다시 확인해주세요.";
      case 401:
        return "번호표나 비밀번호가 틀렸어요.";
      case 500:
        return "카페 문 닫았어요.\n지금은 번호표를 확인할 수 없어요.";
      default:
        return "로그인 중 문제가 생겼어요.\n잠시 후 다시 시도해주세요.";
    }
  };

  const resetAll = () => {
    setStep("main");
    setError("");
    setPinError("");
    setUidInput("");
    setPinInput("");
    setIssuedUid("");
    setNewPin("");
    setConfirmPin("");
    setCopied(false);
    setLoading(false);

    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = null;
    }
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // ── Login with existing ticket ──────────────────────────────────────────────
  const handleExistingTicketLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!uidInput.trim()) {
      setError("번호표를 입력해주세요.");
      return;
    }
    if (!PIN_REGEX.test(pinInput)) {
      setError("비밀번호는 숫자 4자리여야 해요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: uidInput.trim(),
          password: pinInput,
        }),
      });
      let data: AuthApiResponse | null = null;
      try {
        data = (await res.json()) as AuthApiResponse;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(getLoginErrorMessage(data?.code ?? res.status));
      }

      if (data?.code !== 200 || !data.token) {
        throw new Error(getLoginErrorMessage(data?.code));
      }

      login(data.token, data.username ?? null);
      onSuccess();
    } catch (err: unknown) {
      setError(
        getFriendlyErrorMessage(
          err,
          "번호표 기계에 문제가 생겼어요.\n잠시 후 다시 시도해주세요.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Issue a new UID ─────────────────────────────────────────────────
  const handleIssueUid = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/auth/issue-uid`, {
        method: "POST",
      });
      const data = (await res.json()) as AuthApiResponse;

      if (!res.ok || data.code !== 200 || !data.username) {
        throw new Error(data.message || "번호표 발급 실패");
      }

      setIssuedUid(data.username);
      setCopied(false);
      setNewPin("");
      setConfirmPin("");
      setPinError("");
      setStep("set-pin");
    } catch (err: unknown) {
      setError(
        getFriendlyErrorMessage(
          err,
          "번호표 발급 중 문제가 생겼어요.\n잠시 후 다시 시도해주세요.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Set PIN for the newly issued UID ────────────────────────────────
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    if (!PIN_REGEX.test(newPin)) {
      setPinError("비밀번호는 숫자 4자리여야 해요.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("비밀번호가 일치하지 않아요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: issuedUid,
          password: newPin,
          confirmPassword: confirmPin,
        }),
      });
      const data = (await res.json()) as AuthApiResponse;

      if (!res.ok || data.code !== 200 || !data.token) {
        throw new Error(data.message || "비밀번호 설정 실패");
      }

      login(data.token, data.username ?? null);
      resetAll();
      onSuccess();
    } catch (err: unknown) {
      setPinError(
        getFriendlyErrorMessage(
          err,
          "비밀번호 설정 중 문제가 생겼어요.\n잠시 후 다시 시도해주세요.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-modal-overlay"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-[80vw] max-w-sm rounded-[2rem] border-4 border-[#5EC7A5] bg-[#FFFFF8] p-8 shadow-xl md:w-full md:max-w-md"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-[#166D77]/60 hover:text-[#5EC7A5] font-bold text-xl"
            >
              ✕
            </button>

            {/* ── Step: Set PIN after new UID issued ── */}
            {step === "set-pin" ? (
              <div className="text-center py-2">
                <h2 className="mb-2 break-keep text-2xl font-black text-[#166D77] md:text-3xl">
                  번호표를 발급받았어요!
                </h2>
                <p className="mb-1 break-keep text-sm text-[#166D77]/60 md:text-base">
                  잃어버리면 알 수 없으니 꼭 저장해두세요.
                </p>

                <div className="mb-5 flex flex-col gap-2 rounded-2xl border-2 border-[#5EC7A5] bg-pale-custard p-4">
                  <span className="text-xl font-black tracking-wider text-[#5EC7A5] md:text-2xl">
                    {issuedUid}
                  </span>
                  <button
                    onClick={() => copyToClipboard(issuedUid)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#166D77]/50 transition-colors hover:text-[#5EC7A5] md:text-sm"
                  >
                    <AppIcon
                      name={copied ? "BadgeCheck" : "Copy"}
                      size={14}
                      className={copied ? "text-[#5EC7A5]" : undefined}
                    />
                    <span>{copied ? "복사 완료" : "클릭하여 복사하기"}</span>
                  </button>
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

                <form onSubmit={handleSetPin} className="flex flex-col gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={MAX_PIN_LENGTH}
                    placeholder="숫자 4자리 비밀번호"
                    value={"*".repeat(newPin.length)}
                    onKeyDown={(event) =>
                      handleMaskedPinKeyDown(event, newPin, setNewPin)
                    }
                    onPaste={(event) =>
                      handleMaskedPinPaste(event, newPin, setNewPin)
                    }
                    onChange={() => undefined}
                    className="w-full rounded-xl border-2 border-[#166D77]/10 px-4 py-3 text-center font-bold tracking-wider text-[#166D77] outline-none focus:border-[#5EC7A5] md:text-lg"
                    autoComplete="new-password"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={MAX_PIN_LENGTH}
                    placeholder="비밀번호 확인"
                    value={"*".repeat(confirmPin.length)}
                    onKeyDown={(event) =>
                      handleMaskedPinKeyDown(event, confirmPin, setConfirmPin)
                    }
                    onPaste={(event) =>
                      handleMaskedPinPaste(event, confirmPin, setConfirmPin)
                    }
                    onChange={() => undefined}
                    className="w-full rounded-xl border-2 border-[#166D77]/10 px-4 py-3 text-center font-bold tracking-wider text-[#166D77] outline-none focus:border-[#5EC7A5] md:text-lg"
                    autoComplete="new-password"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl border-2 border-[#3f9e80] bg-[#5EC7A5] py-4 text-base font-black text-pale-custard shadow-[0_4px_0_#3f9e80] transition-all hover:translate-y-1 hover:shadow-[0_0px_0_#3f9e80] disabled:opacity-50 md:text-lg"
                  >
                    {loading ? "설정 중..." : "입장하기"}
                  </button>
                </form>
              </div>
            ) : (
              /* ── Step: Main (login or issue uid) ── */
              <>
                <h2 className="mb-4 break-keep text-center text-3xl font-black text-[#166D77] md:text-4xl">
                  번호표 보여주세요!
                </h2>

                {error && (
                  <div className="mb-4 whitespace-pre-line rounded-xl border border-[#e7c0c0] bg-[#f8e8e8] p-3 text-center text-sm font-bold text-red-700 md:text-base">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <form
                    onSubmit={handleExistingTicketLogin}
                    className="flex flex-col gap-3"
                  >
                    <input
                      type="text"
                      placeholder="번호표 입력"
                      value={uidInput}
                      onChange={(e) => setUidInput(e.target.value)}
                      className="w-full rounded-xl border-2 border-[#166D77]/10 px-4 py-3 text-center font-bold tracking-wider text-[#166D77] outline-none focus:border-[#5EC7A5] md:text-lg"
                      autoComplete="username"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={MAX_PIN_LENGTH}
                      placeholder="비밀번호 (숫자 4자리)"
                      value={"*".repeat(pinInput.length)}
                      onKeyDown={(event) =>
                        handleMaskedPinKeyDown(event, pinInput, setPinInput)
                      }
                      onPaste={(event) =>
                        handleMaskedPinPaste(event, pinInput, setPinInput)
                      }
                      onChange={() => undefined}
                      className="w-full rounded-xl border-2 border-[#166D77]/10 px-4 py-3 text-center font-bold tracking-wider text-[#166D77] outline-none focus:border-[#5EC7A5] md:text-lg"
                      autoComplete="current-password"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl border-2 border-[#166D77]/20 bg-pale-custard py-3 text-sm font-black text-[#166D77] transition-all hover:border-[#5EC7A5] disabled:opacity-50 md:text-base"
                    >
                      {loading && uidInput ? "확인 중..." : "여기요!"}
                    </button>
                  </form>

                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-[#166D77]/10"></div>
                    <span className="mx-4 flex-shrink-0 text-sm font-bold uppercase tracking-widest text-[#166D77]/50 md:text-base">
                      번호표가 없으신가요?
                    </span>
                    <div className="flex-grow border-t border-[#166D77]/10"></div>
                  </div>

                  <PushableButton
                    onClick={handleIssueUid}
                    disabled={loading}
                    fullWidth
                    className="py-5 text-xl md:text-2xl"
                  >
                    {loading && !uidInput ? "잠시만요..." : "새 번호표 뽑기"}
                  </PushableButton>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
