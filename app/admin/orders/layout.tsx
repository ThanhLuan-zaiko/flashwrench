import type { ReactNode } from "react";
import { AdminOrdersShell } from "../components/orders/AdminOrdersShell";

// Shared shell for /admin/orders/[status]: the layout stays mounted while
// the status segment changes, so tab switches reuse cached query data.
export default function AdminOrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AdminOrdersShell />
      {children}
    </>
  );
}
