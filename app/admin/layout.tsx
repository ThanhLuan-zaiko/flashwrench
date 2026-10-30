import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { FiShield } from "react-icons/fi";
import { SpeculationRules } from "@/components/speculation/SpeculationRules";
import { StaffAccessDenied } from "@/components/staff/StaffAccessDenied";
import { TourProvider } from "@/components/tour/TourProvider";
import { authenticateRequest } from "@/lib/auth/authorization";
import { AdminShell } from "./components/AdminShell";
import { ADMIN_TOUR_STEPS } from "./components/tour/admin-tour.steps";

// Server-side gate: only users with role "admin" can render anything
// under /admin. Non-logged-in users go to login, other roles get a 403
// panel instead of the admin shell.
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await authenticateRequest();
  if (!user) redirect("/login");

  if (user.role !== "admin") {
    return (
      <StaffAccessDenied
        icon={FiShield}
        title="Khu vực dành cho quản trị viên"
      />
    );
  }

  return (
    <>
      <TourProvider steps={ADMIN_TOUR_STEPS}>
        <AdminShell>{children}</AdminShell>
      </TourProvider>
      <SpeculationRules scope="admin" />
    </>
  );
}
