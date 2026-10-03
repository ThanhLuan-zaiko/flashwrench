// Chat attachment guards: image/location validation, fixed previews,
// publish-after-persist, and proof that rejections touch no storage.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { makeUserRow } from "../helpers/auth.fixtures";
import {
  chatRealtimeMocks,
  chatRepoMocks,
  chatStubs,
  chatUserRepoMocks,
  makeInboxRow,
  resetChatMocks,
} from "../helpers/chat.mocks";
import {
  CUSTOMER_ID,
  MECHANIC_ID,
  MECHANIC_OTHER_ID,
} from "../helpers/mechanic.fixtures";

// Helpers first, mocks second, system under test last.
mock.module("@/lib/chat/chat.repository", () => chatRepoMocks);
mock.module("@/lib/chat/chat-realtime", () => chatRealtimeMocks);
mock.module("@/lib/auth/user.repository", () => chatUserRepoMocks);

import {
  sendChatContentMessage,
  sendChatMessage,
} from "@/lib/chat/chat-messages.service";

const THREAD_ID = "dddddddd-2222-4222-8222-dddddddddddd";
const IMAGE_URL = "/api/media/misc/2026-10/a1b2c3d4.webp";

const customer = { id: CUSTOMER_ID, role: "customer" as const };
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
}

beforeEach(() => {
  resetChatMocks();
  seedUsers();
  seedInbox(CUSTOMER_ID, MECHANIC_ID);
});

describe("sendChatContentMessage", () => {
  test("image message persists with the fixed preview and publishes", async () => {
    const result = await sendChatContentMessage(customer, THREAD_ID, {
      kind: "image",
      body: IMAGE_URL,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.kind).toBe("image");
    expect(result.data.body).toBe(IMAGE_URL);
    expect(chatStubs.insertedMessages).toHaveLength(1);
    expect(chatStubs.insertedMessages[0].kind).toBe("image");
    expect(chatStubs.upsertedInbox[0].lastMessagePreview).toBe(
      "Đã gửi một hình ảnh",
    );
    expect(chatStubs.publishedMessages).toHaveLength(1);
    expect(chatStubs.publishedMessages[0].threadId).toBe(THREAD_ID);
  });

  test("location message normalizes the fix and publishes", async () => {
    const result = await sendChatContentMessage(customer, THREAD_ID, {
      kind: "location",
      body: " 10.762622, 106.660172 ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.kind).toBe("location");
    expect(result.data.body).toBe("10.762622,106.660172");
    expect(chatStubs.upsertedInbox[0].lastMessagePreview).toBe(
      "Đã chia sẻ vị trí",
    );
    expect(chatStubs.publishedMessages).toHaveLength(1);
  });

  test("legacy text sender still trims and persists", async () => {
    const result = await sendChatMessage(customer, THREAD_ID, "  chào thợ  ");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.kind).toBe("text");
    expect(result.data.body).toBe("chào thợ");
    expect(chatStubs.insertedMessages).toHaveLength(1);
  });

  test("rejections never reach storage, inbox or realtime", async () => {
    const bad = [
      { kind: "video", body: "x" },
      { kind: "image", body: "https://cdn.example/a.jpg" },
      { kind: "image", body: "data:image/png;base64,aaa" },
      { kind: "location", body: "91,0" },
      { kind: "location", body: "not-a-place" },
      { kind: "text", body: "   " },
    ];
    for (const input of bad) {
      const result = await sendChatContentMessage(customer, THREAD_ID, input);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.status).toBe(400);
    }
    expect(chatStubs.insertedMessages).toHaveLength(0);
    expect(chatStubs.upsertedInbox).toHaveLength(0);
    expect(chatStubs.publishedMessages).toHaveLength(0);
  });

  test("non-members cannot write attachments", async () => {
    const result = await sendChatContentMessage(outsider, THREAD_ID, {
      kind: "image",
      body: IMAGE_URL,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(chatStubs.insertedMessages).toHaveLength(0);
    expect(chatStubs.publishedMessages).toHaveLength(0);
  });
});
