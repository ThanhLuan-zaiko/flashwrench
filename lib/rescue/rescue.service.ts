// Business logic behind POST /api/rescue: validate guest input, persist
// one atomic batch, then auto-offer the nearest mechanic. Services call
// repositories, never the ScyllaDB client. Guests and logged-in customers
// share this path; the caller links its user id when one exists.
import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import { publishRescueChange } from "@/lib/realtime/domain-publish";
import { resolveZoneForPoint } from "@/lib/zones/zone.service";
import { insertRescueRequest } from "./rescue.repository";
import type {
  CreatedRescue,
  CreateRescueInput,
  RescueResult,
} from "./rescue.types";
import { validateCreateRescueInput } from "./rescue.validation";
import { autoDispatchRescue } from "./rescue-dispatch.service";

export const RESCUE_INITIAL_STATUS = "open";
export const RESCUE_DEFAULT_PRIORITY = "normal";
export const RESCUE_HIGH_PRIORITY = "high";

function priorityForIssue(issueType: string): string {
  if (issueType === "accident") return RESCUE_HIGH_PRIORITY;
  return RESCUE_DEFAULT_PRIORITY;
}

export async function createRescueRequest(
  customer: Pick<PublicUser, "id"> | null,
  raw: CreateRescueInput,
): Promise<RescueResult<CreatedRescue>> {
  const checked = validateCreateRescueInput(raw);
  if ("errors" in checked) {
    return { ok: false, status: 400, errors: checked.errors };
  }
  const value = checked.value;

  const now = new Date();
  const requestId = randomUUID();
  const status = RESCUE_INITIAL_STATUS;
  const priority = priorityForIssue(value.issueType);

  // A pinned point resolves to its service zone so the zone topic and
  // the dispatcher bucket work; without a pin the rescue broadcasts.
  // Zone lookup is best-effort and never blocks the rescue itself.
  let zoneId: string | null = null;
  if (value.lat !== null && value.lng !== null) {
    try {
      zoneId = await resolveZoneForPoint({ lat: value.lat, lng: value.lng });
    } catch {
      zoneId = null;
    }
  }

  await insertRescueRequest({
    requestId,
    customerId: customer?.id ?? null,
    customerName: value.fullName,
    customerPhone: value.phone,
    customerEmail: value.email,
    vehiclePlate: value.vehiclePlate,
    vehicleBrand: value.vehicleBrand,
    vehicleModel: value.vehicleModel,
    zoneId,
    address: {
      province: value.province,
      district: value.district,
      ward: value.ward,
      street: value.street,
      full_text: value.address,
      lat: value.lat,
      lng: value.lng,
    },
    issueType: value.issueType,
    description: value.description,
    priority,
    status,
    createdAt: now,
    updatedAt: now,
  });

  // Auto-offer runs the dispatcher assign step immediately so the
  // nearest eligible mechanic gets a 30s offer. A dispatch failure must
  // never fail a rescue that already persisted: it stays open for a human.
  // The created signal always reaches the operations board so dispatchers
  // monitor every rescue in parallel even when no mechanic is free.
  let assignedMechanicId: string | null = null;
  let assignedMechanicName: string | null = null;
  let offerExpiresAt: string | null = null;
  try {
    await publishRescueChange(
      "rescue-created",
      requestId,
      status,
      customer?.id ?? null,
      [],
      zoneId,
    );
  } catch {
    // Best-effort: the rescue already persisted.
  }
  try {
    const dispatched = await autoDispatchRescue(requestId);
    if (dispatched) {
      assignedMechanicId = dispatched.mechanicId;
      assignedMechanicName = dispatched.mechanicName;
      offerExpiresAt = dispatched.offerExpiresAt;
    }
  } catch {
    // Left open for the dispatcher queue.
  }

  return {
    ok: true,
    data: {
      requestId,
      status: assignedMechanicId ? "dispatched" : status,
      issueType: value.issueType,
      priority,
      vehiclePlate: value.vehiclePlate,
      address: value.address,
      customerName: value.fullName,
      customerPhone: value.phone,
      createdAt: now.toISOString(),
      assignedMechanicId,
      assignedMechanicName,
      offerExpiresAt,
    },
  };
}
