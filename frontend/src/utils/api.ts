import { useAuthStore } from "../store/useAuthStore";

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

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
