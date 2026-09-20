import type { ReactNode } from "react";
import { OrdersRouteShell } from "../components/orders/OrdersRouteShell";

// Shared shell for /dispatch/orders and /dispatch/orders/[status].
// Next.js keeps the layout mounted while only the status segment changes,
// so switching tabs reuses the screen state (month filter, dialogs) and
// renders instantly without replaying the GSAP enter animation.
export default function DispatchOrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <OrdersRouteShell />
      {children}
    </>
  );
}
