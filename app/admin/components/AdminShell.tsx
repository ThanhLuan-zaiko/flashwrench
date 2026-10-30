"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StaffShell } from "@/components/staff/StaffShell";
import {
  StaffStatusNote,
  StaffStatusPill,
} from "@/components/staff/StaffStatus";
import { useMe } from "@/hooks/auth";
import {
  ADMIN_SECTIONS,
  getAdminSection,
  sectionIdForPath,
} from "./admin-sections";
import { ADMIN_TOUR_NAMES } from "./tour/admin-tour.steps";

const COPY = { areaName: "Trang quản trị", scope: "quản trị" };

// Portal wiring only: the shared staff frame with admin copy. No
// business logic here.
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sectionId = sectionIdForPath(pathname);
  const me = useMe();

  return (
    <StaffShell
      copy={COPY}
      sections={ADMIN_SECTIONS}
      section={getAdminSection(sectionId)}
      tour={ADMIN_TOUR_NAMES[sectionId]}
      displayName={me.data?.fullName ?? null}
      maxWidthClass="max-w-6xl"
      status={<StaffStatusPill live label="Trực tuyến" />}
      panel={
        <StaffStatusNote
          title="Hệ thống ổn định"
          detail="3 nhóm dịch vụ đang hoạt động bình thường."
        />
      }
    >
      {children}
    </StaffShell>
  );
}
