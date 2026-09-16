import type { ReactNode } from "react";
import { SCROLLBAR_CLASSES } from "./scrollbar";

type DialogPanelProps = {
  children: ReactNode;
};

// Shared modal panel: uniform radius, border, surface, padding and the
// shared thin scrollbar. Floating overlays may keep their shadow.
export function DialogPanel({ children }: DialogPanelProps) {
  return (
    <div
      className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 ${SCROLLBAR_CLASSES}`}
    >
      {children}
    </div>
  );
}
