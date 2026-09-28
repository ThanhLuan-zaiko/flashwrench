import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makePublicUser } from "../helpers/auth.fixtures";
import { makeComplaintRow } from "../helpers/complaint.fixtures";
import {
  complaintRepoMocks,
  complaintStubs,
  resetComplaintMocks,
} from "../helpers/complaint.mocks";
import {
  commentRepoMocks,
  feedbackStubs,
  makeCommentRow,
  resetFeedbackMocks,
} from "../helpers/feedback.mocks";
import { makeBookingRow } from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { makeOrderRow, makePartRow } from "../helpers/parts.fixtures";
import {
  orderRepoMocks,
  orderStubs,
  partRepoMocks,
  partStubs,
  resetPartsMocks,
} from "../helpers/parts.mocks";
import {
  rescueWorkflowRepoMocks,
  resetRescueMocks,
} from "../helpers/rescue.mocks";
import { realtimePublishMocks, resetRouteMocks } from "../helpers/route-mocks";

mock.module("@/lib/comments/comments.repository", () => commentRepoMocks);
mock.module("@/lib/complaints/complaints.repository", () => complaintRepoMocks);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);
mock.module("@/lib/orders/orders.repository", () => orderRepoMocks);
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import { addComment, listComments } from "@/lib/comments/comments.service";

const CUSTOMER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const BOOKING_ID = "11111111-1111-1111-1111-111111111111";
const ORDER_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const COMPLAINT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OTHER_ID = "99999999-9999-4999-8999-999999999999";

const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });
const admin = makePublicUser({ id: OTHER_ID, role: "admin" });
const staff = makePublicUser({ id: OTHER_ID, role: "dispatcher" });

beforeEach(() => {
  resetFeedbackMocks();
  resetComplaintMocks();
  resetMechanicMocks();
  resetPartsMocks();
  resetRescueMocks();
  resetRouteMocks();
});

describe("listComments access", () => {
  test("rejects malformed targets before any lookup", async () => {
    for (const [type, id] of [
      ["nope", PART_ID],
      ["part", "not-a-uuid"],
      [null, PART_ID],
    ] as const) {
      expect(await listComments(customer, type, id, null)).toMatchObject({
        ok: false,
        status: 400,
      });
    }
    expect(commentRepoMocks.listCommentRows.mock.calls.length).toBe(0);
  });

  test("part threads are public for anonymous readers", async () => {
    partStubs.partById = makePartRow({ part_id: PART_ID });
    feedbackStubs.commentPage = {
      rows: [makeCommentRow()],
      pageState: null,
    };
    const result = await listComments(null, "part", PART_ID, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.mine).toBe(false);
  });

  test("booking threads allow the owner, deny strangers and guests", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    expect(
      await listComments(customer, "booking", BOOKING_ID, null),
    ).toMatchObject({ ok: true });
    expect(
      await listComments(staff, "booking", BOOKING_ID, null),
    ).toMatchObject({ ok: true });
    expect(
      await listComments(
        makePublicUser({ id: OTHER_ID }),
        "booking",
        BOOKING_ID,
        null,
      ),
    ).toMatchObject({ ok: false, status: 403 });
    expect(await listComments(null, "booking", BOOKING_ID, null)).toMatchObject(
      { ok: false, status: 403 },
    );
  });

  test("complaint threads are owner + admin only", async () => {
    complaintStubs.complaintById = makeComplaintRow({
      reporter_user_id: CUSTOMER_ID,
    });
    expect(
      await listComments(customer, "complaint", COMPLAINT_ID, null),
    ).toMatchObject({ ok: true });
    expect(
      await listComments(admin, "complaint", COMPLAINT_ID, null),
    ).toMatchObject({ ok: true });
    // Dispatchers do not handle complaints; the thread stays admin-only.
    expect(
      await listComments(staff, "complaint", COMPLAINT_ID, null),
    ).toMatchObject({ ok: false, status: 403 });
  });

  test("missing targets read as 404", async () => {
    expect(
      await listComments(customer, "booking", BOOKING_ID, null),
    ).toMatchObject({ ok: false, status: 404 });
    partStubs.partById = null;
    expect(await listComments(null, "part", PART_ID, null)).toMatchObject({
      ok: false,
      status: 404,
    });
  });
});

describe("addComment", () => {
  test("writes a customer comment on their own booking and notifies staff", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    const result = await addComment(customer, "booking", BOOKING_ID, {
      body: "Tho oi nho mang them phu tung.",
    });
    expect(result.ok).toBe(true);
    expect(commentRepoMocks.insertComment.mock.calls.length).toBe(1);
    const write = commentRepoMocks.insertComment.mock.calls[0]?.[0] as {
      targetType: string;
      targetId: string;
      userRole: string;
    };
    expect(write.targetType).toBe("booking");
    expect(write.targetId).toBe(BOOKING_ID);
    expect(write.userRole).toBe("customer");
    // Owner topic + operations board get the refresh hint.
    const topics = realtimePublishMocks.publishRealtimeEvent.mock.calls.map(
      (call) => call[0],
    );
    expect(topics).toContain("operations");
    expect(topics).toContain(`user:${CUSTOMER_ID}`);
  });

  test("anonymous actors are denied on private threads", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    const result = await addComment(null as never, "booking", BOOKING_ID, {
      body: "hi",
    });
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(commentRepoMocks.insertComment.mock.calls.length).toBe(0);
  });

  test("strangers cannot write on foreign private threads", async () => {
    orderStubs.orderById = makeOrderRow({ customer_id: CUSTOMER_ID });
    const result = await addComment(
      makePublicUser({ id: OTHER_ID }),
      "order",
      ORDER_ID,
      { body: "khong phai cua toi" },
    );
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(commentRepoMocks.insertComment.mock.calls.length).toBe(0);
  });

  test("empty and overlong bodies are rejected", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    for (const body of ["", "   ", "x".repeat(1001)]) {
      expect(
        await addComment(customer, "booking", BOOKING_ID, { body }),
      ).toMatchObject({ ok: false, status: 400 });
    }
    expect(commentRepoMocks.insertComment.mock.calls.length).toBe(0);
  });
});
