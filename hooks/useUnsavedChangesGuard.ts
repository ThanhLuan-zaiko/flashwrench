"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/toast/useToast";
import { useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

export type GuardedClick = {
  href: string | null;
  target?: string | null;
  download?: boolean;
  button?: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  currentPath: string;
};

function pathOf(href: string): string {
  return href.split("#")[0]?.split("?")[0] ?? "";
}

// Decides whether an anchor click would drop a dirty dialog. Pure so
// bun:test covers it without DOM. New tabs, downloads, hashes, external
// targets and same-path clicks are safe: externals unload (the native
// prompt covers them) and same-path Links keep the dialog mounted.
export function shouldGuardNavigation(click: GuardedClick): boolean {
  const href = (click.href ?? "").trim();
  if (!href) return false;
  if ((click.button ?? 0) !== 0) return false;
  if (click.ctrlKey || click.metaKey || click.shiftKey || click.altKey) {
    return false;
  }
  if (click.target && click.target.toLowerCase() !== "_self") return false;
  if (click.download) return false;
  if (/^(https?:|mailto:|tel:|javascript:|data:|blob:)/i.test(href)) {
    return false;
  }
  if (href.startsWith("#")) return false;
  if (!href.startsWith("/")) return true;
  return pathOf(href) !== pathOf(click.currentPath);
}

// Full unsaved-changes guard for one dialog: native prompt for true
// unloads (F5, tab close), branded confirm plus toast for in-app leaves
// (dialog chrome, Link tab/page switches, back button). Wire requestClose
// into every in-app close path and render the confirm state it returns.
export function useUnsavedChangesGuard(
  dirty: boolean,
  onClose: () => void,
): {
  confirmOpen: boolean;
  requestClose: () => void;
  stay: () => void;
  discard: () => void;
} {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const confirmRef = useRef(false);
  confirmRef.current = confirmOpen;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const pendingHref = useRef<string | null>(null);
  const leavingRef = useRef(false);
  const guardArmed = useRef(false);

  // True unloads keep the native prompt; it never fires while our own
  // confirm is already asking.
  useUnsavedChangesWarning(dirty && !confirmOpen);

  // Back button: a same-URL guard entry turns it into a confirm instead
  // of a silent drop. Clean backs consume the entry and pass through.
  useEffect(() => {
    window.history.pushState({ unsavedGuard: true }, "");
    guardArmed.current = true;
    const onPopState = () => {
      guardArmed.current = false;
      if (!dirtyRef.current || confirmRef.current) return;
      window.history.pushState({ unsavedGuard: true }, "");
      guardArmed.current = true;
      pendingHref.current = null;
      setConfirmOpen(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      // Closed in place (save, discard, clean X): drop our entry so the
      // next back press behaves normally. Skipped when we are the ones
      // navigating away through a confirmed Link.
      if (guardArmed.current && !leavingRef.current) {
        guardArmed.current = false;
        window.history.back();
      }
    };
  }, []);

  // In-app Link navigation never unloads, so intercept it in capture
  // phase before Next.js handles it. Modifier and new-tab clicks pass
  // through to the browser (native prompt covers real unloads).
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

  const requestClose = useCallback(() => {
    if (dirtyRef.current) {
      pendingHref.current = null;
      setConfirmOpen(true);
      return;
    }
    closeRef.current();
  }, []);

  const stay = useCallback(() => {
    pendingHref.current = null;
    setConfirmOpen(false);
  }, []);

  const discard = useCallback(() => {
    const href = pendingHref.current;
    pendingHref.current = null;
    setConfirmOpen(false);
    toast.info("Đã bỏ thay đổi chưa lưu", "Dữ liệu nhập dở đã bị hủy.");
    if (href) {
      leavingRef.current = true;
      closeRef.current();
      router.push(href);
      return;
    }
    closeRef.current();
  }, [router, toast]);

  return { confirmOpen, requestClose, stay, discard };
}
