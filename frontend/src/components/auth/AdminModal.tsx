import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { useToastStore } from "../../store/useToastStore";
import { BASE_URL } from "../../utils/api";

const KOREAN_TO_ENGLISH_MAP: Record<string, string> = {
  ㅂ: "q",
  ㅈ: "w",
  ㄷ: "e",
  ㄱ: "r",
  ㅅ: "t",
  ㅛ: "y",
  ㅕ: "u",
  ㅑ: "i",
  ㅐ: "o",
  ㅔ: "p",
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
  ㅃ: "q",
  ㅉ: "w",
  ㄸ: "e",
  ㄲ: "r",
  ㅆ: "t",
  ㅒ: "o",
  ㅖ: "p",
};

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
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
  const buildPasscode = (chars: string[]) =>
    `${chars.slice(0, 3).join("")}_${chars.slice(3).join("")}`;
  const sanitizePasscode = (raw: string) =>
    raw
      .toLowerCase()
      .replace(/-/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_");

  useEffect(() => {
    if (isOpen) {
      setInputs(Array(7).fill(""));
      setError(false);
      setAuthStatus("idle");
      setFailCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
            icon: "👀",
          });

          setTimeout(() => {
            onClose();
          }, 3000);
          return;
        }

        setAuthStatus("admin");
        setFailCount(0);
        login(data.token);
        addToast({
          title: "시스템 권한 획득",
          description: "관리자 모드로 입장합니다.",
          icon: "🔑",
        });

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
    [addToast, login, onClose, token],
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
    const val = sanitizePasscode(e.target.value);
    const compactValue = val.replace(/_/g, "");
    const currentLength = inputs.filter((x) => x !== "").length;

    if (compactValue.length < currentLength) {
      handleBackspace();
      return;
    }

    if (val.includes("_")) {
      const normalized = compactValue.slice(0, 7);
      if (normalized.length === 7) {
        const nextInputs = normalized.split("");
        setInputs(nextInputs);
        setError(false);
        submitPasscode(nextInputs);
        return;
      }
    }

    const newChar = compactValue[compactValue.length - 1];
    if (!newChar) return;

    let key = newChar;
    if (KOREAN_TO_ENGLISH_MAP[key]) {
      key = KOREAN_TO_ENGLISH_MAP[key];
    }

    if (/^[a-zA-Z0-9]$/.test(key)) {
      handleKeyClick(key);
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
        // If it's a Backspace or letter, let onChange/onKeyDown of input handle it,
        // OR we just use this handler. Actually, if we use handleInputChange,
        // it's better to prevent global listener from duplicating letters.
        if (
          e.key === "Backspace" ||
          /^[a-zA-Z0-9]$/.test(e.key) ||
          KOREAN_TO_ENGLISH_MAP[e.key]
        ) {
          return;
        }
      }

      let key = e.key;

      if (key === "Backspace") {
        handleBackspace();
        return;
      }

      if (KOREAN_TO_ENGLISH_MAP[key]) {
        key = KOREAN_TO_ENGLISH_MAP[key];
      } else if (key.length === 1 && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(key)) {
        return;
      }

      if (key === "_") {
        return;
      }

      if (/^[a-zA-Z0-9]$/.test(key)) {
        e.preventDefault();
        handleKeyClick(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [authStatus, handleBackspace, handleKeyClick, isOpen, loading]);

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
              onPaste={(e) => {
                const pasted = sanitizePasscode(
                  e.clipboardData.getData("text"),
                );
                const normalized = pasted.replace(/_/g, "").slice(0, 7);

                if (normalized.length !== 7) {
                  return;
                }

                e.preventDefault();
                const nextInputs = normalized.split("");
                setInputs(nextInputs);
                setError(false);
                submitPasscode(nextInputs);
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  handleBackspace();
                }
              }}
              autoFocus
              autoCapitalize="none"
              autoComplete="off"
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

              <div className="text-pale-custard/10 text-xl sm:text-2xl font-black mb-2 flex items-end">
                _
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
