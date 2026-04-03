import { create } from "zustand";

const ADMIN_UID = "chiko_03240324";
const AUTH_UID_STORAGE_KEY = "auth_uid";

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(paddingLength);
  return atob(padded);
};

const getJwtSubject = (token: string): string | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const decoded = decodeBase64Url(payload);
    const parsed = JSON.parse(decoded) as { sub?: unknown };

    return typeof parsed.sub === "string" ? parsed.sub : null;
  } catch {
    return null;
  }
};

const isAdminToken = (token: string) => getJwtSubject(token) === ADMIN_UID;

interface AuthState {
  token: string | null;
  uid: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, uid?: string | null) => void;
  logout: () => void;
}

const initialToken = localStorage.getItem("token");
const initialUid =
  localStorage.getItem(AUTH_UID_STORAGE_KEY) ||
  (initialToken ? getJwtSubject(initialToken) : null);

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  uid: initialUid,
  isAuthenticated: !!initialToken,
  isAdmin: initialToken ? isAdminToken(initialToken) : false,
  login: (token: string, uid?: string | null) => {
    localStorage.setItem("token", token);
    const resolvedUid = uid?.trim() || getJwtSubject(token);
    if (resolvedUid) {
      localStorage.setItem(AUTH_UID_STORAGE_KEY, resolvedUid);
    } else {
      localStorage.removeItem(AUTH_UID_STORAGE_KEY);
    }

    set({
      token,
      uid: resolvedUid,
      isAuthenticated: true,
      isAdmin: isAdminToken(token),
    });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem(AUTH_UID_STORAGE_KEY);
    set({ token: null, uid: null, isAuthenticated: false, isAdmin: false });
  },
}));
