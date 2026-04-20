import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { BASE_URL } from "../../utils/api";
import { pushEvent } from "../../utils/analytics";
import {
  AuthModalMainStep,
  AuthModalSetPinStep,
} from "../../features/auth/AuthModalSteps";
import {
  ADMIN_UID,
  AuthRequestError,
  type AuthApiResponse,
  type AuthStep as Step,
  ISSUE_UID_AT_STORAGE_KEY,
  ISSUE_UID_STORAGE_KEY,
  ISSUE_UID_TOKEN_STORAGE_KEY,
  LAST_ISSUE_AT_STORAGE_KEY,
  PIN_REGEX,
  UID_REGEX,
  UID_VALIDITY_MS,
  UID_REISSUE_COOLDOWN_MS,
  canEnterGuestAfterError,
  fetchWithTimeout,
  formatRemainingTime,
  getFriendlyErrorMessage,
  getLoginErrorMessage,
  getRegisterErrorMessage,
  handleMaskedPinKeyDown,
  handleMaskedPinPaste,
  isServerErrorStatus,
  readStoredNumber,
  readStoredString,
  renderLoadingLabel,
} from "../../features/auth/authModalUtils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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
    setError("몇 번을 불렀는데 이제 오시면 어떡해요!\n다시 티켓을 뽑아주세요.");
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

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    pushEvent("copy_link");
    setCopied(true);

    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copyResetTimerRef.current = null;
    }, 1800);
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
    pushEvent("click_start_button");
    setError("");
    setShowGuestEntry(false);

    if (!uidInput.trim()) {
      setError("티켓을 입력해주세요.");
      return;
    }
    if (!UID_REGEX.test(uidInput.trim())) {
      setError("티켓은 chiko_(8글자 영문+숫자 조합)이어야 해요.");
      return;
    }
    if (uidInput.trim() === ADMIN_UID) {
      setError("이 티켓은 관리자 전용이라 여기서 로그인할 수 없어요.");
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
        const errorCode = data?.code ?? res.status;
        throw new AuthRequestError(
          getLoginErrorMessage(errorCode),
          isServerErrorStatus(errorCode),
        );
      }

      if (data?.code !== 200 || !data.token) {
        throw new AuthRequestError(
          getLoginErrorMessage(data?.code),
          isServerErrorStatus(data?.code),
        );
      }

      login(data.token, data.username ?? null);
      onSuccess();
    } catch (err: unknown) {
      setShowGuestEntry(canEnterGuestAfterError(err));
      setError(
        getFriendlyErrorMessage(
          err,
          "티켓 기계에 문제가 생겼어요.\n잠시 후 다시 시도해주세요.",
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
        `새 티켓은 ${formatRemainingTime(cooldownRemainingMs)} 후 다시 뽑을 수 있어요.`,
      );
      return;
    }

    setLoading(true);
    setError("");
    setShowGuestEntry(false);

    try {
      const res = await fetchWithTimeout(`${BASE_URL}/auth/issue-uid`, {
        method: "POST",
      });
      let data: AuthApiResponse | null = null;
      try {
        data = (await res.json()) as AuthApiResponse;
      } catch {
        data = null;
      }

      if (!res.ok || data?.code !== 200 || !data.username || !data.token) {
        const errorCode = data?.code ?? res.status;
        throw new AuthRequestError(
          data?.message || "티켓 발급 실패",
          isServerErrorStatus(errorCode),
        );
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
      setShowGuestEntry(canEnterGuestAfterError(err));
      setError(
        getFriendlyErrorMessage(
          err,
          "티켓 발급 중 문제가 생겼어요.\n잠시 후 다시 시도해주세요.",
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
        "몇 번을 불렀는데 이제 오시면 어떡해요!\n다시 티켓을 뽑아주세요.",
      );
      return;
    }
    if (!issuedUidToken) {
      setPinError(
        "몇 번을 불렀는데 이제 오시면 어떡해요!\n다시 티켓을 뽑아주세요.",
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
      let data: AuthApiResponse | null = null;
      try {
        data = (await res.json()) as AuthApiResponse;
      } catch {
        data = null;
      }

      if (!res.ok || data?.code !== 200 || !data.token) {
        const errorCode = data?.code ?? res.status;
        throw new AuthRequestError(
          getRegisterErrorMessage(data?.message, errorCode),
          isServerErrorStatus(errorCode),
        );
      }

      login(data.token, data.username ?? null);
      resetAll();
      onSuccess();
    } catch (err: unknown) {
      setShowGuestEntry(canEnterGuestAfterError(err));
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
              <AuthModalSetPinStep
                issuedUid={issuedUid}
                copied={copied}
                pinError={pinError}
                showGuestEntry={showGuestEntry}
                newPin={newPin}
                confirmPin={confirmPin}
                loading={loading}
                onCopy={() => copyToClipboard(issuedUid)}
                onEnterGuestMode={handleEnterGuestMode}
                onSubmit={handleSetPin}
                onNewPinKeyDown={(event) =>
                  handleMaskedPinKeyDown(event, newPin, setNewPin)
                }
                onNewPinPaste={(event) =>
                  handleMaskedPinPaste(event, newPin, setNewPin)
                }
                onConfirmPinKeyDown={(event) =>
                  handleMaskedPinKeyDown(event, confirmPin, setConfirmPin)
                }
                onConfirmPinPaste={(event) =>
                  handleMaskedPinPaste(event, confirmPin, setConfirmPin)
                }
                renderLoadingLabel={renderLoadingLabel}
              />
            ) : (
              <AuthModalMainStep
                error={error}
                showGuestEntry={showGuestEntry}
                uidInput={uidInput}
                pinInput={pinInput}
                loading={loading}
                isIssueCooldownActive={isIssueCooldownActive}
                cooldownLabel={formatRemainingTime(cooldownRemainingMs)}
                onUidChange={setUidInput}
                onLoginSubmit={handleExistingTicketLogin}
                onPinKeyDown={(event) =>
                  handleMaskedPinKeyDown(event, pinInput, setPinInput)
                }
                onPinPaste={(event) =>
                  handleMaskedPinPaste(event, pinInput, setPinInput)
                }
                onIssueUid={handleIssueUid}
                onEnterGuestMode={handleEnterGuestMode}
                renderLoadingLabel={renderLoadingLabel}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
