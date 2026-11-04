import type { ReactNode } from "react";
import { ScrollTopOnEnter } from "@/components/layout/ScrollTopOnEnter";
import { IncomeRouteShell } from "../components/income/IncomeRouteShell";

export default function MechanicIncomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <IncomeRouteShell />
      <ScrollTopOnEnter />
      {children}
    </>
  );
}
