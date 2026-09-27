import type { ReactNode } from "react";
import { RescueRouteShell } from "../components/rescue/RescueRouteShell";

// Shared shell for /dispatch/rescue and /dispatch/rescue/[status].
// The layout stays mounted while only the status segment changes, so
// switching tabs reuses cached data and never replays enter effects.
export default function DispatchRescueLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <RescueRouteShell />
      {children}
    </>
  );
}
