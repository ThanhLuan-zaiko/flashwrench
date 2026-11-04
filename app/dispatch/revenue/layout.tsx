import type { ReactNode } from "react";
import { ScrollTopOnEnter } from "@/components/layout/ScrollTopOnEnter";
import { DispatchRevenueShell } from "../components/revenue/DispatchRevenueShell";

// Shared shell for /dispatch/revenue/[range]. Next.js keeps the layout
// mounted while only the range segment changes, so switching day/week/
// month/year reuses the screen and never replays the enter animation.
export default function DispatchRevenueLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <DispatchRevenueShell />
      <ScrollTopOnEnter />
      {children}
    </>
  );
}
