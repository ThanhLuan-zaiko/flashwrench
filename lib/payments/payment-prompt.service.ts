// Payment-prompt orchestration: the banner's write + read model.
// Issue services call the upsert helpers right after storing the confirm
// code on the ref row; settle paths call clearPaymentPrompt; the banner
// endpoint calls listPaymentPrompts, which re-verifies each row against
// the live booking/rescue/order so a missed delete self-heals.

import type { MechanicBookingRow } from "@/lib/mechanic/mechanic.types";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { findOrderRowById } from "@/lib/orders/orders.repository";
import type { OrderRow } from "@/lib/orders/orders.types";
import {
  findRescueRowById,
  type RescueRow,
} from "@/lib/rescue/rescue-workflow.repository";
import {
  deletePaymentPrompt,
  listPaymentPromptRows,
  putPaymentPrompt,
} from "./payment-prompt.repository";
import {
  isPaymentPromptKind,
  type PaymentPromptItem,
  type PaymentPromptRow,
} from "./payment-prompt.types";

function safeAmount(value: number | null): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

// Guests carry no customer_id, so no prompt row can be written for them —
// they follow the public tracking page, which shows the code already.
export async function upsertBookingPrompt(
  booking: MechanicBookingRow,
  issuedAt: Date,
): Promise<void> {
  if (!booking.customer_id) return;
  const plate = booking.vehicle_plate ? ` · ${booking.vehicle_plate}` : "";
  await putPaymentPrompt({
    customerId: booking.customer_id,
    refType: "booking",
    refId: booking.booking_id,
    title: `Sửa xe tận nơi${plate}`,
    amountDue: safeAmount(booking.total),
    issuedAt,
  });
}

export async function upsertRescuePrompt(
  row: RescueRow,
  issuedAt: Date,
): Promise<void> {
  if (!row.customer_id) return;
  const plate = row.vehicle_plate ? ` · ${row.vehicle_plate}` : "";
  await putPaymentPrompt({
    customerId: row.customer_id,
    refType: "emergency",
    refId: row.request_id,
    title: `Cứu hộ khẩn cấp${plate}`,
    amountDue: safeAmount(row.final_price ?? row.price_estimate),
    issuedAt,
  });
}

export async function upsertOrderPrompt(
  row: OrderRow,
  issuedAt: Date,
): Promise<void> {
  if (!row.customer_id) return;
  await putPaymentPrompt({
    customerId: row.customer_id,
    refType: "order",
    refId: row.order_id,
    title: `Đơn hàng #${row.order_id.slice(0, 8)}`,
    amountDue: safeAmount(row.total),
    issuedAt,
  });
}

// Every settle path calls this — payment recorded, order delivered,
// refund/cancel while a prompt was live. Delete of a missing row is a
// no-op, so callers never have to check first.
export async function clearPaymentPrompt(
  customerId: string | null,
  refType: string,
  refId: string,
): Promise<void> {
  if (!customerId) return;
  await deletePaymentPrompt(customerId, refType, refId).catch(() => undefined);
}

function promptHref(row: PaymentPromptRow): string {
  switch (row.ref_type) {
    case "booking":
      return `/history?booking=${row.ref_id}`;
    case "emergency":
      return `/history/rescue?request=${row.ref_id}`;
    default:
      return `/orders/${row.ref_id}`;
  }
}

function promptTitle(row: PaymentPromptRow): string {
  if (row.title) return row.title;
  if (row.ref_type === "booking") return "Đơn sửa xe";
  if (row.ref_type === "emergency") return "Cứu hộ khẩn cấp";
  return `Đơn hàng #${row.ref_id.slice(0, 8)}`;
}

// A prompt stays live only while its ref row still holds an issued code
// with money outstanding — anything else (paid, refunded, cancelled) is
// stale and gets swept on the way out.
async function promptIsLive(row: PaymentPromptRow): Promise<boolean> {
  if (row.ref_type === "booking") {
    const booking = await findBookingRowById(row.ref_id);
    return Boolean(
      booking?.payment_confirm_code &&
        (booking.payment_status === "unpaid" ||
          booking.payment_status === "partial"),
    );
  }
  if (row.ref_type === "emergency") {
    const rescue = await findRescueRowById(row.ref_id);
    return Boolean(
      rescue?.payment_confirm_code && rescue.payment_status === "unpaid",
    );
  }
  const order = await findOrderRowById(row.ref_id);
  return Boolean(
    order?.payment_confirm_code && order.payment_status === "unpaid",
  );
}

export async function listPaymentPrompts(
  customerId: string,
): Promise<PaymentPromptItem[]> {
  const rows = await listPaymentPromptRows(customerId);
  const live = await Promise.all(
    rows.map(async (row) => ({ row, isLive: await promptIsLive(row) })),
  );
  const items: PaymentPromptItem[] = [];
  for (const { row, isLive } of live) {
    if (!isPaymentPromptKind(row.ref_type)) continue;
    if (!isLive) {
      void deletePaymentPrompt(row.customer_id, row.ref_type, row.ref_id).catch(
        () => undefined,
      );
      continue;
    }
    items.push({
      kind: row.ref_type,
      refId: row.ref_id,
      title: promptTitle(row),
      amountDue: row.amount_due ?? 0,
      href: promptHref(row),
      issuedAt: row.issued_at?.toISOString() ?? null,
    });
  }
  items.sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? ""));
  return items;
}
