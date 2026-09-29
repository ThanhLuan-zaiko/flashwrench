import { beforeEach, describe, expect, mock, test } from "bun:test";
import { encodeCursor } from "@/lib/db/cursor";
import { makePublicUser } from "../helpers/auth.fixtures";
import {
  complaintRepoMocks,
  resetComplaintMocks,
} from "../helpers/complaint.mocks";
import {
  commentRepoMocks,
  feedbackStubs,
  makeCommentLookupRow,
  makeCommentRow,
  resetFeedbackMocks,
} from "../helpers/feedback.mocks";
import { makeBookingRow } from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";
import { makePartRow } from "../helpers/parts.fixtures";
import {
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
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module(
  "@/lib/rescue/rescue-workflow.repository",
  () => rescueWorkflowRepoMocks,
);
mock.module("@/lib/realtime/publish", () => realtimePublishMocks);

import { listReplies } from "@/lib/comments/comment-replies.service";
import { addComment, listComments } from "@/lib/comments/comments.service";

const PARENT_ID = "78787878-7878-4787-8787-787878787878";
const CUSTOMER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const BOOKING_ID = "11111111-1111-1111-1111-111111111111";
const PART_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
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

describe("hidden comment filtering", () => {
  test("public readers never see hidden comments", async () => {
    partStubs.partById = makePartRow({ part_id: PART_ID });
    feedbackStubs.commentPage = {
      rows: [
        makeCommentRow(),
        makeCommentRow({
          comment_id: "99999999-9999-4999-8999-999999999999",
          is_hidden: true,
        }),
      ],
      pageState: null,
    };
    const result = await listComments(null, "part", PART_ID, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0]?.hidden).toBe(false);
  });

  test("admin and dispatcher see hidden comments flagged", async () => {
    partStubs.partById = makePartRow({ part_id: PART_ID });
    feedbackStubs.commentPage = {
      rows: [makeCommentRow({ is_hidden: true })],
      pageState: null,
    };
    for (const viewer of [admin, staff]) {
      const result = await listComments(viewer, "part", PART_ID, null);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0]?.hidden).toBe(true);
    }
  });
});

describe("comment replies", () => {
  test("customer replies to a top-level comment on their booking", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    feedbackStubs.commentLookup = makeCommentLookupRow({
      comment_id: PARENT_ID,
      target_type: "booking",
      target_id: BOOKING_ID,
    });
    feedbackStubs.replyCount = 2;
    const result = await addComment(customer, "booking", BOOKING_ID, {
      body: "Cam on shop!",
      parentId: PARENT_ID,
    });
    expect(result.ok).toBe(true);
    expect(commentRepoMocks.insertReply.mock.calls.length).toBe(1);
    expect(commentRepoMocks.insertComment.mock.calls.length).toBe(0);
    expect(commentRepoMocks.updateReplyCount.mock.calls.length).toBe(1);
    expect(commentRepoMocks.indexCommentLookup.mock.calls.length).toBe(1);
    const write = commentRepoMocks.insertReply.mock.calls[0]?.[0] as {
      parentId: string;
    };
    expect(write.parentId).toBe(PARENT_ID);
    // Same realtime fan-out as a top-level booking comment.
    const topics = realtimePublishMocks.publishRealtimeEvent.mock.calls.map(
      (call) => call[0],
    );
    expect(topics).toContain("operations");
  });

  test("replies on part threads refresh the part topic", async () => {
    partStubs.partById = makePartRow({ part_id: PART_ID });
    feedbackStubs.commentLookup = makeCommentLookupRow();
    const result = await addComment(customer, "part", PART_ID, {
      body: "Tra loi",
      parentId: PARENT_ID,
    });
    expect(result.ok).toBe(true);
    const calls = realtimePublishMocks.publishRealtimeEvent.mock.calls;
    expect(calls.map((call) => call[0])).toEqual([`part:${PART_ID}`]);
  });

  test("a reply cannot receive a reply (one level only)", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    feedbackStubs.commentLookup = makeCommentLookupRow({
      comment_id: "12121212-1212-4121-8121-121212121212",
      target_type: "booking",
      target_id: BOOKING_ID,
      parent_id: PARENT_ID,
    });
    const result = await addComment(customer, "booking", BOOKING_ID, {
      body: "nested",
      parentId: "12121212-1212-4121-8121-121212121212",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(commentRepoMocks.insertReply.mock.calls.length).toBe(0);
  });

  test("replies must stay on the parent's thread", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    feedbackStubs.commentLookup = makeCommentLookupRow({
      target_type: "part",
      target_id: PART_ID,
    });
    const result = await addComment(customer, "booking", BOOKING_ID, {
      body: "cross thread",
      parentId: PARENT_ID,
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(commentRepoMocks.insertReply.mock.calls.length).toBe(0);
  });

  test("missing parents read as 404", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    feedbackStubs.commentLookup = null;
    const result = await addComment(customer, "booking", BOOKING_ID, {
      body: "reply to nothing",
      parentId: PARENT_ID,
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  test("malformed parent ids read as 400", async () => {
    mechanicStubs.bookingById = makeBookingRow({ customer_id: CUSTOMER_ID });
    const result = await addComment(customer, "booking", BOOKING_ID, {
      body: "reply",
      parentId: "not-a-uuid",
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(commentRepoMocks.findCommentLookup.mock.calls.length).toBe(0);
  });
});

describe("listReplies", () => {
  test("anonymous readers get replies of visible part comments", async () => {
    partStubs.partById = makePartRow({ part_id: PART_ID });
    feedbackStubs.commentLookup = makeCommentLookupRow();
    feedbackStubs.replyPage = {
      rows: [makeCommentRow({ body: "Reply one." })],
      pageState: "ps-1",
    };
    const result = await listReplies(null, PARENT_ID, null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(1);
    expect(result.data.nextCursor).not.toBeNull();
  });

  test("replies of a hidden comment are only visible to moderators", async () => {
    partStubs.partById = makePartRow({ part_id: PART_ID });
    feedbackStubs.commentLookup = makeCommentLookupRow();
    feedbackStubs.commentHidden = true;
    feedbackStubs.replyPage = { rows: [makeCommentRow()], pageState: null };
    expect(await listReplies(null, PARENT_ID, null)).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await listReplies(staff, PARENT_ID, null)).toMatchObject({
      ok: true,
    });
  });

  test("rejects replies-of-replies and malformed parents", async () => {
    feedbackStubs.commentLookup = makeCommentLookupRow({
      parent_id: OTHER_ID,
    });
    expect(await listReplies(null, PARENT_ID, null)).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await listReplies(null, "nope", null)).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  test("rejects cursors minted for another parent", async () => {
    partStubs.partById = makePartRow({ part_id: PART_ID });
    feedbackStubs.commentLookup = makeCommentLookupRow();
    const foreign = encodeCursor("ps-9", "replies:other-parent");
    expect(await listReplies(null, PARENT_ID, foreign)).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});
