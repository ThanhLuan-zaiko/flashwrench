import type { ReactNode } from "react";
import { ScrollTopOnEnter } from "@/components/layout/ScrollTopOnEnter";
import { ScheduleRouteShell } from "../components/schedule/ScheduleRouteShell";

export default function MechanicScheduleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <ScheduleRouteShell />
      <ScrollTopOnEnter />
      {children}
    </>
  );
}
