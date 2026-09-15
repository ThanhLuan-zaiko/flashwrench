import type {
  ComplaintRow,
  CreateComplaintInput,
} from "@/lib/complaints/complaint.types";

// Builders for the complaint suites. Each test derives its own rows
// instead of mutating shared objects, mirroring catalog.fixtures.ts.

export function makeComplaintRow(
  overrides?: Partial<ComplaintRow>,
): ComplaintRow {
  return {
    complaint_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    reporter_name: "Nguyen Van A",
    reporter_phone: "0912345678",
    target_user_id: null,
    target_name: "",
    ref_type: "booking",
    ref_id: "booking-123",
    subject: "Tho den tre hai gio",
    body: "Tho hen 9 gio nhung 11 gio moi den, khong bao truoc.",
    status: "open",
    resolution_note: null,
    month_bucket: "2026-09",
    created_at: new Date("2026-09-10T00:00:00.000Z"),
    updated_at: new Date("2026-09-10T00:00:00.000Z"),
    resolved_at: null,
    ...overrides,
  };
}

export function makeComplaintInput(
  overrides?: Partial<CreateComplaintInput>,
): CreateComplaintInput {
  return {
    reporterName: "Nguyen Van A",
    reporterPhone: "0912345678",
    targetName: "Tran Van Tho",
    refType: "booking",
    refId: "booking-123",
    subject: "Tho den tre hai gio khong bao truoc",
    body: "Tho hen 9 gio nhung 11 gio moi den, khong bao truoc cho khach.",
    ...overrides,
  };
}
