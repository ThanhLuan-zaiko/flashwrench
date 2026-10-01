// Chat domain events fan out on the participants' private `user:{id}`
// topics — never on a thread topic, because topic auth cannot express
// "exactly these two members". Payloads carry ids only; clients refetch
// the message body through the authenticated REST API.
import type { DomainEvent } from "@/lib/realtime/domain-events";
import { userTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";

async function publishToUsers(
  userIds: string[],
  event: DomainEvent,
): Promise<void> {
  await Promise.all(
    userIds.map((userId) => publishRealtimeEvent(userTopic(userId), event)),
  );
}

export async function publishChatMessage(args: {
  threadId: string;
  messageId: string;
  senderId: string;
  recipientIds: string[];
}): Promise<void> {
  await publishToUsers(args.recipientIds, {
    kind: "chat-message",
    threadId: args.threadId,
    messageId: args.messageId,
    senderId: args.senderId,
  });
}

export async function publishChatRead(args: {
  threadId: string;
  readerId: string;
  recipientIds: string[];
}): Promise<void> {
  await publishToUsers(args.recipientIds, {
    kind: "chat-read",
    threadId: args.threadId,
    senderId: args.readerId,
  });
}
