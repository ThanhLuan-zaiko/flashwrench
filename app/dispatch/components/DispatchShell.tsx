"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StaffShell } from "@/components/staff/StaffShell";
import {
  StaffStatusNote,
  StaffStatusPill,
} from "@/components/staff/StaffStatus";
import { useToast } from "@/components/toast/useToast";
import { useMe } from "@/hooks/auth";
import { useDispatchOperations } from "@/hooks/dispatch";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import {
  DISPATCH_NAV_GROUPS,
  DISPATCH_SECTIONS,
  type DispatchSectionId,
  getDispatchSection,
} from "./dispatch-sections";
import { DISPATCH_TOUR_NAMES } from "./tour/dispatch-tour.steps";

const COPY = { areaName: "Khu vực điều phối", scope: "điều phối" };

function sectionIdForPath(pathname: string): DispatchSectionId {
  if (pathname.startsWith("/dispatch/rescue")) return "rescue";
  if (pathname.startsWith("/dispatch/orders")) return "orders";
  if (pathname.startsWith("/dispatch/vouchers")) return "vouchers";
  if (pathname.startsWith("/dispatch/stock")) return "stock";
  if (pathname.startsWith("/dispatch/revenue")) return "revenue";
  if (pathname.startsWith("/dispatch/customer-mix")) return "customer-mix";
  return "board";
}

// Portal wiring only: the shared staff frame plus the operations topic
// subscription, so the whole workspace refreshes and toasts on new
// bookings, not just one list.
export function DispatchShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sectionId = sectionIdForPath(pathname);
  const section = getDispatchSection(sectionId);
  const me = useMe();
  const toast = useToast();
  const realtime = useRealtimeStatus();
  const displayName = me.data?.fullName ?? null;

  // Every booking mutation (create, assign, status flips, payments) lands
  // on the operations topic; the hook invalidates all dispatch queries.
  useDispatchOperations((event) => {
    if (event.kind === "booking-created") {
      toast.success(
        "Có đơn mới",
        "Một khách hàng vừa đặt lịch. Mở tab Chờ xử lý để điều phối.",
      );
    }
    if (event.kind === "rescue-created") {
      toast.success(
        "Có cứu hộ mới",
        "Hệ thống đang tự giao thợ gần nhất. Mở tab Cứu hộ để theo dõi.",
      );
    }
  });

  return (
    <StaffShell
      copy={COPY}
      groups={DISPATCH_NAV_GROUPS}
      sections={DISPATCH_SECTIONS}
      section={section}
      tour={DISPATCH_TOUR_NAMES[sectionId]}
      displayName={displayName}
      status={
        <StaffStatusPill
          live={realtime === "live"}
          label={realtime === "live" ? "Trực tiếp" : "Mất kết nối realtime"}
        />
      }
      panel={
        <StaffStatusNote
          title="Trực tuyến điều phối"
          detail={
            displayName
              ? `${displayName} đang trực. Đơn mới hiện ngay trên bàn.`
              : "Đơn mới sẽ hiện ngay trên bàn điều phối."
          }
        />
      }
    >
      {children}
    </StaffShell>
  );
}
