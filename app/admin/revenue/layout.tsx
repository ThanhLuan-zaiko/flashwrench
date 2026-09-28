import type { ReactNode } from "react";
import { AdminRevenueShell } from "../components/revenue/AdminRevenueShell";

// Shared shell for /admin/revenue/[range]: the layout stays mounted while
// the range segment changes, so range switches reuse cached state.
export default function AdminRevenueLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AdminRevenueShell />
      {children}
    </>
  );
}
