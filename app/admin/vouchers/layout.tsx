import type { ReactNode } from "react";
import { VouchersRouteShell } from "../components/vouchers/VouchersRouteShell";

// Shared shell for /admin/vouchers/[tab]. Next.js keeps the layout mounted
// while only the tab segment changes, so switching tabs reuses the screen
// state (dialogs, list cache) without replaying the enter animation.
// Pages stay metadata-only.
export default function AdminVouchersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <VouchersRouteShell />
      {children}
    </>
  );
}
