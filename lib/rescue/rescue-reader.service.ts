// Read path for parallel dispatcher monitoring and the assigned
// mechanic inbox. Guests track via the success panel, so detail reads
// stay staff-only.
import type { PublicUser } from "@/lib/auth/user.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { isUuid } from "@/lib/validation";
import type { RescueResult } from "./rescue.types";
import { RESCUE_OFFER_TIMEOUT_MS } from "./rescue-status";
import {
  findRescueRowById,
  listRescueHistoryRows,
  listRescueRefsByMechanic,
  listRescueRefsByStatus,
  type RescueRow,
} from "./rescue-workflow.repository";

export type RescueDetail = {
  requestId: string;
  status: string;
  issueType: string | null;
  priority: string | null;
  vehiclePlate: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  customerName: string | null;
  customerPhone: string | null;
  assignedMechanicId: string | null;
  assignedMechanicName: string | null;
  offerExpiresAt: string | null;
  updatedAt: string | null;
};

export type RescueTimelineItem = {
  changedAt: string;
  oldStatus: string | null;
  newStatus: string | null;
  note: string | null;
};

function fail<T>(status: number, form: string): RescueResult<T> {
  return { ok: false, status, errors: { form } };
}

function isStaff(actor: PublicUser): boolean {
  return (
    actor.role === "dispatcher" ||
    actor.role === "admin" ||
    actor.role === "mechanic"
  );
}

function toDetail(row: RescueRow): RescueDetail {
  return {
    requestId: row.request_id,
    status: row.status ?? "open",
    issueType: row.issue_type,
    priority: row.priority,
    vehiclePlate: row.vehicle_plate,
    address: row.address_text,
    lat: row.address_lat,
    lng: row.address_lng,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    assignedMechanicId: row.assigned_mechanic_id,
    assignedMechanicName: row.assigned_mechanic_name,
    offerExpiresAt:
      row.status === "dispatched" && row.updated_at
        ? new Date(
            row.updated_at.getTime() + RESCUE_OFFER_TIMEOUT_MS,
          ).toISOString()
        : null,
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

export async function getRescueDetail(
  actor: PublicUser,
  requestId: string,
): Promise<
  RescueResult<{ rescue: RescueDetail; timeline: RescueTimelineItem[] }>
> {
  if (!isStaff(actor)) {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(requestId)) {
    return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
  }
  const row = await findRescueRowById(requestId);
  if (!row) return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  if (
    actor.role === "mechanic" &&
    row.assigned_mechanic_id !== null &&
    row.assigned_mechanic_id !== actor.id
  ) {
    return fail(403, "Yêu cầu này không thuộc về bạn.");
  }
  const history = await listRescueHistoryRows(requestId, 50);
  return {
    ok: true,
    data: {
      rescue: toDetail(row),
      timeline: history.map((item) => ({
        changedAt: item.changed_at.toISOString(),
        oldStatus: item.old_status,
        newStatus: item.new_status,
        note: item.note,
      })),
    },
  };
}

const RESCUE_BOARD_STATUSES = ["open", "dispatched", "accepted"] as const;
const RESCUE_BOARD_PAGE_SIZE = 8;

// Dispatcher board: newest rescues per status with cursor paging. The
// cursor scope pins actor and status so a token from one list can never
// page another.
export async function listDispatchRescues(
  actor: PublicUser,
  params: { status?: string; cursor?: string | null } = {},
): Promise<RescueResult<{ items: RescueDetail[]; nextCursor: string | null }>> {
  if (actor.role !== "dispatcher" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  const status = params.status ?? "open";
  if (!(RESCUE_BOARD_STATUSES as readonly string[]).includes(status)) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Trạng thái không hợp lệ." },
    };
  }
  const scope = `dispatch-rescue:${actor.id}:${status}`;
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(params.cursor, scope);
  } catch {
    return {
      ok: false,
      status: 400,
      errors: { form: "Con trỏ trang không hợp lệ." },
    };
  }
  const page = await listRescueRefsByStatus(
    status,
    RESCUE_BOARD_PAGE_SIZE,
    pageState,
  );
  const items: RescueDetail[] = [];
  for (const ref of page.rows) {
    const row = await findRescueRowById(ref.request_id);
    if (row && row.status === status) items.push(toDetail(row));
  }
  return {
    ok: true,
    data: { items, nextCursor: encodeCursor(page.pageState, scope) },
  };
}

// Mechanic inbox: rescues currently offered to or accepted by me.
export async function listMechanicRescues(
  actor: PublicUser,
): Promise<RescueResult<{ items: RescueDetail[] }>> {
  if (actor.role !== "mechanic" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  const refs = await listRescueRefsByMechanic(actor.id);
  const items: RescueDetail[] = [];
  for (const ref of refs) {
    const row = await findRescueRowById(ref.request_id);
    if (
      row &&
      (row.status === "dispatched" || row.status === "accepted") &&
      row.assigned_mechanic_id === actor.id
    ) {
      items.push(toDetail(row));
    }
  }
  return { ok: true, data: { items } };
}
