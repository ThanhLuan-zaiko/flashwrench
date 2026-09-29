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
  makeCommentLookupRow,
  resetFeedbackMocks,
} from "../helpers/feedback.mocks";
import { makeBookingRow } from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { makeOrderRow } from "../helpers/parts.fixtures";
import {
  orderRepoMocks,
  orderStubs,
  partRepoMocks,
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

import { moderateComment } from "@/lib/comments/comment-moderation.service";

const CUSTOMER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const OTHER_ID = "99999999-9999-4999-8999-999999999999";
const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const BOOKING_ID = "11111111-1111-1111-1111-111111111111";
const COMPLAINT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const COMMENT_ID = "78787878-7878-4787-8787-787878787878";

const customer = makePublicUser({ id: CUSTOMER_ID, role: "customer" });
const mechanic = makePublicUser({ role: "mechanic" });
const admin = makePublicUser({ id: OTHER_ID, role: "admin" });
const dispatcher = makePublicUser({ id: OTHER_ID, role: "dispatcher" });

beforeEach(() => {
  resetFeedbackMocks();
  resetComplaintMocks();
  resetMechanicMocks();
  resetPartsMocks();
  resetRescueMocks();
  resetRouteMocks();
  feedbackStubs.commentLookup = makeCommentLookupRow({
    comment_id: COMMENT_ID,
    target_type: "part",
    target_id: PART_ID,
  });
});

describe("moderateComment authorization", () => {
  test("customers and mechanics cannot moderate", async () => {
    for (const actor of [customer, mechanic]) {
      const result = await moderateComment(actor, COMMENT_ID, {
        action: "hide",
      });
      expect(result).toMatchObject({ ok: false, status: 403 });
    }
    expect(commentRepoMocks.setCommentHidden.mock.calls.length).toBe(0);
    // Role check happens before any lookup.
    expect(commentRepoMocks.findCommentLookup.mock.calls.length).toBe(0);
  });

  test("complaint comments stay admin-only", async () => {
    feedbackStubs.commentLookup = makeCommentLookupRow({
      target_type: "complaint",
      target_id: COMPLAINT_ID,
    });
    complaintStubs.complaintById = makeComplaintRow({
      complaint_id: COMPLAINT_ID,
      reporter_user_id: CUSTOMER_ID,
    });
    expect(
      await moderateComment(dispatcher, COMMENT_ID, { action: "hide" }),
    ).toMatchObject({ ok: false, status: 403 });
    expect(
      await moderateComment(admin, COMMENT_ID, { action: "hide" }),
    ).toMatchObject({ ok: true, data: { hidden: true } });
  });
});

describe("moderateComment behavior", () => {
  test("admin hides and unhides a part comment with realtime fan-out", async () => {
    const hide = await moderateComment(admin, COMMENT_ID, { action: "hide" });
    expect(hide).toMatchObject({
      ok: true,
      data: { id: COMMENT_ID, hidden: true },
    });
    const write = commentRepoMocks.setCommentHidden.mock.calls[0]?.[0] as {
      hidden: boolean;
      staffId: string;
    };
    expect(write.hidden).toBe(true);
    expect(write.staffId).toBe(OTHER_ID);
    // Product viewers get a live refresh, not the staff operations board.
    expect(
      realtimePublishMocks.publishRealtimeEvent.mock.calls.map((c) => c[0]),
    ).toEqual([`part:${PART_ID}`]);

    commentRepoMocks.setCommentHidden.mockClear();
    realtimePublishMocks.publishRealtimeEvent.mockClear();
    feedbackStubs.commentHidden = true;
    const unhide = await moderateComment(admin, COMMENT_ID, {
      action: "unhide",
    });
    expect(unhide).toMatchObject({ ok: true, data: { hidden: false } });
    expect(
      (
        commentRepoMocks.setCommentHidden.mock.calls[0]?.[0] as {
          hidden: boolean;
        }
      ).hidden,
    ).toBe(false);
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(1);
  });

  test("dispatcher can hide a booking comment; staff + owner get notified", async () => {
    feedbackStubs.commentLookup = makeCommentLookupRow({
      target_type: "booking",
      target_id: BOOKING_ID,
    });
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    const result = await moderateComment(dispatcher, COMMENT_ID, {
      action: "hide",
    });
    expect(result).toMatchObject({ ok: true, data: { hidden: true } });
    const topics = realtimePublishMocks.publishRealtimeEvent.mock.calls.map(
      (call) => call[0],
    );
    expect(topics).toContain("operations");
    expect(topics).toContain(`user:${CUSTOMER_ID}`);
  });

  test("hiding a reply decrements the parent's reply_count", async () => {
    const PARENT_ID = "55555555-5555-4555-8555-555555555555";
    feedbackStubs.commentLookup = makeCommentLookupRow({
      comment_id: COMMENT_ID,
      parent_id: PARENT_ID,
    });
    feedbackStubs.replyCount = 2;
    const result = await moderateComment(dispatcher, COMMENT_ID, {
      action: "hide",
    });
    expect(result).toMatchObject({ ok: true });
    expect(commentRepoMocks.updateReplyCount.mock.calls.length).toBe(1);
    const countCall = commentRepoMocks.updateReplyCount.mock.calls[0];
    expect(countCall?.[4]).toBe(1);
    // The parent was located through the lookup table, then back-filled.
    expect(commentRepoMocks.findCommentLookup.mock.calls.at(-1)?.[0]).toBe(
      PARENT_ID,
    );
  });

  test("repeating the same action is a no-op", async () => {
    feedbackStubs.commentHidden = true;
    const result = await moderateComment(admin, COMMENT_ID, {
      action: "hide",
    });
    expect(result).toMatchObject({ ok: true, data: { hidden: true } });
    expect(commentRepoMocks.setCommentHidden.mock.calls.length).toBe(0);
    // Still announces so moderators' lists re-sync.
    expect(realtimePublishMocks.publishRealtimeEvent.mock.calls.length).toBe(1);
  });

  test("rejects bad input and unknown comments", async () => {
    expect(
      await moderateComment(admin, "nope", { action: "hide" }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await moderateComment(admin, COMMENT_ID, { action: "nuke" }),
    ).toMatchObject({ ok: false, status: 400 });
    feedbackStubs.commentLookup = null;
    expect(
      await moderateComment(admin, COMMENT_ID, { action: "hide" }),
    ).toMatchObject({ ok: false, status: 404 });
  });

  test("legacy rows resolve through the target hint and backfill the index", async () => {
    feedbackStubs.commentLookup = null;
    feedbackStubs.topLevelLocation = makeCommentLookupRow({
      comment_id: COMMENT_ID,
      target_type: "part",
      target_id: PART_ID,
    });
    const result = await moderateComment(admin, COMMENT_ID, {
      action: "hide",
      targetType: "part",
      targetId: PART_ID,
    });
    expect(result).toMatchObject({ ok: true, data: { hidden: true } });
    expect(commentRepoMocks.findTopLevelLocation.mock.calls.length).toBe(1);
    expect(commentRepoMocks.indexCommentLookup.mock.calls.length).toBe(1);
  });

  test("order comment moderation notifies the owner topic", async () => {
    feedbackStubs.commentLookup = makeCommentLookupRow({
      target_type: "order",
      target_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    });
    orderStubs.orderById = makeOrderRow({ customer_id: CUSTOMER_ID });
    const result = await moderateComment(admin, COMMENT_ID, { action: "hide" });
    expect(result).toMatchObject({ ok: true });
    const topics = realtimePublishMocks.publishRealtimeEvent.mock.calls.map(
      (call) => call[0],
    );
    expect(topics).toContain(`user:${CUSTOMER_ID}`);
  });
});
