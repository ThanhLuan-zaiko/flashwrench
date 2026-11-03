"use client";

import { type RefCallback, useCallback, useRef } from "react";
import { tabWrapTarget } from "@/lib/a11y/tab-wrap";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

// Open modal dialogs, innermost last. Only the top one reacts to Escape and
// Tab, so a confirm sheet stacked on a form dialog gets the keys first.
const openModals: HTMLElement[] = [];

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.getAttribute("aria-hidden") !== "true");
}

function trapTab(event: KeyboardEvent, container: HTMLElement): void {
  const items = focusableWithin(container);
  if (items.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }
  const active = document.activeElement;
  const index = active instanceof HTMLElement ? items.indexOf(active) : -1;
  const target = tabWrapTarget(items.length, index, event.shiftKey);
  if (target === null) return;
  event.preventDefault();
  items[target].focus();
}

type DialogFocusOptions = {
  // Modal dialogs move focus in, trap Tab and own Escape. Non-modal panels
  // only answer Escape while focus is already inside them.
  modal?: boolean;
};

// Accessibility contract for role="dialog" surfaces: focus moves into the
// dialog on mount, Tab stays inside it, Escape calls onClose, and focus
// returns to the element that opened it. Returns a callback ref, so it also
// works for dialogs that mount only when open. Pass the same close path the
// backdrop and close button use, so guarded dialogs keep their confirm step.
export function useDialogFocus<T extends HTMLElement>(
  onClose?: () => void,
  { modal = true }: DialogFocusOptions = {},
): RefCallback<T> {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  return useCallback(
    (node: T | null) => {
      if (!node) return;
      const container: HTMLElement = node;

      const opener =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      if (modal) openModals.push(container);
      if (!container.contains(document.activeElement)) {
        container.focus({ preventScroll: true });
      }

      const isTop = () =>
        !modal || openModals[openModals.length - 1] === container;

      function handleKeyDown(event: KeyboardEvent) {
        if (!isTop()) return;
        if (event.key === "Escape") {
          // An expanded control inside the dialog (a dropdown, say) closes first.
          if (container.querySelector('[aria-expanded="true"]')) return;
          if (!modal && !container.contains(document.activeElement)) return;
          if (closeRef.current) {
            event.preventDefault();
            closeRef.current();
          }
          return;
        }
        if (event.key === "Tab" && modal) trapTab(event, container);
      }

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        if (modal) {
          const index = openModals.indexOf(container);
          if (index >= 0) openModals.splice(index, 1);
        }
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      };
    },
    [modal],
  );
}
