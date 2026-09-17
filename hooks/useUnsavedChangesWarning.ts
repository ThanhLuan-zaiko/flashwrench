"use client";

import { useEffect } from "react";

// Native unsaved-changes guard for long admin forms. One beforeunload
// listener covers refresh (F5), tab close and window close alike — the
// browser owns the prompt text and the user stays in control. Mounts only
// while dirty so saved or pristine forms navigate away silently.
export function useUnsavedChangesWarning(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}
