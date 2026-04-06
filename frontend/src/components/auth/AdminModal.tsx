import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { useToastStore } from "../../store/useToastStore";
import { EASTER_EGG_NOTE_ACCESS_STORAGE_KEY } from "../../constants/noteAccess";
import { BASE_URL } from "../../utils/api";

const ASCII_INPUT_REGEX = /^[A-Za-z0-9]$/;
const KOREAN_TO_ENGLISH_MAP: Record<string, string> = {
  ㅂ: "q",
  ㅃ: "q",
  ㅈ: "w",
  ㅉ: "w",
  ㄷ: "e",
  ㄸ: "e",
  ㄱ: "r",
  ㄲ: "r",
  ㅅ: "t",
  ㅆ: "t",
  ㅛ: "y",
  ㅕ: "u",
  ㅑ: "i",
  ㅐ: "o",
  ㅒ: "o",
  ㅔ: "p",
  ㅖ: "p",
  ㅁ: "a",
  ㄴ: "s",
  ㅇ: "d",
  ㄹ: "f",
  ㅎ: "g",
  ㅗ: "h",
  ㅓ: "j",
  ㅏ: "k",
  ㅣ: "l",
  ㅋ: "z",
  ㅌ: "x",
  ㅊ: "c",
  ㅍ: "v",
  ㅠ: "b",
  ㅜ: "n",
  ㅡ: "m",
  ᄇ: "q",
  ᄈ: "q",
  ᄌ: "w",
  ᄍ: "w",
  ᄃ: "e",
  ᄄ: "e",
  ᄀ: "r",
  ᄁ: "r",
  ᄉ: "t",
  ᄊ: "t",
  ᄋ: "d",
  ᄂ: "s",
  ᄅ: "f",
  ᄒ: "g",
  ᄆ: "a",
  ᄏ: "z",
  ᄐ: "x",
  ᄎ: "c",
  ᄑ: "v",
  ᅭ: "y",
  ᅧ: "u",
  ᅣ: "i",
  ᅢ: "o",
  ᅤ: "o",
  ᅦ: "p",
  ᅨ: "p",
  ᅩ: "h",
  ᅥ: "j",
  ᅡ: "k",
  ᅵ: "l",
  ᅮ: "n",
  ᅲ: "b",
  ᅳ: "m",
  ᆨ: "r",
  ᆫ: "s",
  ᆮ: "e",
  ᆯ: "f",
  ᆷ: "a",
  ᆸ: "q",
  ᆺ: "t",
  ᆻ: "t",
  ᆼ: "d",
  ᆽ: "w",
  ᆾ: "c",
  ᆿ: "z",
  ᇀ: "x",
  ᇁ: "v",
  ᇂ: "g",
};

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccessGranted?: (access: "admin" | "easter_egg") => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onAccessGranted,
}) => {
  const [inputs, setInputs] = useState<string[]>(Array(7).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "admin" | "easter_egg">(
    "idle",
  );
  const [failCount, setFailCount] = useState(0);

  const { login } = useAuthStore();
  const { addToast } = useToastStore();
  const { token } = useAuthStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const lastAcceptedKeyRef = useRef<number | null>(null);
  const buildPasscode = (chars: string[]) =>
    `${chars.slice(0, 3).join("")}_${chars.slice(3).join("")}`;
  const normalizeSingleKeyInput = (raw: string) => {
    const normalized = raw.normalize("NFKC").toLowerCase();
    const mapped = KOREAN_TO_ENGLISH_MAP[normalized] ?? normalized;
    return ASCII_INPUT_REGEX.test(mapped) ? mapped : null;
  };

  useEffect(() => {
    if (isOpen) {
      setInputs(Array(7).fill(""));
      setError(false);
      setAuthStatus("idle");
      setFailCount(0);
      lastAcceptedKeyRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const shouldIgnoreRapidRepeat = useCallback(() => {
    const now = Date.now();
    const lastAcceptedKeyTime = lastAcceptedKeyRef.current;

    if (lastAcceptedKeyTime !== null && now - lastAcceptedKeyTime < 80) {
      return true;
    }

    lastAcceptedKeyRef.current = now;
    return false;
  }, []);

  const submitPasscode = useCallback(
    async (currentInputs: string[]) => {
      const passcode = buildPasscode(currentInputs);

      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/auth/admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error();

        if (data.message === "easter_egg") {
          setAuthStatus("easter_egg");
          window.localStorage.setItem(
            EASTER_EGG_NOTE_ACCESS_STORAGE_KEY,
            "true",
          );
          onAccessGranted?.("easter_egg");

          // Trigger achievement for Easter Egg
          if (token) {
            fetch(`${BASE_URL}/achievements/award/RICO_DEBUT_DATE`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(console.error);
          }

          addToast({
            title: "관리자 권한에 접근한 자",
            description: "정답은 리코 데뷔 날짜였습니다~",
            icon: "Eye",
          });

          setTimeout(() => {
            onClose();
          }, 3000);
          return;
        }

        setAuthStatus("admin");
        setFailCount(0);
        login(
          data.token,
          typeof data.username === "string" ? data.username : null,
        );
        onAccessGranted?.("admin");

        const achievementRes = await fetch(
          `${BASE_URL}/achievements/award/WHO_ARE_YOU`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          },
        );
        const achievementAwarded = achievementRes.ok
          ? await achievementRes.json()
          : false;

        addToast({
          title: "시스템 권한 획득",
          description: "관리자 모드로 입장합니다.",
          icon: "KeyRound",
        });
        if (achievementAwarded) {
          addToast({
            title: "??? 예요.",
            description: "내 별은 영원히 너야.",
            icon: "Rose",
          });
        }

        setTimeout(() => {
          onClose();
        }, 2000);
      } catch {
        setError(true);
        setFailCount((prev) => prev + 1);
        setTimeout(() => {
          setInputs(Array(7).fill(""));
          setError(false);
        }, 500);
      } finally {
        setLoading(false);
      }
    },
    [addToast, login, onAccessGranted, onClose, token],
  );

  const handleKeyClick = useCallback(
    (letter: string) => {
      if (loading || authStatus !== "idle") return;

      const firstEmptyIndex = inputs.findIndex((val) => val === "");
      if (firstEmptyIndex === -1) return;

      const newInputs = [...inputs];
      newInputs[firstEmptyIndex] = letter.toLowerCase();
      setInputs(newInputs);
      setError(false);

      if (newInputs.every((val) => val !== "")) {
        submitPasscode(newInputs);
      }
    },
    [authStatus, inputs, loading, submitPasscode],
  );

  const handleBackspace = useCallback(() => {
    if (loading || authStatus !== "idle") return;

    const lastFilledIndex = [...inputs]
      .reverse()
      .findIndex((val) => val !== "");
    if (lastFilledIndex === -1) return;

    const actualIndex = 6 - lastFilledIndex;
    const newInputs = [...inputs];
    newInputs[actualIndex] = "";
    setInputs(newInputs);
    setError(false);
  }, [authStatus, inputs, loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loading || authStatus !== "idle") return;
    const rawValue = e.target.value.normalize("NFKC").replace(/-/g, "_");
    const compactValue = rawValue.replace(/_/g, "");
    const currentValue = inputs.join("");
    const lengthDelta = compactValue.length - currentValue.length;

    if (lengthDelta !== 1) {
      return;
    }

    const newChar = compactValue[compactValue.length - 1];
    if (!newChar) return;
    if (shouldIgnoreRapidRepeat()) return;

    const normalizedChar = normalizeSingleKeyInput(newChar);
    if (normalizedChar) {
      handleKeyClick(normalizedChar);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || loading || authStatus !== "idle") return;

      // Give priority to the input field if it's focused,
      // otherwise global keys might double-trigger.
      // But since the input captures onChange, we can safely ignore global A-Z keys
      // if the active element is our input to avoid double entries.
      if (document.activeElement === inputRef.current) {
        if (
          e.key === "Backspace" ||
          ASCII_INPUT_REGEX.test(e.key) ||
          Boolean(normalizeSingleKeyInput(e.key))
        ) {
          return;
        }
      }

      let key = e.key;

      if (key === "Backspace") {
        if (e.repeat) {
          e.preventDefault();
          return;
        }
        handleBackspace();
        return;
      }

      if (key === "_") {
        return;
      }

      key = normalizeSingleKeyInput(key) ?? key;

      if (ASCII_INPUT_REGEX.test(key)) {
        if (e.repeat || shouldIgnoreRapidRepeat()) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        handleKeyClick(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    authStatus,
    handleBackspace,
    handleKeyClick,
    isOpen,
    loading,
    shouldIgnoreRapidRepeat,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="admin-modal-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-[92vw] sm:max-w-xl bg-[#0a0a0a] rounded-[2rem] sm:rounded-[3rem] border border-pale-custard/5 shadow-2xl px-5 py-7 sm:p-10 overflow-hidden"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            onClick={() => inputRef.current?.focus()}
          >
            <input
              ref={inputRef}
              className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-text text-transparent bg-transparent"
              value={inputs.join("")}
              onChange={handleInputChange}
              onPaste={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  e.preventDefault();
                  if (e.repeat) {
                    return;
                  }
                  handleBackspace();
                }
              }}
              autoFocus
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#5EC7A5] to-transparent opacity-50" />

            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-lg sm:text-xl font-bold text-pale-custard/40 tracking-[0.24em] sm:tracking-[0.3em] uppercase mb-1">
                Who am I?
              </h2>
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-8 bg-pale-custard/10" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#5EC7A5] animate-pulse" />
                <div className="h-px w-8 bg-pale-custard/10" />
              </div>
            </div>

            <div
              className={`flex items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 ${error ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
            >
              <div className="flex gap-1.5 sm:gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-14 sm:w-12 sm:h-16 bg-pale-custard/5 border-2 rounded-xl flex items-center justify-center text-2xl transition-all
                                    ${
                                      authStatus === "easter_egg"
                                        ? "border-[#5FC7A5] bg-[#5FC7A5]/10 text-[#5FC7A5]"
                                        : authStatus === "admin"
                                          ? "border-[#77aaee] bg-[#77aaee]/10 text-[#77aaee]"
                                          : error
                                            ? "border-red-500 text-red-500"
                                            : inputs[i]
                                              ? "border-[#5EC7A5] bg-pale-custard/10"
                                              : "border-pale-custard/5"
                                    }`}
                  >
                    <span
                      className={
                        authStatus !== "idle"
                          ? "mt-1"
                          : "text-pale-custard mt-1"
                      }
                    >
                      {inputs[i] ? "*" : ""}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex h-14 items-end text-xl font-black text-pale-custard/10 sm:h-16 sm:text-2xl">
                <span className="flex h-full items-end leading-none">_</span>
              </div>

              <div className="flex gap-1.5 sm:gap-2">
                {[3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-14 sm:w-12 sm:h-16 bg-pale-custard/5 border-2 rounded-xl flex items-center justify-center text-2xl transition-all
                                    ${
                                      authStatus === "easter_egg"
                                        ? "border-[#5FC7A5] bg-[#5FC7A5]/10 text-[#5FC7A5]"
                                        : authStatus === "admin"
                                          ? "border-[#77aaee] bg-[#77aaee]/10 text-[#77aaee]"
                                          : error
                                            ? "border-red-500 text-red-500"
                                            : inputs[i]
                                              ? "border-[#5EC7A5] bg-pale-custard/10"
                                              : "border-pale-custard/5"
                                    }`}
                  >
                    <span
                      className={
                        authStatus !== "idle"
                          ? "mt-1"
                          : "text-pale-custard mt-1"
                      }
                    >
                      {inputs[i] ? "*" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <AnimatePresence mode="wait">
                {authStatus === "admin" ? (
                  <motion.span
                    key="s"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[#77aaee] font-black tracking-widest text-s underline underline-offset-8"
                  >
                    ACCESS GRANTED
                  </motion.span>
                ) : authStatus === "easter_egg" ? (
                  <motion.span
                    key="egg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[#5FC7A5] font-black tracking-widest text-s uppercase font-mono"
                  >
                    EASTER EGG FOUND
                  </motion.span>
                ) : loading ? (
                  <motion.div
                    key="l"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center gap-1"
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-1 bg-[#5EC7A5] rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </motion.div>
                ) : error ? (
                  <motion.span
                    key="e"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 font-bold text-s tracking-widest"
                  >
                    VERIFICATION FAILED
                  </motion.span>
                ) : (
                  <motion.span
                    key="p"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-pale-custard/40 text-s uppercase tracking-[0.4em]"
                  >
                    {failCount >= 3
                      ? "생일은 너무 쉬우니까"
                      : "관리자 모드로 전환합니다."}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}

      <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
            `}</style>
    </AnimatePresence>
  );
};
