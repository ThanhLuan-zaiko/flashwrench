import type { ReactNode } from "react";
import { Suspense } from "react";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { VouchersRouteShell } from "@/components/vouchers/VouchersRouteShell";

// Shared shell for /vouchers, /vouchers/page/N, /vouchers/w/[walletId]
// and /vouchers/c/[slug]. Next.js keeps the layout mounted while only
// the segment changes, so pager links reuse the wallet query cache and
// list/detail switches never replay the enter animation. Pages stay
// metadata-only. The list is full width like the products shop; the detail
// screens centre their own column inside the route shell.
export default function VouchersLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col overflow-x-clip bg-white dark:bg-zinc-950">
      <Suspense fallback={null}>
        <VouchersRouteShell />
      </Suspense>
      {children}
      <SpeculationRules scope="vouchers" />
    </main>
  );
}
