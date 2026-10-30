import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { FiCompass } from "react-icons/fi";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { StaffAccessDenied } from "@/components/staff/StaffAccessDenied";
import { TourProvider } from "@/components/tour/TourProvider";
import { authenticateRequest } from "@/lib/auth/authorization";
import { DispatchShell } from "./components/DispatchShell";
import { DISPATCH_TOUR_STEPS } from "./components/tour/dispatch-tour.steps";

// Server-side gate: only users with role "dispatcher" (or "admin", who can
// preview every workspace) render anything under /dispatch. Non-logged-in
// users go to login, other roles get a 403 panel instead of the shell.
export default async function DispatchLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await authenticateRequest();
  if (!user) redirect("/login");

  if (user.role !== "dispatcher" && user.role !== "admin") {
    return (
      <StaffAccessDenied
        icon={FiCompass}
        title="Khu vực dành cho nhân viên điều phối"
      />
    );
  }

  return (
    <>
      <TourProvider steps={DISPATCH_TOUR_STEPS}>
        <DispatchShell>{children}</DispatchShell>
      </TourProvider>
      <SpeculationRules scope="dispatch" />
    </>
  );
}
