"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ToastViewport } from "./ToastViewport";
import type { ToastContextValue, ToastInput, ToastItem } from "./toast.types";

export const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 3500;
const MAX_TOASTS = 3;

function createToastId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((input: ToastInput) => {
    const item: ToastItem = {
      id: createToastId(),
      title: input.title,
      description: input.description,
      variant: input.variant ?? "info",
      durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
    };
    setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), item]);
    return item.id;
  }, []);

  const success = useCallback(
    (title: string, description?: string) =>
      push({ title, description, variant: "success" }),
    [push],
  );

  const error = useCallback(
    (title: string, description?: string) =>
      push({ title, description, variant: "error" }),
    [push],
  );

  const info = useCallback(
    (title: string, description?: string) =>
      push({ title, description, variant: "info" }),
    [push],
  );

  const value = useMemo(
    () => ({ toasts, push, dismiss, success, error, info }),
    [toasts, push, dismiss, success, error, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
