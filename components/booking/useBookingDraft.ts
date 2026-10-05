"use client";

import { useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/toast/useToast";
import type { BookingDraft } from "./booking-draft";
import {
  clearBookingDraft,
  hasBookingDraftContent,
  persistBookingDraft,
  readBookingDraft,
} from "./booking-draft";

// Mirrors the booking form's draftable fields to sessionStorage: a
// mount-time restore explains itself with a toast, and every later
// change rewrites (or clears) the draft. Same contract as the rescue
// form's draft handling.
export function useBookingDraft({
  values,
  onRestore,
}: {
  values: BookingDraft;
  onRestore: (draft: BookingDraft) => void;
}): { clearDraft: () => void } {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // One-shot restore after mount: reading sessionStorage in the first
  // render would flash a hydration mismatch, so the form paints with
  // its defaults and the draft fills in here.
  useEffect(() => {
    const draft = readBookingDraft(window.sessionStorage);
    if (!draft || !hasBookingDraftContent(draft)) return;
    onRestoreRef.current(draft);
    toastRef.current.info(
      "Đã khôi phục thông tin đã nhập",
      "Bạn có thể tiếp tục đặt lịch từ chỗ đã dừng.",
    );
  }, []);

  // Draft mirrors live state; every change rewrites it and an emptied
  // form frees the key. The first run is skipped so the mount commit
  // (pre-restore state) never clears a draft it has not applied yet.
  const skipFirstPersist = useRef(true);
  useEffect(() => {
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    persistBookingDraft(window.sessionStorage, values);
  }, [values]);

  const clearDraft = useCallback(() => {
    clearBookingDraft(window.sessionStorage);
  }, []);

  return { clearDraft };
}
