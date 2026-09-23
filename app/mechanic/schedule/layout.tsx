import type { ReactNode } from "react";
import { ScheduleRouteShell } from "../components/schedule/ScheduleRouteShell";

export default function MechanicScheduleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <ScheduleRouteShell />
      {children}
    </>
  );
}
