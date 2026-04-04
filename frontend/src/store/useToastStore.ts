import { create } from "zustand";
import type { AppIconName } from "../components/common/AppIcon";
import { playDiriringSfx } from "../utils/soundEffects";

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

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    void playDiriringSfx();
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000); // Auto remove after 5 seconds
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
