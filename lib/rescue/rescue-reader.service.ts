// Read path for parallel dispatcher monitoring and the assigned
// mechanic inbox. Guests track via the success panel, so detail reads
// stay staff-only.
import type { PublicUser } from "@/lib/auth/user.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { isUuid } from "@/lib/validation";
import type { RescueResult } from "./rescue.types";
import { getDispatchConfig } from "./rescue-config.service";
import {
  findRescueRowById,
  listRescueHistoryRows,
  listRescueRefsByCustomer,
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
  etaMin: number | null;
  priceEstimate: number | null;
  finalPrice: number | null;
  paymentStatus: string | null;
  /**
   * Cash confirmation code — populated for the requesting customer only.
   * Staff and mechanic views keep it null by design.
   */
  paymentConfirmCode: string | null;
  offerExpiresAt: string | null;
  updatedAt: string | null;
};

// Public tracking payload: the minimum a requester needs to follow the
// mechanic's approach. No customer PII — the requestId is the capability.
export type RescueTracking = {
  requestId: string;
  status: string;
  issueType: string | null;
  mechanicName: string | null;
  etaMin: number | null;
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

function toDetail(
  row: RescueRow,
  offerTimeoutMs: number,
  exposeCode = false,
): RescueDetail {
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
    etaMin: row.eta_min,
    priceEstimate: row.price_estimate,
    finalPrice: row.final_price,
    paymentStatus: row.payment_status,
    paymentConfirmCode:
      exposeCode && row.payment_status !== "paid"
        ? row.payment_confirm_code
        : null,
    offerExpiresAt:
      row.status === "dispatched" && row.updated_at
        ? new Date(row.updated_at.getTime() + offerTimeoutMs).toISOString()
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
  if (!isStaff(actor) && actor.role !== "customer") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(requestId)) {
    return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
  }
  const row = await findRescueRowById(requestId);
  if (!row) return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  if (actor.role === "customer" && row.customer_id !== actor.id) {
    return fail(403, "Yêu cầu này không thuộc về bạn.");
  }
  if (
    actor.role === "mechanic" &&
    row.assigned_mechanic_id !== null &&
    row.assigned_mechanic_id !== actor.id
  ) {
    return fail(403, "Yêu cầu này không thuộc về bạn.");
  }
  const history = await listRescueHistoryRows(requestId, 50);
  const config = await getDispatchConfig();
  return {
    ok: true,
    data: {
      rescue: toDetail(row, config.offerTimeoutMs, actor.role === "customer"),
      timeline: history.map((item) => ({
        changedAt: item.changed_at.toISOString(),
        oldStatus: item.old_status,
        newStatus: item.new_status,
        note: item.note,
      })),
    },
  };
}

// Guest tracking link: anyone holding the unguessable request id can
// follow status + ETA, but nothing that identifies the customer.
export async function getPublicRescueTracking(
  requestId: string,
): Promise<RescueResult<RescueTracking>> {
  if (!isUuid(requestId)) {
    return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
  }
  const row = await findRescueRowById(requestId);
  if (!row) return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  return {
    ok: true,
    data: {
      requestId: row.request_id,
      status: row.status ?? "open",
      issueType: row.issue_type,
      mechanicName: row.assigned_mechanic_name,
      etaMin: row.eta_min,
      updatedAt: row.updated_at?.toISOString() ?? null,
    },
  };
}

const RESCUE_BOARD_STATUSES = [
  "open",
  "dispatched",
  "accepted",
  "en_route",
  "arrived",
] as const;
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
  const config = await getDispatchConfig();
  const items: RescueDetail[] = [];
  for (const ref of page.rows) {
    const row = await findRescueRowById(ref.request_id);
    if (row && row.status === status)
      items.push(toDetail(row, config.offerTimeoutMs));
  }
  return {
    ok: true,
    data: { items, nextCursor: encodeCursor(page.pageState, scope) },
  };
}

// Customer history: every rescue the account filed, newest first. Rows
// hydrate through the live row so stale ref statuses never leak out.
export async function listCustomerRescues(
  actor: PublicUser,
): Promise<RescueResult<{ items: RescueDetail[] }>> {
  if (actor.role !== "customer") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  const refs = await listRescueRefsByCustomer(actor.id);
  const config = await getDispatchConfig();
  const items: RescueDetail[] = [];
  for (const ref of refs) {
    const row = await findRescueRowById(ref.request_id);
    if (row && row.customer_id === actor.id) {
      items.push(toDetail(row, config.offerTimeoutMs, true));
    }
  }
  return { ok: true, data: { items } };
}

// Mechanic inbox: offers plus the live trip, so the card keeps the
// depart/arrive/complete buttons until the rescue is closed. Completed
// rescues stay while money is still owed so the mechanic can collect.
const MECHANIC_ACTIVE_STATUSES = new Set([
  "dispatched",
  "accepted",
  "en_route",
  "arrived",
]);

function isMechanicVisible(row: RescueRow): boolean {
  if (MECHANIC_ACTIVE_STATUSES.has(row.status ?? "")) return true;
  return row.status === "completed" && row.payment_status === "unpaid";
}

export async function listMechanicRescues(
  actor: PublicUser,
): Promise<RescueResult<{ items: RescueDetail[] }>> {
  if (actor.role !== "mechanic" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  const refs = await listRescueRefsByMechanic(actor.id);
  const config = await getDispatchConfig();
  const items: RescueDetail[] = [];
  for (const ref of refs) {
    const row = await findRescueRowById(ref.request_id);
    if (
      row &&
      isMechanicVisible(row) &&
      row.assigned_mechanic_id === actor.id
    ) {
      items.push(toDetail(row, config.offerTimeoutMs));
    }
  }
  return { ok: true, data: { items } };
}
