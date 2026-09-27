// Business logic behind POST /api/rescue: validate guest input, then
// persist one atomic batch. Services call repositories, never the
// ScyllaDB client. Guests and logged-in customers share this path;
// the caller links its user id when one exists.
import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import { insertRescueRequest } from "./rescue.repository";
import type {
  CreatedRescue,
  CreateRescueInput,
  RescueResult,
} from "./rescue.types";
import { validateCreateRescueInput } from "./rescue.validation";

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

  await insertRescueRequest({
    requestId,
    customerId: customer?.id ?? null,
    customerName: value.fullName,
    customerPhone: value.phone,
    vehiclePlate: value.vehiclePlate,
    vehicleBrand: value.vehicleBrand,
    vehicleModel: value.vehicleModel,
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

  return {
    ok: true,
    data: {
      requestId,
      status,
      issueType: value.issueType,
      priority,
      vehiclePlate: value.vehiclePlate,
      address: value.address,
      customerName: value.fullName,
      customerPhone: value.phone,
      createdAt: now.toISOString(),
    },
  };
}
