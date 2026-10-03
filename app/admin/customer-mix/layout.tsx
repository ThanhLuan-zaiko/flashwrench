import type { ReactNode } from "react";
import { AdminCustomerMixShell } from "../components/customer-mix/AdminCustomerMixShell";

// Shared shell for /admin/customer-mix/[range]: the layout stays mounted
// while the range segment changes, so range switches reuse cached state.
export default function AdminCustomerMixLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AdminCustomerMixShell />
      {children}
    </>
  );
}
