import { useAuthStore } from "../store/useAuthStore";

const normalizeBaseUrl = (baseUrl?: string) => {
  const trimmedBaseUrl = baseUrl?.trim();

  if (!trimmedBaseUrl) {
    return null;
  }

  const normalizedBaseUrl = trimmedBaseUrl.endsWith("/")
    ? trimmedBaseUrl.slice(0, -1)
    : trimmedBaseUrl;

  if (normalizedBaseUrl === "/api" || normalizedBaseUrl.endsWith("/api")) {
    return normalizedBaseUrl;
  }

  if (normalizedBaseUrl.startsWith("/")) {
    return `${normalizedBaseUrl}/api`;
  }

  try {
    const parsedUrl = new URL(normalizedBaseUrl);
    const normalizedPathname = parsedUrl.pathname.replace(/\/$/, "");

    if (!normalizedPathname || normalizedPathname === "") {
      return `${normalizedBaseUrl}/api`;
    }

    return normalizedBaseUrl;
  } catch {
    return normalizedBaseUrl;
  }
};

const PRODUCTION_API_BASE_URL = "https://rico-birthday-cafe-api.onrender.com/api";

const isPrivateIpv4Host = (hostname: string) => {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) {
    return false;
  }

  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) {
    return false;
  }

  const [a, b] = octets;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
};

const getDefaultBaseUrl = () => {
  if (typeof window === "undefined") {
    return "/api";
  }

  const { hostname } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const isLanDevHost = isPrivateIpv4Host(hostname);

  if (isLocalhost || isLanDevHost) {
    return "/api";
  }

  return PRODUCTION_API_BASE_URL;
};

export const BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || getDefaultBaseUrl();

const FETCH_TIMEOUT_MS = 10_000;

type FetchOptions = RequestInit;

export const fetchWithAuth = async (
  endpoint: string,
  options: FetchOptions = {},
) => {
  const { token, isGuest } = useAuthStore.getState();

  // Block guests and unauthenticated users — no server calls needed
  if (isGuest || !token) {
    return new Response(
      JSON.stringify({
        code: 403,
        message: "UNAUTHENTICATED: this request requires an authenticated uid",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  // Default to JSON if not specified and body exists
  if (
    !headers.has("Content-Type") &&
    options.body &&
    typeof options.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = { ...options, headers };

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });

    // Auto-logout on 401 (expired / invalid token) — no redirect so user stays in place
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }

    return response;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return new Response(
        JSON.stringify({ code: 408, message: "REQUEST_TIMEOUT" }),
        { status: 408, headers: { "Content-Type": "application/json" } },
      );
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
};
