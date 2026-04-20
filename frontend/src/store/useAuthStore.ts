import { create } from "zustand";

const ADMIN_UID = "chiko_03240324";
const AUTH_UID_STORAGE_KEY = "auth_uid";
const AUTH_GUEST_STORAGE_KEY = "auth_guest_mode";

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
  isGuest: boolean;
  hasHydrated: boolean;
  hydrateFromStorage: () => void;
  login: (token: string, uid?: string | null) => void;
  enterGuest: () => void;
  logout: () => void;
}

const getStoredAuthState = () => {
  if (typeof window === "undefined") {
    return {
      token: null,
      uid: null,
      isAuthenticated: false,
      isAdmin: false,
      isGuest: false,
    };
  }

  const token = window.localStorage.getItem("token");
  const isGuest =
    window.localStorage.getItem(AUTH_GUEST_STORAGE_KEY) === "true" && !token;
  const uid =
    window.localStorage.getItem(AUTH_UID_STORAGE_KEY) ||
    (token ? getJwtSubject(token) : null);

  return {
    token,
    uid: isGuest ? null : uid,
    isAuthenticated: !!token || isGuest,
    isAdmin: token ? isAdminToken(token) : false,
    isGuest,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  uid: null,
  isAuthenticated: false,
  isAdmin: false,
  isGuest: false,
  hasHydrated: false,
  hydrateFromStorage: () => {
    set({
      ...getStoredAuthState(),
      hasHydrated: true,
    });
  },
  login: (token: string, uid?: string | null) => {
    localStorage.setItem("token", token);
    localStorage.removeItem(AUTH_GUEST_STORAGE_KEY);
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
      isGuest: false,
      hasHydrated: true,
    });
  },
  enterGuest: () => {
    localStorage.removeItem("token");
    localStorage.removeItem(AUTH_UID_STORAGE_KEY);
    localStorage.removeItem(AUTH_GUEST_STORAGE_KEY);
    set({
      token: null,
      uid: null,
      isAuthenticated: true,
      isAdmin: false,
      isGuest: true,
      hasHydrated: true,
    });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem(AUTH_UID_STORAGE_KEY);
    localStorage.removeItem(AUTH_GUEST_STORAGE_KEY);
    set({
      token: null,
      uid: null,
      isAuthenticated: false,
      isAdmin: false,
      isGuest: false,
      hasHydrated: true,
    });
  },
}));
