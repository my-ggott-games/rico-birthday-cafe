import { useAuthStore } from "../store/useAuthStore";

const normalizeBaseUrl = (baseUrl?: string) => {
  const trimmedBaseUrl = baseUrl?.trim();

  if (!trimmedBaseUrl) {
    return null;
  }

  return trimmedBaseUrl.endsWith("/")
    ? trimmedBaseUrl.slice(0, -1)
    : trimmedBaseUrl;
};

const PRODUCTION_API_BASE_URL = "https://rico-birthday-cafe-api.onrender.com/api";

const getDefaultBaseUrl = () => {
  if (typeof window === "undefined") {
    return "/api";
  }

  const { hostname } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalhost) {
    return "/api";
  }

  return PRODUCTION_API_BASE_URL;
};

export const BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || getDefaultBaseUrl();

type FetchOptions = RequestInit;

export const fetchWithAuth = async (
  endpoint: string,
  options: FetchOptions = {},
) => {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Default to JSON if not specified and body exists
  if (
    !headers.has("Content-Type") &&
    options.body &&
    typeof options.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Auto logout on 401 Unauthorized
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = "/"; // redirect to login/landing
  }

  return response;
};
