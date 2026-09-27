import {
  bookingTopic,
  type DomainEvent,
  emergencyZoneTopic,
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

// Rescue fan-out for parallel dispatcher monitoring: operations board
// plus the offered mechanic inbox, the owner when logged in, and the
// zone topic when the rescue carries one.
export async function publishRescueChange(
  kind: Extract<DomainEvent["kind"], `rescue-${string}`>,
  requestId: string,
  status: string,
  customerId: string | null,
  mechanicIds: (string | null)[],
  zoneId: string | null,
): Promise<void> {
  const topics = new Set([OPERATIONS_TOPIC]);
  if (customerId) topics.add(userTopic(customerId));
  for (const id of mechanicIds) if (id) topics.add(userTopic(id));
  if (zoneId) topics.add(emergencyZoneTopic(zoneId));
  await Promise.all(
    [...topics].map((topic) =>
      publishRealtimeEvent(topic, { kind, rescueId: requestId, status }),
    ),
  );
}
