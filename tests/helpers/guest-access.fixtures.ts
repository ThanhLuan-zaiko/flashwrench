import type {
  GuestInvoice,
  GuestInvoiceLine,
  GuestInvoicePayment,
} from "@/lib/guest-access/guest-access.types";

// Builders for the guest-access suites. Each call derives its own object so
// no test can leak state into the next.
export function makeInvoiceLine(
  overrides?: Partial<GuestInvoiceLine>,
): GuestInvoiceLine {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    name: "Thay dầu động cơ",
    quantity: 1,
    unitPrice: 450000,
    lineTotal: 450000,
    ...overrides,
  };
}

export function makeInvoicePayment(
  overrides?: Partial<GuestInvoicePayment>,
): GuestInvoicePayment {
  return {
    id: "pay-1",
    method: "cod",
    status: "paid",
    amount: 250000,
    paidAt: "2026-09-16T02:00:00.000Z",
    reference: null,
    ...overrides,
  };
}

export function makeGuestInvoice(
  overrides?: Partial<GuestInvoice>,
): GuestInvoice {
  return {
    kind: "booking",
    id: "11111111-1111-1111-1111-111111111111",
    reference: "11111111",
    issuedAt: "2026-09-15T08:30:00.000Z",
    status: "completed",
    paymentStatus: "partial",
    // Vietnamese throughout: the font is the whole point of these fixtures,
    // so an ASCII-only invoice would let a broken font pass unnoticed.
    customerName: "Nguyễn Văn Anh",
    customerPhone: "0912345678",
    vehicleLabel: "51F-12345 · Honda Wave Alpha",
    serviceNames: ["Thay dầu động cơ"],
    mechanicName: "Trần Thị Bình",
    scheduledAt: "2026-09-16T07:00:00.000Z",
    lines: [makeInvoiceLine()],
    totals: {
      subtotal: 450000,
      extraFee: 50000,
      discount: 0,
      total: 500000,
      paid: 250000,
      outstanding: 250000,
    },
    payments: [makeInvoicePayment()],
    notes: "Khách yêu cầu kiểm tra phanh sau.",
    ...overrides,
  };
}
