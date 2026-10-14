import {
  bookingTopic,
  bookingTrackTopic,
  type DomainEvent,
  emergencyZoneTopic,
  OPERATIONS_TOPIC,
  orderTopic,
  rescueTopic,
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
  const topics = new Set([
    bookingTopic(bookingId),
    bookingTrackTopic(bookingId),
    OPERATIONS_TOPIC,
  ]);
  if (customerId) topics.add(userTopic(customerId));
  for (const id of mechanicIds) if (id) topics.add(userTopic(id));
  await Promise.all(
    [...topics].map((topic) =>
      publishRealtimeEvent(topic, { kind, bookingId, status }),
    ),
  );
}

// Rescue fan-out for parallel dispatcher monitoring: operations board
// plus the offered mechanic inbox, the owner when logged in, and the
// zone topic when the rescue carries one. The public rescue topic keeps
// guest /track pages live without a login (id is the capability).
export async function publishRescueChange(
  kind: Extract<DomainEvent["kind"], `rescue-${string}`>,
  requestId: string,
  status: string,
  customerId: string | null,
  mechanicIds: (string | null)[],
  zoneId: string | null,
): Promise<void> {
  const topics = new Set([OPERATIONS_TOPIC, rescueTopic(requestId)]);
  if (customerId) topics.add(userTopic(customerId));
  for (const id of mechanicIds) if (id) topics.add(userTopic(id));
  if (zoneId) topics.add(emergencyZoneTopic(zoneId));
  await Promise.all(
    [...topics].map((topic) =>
      publishRealtimeEvent(topic, { kind, rescueId: requestId, status }),
    ),
  );
}

// Order fan-out: operations board plus the owner inbox when logged in,
// plus the public order topic so guest /track/order pages refresh live.
// The id is the capability, matching the public HTTP tracking endpoint.
export async function publishOrderChange(
  orderId: string,
  status: string,
  customerId: string | null,
): Promise<void> {
  await Promise.all([
    publishRealtimeEvent(OPERATIONS_TOPIC, {
      kind: "orders-updated",
      updatedAt: new Date().toISOString(),
    }),
    publishRealtimeEvent(orderTopic(orderId), {
      kind: "order-updated",
      orderId,
      status,
    }),
    ...(customerId
      ? [
          publishRealtimeEvent(userTopic(customerId), {
            kind: "order-updated",
            orderId,
            status,
          }),
        ]
      : []),
  ]);
}
