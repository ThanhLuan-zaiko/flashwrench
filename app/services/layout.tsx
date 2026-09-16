import type { ReactNode } from "react";
import { ServicesRouteShell } from "@/components/services/ServicesRouteShell";

// Shared shell for /services and /services/[slug]. Next.js keeps the layout
// mounted while only the slug segment changes, so switching tabs reuses the
// screen state (search text, cached prices) and renders instantly without
// replaying the GSAP enter animation. Pages stay metadata-only.
export default function ServicesLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <ServicesRouteShell />
        {children}
      </div>
    </main>
  );
}
