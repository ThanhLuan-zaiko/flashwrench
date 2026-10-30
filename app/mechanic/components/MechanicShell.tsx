"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StaffShell } from "@/components/staff/StaffShell";
import { StaffStatusPill } from "@/components/staff/StaffStatus";
import { useToast } from "@/components/toast/useToast";
import { useLogout, useMe } from "@/hooks/auth";
import { useMechanicBookings, useMechanicInbox } from "@/hooks/mechanic";
import { useRescueInbox } from "@/hooks/rescue-inbox";
import { MechanicPresenceCard } from "./MechanicPresenceCard";
import {
  getMechanicSection,
  MECHANIC_SECTIONS,
  type MechanicSectionId,
} from "./mechanic-sections";
import { MECHANIC_TOUR_NAMES } from "./tour/mechanic-tour.steps";

const COPY = { areaName: "Khu vực thợ xe", scope: "thợ xe" };

function sectionIdForPath(pathname: string): MechanicSectionId {
  if (pathname.startsWith("/mechanic/schedule")) return "schedule";
  if (pathname.startsWith("/mechanic/map")) return "map";
  if (pathname.startsWith("/mechanic/income")) return "income";
  return "stats";
}

// Portal wiring only: the shared staff frame plus the personal inbox
// subscriptions that toast new jobs and drive the queue badge.
export function MechanicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sectionId = sectionIdForPath(pathname);
  const section = getMechanicSection(sectionId);
  const me = useMe();
  const logout = useLogout();
  const toast = useToast();
  const queue = useMechanicBookings();
  const displayName = me.data?.fullName ?? null;
  // New customer bookings arrive on the personal inbox the instant POST
  // /api/bookings succeeds: the queue query above invalidates through the
  // shared socket, so the badge and every list refresh with no reload.
  useMechanicInbox(me.data?.id ?? null, (event) => {
    if (event.kind === "booking-assigned") {
      toast.success(
        "Có đơn mới",
        "Bạn vừa được giao một đơn. Mở hàng đợi để xem chi tiết.",
      );
    }
  });
  // Rescue offers arrive on the same inbox topic with 30s to answer.
  useRescueInbox(me.data?.id ?? null, () => {
    toast.success(
      "Có cứu hộ khẩn cấp",
      "Bạn vừa được giao một ca cứu hộ. Trả lời trong 30 giây.",
    );
  });
  const pendingCount =
    queue.data?.bookings.filter((booking) => booking.status === "pending")
      .length ?? 0;

  return (
    <StaffShell
      copy={COPY}
      sections={MECHANIC_SECTIONS}
      section={section}
      tour={MECHANIC_TOUR_NAMES[sectionId]}
      displayName={displayName}
      onLogout={() => logout.mutate()}
      badges={{ schedule: pendingCount }}
      status={
        pendingCount > 0 ? (
          <StaffStatusPill live label={`${pendingCount} đơn chờ nhận`} />
        ) : undefined
      }
      panel={<MechanicPresenceCard displayName={displayName} />}
    >
      {children}
    </StaffShell>
  );
}
