import type { ReactNode } from "react";
import { SCROLLBAR_CLASSES } from "./scrollbar";

type DialogPanelProps = {
  children: ReactNode;
  wide?: boolean;
};

// Shared modal panel: uniform radius, border, surface, padding and the
// shared thin scrollbar. Floating overlays may keep their shadow. Wide
// suits galleries and roomy forms; default stays compact elsewhere.
export function DialogPanel({ children, wide = false }: DialogPanelProps) {
  return (
    <div
      className={`relative max-h-[80dvh] w-full ${wide ? "max-w-2xl" : "max-w-lg"} overflow-y-auto scroll-pb-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 ${SCROLLBAR_CLASSES}`}
    >
      {children}
    </div>
  );
}
