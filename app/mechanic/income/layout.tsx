import type { ReactNode } from "react";
import { IncomeRouteShell } from "../components/income/IncomeRouteShell";

export default function MechanicIncomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <IncomeRouteShell />
      {children}
    </>
  );
}
