// Customer-facing invoices for anonymous work. Every builder is reached only
// through requireGuestRecord, so ownership is settled before any row is read.

import { toIso } from "@/lib/mechanic/mechanic.types";
import {
  findBookingRowById,
  listBookingItemRowsByBookingIds,
} from "@/lib/mechanic/mechanic-bookings.repository";
import {
  findOrderRowById,
  listOrderItemRows,
} from "@/lib/orders/orders.repository";
import {
  findPaymentRowById,
  listPaymentRefPaymentIds,
  type PaymentRow,
} from "@/lib/payments/booking-payment.repository";
import { findRescueRowById } from "@/lib/rescue/rescue-workflow.repository";
import { requireGuestRecord } from "./guest-access.service";
import {
  GUEST_RECORD_LABELS,
  type GuestAccessResult,
  type GuestInvoice,
  type GuestInvoiceLine,
  type GuestInvoicePayment,
  type GuestInvoiceTotals,
  type GuestRecordType,
} from "./guest-access.types";

/** Short human-facing code. The full id stays a capability, never a label. */
function referenceOf(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function vehicleLabel(
  plate: string | null,
  brand: string | null,
  model: string | null,
): string | null {
  const parts = [brand, model].filter((value): value is string =>
    Boolean(value?.trim()),
  );
  const name = parts.join(" ").trim();
  if (name && plate) return `${plate} · ${name}`;
  return name || plate || null;
}

/** Installments are separate receipts, so a job can carry several rows. */
async function collectPayments(
  refType: string,
  refId: string,
): Promise<{ payments: GuestInvoicePayment[]; paid: number }> {
  const ids = await listPaymentRefPaymentIds(refType, refId);
  const rows = (
    await Promise.all(ids.map((id) => findPaymentRowById(id)))
  ).filter((row): row is PaymentRow => row !== null);

  const paid = rows
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);

  const payments = rows
    .map((row) => ({
      id: row.payment_id,
      method: row.method ?? "cod",
      status: row.status ?? "unknown",
      amount: row.amount ?? 0,
      paidAt: toIso(row.paid_at),
      reference: row.provider_ref,
    }))
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""));

  return { payments, paid };
}

function withBalance(
  totals: Omit<GuestInvoiceTotals, "paid" | "outstanding">,
  paid: number,
): GuestInvoiceTotals {
  return {
    ...totals,
    paid,
    outstanding: Math.max(0, totals.total - paid),
  };
}

async function buildBookingInvoice(id: string): Promise<GuestInvoice | null> {
  const row = await findBookingRowById(id);
  if (!row) return null;
  const items = await listBookingItemRowsByBookingIds([id]);
  const lines: GuestInvoiceLine[] = items.map((item) => ({
    id: item.service_id,
    name: item.service_name ?? "Dịch vụ",
    quantity: item.quantity ?? 1,
    unitPrice: item.unit_price ?? 0,
    lineTotal: item.line_total ?? 0,
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const total = row.total ?? subtotal;
  const { payments, paid } = await collectPayments("booking", id);

  return {
    kind: "booking",
    id,
    reference: referenceOf(id),
    issuedAt: toIso(row.created_at),
    status: row.status ?? "pending",
    paymentStatus: row.payment_status ?? "unpaid",
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    vehicleLabel: vehicleLabel(
      row.vehicle_plate,
      row.vehicle_brand,
      row.vehicle_model,
    ),
    serviceNames: lines.map((line) => line.name),
    mechanicName: row.mechanic_name ?? null,
    scheduledAt: toIso(row.scheduled_at),
    lines,
    // Anything the item list does not explain (zone or travel fee) surfaces
    // as its own row instead of being folded silently into the total.
    totals: withBalance(
      { subtotal, extraFee: Math.max(0, total - subtotal), discount: 0, total },
      paid,
    ),
    payments,
    notes: row.notes,
  };
}

async function buildRescueInvoice(id: string): Promise<GuestInvoice | null> {
  const row = await findRescueRowById(id);
  if (!row) return null;
  const estimate = row.price_estimate ?? 0;
  const total = row.final_price ?? estimate;
  const { payments, paid } = await collectPayments("emergency", id);

  return {
    kind: "rescue",
    id,
    reference: referenceOf(id),
    issuedAt: toIso(row.created_at),
    status: row.status ?? "open",
    paymentStatus: row.payment_status ?? "unpaid",
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    vehicleLabel: row.vehicle_plate,
    serviceNames: [row.issue_type ?? GUEST_RECORD_LABELS.rescue],
    mechanicName: row.assigned_mechanic_name ?? null,
    scheduledAt: null,
    lines: [
      {
        // A rescue has no item table, so the request id is the row key.
        id: row.request_id,
        name: row.issue_type ?? GUEST_RECORD_LABELS.rescue,
        quantity: 1,
        unitPrice: estimate,
        lineTotal: estimate,
      },
    ],
    totals: withBalance(
      {
        subtotal: estimate,
        extraFee: Math.max(0, total - estimate),
        discount: 0,
        total,
      },
      paid,
    ),
    payments,
    notes: null,
  };
}

async function buildOrderInvoice(id: string): Promise<GuestInvoice | null> {
  const row = await findOrderRowById(id);
  if (!row) return null;
  const items = await listOrderItemRows(id);
  const lines: GuestInvoiceLine[] = items.map((item) => ({
    id: item.part_id,
    name: item.part_name ?? "Linh kiện",
    quantity: item.quantity ?? 1,
    unitPrice: item.unit_price ?? 0,
    lineTotal: item.line_total ?? 0,
  }));
  const subtotal =
    row.subtotal ?? lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = row.total ?? subtotal;
  const { payments, paid } = await collectPayments("order", id);

  return {
    kind: "order",
    id,
    reference: referenceOf(id),
    issuedAt: toIso(row.created_at),
    status: row.status ?? "pending",
    paymentStatus: row.payment_status ?? "unpaid",
    customerName: row.customer_name ?? "",
    customerPhone: row.customer_phone ?? "",
    vehicleLabel: null,
    serviceNames: lines.slice(0, 3).map((line) => line.name),
    mechanicName: null,
    scheduledAt: null,
    lines,
    totals: withBalance(
      {
        subtotal,
        extraFee: row.shipping_fee ?? 0,
        discount: row.discount ?? 0,
        total,
      },
      paid,
    ),
    payments,
    notes: row.note,
  };
}

const BUILDERS: Record<
  GuestRecordType,
  (id: string) => Promise<GuestInvoice | null>
> = {
  booking: buildBookingInvoice,
  rescue: buildRescueInvoice,
  order: buildOrderInvoice,
};

export async function readGuestInvoice(
  email: string,
  type: GuestRecordType,
  id: string,
): Promise<GuestAccessResult<GuestInvoice>> {
  const allowed = await requireGuestRecord(email, type, id);
  if (!allowed.ok) return allowed;

  const invoice = await BUILDERS[type](id);
  if (!invoice) {
    return {
      ok: false,
      status: 404,
      errors: { form: "Không tìm thấy hóa đơn này." },
    };
  }
  return { ok: true, data: invoice };
}
