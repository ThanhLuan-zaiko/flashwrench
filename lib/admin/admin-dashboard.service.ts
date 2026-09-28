// Admin dashboard aggregation: today's bookings, live rescues, online
// mechanics, this month's revenue and the payment audit feed — one call so
// the dashboard renders all cards from a single round-trip.
import type { PublicUser } from "@/lib/auth/user.types";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { listStatusBookingRefs } from "@/lib/dispatch/dispatch.repository";
import { listAvailableMechanicRows } from "@/lib/mechanic/mechanic-directory.repository";
import {
  dayKey,
  MECHANIC_TIME_ZONE,
  monthKey,
} from "@/lib/mechanic/mechanic-period";
import { MECHANIC_BOOKING_STATUSES } from "@/lib/mechanic/mechanic-status";
import {
  getAdminRevenue,
  getPaymentAudit,
} from "@/lib/revenue/revenue.service";
import type { PaymentAuditEvent } from "@/lib/revenue/revenue.types";
import { countRescueRefsByStatus } from "./admin-dashboard.repository";

// Rescue statuses still needing work — "đang mở" on the dashboard means
// everything that has not reached a terminal state yet.
const LIVE_RESCUE_STATUSES = [
  "open",
  "dispatched",
  "accepted",
  "en_route",
  "arrived",
] as const;
const PENDING_RESCUE_STATUSES = ["open", "dispatched"] as const;

const STATUS_PAGE_LIMIT = 500;
const MECHANIC_SCAN_LIMIT = 1000;
const TODAY_EVENTS_SHOWN = 8;

export type AdminDashboard = {
  todayBookings: number;
  openRescues: number;
  pendingRescues: number;
  onlineMechanics: number;
  monthRevenue: number;
  monthReceipts: number;
  todayReceipts: number;
  failedConfirmations: number;
  events: PaymentAuditEvent[];
};

export async function getAdminDashboard(
  actor: PublicUser,
  now = new Date(),
): Promise<WorkspaceResult<AdminDashboard>> {
  if (actor.role !== "admin") {
    return {
      ok: false,
      status: 403,
      errors: { form: "Bạn không có quyền xem dashboard quản trị." },
    };
  }
  const today = dayKey(now, MECHANIC_TIME_ZONE);
  const month = monthKey(now, MECHANIC_TIME_ZONE);

  // Bookings scheduled today live across every status partition of the
  // current month bucket — count refs whose scheduled_at lands on today.
  const refPages = await Promise.all(
    MECHANIC_BOOKING_STATUSES.map((status) =>
      listStatusBookingRefs(status, month, STATUS_PAGE_LIMIT),
    ),
  );
  const todayBookings = refPages.reduce(
    (total, page) =>
      total +
      page.rows.filter(
        (row) =>
          row.scheduled_at instanceof Date &&
          dayKey(row.scheduled_at, MECHANIC_TIME_ZONE) === today,
      ).length,
    0,
  );

  const rescueCounts = await Promise.all(
    LIVE_RESCUE_STATUSES.map((status) => countRescueRefsByStatus(status)),
  );
  const openRescues = rescueCounts.reduce((sum, count) => sum + count, 0);
  const pendingRescues = (
    await Promise.all(
      PENDING_RESCUE_STATUSES.map((status) => countRescueRefsByStatus(status)),
    )
  ).reduce((sum, count) => sum + count, 0);

  const mechanicRows = await listAvailableMechanicRows(MECHANIC_SCAN_LIMIT);
  const onlineMechanics = mechanicRows.filter(
    (row) => row.is_online === true,
  ).length;

  const revenue = await getAdminRevenue(actor, { range: "month" });
  const audit = await getPaymentAudit(actor, { range: "day" });
  if (!revenue.ok)
    return {
      ok: false,
      status: 500,
      errors: { form: "Không tải được số liệu doanh thu." },
    };
  if (!audit.ok)
    return {
      ok: false,
      status: 500,
      errors: { form: "Không tải được nhật ký thu tiền." },
    };

  const events = audit.data.events;
  const todayReceipts = events.filter(
    (event) => event.action === "recorded",
  ).length;
  const failedConfirmations = events.filter(
    (event) => event.action === "confirm_failed",
  ).length;

  return {
    ok: true,
    data: {
      todayBookings,
      openRescues,
      pendingRescues,
      onlineMechanics,
      monthRevenue: revenue.data.collected,
      monthReceipts: revenue.data.receipts,
      todayReceipts,
      failedConfirmations,
      events: events.slice(0, TODAY_EVENTS_SHOWN),
    },
  };
}
