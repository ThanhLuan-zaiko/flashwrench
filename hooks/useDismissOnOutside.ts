"use client";

import { type RefObject, useEffect, useRef } from "react";

// Closes a popover on a pointer press outside `containerRef` or on Escape.
// Listeners exist only while the popover is open.
export function useDismissOnOutside(
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
): void {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        dismissRef.current();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismissRef.current();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, open]);
}
