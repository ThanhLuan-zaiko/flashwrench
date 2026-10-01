// Shared shapes for the OTP-authenticated guest lookup: the record list a
// visitor sees, and the invoice any of those records can produce.
export const GUEST_RECORD_TYPES = ["booking", "rescue", "order"] as const;

export type GuestRecordType = (typeof GUEST_RECORD_TYPES)[number];

export function isGuestRecordType(value: unknown): value is GuestRecordType {
  return (
    typeof value === "string" &&
    (GUEST_RECORD_TYPES as readonly string[]).includes(value)
  );
}

/** Vietnamese labels reused by the list UI and the invoice header. */
export const GUEST_RECORD_LABELS: Record<GuestRecordType, string> = {
  booking: "Đặt lịch sửa xe",
  rescue: "Cứu hộ khẩn cấp",
  order: "Đơn linh kiện",
};

export type GuestRecordSummary = {
  type: GuestRecordType;
  id: string;
  title: string;
  status: string;
  createdAt: string | null;
  scheduledAt: string | null;
  total: number | null;
  mechanicName: string | null;
  /** Public live-tracking route, when this record type has one. */
  trackHref: string | null;
};

export type GuestRecordList = {
  maskedEmail: string;
  records: GuestRecordSummary[];
};

export type GuestInvoiceLine = {
  /** Stable row key for the UI: the service or part id behind the snapshot. */
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type GuestInvoiceTotals = {
  subtotal: number;
  /** Travel/zone fee for a booking, shipping fee for a parts order. */
  extraFee: number;
  discount: number;
  total: number;
  paid: number;
  outstanding: number;
};

export type GuestInvoicePayment = {
  /** Receipt id — a job can carry several installments. */
  id: string;
  method: string;
  status: string;
  amount: number;
  paidAt: string | null;
  reference: string | null;
};

export type GuestInvoice = {
  kind: GuestRecordType;
  /** Full record id — what the PDF download route is addressed by. */
  id: string;
  /** Short human-facing code (first 8 chars of the id, uppercased). */
  reference: string;
  issuedAt: string | null;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  vehicleLabel: string | null;
  serviceNames: string[];
  mechanicName: string | null;
  scheduledAt: string | null;
  lines: GuestInvoiceLine[];
  totals: GuestInvoiceTotals;
  payments: GuestInvoicePayment[];
  notes: string | null;
};

export type GuestAccessResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: { form: string } };
