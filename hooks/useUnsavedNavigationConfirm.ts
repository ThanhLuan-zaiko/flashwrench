"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { shouldGuardNavigation } from "./useUnsavedChangesGuard";

// Page-level leave confirm: intercepts in-app Link clicks while `dirty`
// and asks with the branded confirm before navigating. True unloads
// (F5, tab close) and the back button are deliberately untouched — the
// caller persists a draft, so those exits lose nothing and stay fast.
// Dialogs that must cover every close path use useUnsavedChangesGuard.
export function useUnsavedNavigationConfirm(
  dirty: boolean,
  onDiscard?: () => void,
): {
  confirmOpen: boolean;
  stay: () => void;
  leave: () => void;
} {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const confirmRef = useRef(false);
  confirmRef.current = confirmOpen;
  const pendingHref = useRef<string | null>(null);
  const discardRef = useRef(onDiscard);
  discardRef.current = onDiscard;

  // In-app Link navigation never unloads, so intercept it in capture
  // phase before Next.js handles it. Modifier and new-tab clicks pass
  // through to the browser; the draft covers anything we miss.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!dirtyRef.current || confirmRef.current) return;
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const guarded = shouldGuardNavigation({
        href: anchor.getAttribute("href"),
        target: anchor.target,
        download: anchor.hasAttribute("download"),
        button: event.button,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        currentPath: window.location.pathname + window.location.search,
      });
      if (!guarded) return;
      event.preventDefault();
      event.stopPropagation();
      pendingHref.current = anchor.href;
      setConfirmOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const stay = useCallback(() => {
    pendingHref.current = null;
    setConfirmOpen(false);
  }, []);

  const leave = useCallback(() => {
    const href = pendingHref.current;
    pendingHref.current = null;
    setConfirmOpen(false);
    discardRef.current?.();
    toast.info(
      "Đã xóa thông tin đã nhập",
      "Bạn có thể quay lại và gửi yêu cầu mới bất cứ lúc nào.",
    );
    if (href) router.push(href);
  }, [router, toast]);

  return { confirmOpen, stay, leave };
}
