import type { MapPoint } from "../booking/MapPicker";
import {
  isRescueFormDirty,
  type RescueAddressValues,
  type RescueVehicleValues,
} from "./rescue-form-state";

// Draft persistence for the public rescue form: every field that can
// hold typed input is mirrored to sessionStorage so an accidental
// refresh or tab close restores instead of warning. sessionStorage is
// tab-scoped, so a stale draft can never surface on another visit days
// later; storage access is best-effort and never throws into the form.
export const RESCUE_DRAFT_KEY = "flashwrench-rescue-draft";

export type RescueDraft = {
  fullName: string;
  phone: string;
  issueType: string;
  description: string;
  coords: MapPoint | null;
  address: RescueAddressValues;
  vehicle: RescueVehicleValues;
};

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const ADDRESS_KEYS: readonly (keyof RescueAddressValues)[] = [
  "address",
  "province",
  "district",
  "ward",
  "street",
];

const VEHICLE_KEYS: readonly (keyof RescueVehicleValues)[] = [
  "vehiclePlate",
  "vehicleBrand",
  "vehicleModel",
];

function isStringMap(
  value: unknown,
  keys: readonly string[],
): value is Record<string, string> {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return keys.every((key) => typeof record[key] === "string");
}

function toPoint(value: unknown): MapPoint | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return undefined;
  const { lat, lng } = value as Record<string, unknown>;
  if (typeof lat !== "number" || typeof lng !== "number") return undefined;
  return { lat, lng };
}

// Validates a stored envelope into a draft. Any shape drift (old
// version, missing key, wrong type) drops the whole draft — a partial
// restore would put values into the wrong fields.
export function toRescueDraft(raw: unknown): RescueDraft | null {
  if (typeof raw !== "object" || raw === null) return null;
  const envelope = raw as { v?: unknown; draft?: unknown };
  if (envelope.v !== 1 || typeof envelope.draft !== "object") return null;
  const draft = envelope.draft as Record<string, unknown> | null;
  if (draft === null) return null;
  if (
    typeof draft.fullName !== "string" ||
    typeof draft.phone !== "string" ||
    typeof draft.issueType !== "string" ||
    typeof draft.description !== "string" ||
    !isStringMap(draft.address, ADDRESS_KEYS) ||
    !isStringMap(draft.vehicle, VEHICLE_KEYS)
  ) {
    return null;
  }
  const coords = toPoint(draft.coords);
  if (coords === undefined) return null;
  const address = draft.address;
  const vehicle = draft.vehicle;
  return {
    fullName: draft.fullName,
    phone: draft.phone,
    issueType: draft.issueType,
    description: draft.description,
    coords,
    address: {
      address: address.address,
      province: address.province,
      district: address.district,
      ward: address.ward,
      street: address.street,
    },
    vehicle: {
      vehiclePlate: vehicle.vehiclePlate,
      vehicleBrand: vehicle.vehicleBrand,
      vehicleModel: vehicle.vehicleModel,
    },
  };
}

export function hasRescueDraftContent(draft: RescueDraft): boolean {
  return isRescueFormDirty({ ...draft, pending: false });
}

export function readRescueDraft(storage: DraftStorage): RescueDraft | null {
  try {
    const raw = storage.getItem(RESCUE_DRAFT_KEY);
    if (!raw) return null;
    return toRescueDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeRescueDraft(
  storage: DraftStorage,
  draft: RescueDraft,
): void {
  try {
    storage.setItem(RESCUE_DRAFT_KEY, JSON.stringify({ v: 1, draft }));
  } catch {
    // Storage blocked or full — the draft is best-effort, never fatal.
  }
}

export function clearRescueDraft(storage: DraftStorage): void {
  try {
    storage.removeItem(RESCUE_DRAFT_KEY);
  } catch {
    // Ignore — nothing stored or storage unavailable.
  }
}

// Keep-or-clear in one place: an emptied form frees the key instead of
// leaving an "{}" draft behind that reads as a false restore.
export function persistRescueDraft(
  storage: DraftStorage,
  draft: RescueDraft,
): void {
  if (hasRescueDraftContent(draft)) {
    writeRescueDraft(storage, draft);
  } else {
    clearRescueDraft(storage);
  }
}
