import type { ReactNode } from "react";
import { Suspense } from "react";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { VouchersRouteShell } from "@/components/vouchers/VouchersRouteShell";

// Shared shell for /vouchers, /vouchers/page/N, /vouchers/w/[walletId]
// and /vouchers/c/[slug]. Next.js keeps the layout mounted while only
// the segment changes, so pager links reuse the wallet query cache and
// list/detail switches never replay the enter animation. Pages stay
// metadata-only.
export default function VouchersLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <Suspense fallback={null}>
        <VouchersRouteShell />
      </Suspense>
      {children}
      <SpeculationRules scope="vouchers" />
    </main>
  );
}
