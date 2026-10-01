// Raw CQL for rescue dispatch transitions. No business logic here:
// the dispatch service decides who gets the offer and when it expires.
import { scylla } from "@/lib/db/client";

export type RescueRow = {
  request_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  zone_id: string | null;
  vehicle_plate: string | null;
  address_lat: number | null;
  address_lng: number | null;
  address_text: string | null;
  status: string | null;
  assigned_mechanic_id: string | null;
  assigned_mechanic_name: string | null;
  priority: string | null;
  issue_type: string | null;
  eta_min: number | null;
  price_estimate: number | null;
  final_price: number | null;
  payment_status: string | null;
  payment_confirm_code: string | null;
  updated_at: Date | null;
  created_at: Date | null;
};

export type RescueTransitionWrite = {
  before: RescueRow;
  status: string;
  mechanicId: string | null;
  mechanicName: string | null;
  etaMin: number | null;
  actorId: string | null;
  note: string | null;
  at: Date;
};

export type RescueHistoryRow = {
  request_id: string;
  changed_at: Date;
  old_status: string | null;
  new_status: string | null;
  changed_by: string | null;
  note: string | null;
};

const RESCUE_DETAIL_COLUMNS =
  "request_id, customer_id, customer_name, customer_phone, customer_email, zone_id, vehicle_plate, address, issue_type, priority, status, assigned_mechanic_id, assigned_mechanic_name, eta_min, price_estimate, final_price, payment_status, payment_confirm_code, created_at, updated_at";

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value?.toString === "function") return String(value);
  return null;
}

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function toAddressParts(address: unknown): {
  lat: number | null;
  lng: number | null;
  text: string | null;
} {
  if (!address || typeof address !== "object") {
    return { lat: null, lng: null, text: null };
  }
  const raw = address as Record<string, unknown>;
  const lat = typeof raw.lat === "number" ? raw.lat : null;
  const lng = typeof raw.lng === "number" ? raw.lng : null;
  const text = typeof raw.full_text === "string" ? raw.full_text : null;
  return { lat, lng, text };
}

function toRescueRow(raw: Record<string, unknown>): RescueRow {
  const address = toAddressParts(raw.address);
  return {
    request_id: String(raw.request_id),
    customer_id: toStringOrNull(raw.customer_id),
    customer_name: toStringOrNull(raw.customer_name),
    customer_phone: toStringOrNull(raw.customer_phone),
    customer_email: toStringOrNull(raw.customer_email),
    zone_id: toStringOrNull(raw.zone_id),
    vehicle_plate: toStringOrNull(raw.vehicle_plate),
    address_lat: address.lat,
    address_lng: address.lng,
    address_text: address.text,
    status: toStringOrNull(raw.status),
    assigned_mechanic_id: toStringOrNull(raw.assigned_mechanic_id),
    assigned_mechanic_name: toStringOrNull(raw.assigned_mechanic_name),
    priority: toStringOrNull(raw.priority),
    issue_type: toStringOrNull(raw.issue_type),
    eta_min: toNumberOrNull(raw.eta_min),
    price_estimate: toNumberOrNull(raw.price_estimate),
    final_price: toNumberOrNull(raw.final_price),
    payment_status: toStringOrNull(raw.payment_status),
    payment_confirm_code: toStringOrNull(raw.payment_confirm_code),
    updated_at: toDateOrNull(raw.updated_at),
    created_at: toDateOrNull(raw.created_at),
  };
}

export async function findRescueRowById(
  requestId: string,
): Promise<RescueRow | null> {
  const result = await scylla.execute(
    `SELECT ${RESCUE_DETAIL_COLUMNS} FROM emergency_by_id WHERE request_id = ?`,
    [requestId],
    { prepare: true },
  );
  const raw = result.first() as unknown as Record<string, unknown> | null;
  if (!raw) return null;
  return toRescueRow(raw);
}

// Conditional claim so two dispatch passes (or a dispatcher override)
// never double-offer the same row. Lost claims return false.
export async function claimRescueTransition(
  write: RescueTransitionWrite,
): Promise<boolean> {
  const result = await scylla.execute(
    "UPDATE emergency_by_id SET status = ?, assigned_mechanic_id = ?, assigned_mechanic_name = ?, eta_min = ?, updated_at = ? WHERE request_id = ? IF status = ? AND assigned_mechanic_id = ? AND updated_at = ?",
    [
      write.status,
      write.mechanicId,
      write.mechanicName,
      write.etaMin,
      write.at,
      write.before.request_id,
      write.before.status,
      write.before.assigned_mechanic_id,
      write.before.updated_at,
    ],
    { prepare: true },
  );
  const row = result.first() as unknown as Record<string, unknown> | null;
  return row?.["[applied]"] === true;
}

export async function projectRescueTransition(
  write: RescueTransitionWrite,
): Promise<void> {
  const createdAt = write.before.created_at ?? write.at;
  const queries: { query: string; params: unknown[] }[] = [
    {
      query:
        "INSERT INTO emergency_status_history (request_id, changed_at, old_status, new_status, changed_by, note) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        write.before.request_id,
        write.at,
        write.before.status,
        write.status,
        write.actorId,
        write.note,
      ],
    },
    {
      query:
        "INSERT INTO emergency_by_status (status, created_at, request_id, priority, issue_type, zone_id) VALUES (?, ?, ?, ?, ?, ?)",
      params: [
        write.status,
        createdAt,
        write.before.request_id,
        write.before.priority,
        write.before.issue_type,
        write.before.zone_id,
      ],
    },
  ];

  if (write.before.status && write.before.status !== write.status) {
    queries.push({
      query:
        "DELETE FROM emergency_by_status WHERE status = ? AND created_at = ? AND request_id = ?",
      params: [write.before.status, createdAt, write.before.request_id],
    });
  }

  if (write.mechanicId) {
    queries.push({
      query:
        "INSERT INTO emergency_by_mechanic (mechanic_id, created_at, request_id, status, issue_type) VALUES (?, ?, ?, ?, ?)",
      params: [
        write.mechanicId,
        createdAt,
        write.before.request_id,
        write.status,
        write.before.issue_type,
      ],
    });
  }

  if (
    write.before.assigned_mechanic_id &&
    write.before.assigned_mechanic_id !== write.mechanicId
  ) {
    queries.push({
      query:
        "DELETE FROM emergency_by_mechanic WHERE mechanic_id = ? AND created_at = ? AND request_id = ?",
      params: [
        write.before.assigned_mechanic_id,
        createdAt,
        write.before.request_id,
      ],
    });
  }

  // Customer history keeps one row per request forever, so a transition
  // only moves its status label forward in place.
  if (write.before.customer_id) {
    queries.push({
      query:
        "UPDATE emergency_by_customer SET status = ? WHERE customer_id = ? AND created_at = ? AND request_id = ?",
      params: [
        write.status,
        write.before.customer_id,
        createdAt,
        write.before.request_id,
      ],
    });
  }

  await scylla.batch(queries, { prepare: true });
}

export type RescueStatusRef = {
  status: string;
  created_at: Date;
  request_id: string;
};

export async function listRescueRefsByStatus(
  status: string,
  limit: number,
  pageState: string | null,
): Promise<{ rows: RescueStatusRef[]; pageState: string | null }> {
  const result = await scylla.execute(
    "SELECT status, created_at, request_id FROM emergency_by_status WHERE status = ? LIMIT ?",
    [status, limit],
    { prepare: true, fetchSize: limit, pageState: pageState ?? undefined },
  );
  return {
    rows: result.rows.map((raw) => {
      const row = raw as unknown as Record<string, unknown>;
      return {
        status: String(row.status),
        created_at: toDateOrNull(row.created_at) ?? new Date(0),
        request_id: String(row.request_id),
      };
    }),
    pageState: result.pageState ?? null,
  };
}

// Customer history: every request the account filed, newest first. Rows
// are never deleted on transitions — the list is a history, not a queue.
export async function listRescueRefsByCustomer(
  customerId: string,
): Promise<RescueStatusRef[]> {
  const result = await scylla.execute(
    "SELECT status, created_at, request_id FROM emergency_by_customer WHERE customer_id = ? LIMIT 50",
    [customerId],
    { prepare: true },
  );
  return result.rows.map((raw) => {
    const row = raw as unknown as Record<string, unknown>;
    return {
      status: String(row.status),
      created_at: toDateOrNull(row.created_at) ?? new Date(0),
      request_id: String(row.request_id),
    };
  });
}

export async function listRescueRefsByMechanic(
  mechanicId: string,
): Promise<RescueStatusRef[]> {
  const result = await scylla.execute(
    "SELECT status, created_at, request_id FROM emergency_by_mechanic WHERE mechanic_id = ? LIMIT 50",
    [mechanicId],
    { prepare: true },
  );
  return result.rows.map((raw) => {
    const row = raw as unknown as Record<string, unknown>;
    return {
      status: String(row.status),
      created_at: toDateOrNull(row.created_at) ?? new Date(0),
      request_id: String(row.request_id),
    };
  });
}

export async function listRescueHistoryRows(
  requestId: string,
  limit: number,
): Promise<RescueHistoryRow[]> {
  const result = await scylla.execute(
    "SELECT request_id, changed_at, old_status, new_status, changed_by, note FROM emergency_status_history WHERE request_id = ? LIMIT ?",
    [requestId, limit],
    { prepare: true },
  );
  return result.rows.map((raw) => {
    const row = raw as unknown as Record<string, unknown>;
    return {
      request_id: String(row.request_id),
      changed_at: toDateOrNull(row.changed_at) ?? new Date(0),
      old_status: toStringOrNull(row.old_status),
      new_status: toStringOrNull(row.new_status),
      changed_by: toStringOrNull(row.changed_by),
      note: toStringOrNull(row.note),
    };
  });
}
