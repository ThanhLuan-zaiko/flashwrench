import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { FiTool } from "react-icons/fi";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { StaffAccessDenied } from "@/components/staff/StaffAccessDenied";
import { TourProvider } from "@/components/tour/TourProvider";
import { authenticateRequest } from "@/lib/auth/authorization";
import { MechanicShell } from "./components/MechanicShell";
import { MECHANIC_TOUR_STEPS } from "./components/tour/mechanic-tour.steps";

// Server-side gate: only users with role "mechanic" can render anything
// under /mechanic. Non-logged-in users go to login, other roles get a 403
// panel instead of the mechanic shell.
export default async function MechanicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await authenticateRequest();
  if (!user) redirect("/login");

  if (user.role !== "mechanic") {
    return (
      <StaffAccessDenied icon={FiTool} title="Khu vực dành cho thợ sửa xe" />
    );
  }

  return (
    <>
      <TourProvider steps={MECHANIC_TOUR_STEPS}>
        <MechanicShell>{children}</MechanicShell>
      </TourProvider>
      <SpeculationRules scope="mechanic" />
    </>
  );
}
