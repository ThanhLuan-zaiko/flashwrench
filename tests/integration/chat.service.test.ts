// Chat service guards: booking-anchored thread opening, membership checks
// on every read/write, message validation, and publish-after-persist.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  chatRealtimeMocks,
  chatRepoMocks,
  chatStubs,
  chatUserRepoMocks,
  makeInboxRow,
  makeMessageRow,
  resetChatMocks,
} from "../helpers/chat.mocks";
import {
  BOOKING_ID,
  CUSTOMER_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
  makeBookingRow,
} from "../helpers/mechanic.fixtures";
import {
  mechanicBookingsRepoMocks,
  mechanicStubs,
  resetMechanicMocks,
} from "../helpers/mechanic.mocks";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/chat/chat.repository", () => chatRepoMocks);
mock.module("@/lib/chat/chat-realtime", () => chatRealtimeMocks);
mock.module("@/lib/auth/user.repository", () => chatUserRepoMocks);
mock.module(
  "@/lib/mechanic/mechanic-bookings.repository",
  () => mechanicBookingsRepoMocks,
);

import { listMyThreads, openThreadForBooking } from "@/lib/chat/chat.service";
import {
  listThreadMessages,
  markThreadRead,
  sendChatMessage,
} from "@/lib/chat/chat-messages.service";

const THREAD_ID = "dddddddd-2222-4222-8222-dddddddddddd";

const customer = { id: CUSTOMER_ID, role: "customer" as const };
const mechanic = { id: MECHANIC_ID, role: "mechanic" as const };
const outsider = { id: MECHANIC_OTHER_ID, role: "mechanic" as const };

function seedUsers() {
  chatStubs.usersById.set(
    CUSTOMER_ID,
    makeUserRow({ user_id: CUSTOMER_ID, role: "customer" }),
  );
  chatStubs.usersById.set(
    MECHANIC_ID,
    makeUserRow({ user_id: MECHANIC_ID, role: "mechanic" }),
  );
}

function seedInbox(userId: string, peerId: string) {
  const row = makeInboxRow({
    user_id: userId,
    thread_id: THREAD_ID,
    peer_id: peerId,
  });
  chatStubs.inboxByUser.set(`${userId}:${THREAD_ID}`, row);
  chatStubs.inboxRows.push(row);
  return row;
}

beforeEach(() => {
  resetChatMocks();
  resetMechanicMocks();
  seedUsers();
  mechanicStubs.bookingById = makeBookingRow();
});

describe("openThreadForBooking", () => {
  test("customer creates a thread for an assigned booking", async () => {
    const result = await openThreadForBooking(customer, BOOKING_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.peerId).toBe(MECHANIC_ID);
    expect(result.data.peerRole).toBe("mechanic");
    expect(chatStubs.insertedThreads).toHaveLength(1);
    expect(chatStubs.insertedThreads[0].customerId).toBe(CUSTOMER_ID);
    expect(chatStubs.insertedThreads[0].mechanicId).toBe(MECHANIC_ID);
    // Both participants get an inbox row.
    expect(chatStubs.upsertedInbox).toHaveLength(2);
  });

  test("mechanic opens the same pair and reuses the thread", async () => {
    const first = await openThreadForBooking(customer, BOOKING_ID);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    chatStubs.pairThreadId = first.data.id;
    const second = await openThreadForBooking(mechanic, BOOKING_ID);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.data.id).toBe(first.data.id);
    // No second thread row for the same pair.
    expect(chatStubs.insertedThreads).toHaveLength(1);
  });

  test("a stranger cannot open a thread on someone else's booking", async () => {
    const result = await openThreadForBooking(outsider, BOOKING_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(403);
    expect(chatStubs.insertedThreads).toHaveLength(0);
  });

  test("dispatcher and admin roles are rejected", async () => {
    for (const role of ["dispatcher", "admin"] as const) {
      const result = await openThreadForBooking(
        { id: CUSTOMER_ID, role },
        BOOKING_ID,
      );
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.status).toBe(403);
    }
    expect(chatStubs.insertedThreads).toHaveLength(0);
  });

  test("booking without an assigned mechanic cannot open a thread", async () => {
    mechanicStubs.bookingById = makeBookingRow({ mechanic_id: null });
    const result = await openThreadForBooking(customer, BOOKING_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  test("non-uuid booking ids are rejected before any lookup", async () => {
    const result = await openThreadForBooking(customer, "not-a-uuid");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(mechanicBookingsRepoMocks.findBookingRowById).not.toHaveBeenCalled();
  });
});

describe("listMyThreads", () => {
  test("returns the actor inbox sorted by latest activity", async () => {
    const older = makeInboxRow({
      user_id: CUSTOMER_ID,
      thread_id: "dddddddd-3333-4333-8333-dddddddddddd",
      peer_id: MECHANIC_ID,
      last_message_at: new Date("2026-09-16T08:00:00.000Z"),
      last_message_sender: MECHANIC_ID,
      // Already read — this thread must not count toward the badge.
      last_read_at: new Date("2026-09-16T09:00:00.000Z"),
    });
    const newer = makeInboxRow({
      user_id: CUSTOMER_ID,
      thread_id: THREAD_ID,
      peer_id: MECHANIC_ID,
      last_message_at: new Date("2026-09-16T10:00:00.000Z"),
      last_message_sender: MECHANIC_ID,
    });
    chatStubs.inboxRows.push(older, newer);
    const result = await listMyThreads(customer, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items[0].id).toBe(THREAD_ID);
    expect(result.data.unreadThreads).toBe(1);
  });

  test("unread counts only count the peer's messages", async () => {
    seedInbox(CUSTOMER_ID, MECHANIC_ID);
    chatStubs.unreadSenders = [MECHANIC_ID, MECHANIC_ID, CUSTOMER_ID];
    const result = await listMyThreads(customer, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items[0].unreadCount).toBe(2);
  });

  test("a forged cursor is rejected", async () => {
    const result = await listMyThreads(customer, { cursor: "forged.cursor" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });
});

describe("listThreadMessages", () => {
  test("members read paged history, newest first", async () => {
    seedInbox(CUSTOMER_ID, MECHANIC_ID);
    chatStubs.messagePage = {
      rows: [
        makeMessageRow({ message_id: "m2", sender_id: CUSTOMER_ID }),
        makeMessageRow({ message_id: "m1", sender_id: MECHANIC_ID }),
      ],
      pageState: null,
    };
    const result = await listThreadMessages(customer, THREAD_ID, {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(2);
    expect(result.data.items[0].mine).toBe(true);
    expect(result.data.items[1].mine).toBe(false);
  });

  test("non-members get 404 and no rows", async () => {
    chatStubs.messagePage = { rows: [makeMessageRow()], pageState: null };
    const result = await listThreadMessages(outsider, THREAD_ID, {});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(chatRepoMocks.listMessageRows).not.toHaveBeenCalled();
  });
});

describe("sendChatMessage", () => {
  test("member message persists then publishes to both participants", async () => {
    seedInbox(CUSTOMER_ID, MECHANIC_ID);
    const result = await sendChatMessage(customer, THREAD_ID, "  chào thợ  ");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.body).toBe("chào thợ");
    // Sender is derived from the authenticated actor, never the client.
    expect(chatStubs.insertedMessages).toHaveLength(1);
    expect(chatStubs.insertedMessages[0].senderId).toBe(CUSTOMER_ID);
    // Inbox bump for both sides + thread snapshot update.
    expect(chatStubs.upsertedInbox).toHaveLength(2);
    expect(chatRepoMocks.updateThreadSnapshot).toHaveBeenCalled();
    // Realtime fanout goes to peer and self (multi-device sync).
    expect(chatStubs.publishedMessages).toHaveLength(1);
    expect(chatStubs.publishedMessages[0].recipientIds).toContain(MECHANIC_ID);
    expect(chatStubs.publishedMessages[0].recipientIds).toContain(CUSTOMER_ID);
    expect(chatStubs.publishedMessages[0].threadId).toBe(THREAD_ID);
  });

  test("empty and oversized bodies never reach storage", async () => {
    seedInbox(CUSTOMER_ID, MECHANIC_ID);
    for (const body of ["   ", "x".repeat(2001)]) {
      const result = await sendChatMessage(customer, THREAD_ID, body);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.status).toBe(400);
    }
    expect(chatStubs.insertedMessages).toHaveLength(0);
    expect(chatStubs.publishedMessages).toHaveLength(0);
  });

  test("non-members cannot write or publish", async () => {
    const result = await sendChatMessage(outsider, THREAD_ID, "hello");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(chatStubs.insertedMessages).toHaveLength(0);
    expect(chatStubs.publishedMessages).toHaveLength(0);
  });
});

describe("markThreadRead", () => {
  test("member read stamp updates the row and notifies both sides", async () => {
    seedInbox(CUSTOMER_ID, MECHANIC_ID);
    const result = await markThreadRead(customer, THREAD_ID);
    expect(result.ok).toBe(true);
    expect(chatStubs.readMarks).toHaveLength(1);
    expect(chatStubs.readMarks[0].userId).toBe(CUSTOMER_ID);
    expect(chatStubs.publishedReads).toHaveLength(1);
    expect(chatStubs.publishedReads[0].recipientIds).toContain(MECHANIC_ID);
  });

  test("non-members cannot mark anything", async () => {
    const result = await markThreadRead(outsider, THREAD_ID);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(chatStubs.readMarks).toHaveLength(0);
  });
});
