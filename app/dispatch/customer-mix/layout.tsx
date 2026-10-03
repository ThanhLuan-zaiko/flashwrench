import type { ReactNode } from "react";
import { DispatchCustomerMixShell } from "../components/customer-mix/DispatchCustomerMixShell";

// Shared shell for /dispatch/customer-mix/[range]. Next.js keeps the layout
// mounted while only the range segment changes, so switching day/week/
// month reuses the screen and never replays the enter animation.
export default function DispatchCustomerMixLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <DispatchCustomerMixShell />
      {children}
    </>
  );
}
