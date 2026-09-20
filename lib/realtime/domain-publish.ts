import {
  bookingTopic,
  type DomainEvent,
  OPERATIONS_TOPIC,
  userTopic,
} from "./protocol";
import { publishRealtimeEvent } from "./publish";

export async function publishBookingChange(
  kind: DomainEvent["kind"],
  bookingId: string,
  status: string,
  customerId: string | null,
  mechanicIds: (string | null)[],
): Promise<void> {
  const topics = new Set([bookingTopic(bookingId), OPERATIONS_TOPIC]);
  if (customerId) topics.add(userTopic(customerId));
  for (const id of mechanicIds) if (id) topics.add(userTopic(id));
  await Promise.all(
    [...topics].map((topic) =>
      publishRealtimeEvent(topic, { kind, bookingId, status }),
    ),
  );
}
