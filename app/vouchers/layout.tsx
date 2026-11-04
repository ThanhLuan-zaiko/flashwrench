import type { ReactNode } from "react";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";

// Frame shared by the wallet list and the detail screens. The list lives in the
// (list) route group; each detail is a real page, so Next.js opens it at the
// top and restores the list position on Back.
export default function VouchersLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col overflow-x-clip bg-white dark:bg-zinc-950">
      {children}
      <SpeculationRules scope="vouchers" />
    </main>
  );
}
