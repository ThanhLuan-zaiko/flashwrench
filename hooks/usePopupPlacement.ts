"use client";

import { type RefObject, useLayoutEffect, useState } from "react";
import {
  type PopupAlign,
  type PopupPlacement,
  type PopupWidth,
  placePopup,
} from "@/components/ui/popup-position";

// Keeps an open popup attached to its trigger through page and dialog
// scrolling, window resizes and changes in the popup's own height.
export function usePopupPlacement(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  panelWidth: PopupWidth,
  align: PopupAlign,
): PopupPlacement | null {
  const [placement, setPlacement] = useState<PopupPlacement | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }
    function update() {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const viewport = {
        width: document.documentElement.clientWidth,
        height: window.innerHeight,
      };
      setPlacement(
        placePopup(
          trigger,
          panel.scrollHeight,
          viewport,
          panelWidth(trigger.width, viewport.width),
          align,
        ),
      );
    }
    update();
    const observer = new ResizeObserver(update);
    if (panelRef.current) observer.observe(panelRef.current);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, triggerRef, panelRef, panelWidth, align]);

  return placement;
}
