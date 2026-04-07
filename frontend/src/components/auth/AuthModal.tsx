import React, { useEffect, useRef, useState } from "react";
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
const UID_REGEX = /^chiko_[a-zA-Z0-9]{8}$/;
const ADMIN_UID = "chiko_03240324";
const MAX_PIN_LENGTH = 4;
const REQUEST_TIMEOUT_MS = 15000;
const UID_VALIDITY_MS = 5 * 60 * 1000;
const UID_REISSUE_COOLDOWN_MS = 3 * 60 * 1000;
const ISSUE_UID_STORAGE_KEY = "auth_issued_uid";
const ISSUE_UID_TOKEN_STORAGE_KEY = "auth_issued_uid_token";
const ISSUE_UID_AT_STORAGE_KEY = "auth_issued_uid_at";
const LAST_ISSUE_AT_STORAGE_KEY = "auth_last_issue_at";
const PIN_NAV_KEYS = new Set([
  "Tab",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const readStoredString = (key: string) => {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(key) ?? "";
};

const readStoredNumber = (key: string): number | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const getFriendlyErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  if (error.name === "AbortError") {
    return "요청이 지연되고 있어요.\n잠시 후 다시 시도해주세요.";
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
  const [issuedUid, setIssuedUid] = useState(() =>
    readStoredString(ISSUE_UID_STORAGE_KEY),
  );
  const [issuedUidToken, setIssuedUidToken] = useState(() =>
    readStoredString(ISSUE_UID_TOKEN_STORAGE_KEY),
  );
  const [issuedAtMs, setIssuedAtMs] = useState<number | null>(() =>
    readStoredNumber(ISSUE_UID_AT_STORAGE_KEY),
  );
  const [lastIssueAtMs, setLastIssueAtMs] = useState<number | null>(() =>
    readStoredNumber(LAST_ISSUE_AT_STORAGE_KEY),
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showGuestEntry, setShowGuestEntry] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);

  const { login, enterGuest } = useAuthStore();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (issuedUid) {
      window.localStorage.setItem(ISSUE_UID_STORAGE_KEY, issuedUid);
    } else {
      window.localStorage.removeItem(ISSUE_UID_STORAGE_KEY);
    }
  }, [issuedUid]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (issuedUidToken) {
      window.localStorage.setItem(ISSUE_UID_TOKEN_STORAGE_KEY, issuedUidToken);
    } else {
      window.localStorage.removeItem(ISSUE_UID_TOKEN_STORAGE_KEY);
    }
  }, [issuedUidToken]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (issuedAtMs) {
      window.localStorage.setItem(ISSUE_UID_AT_STORAGE_KEY, String(issuedAtMs));
    } else {
      window.localStorage.removeItem(ISSUE_UID_AT_STORAGE_KEY);
    }
  }, [issuedAtMs]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (lastIssueAtMs) {
      window.localStorage.setItem(
        LAST_ISSUE_AT_STORAGE_KEY,
        String(lastIssueAtMs),
      );
    } else {
      window.localStorage.removeItem(LAST_ISSUE_AT_STORAGE_KEY);
    }
  }, [lastIssueAtMs]);

  const cooldownRemainingMs = lastIssueAtMs
    ? Math.max(0, UID_REISSUE_COOLDOWN_MS - (nowMs - lastIssueAtMs))
    : 0;
  const isIssueCooldownActive = cooldownRemainingMs > 0;
  const isIssuedUidExpired = issuedAtMs
    ? nowMs - issuedAtMs >= UID_VALIDITY_MS
    : false;

  const formatRemainingTime = (remainingMs: number) => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const renderLoadingLabel = (baseText: string) => (
    <span className="inline-flex items-center">
      <span>{baseText}</span>
      <span
        aria-hidden="true"
        className="ml-0.5 inline-flex min-w-[1.1em] justify-start"
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="auth-loading-dot"
            style={{ animationDelay: `${index * 0.18}s` }}
          >
            .
          </span>
        ))}
      </span>
    </span>
  );

  const clearIssuedUid = () => {
    setIssuedUid("");
    setIssuedUidToken("");
    setIssuedAtMs(null);
    setNewPin("");
    setConfirmPin("");
    setPinError("");
  };

  useEffect(() => {
    if (step !== "set-pin" || !issuedAtMs) {
      return;
    }
    if (!isIssuedUidExpired) {
      return;
    }

    clearIssuedUid();
    setStep("main");
    setError(
      "몇 번을 불렀는데 이제 오시면 어떡해요!\n다시 번호표를 뽑아주세요.",
    );
  }, [isIssuedUidExpired, issuedAtMs, step]);

  useEffect(() => {
    if (!issuedAtMs) {
      return;
    }
    if (Date.now() - issuedAtMs >= UID_VALIDITY_MS) {
      clearIssuedUid();
      setStep("main");
    }
  }, []);

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
        return "번호표나 비밀번호가 일치하지 않아요.";
      case 500:
        return "카페 문 닫았어요.\n지금은 번호표를 확인할 수 없어요.";
      default:
        return "로그인 중 문제가 생겼어요.\n잠시 후 다시 시도해주세요.";
    }
  };

  const getRegisterErrorMessage = (message?: string, code?: number) => {
    if (message?.includes("INVALID_UID_FORMAT_OR_RESERVED")) {
      return "번호표는 chiko_ 로 시작하는데...";
    }

    if (message?.includes("UID_ISSUE_TOKEN_INVALID_OR_EXPIRED")) {
      return "몇 번을 불렀는데 이제 오시면 어떡해요! 새 번호표를 발급받아주세요.";
    }

    if (message?.includes("PIN_FORMAT_INVALID")) {
      return "비밀번호는 숫자 4자리인데...";
    }

    if (message?.includes("PIN_CONFIRM_MISMATCH")) {
      return "비밀번호가 일치하지 않아요.";
    }

    if (message?.includes("UID_ALREADY_REGISTERED_OR_REPLAYED")) {
      return "몇 번을 불렀는데 이제 오시면 어떡해요!\n다시 번호표를 뽑아주세요.";
    }

    if (code === 401) {
      return "번호표 인증이 만료됐어요.\n새 번호표를 다시 뽑아주세요.";
    }

    return "비밀번호 설정 중 문제가 생겼어요.\n잠시 후 다시 시도해주세요.";
  };

  const resetAll = () => {
    setStep("main");
    setError("");
    setPinError("");
    setShowGuestEntry(false);
    setUidInput("");
    setPinInput("");
    clearIssuedUid();
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

  const handleEnterGuestMode = () => {
    enterGuest();
    resetAll();
    onSuccess();
  };

  // ── Login with existing ticket ──────────────────────────────────────────────
  const handleExistingTicketLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowGuestEntry(false);

    if (!uidInput.trim()) {
      setError("번호표를 입력해주세요.");
      return;
    }
    if (!UID_REGEX.test(uidInput.trim())) {
      setError("번호표는 chiko_(8글자 영문+숫자 조합)이어야 해요.");
      return;
    }
    if (uidInput.trim() === ADMIN_UID) {
      setError("이 번호표는 관리자 전용이라 여기서 로그인할 수 없어요.");
      return;
    }
    if (!PIN_REGEX.test(pinInput)) {
      setError("비밀번호는 숫자 4자리인데...");
      return;
    }

    setLoading(true);

    try {
      const res = await fetchWithTimeout(`${BASE_URL}/auth/login`, {
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
        if ((data?.code ?? res.status) === 500) {
          setShowGuestEntry(true);
        }
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
    if (isIssueCooldownActive) {
      setError(
        `새 번호표는 ${formatRemainingTime(cooldownRemainingMs)} 후 다시 뽑을 수 있어요.`,
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetchWithTimeout(`${BASE_URL}/auth/issue-uid`, {
        method: "POST",
      });
      const data = (await res.json()) as AuthApiResponse;

      if (!res.ok || data.code !== 200 || !data.username || !data.token) {
        throw new Error(data.message || "번호표 발급 실패");
      }

      setIssuedUid(data.username);
      setIssuedUidToken(data.token);
      setIssuedAtMs(Date.now());
      setLastIssueAtMs(Date.now());
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
    setShowGuestEntry(false);

    if (!PIN_REGEX.test(newPin)) {
      setPinError("비밀번호는 숫자 4자리여야 해요.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("비밀번호가 일치하지 않아요.");
      return;
    }
    if (isIssuedUidExpired) {
      clearIssuedUid();
      setStep("main");
      setError(
        "몇 번을 불렀는데 이제 오시면 어떡해요!\n다시 번호표를 뽑아주세요.",
      );
      return;
    }
    if (!issuedUidToken) {
      setPinError(
        "몇 번을 불렀는데 이제 오시면 어떡해요!\n다시 번호표를 뽑아주세요.",
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetchWithTimeout(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: issuedUid,
          password: newPin,
          confirmPassword: confirmPin,
          issueToken: issuedUidToken,
        }),
      });
      const data = (await res.json()) as AuthApiResponse;

      if (!res.ok || data.code !== 200 || !data.token) {
        if ((data.code ?? res.status) === 500) {
          setShowGuestEntry(true);
        }
        throw new Error(
          getRegisterErrorMessage(data.message, data.code ?? res.status),
        );
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
                  잃어버리면 누군지 알 수 없으니 새로 뽑아야 해요.
                </p>

                <div className="mb-5 flex flex-col gap-2 rounded-2xl border-2 border-[#5EC7A5] bg-pale-custard p-4">
                  <span className="text-xl font-black tracking-wider text-[#5EC7A5] md:text-2xl">
                    {issuedUid}
                  </span>
                  <PushableButton
                    onClick={() => copyToClipboard(issuedUid)}
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
                  <button
                    type="button"
                    onClick={handleEnterGuestMode}
                    className="mb-4 w-full rounded-xl border-2 border-[#166D77]/25 bg-[#166D77] py-3 text-sm font-black text-pale-custard transition-all hover:brightness-110 md:text-base"
                  >
                    게스트 모드로 입장하기
                  </button>
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
                    {loading ? renderLoadingLabel("확인 중") : "입장하기"}
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
                {showGuestEntry && (
                  <button
                    type="button"
                    onClick={handleEnterGuestMode}
                    className="mb-4 w-full rounded-xl border-2 border-[#166D77]/25 bg-[#166D77] py-3 text-sm font-black text-pale-custard transition-all hover:brightness-110 md:text-base"
                  >
                    게스트 모드로 입장하기
                  </button>
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
                      {loading && uidInput
                        ? renderLoadingLabel("확인 중")
                        : "여기요!"}
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
                    disabled={loading || isIssueCooldownActive}
                    fullWidth
                    className="py-5 text-xl md:text-2xl"
                  >
                    {loading && !uidInput
                      ? renderLoadingLabel("잠시만요")
                      : isIssueCooldownActive
                        ? `새 번호표 뽑기 (${formatRemainingTime(cooldownRemainingMs)})`
                        : "새 번호표 뽑기"}
                  </PushableButton>

                  <button
                    type="button"
                    onClick={handleEnterGuestMode}
                    className="w-full rounded-xl border-2 border-[#166D77]/20 bg-[#166D77]/10 py-3 text-sm font-black text-[#166D77] transition-all hover:bg-[#166D77]/15 md:text-base"
                  >
                    (임시) 게스트 모드로 입장
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
