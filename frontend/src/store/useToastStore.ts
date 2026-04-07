import { create } from "zustand";
import type { AppIconName } from "../components/common/appIconRegistry";
import {
  isPageTransitionLoading,
  PAGE_TRANSITION_LOADING_EVENT,
} from "../utils/pageTransitionLoading";

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  icon?: AppIconName;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const TOAST_DURATION_MS = 5000;

const pendingToasts: Array<Omit<ToastMessage, "id">> = [];
let flushListenerAttached = false;

const removeToastById = (id: string) =>
  useToastStore.setState((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id),
  }));

const pushToast = (toast: Omit<ToastMessage, "id">) => {
  const id = Math.random().toString(36).substr(2, 9);
  useToastStore.setState((state) => ({
    toasts: [...state.toasts, { ...toast, id }],
  }));

  window.setTimeout(() => {
    removeToastById(id);
  }, TOAST_DURATION_MS);
};

const flushPendingToasts = () => {
  while (pendingToasts.length > 0) {
    const nextToast = pendingToasts.shift();
    if (!nextToast) {
      break;
    }
    pushToast(nextToast);
  }
};

const ensureFlushListener = () => {
  if (flushListenerAttached || typeof window === "undefined") {
    return;
  }

  const handleLoadingChange = (
    event: Event | CustomEvent<{ loading?: boolean }>,
  ) => {
    const loading =
      "detail" in event && event.detail
        ? event.detail.loading === true
        : isPageTransitionLoading();

    if (loading) {
      return;
    }

    flushPendingToasts();
  };

  window.addEventListener(PAGE_TRANSITION_LOADING_EVENT, handleLoadingChange);
  flushListenerAttached = true;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    if (typeof window !== "undefined" && isPageTransitionLoading()) {
      pendingToasts.push(toast);
      ensureFlushListener();
      return;
    }

    pushToast(toast);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
