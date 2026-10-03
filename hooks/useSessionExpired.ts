"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast/useToast";
import { buildLoginHref } from "@/lib/auth/auth-redirect";

// Dead-session landing spot for mutation onError handlers: apiRequest
// already burned its one refresh retry by the time a 401 reaches the
// caller, so the only honest move left is a re-login. Returns true when
// the error was an expired session so callers can bail early; `next` is
// the safe path the login page returns to (validated by buildLoginHref).
export function useSessionExpired() {
  const router = useRouter();
  const toast = useToast();
  return (error: unknown, next?: string | null): boolean => {
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status: unknown }).status
        : undefined;
    if (status !== 401) return false;
    toast.error("Phiên đăng nhập đã hết", "Vui lòng đăng nhập lại.");
    router.push(buildLoginHref(next));
    return true;
  };
}
