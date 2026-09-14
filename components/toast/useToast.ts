"use client";

import { useContext } from "react";
import { ToastContext } from "./ToastProvider";
import type { ToastContextValue } from "./toast.types";

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
