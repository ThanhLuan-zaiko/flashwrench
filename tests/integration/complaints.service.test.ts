import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeComplaintInput,
  makeComplaintRow,
} from "../helpers/complaint.fixtures";
import {
  complaintRepoMocks,
  complaintStubs,
  resetServiceMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, matching tests/integration/*.test.ts.
mock.module("@/lib/complaints/complaints.repository", () => complaintRepoMocks);

import {
  createComplaint,
  listComplaints,
  transitionComplaint,
} from "@/lib/complaints/complaints.service";

const COMPLAINT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

beforeEach(() => {
  resetServiceMocks();
});

describe("listComplaints", () => {
  test("sorts newest first and filters by status", async () => {
    complaintStubs.complaintRows = [
      makeComplaintRow({
        complaint_id: "old",
        status: "open",
        created_at: new Date("2026-09-01T00:00:00.000Z"),
      }),
      makeComplaintRow({
        complaint_id: "new",
        status: "resolved",
        created_at: new Date("2026-09-12T00:00:00.000Z"),
      }),
    ];
    const all = await listComplaints();
    expect(all.ok).toBe(true);
    if (!all.ok) return;
    expect(all.data.map((c) => c.id)).toEqual(["new", "old"]);

    const open = await listComplaints({ status: "open" });
    expect(open.ok).toBe(true);
    if (!open.ok) return;
    expect(open.data.map((c) => c.id)).toEqual(["old"]);
  });

  test("rejects an unknown status filter", async () => {
    const result = await listComplaints({ status: "archived" as never });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });
});

describe("createComplaint", () => {
  test("creates and returns the new complaint", async () => {
    complaintStubs.complaintById = makeComplaintRow({
      subject: "Tho den tre hai gio khong bao truoc",
    });
    const result = await createComplaint(makeComplaintInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.status).toBe("open");
    expect(result.data.subject).toBe("Tho den tre hai gio khong bao truoc");
    expect(complaintRepoMocks.insertComplaint.mock.calls.length).toBe(1);
  });

  test("rejects invalid payloads without touching storage", async () => {
    expect(
      await createComplaint(makeComplaintInput({ subject: "abc" })),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await createComplaint(makeComplaintInput({ reporterPhone: "abc" })),
    ).toMatchObject({ ok: false, status: 400 });
    expect(complaintRepoMocks.insertComplaint.mock.calls.length).toBe(0);
  });
});

describe("transitionComplaint", () => {
  test("starts review on an open complaint", async () => {
    complaintStubs.complaintById = makeComplaintRow({ status: "open" });
    const result = await transitionComplaint(COMPLAINT_ID, {
      action: "start-review",
    });
    expect(result.ok).toBe(true);
    expect(
      complaintRepoMocks.updateComplaintStatus.mock.calls[0],
    ).toMatchObject([{ status: "in_review", oldStatus: "open" }]);
  });

  test("resolves with a note and reopens closed records", async () => {
    complaintStubs.complaintById = makeComplaintRow({ status: "in_review" });
    const resolved = await transitionComplaint(COMPLAINT_ID, {
      action: "resolve",
      note: "Da hoan tien cho khach.",
    });
    expect(resolved.ok).toBe(true);

    complaintStubs.complaintById = makeComplaintRow({ status: "resolved" });
    const reopened = await transitionComplaint(COMPLAINT_ID, {
      action: "reopen",
    });
    expect(reopened.ok).toBe(true);
    expect(complaintRepoMocks.updateComplaintStatus.mock.calls.length).toBe(2);
  });

  test("refuses illegal transitions and missing notes", async () => {
    complaintStubs.complaintById = makeComplaintRow({ status: "resolved" });
    expect(
      await transitionComplaint(COMPLAINT_ID, {
        action: "resolve",
        note: "x".repeat(10),
      }),
    ).toMatchObject({ ok: false, status: 400 });

    complaintStubs.complaintById = makeComplaintRow({ status: "open" });
    expect(
      await transitionComplaint(COMPLAINT_ID, { action: "resolve" }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(complaintRepoMocks.updateComplaintStatus.mock.calls.length).toBe(0);
  });

  test("returns 404 for an unknown complaint", async () => {
    complaintStubs.complaintById = null;
    const result = await transitionComplaint("ghost", {
      action: "start-review",
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});
