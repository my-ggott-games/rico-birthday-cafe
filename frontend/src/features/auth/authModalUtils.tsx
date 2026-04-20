import React from "react";

export type AuthApiResponse = {
  code?: number;
  token?: string | null;
  message?: string;
  username?: string | null;
};

export type AuthStep = "main" | "set-pin";

export class AuthRequestError extends Error {
  readonly canEnterGuest: boolean;

  constructor(message: string, canEnterGuest = false) {
    super(message);
    this.name = "AuthRequestError";
    this.canEnterGuest = canEnterGuest;
  }
}

export const PIN_REGEX = /^[0-9]{4}$/;
export const UID_REGEX = /^chiko_[a-zA-Z0-9]{8}$/;
export const ADMIN_UID = "chiko_03240324";
export const MAX_PIN_LENGTH = 4;
export const REQUEST_TIMEOUT_MS = 5000;
export const UID_VALIDITY_MS = 5 * 60 * 1000;
export const UID_REISSUE_COOLDOWN_MS = 3 * 60 * 1000;
export const ISSUE_UID_STORAGE_KEY = "auth_issued_uid";
export const ISSUE_UID_TOKEN_STORAGE_KEY = "auth_issued_uid_token";
export const ISSUE_UID_AT_STORAGE_KEY = "auth_issued_uid_at";
export const LAST_ISSUE_AT_STORAGE_KEY = "auth_last_issue_at";
export const PIN_NAV_KEYS = new Set([
  "Tab",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

export const SERVER_UNAVAILABLE_MESSAGE =
  "카페 리모델링 중입니다.\n게스트 모드로 입장해주세요.";

export const fetchWithTimeout = async (
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

export const readStoredString = (key: string) => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) ?? "";
};

export const readStoredNumber = (key: string): number | null => {
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

export const isServerErrorStatus = (code?: number) =>
  typeof code === "number" && code >= 500;

export const isNetworkOrTimeoutError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === "AbortError") {
    return true;
  }

  return /expected pattern|load failed|failed to fetch|networkerror/i.test(
    error.message,
  );
};

export const canEnterGuestAfterError = (error: unknown) => {
  if (error instanceof AuthRequestError) {
    return error.canEnterGuest;
  }

  return isNetworkOrTimeoutError(error);
};

export const getFriendlyErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  if (error instanceof AuthRequestError && error.canEnterGuest) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  if (error.name === "AbortError") {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  const message = error.message.trim();

  if (!message) {
    return fallbackMessage;
  }

  if (/expected pattern|load failed|failed to fetch/i.test(message)) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  if (/[a-zA-Z]/.test(message) && !/[가-힣]/.test(message)) {
    return fallbackMessage;
  }

  return message;
};

export const formatRemainingTime = (remainingMs: number) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const renderLoadingLabel = (baseText: string) => (
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

export const sanitizePin = (value: string) =>
  value.replace(/\D/g, "").slice(0, MAX_PIN_LENGTH);

export const handleMaskedPinKeyDown = (
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

export const handleMaskedPinPaste = (
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

export const getLoginErrorMessage = (code?: number) => {
  if (isServerErrorStatus(code)) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  switch (code) {
    case 400:
      return "티켓을 다시 확인해주세요.";
    case 401:
      return "티켓이나 비밀번호가 일치하지 않아요.";
    default:
      return "로그인 중 문제가 생겼어요.\n잠시 후 다시 시도해주세요.";
  }
};

export const getRegisterErrorMessage = (message?: string, code?: number) => {
  if (message?.includes("INVALID_UID_FORMAT_OR_RESERVED")) {
    return "티켓은 chiko_ 로 시작하는데...";
  }

  if (message?.includes("UID_ISSUE_TOKEN_INVALID_OR_EXPIRED")) {
    return "몇 번을 불렀는데 이제 오시면 어떡해요! 새 티켓을 발급받아주세요.";
  }

  if (message?.includes("PIN_FORMAT_INVALID")) {
    return "비밀번호는 숫자 4자리인데...";
  }

  if (message?.includes("PIN_CONFIRM_MISMATCH")) {
    return "비밀번호가 일치하지 않아요.";
  }

  if (message?.includes("UID_ALREADY_REGISTERED_OR_REPLAYED")) {
    return "몇 번을 불렀는데 이제 오시면 어떡해요!\n다시 티켓을 뽑아주세요.";
  }

  if (code === 401) {
    return "티켓 인증이 만료됐어요.\n새 티켓을 다시 뽑아주세요.";
  }

  if (isServerErrorStatus(code)) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  return "비밀번호 설정 중 문제가 생겼어요.\n잠시 후 다시 시도해주세요.";
};
