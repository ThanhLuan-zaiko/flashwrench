import type { ReactNode } from "react";
import { DispatchRouteShell } from "../components/DispatchRouteShell";

// Shared shell for /dispatch/bookings and /dispatch/bookings/[status].
// Next.js keeps the layout mounted while only the status segment changes,
// so switching tabs reuses the screen state (month filter, dialogs) and
// renders instantly without replaying the GSAP enter animation. Pages
// stay metadata-only.
export default function DispatchBookingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <DispatchRouteShell />
      {children}
    </>
  );
}
