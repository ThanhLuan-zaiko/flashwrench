import type { AddressValues } from "./BookingAddressSection";
import type { VehicleValues } from "./BookingVehicleSection";
import type { MapPoint } from "./MapPicker";

// Draft persistence for the booking form: every field that can hold
// typed input is mirrored to sessionStorage so an accidental refresh,
// tab close or login round-trip restores instead of losing work.
// sessionStorage is tab-scoped, so a stale draft can never surface on
// another visit days later; storage access is best-effort and never
// throws into the form.
export const BOOKING_DRAFT_KEY = "flashwrench-booking-draft";
export const BOOKING_DRAFT_TTL_MS = 30 * 60 * 1000;

export type BookingDraft = {
  contact: { fullName: string; phone: string; email: string };
  scheduledAt: string;
  coords: MapPoint | null;
  address: AddressValues;
  vehicle: VehicleValues;
  voucherCode: string;
};

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const CONTACT_KEYS = ["fullName", "phone", "email"] as const;
const ADDRESS_KEYS: readonly (keyof AddressValues)[] = [
  "address",
  "province",
  "district",
  "ward",
  "street",
];
const VEHICLE_KEYS: readonly (keyof VehicleValues)[] = [
  "vehiclePlate",
  "vehicleBrand",
  "vehicleModel",
  "notes",
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
// version, missing key, wrong type, stale or future timestamp) drops
// the whole draft — a partial restore would put values into the wrong
// fields.
export function toBookingDraft(raw: unknown, now: number): BookingDraft | null {
  if (typeof raw !== "object" || raw === null) return null;
  const envelope = raw as { v?: unknown; savedAt?: unknown; draft?: unknown };
  if (envelope.v !== 1 || typeof envelope.savedAt !== "number") return null;
  const savedAt = envelope.savedAt;
  if (!Number.isFinite(savedAt)) return null;
  // Clock skew tolerance only — a savedAt beyond that means the envelope
  // was written by another clock and its age cannot be trusted.
  if (savedAt > now + 60_000 || now - savedAt > BOOKING_DRAFT_TTL_MS) {
    return null;
  }
  if (typeof envelope.draft !== "object" || envelope.draft === null) {
    return null;
  }
  const draft = envelope.draft as Record<string, unknown>;
  if (
    typeof draft.scheduledAt !== "string" ||
    typeof draft.voucherCode !== "string" ||
    !isStringMap(draft.contact, CONTACT_KEYS) ||
    !isStringMap(draft.address, ADDRESS_KEYS) ||
    !isStringMap(draft.vehicle, VEHICLE_KEYS)
  ) {
    return null;
  }
  const coords = toPoint(draft.coords);
  if (coords === undefined) return null;
  const contact = draft.contact;
  const address = draft.address;
  const vehicle = draft.vehicle;
  return {
    contact: {
      fullName: contact.fullName,
      phone: contact.phone,
      email: contact.email,
    },
    scheduledAt: draft.scheduledAt,
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
      notes: vehicle.notes,
    },
    voucherCode: draft.voucherCode,
  };
}

// scheduledAt always carries a default, so it alone never counts as
// content — otherwise every visit would restore an empty form.
export function hasBookingDraftContent(draft: BookingDraft): boolean {
  return (
    Object.values(draft.contact).some((value) => value.trim() !== "") ||
    Object.values(draft.address).some((value) => value.trim() !== "") ||
    Object.values(draft.vehicle).some((value) => value.trim() !== "") ||
    draft.voucherCode.trim() !== "" ||
    draft.coords !== null
  );
}

export function readBookingDraft(
  storage: DraftStorage,
  now = Date.now(),
): BookingDraft | null {
  try {
    const raw = storage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    return toBookingDraft(JSON.parse(raw), now);
  } catch {
    return null;
  }
}

// The stored object is built explicitly, field by field — never spread
// the caller's objects, so stray keys (passwords!) can never reach
// storage.
export function writeBookingDraft(
  storage: DraftStorage,
  draft: BookingDraft,
  now = Date.now(),
): void {
  try {
    const stored: BookingDraft = {
      contact: {
        fullName: draft.contact.fullName,
        phone: draft.contact.phone,
        email: draft.contact.email,
      },
      scheduledAt: draft.scheduledAt,
      coords: draft.coords
        ? { lat: draft.coords.lat, lng: draft.coords.lng }
        : null,
      address: {
        address: draft.address.address,
        province: draft.address.province,
        district: draft.address.district,
        ward: draft.address.ward,
        street: draft.address.street,
      },
      vehicle: {
        vehiclePlate: draft.vehicle.vehiclePlate,
        vehicleBrand: draft.vehicle.vehicleBrand,
        vehicleModel: draft.vehicle.vehicleModel,
        notes: draft.vehicle.notes,
      },
      voucherCode: draft.voucherCode,
    };
    storage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({ v: 1, savedAt: now, draft: stored }),
    );
  } catch {
    // Storage blocked or full — the draft is best-effort, never fatal.
  }
}

export function clearBookingDraft(storage: DraftStorage): void {
  try {
    storage.removeItem(BOOKING_DRAFT_KEY);
  } catch {
    // Ignore — nothing stored or storage unavailable.
  }
}

// Keep-or-clear in one place: an emptied form frees the key instead of
// leaving an "{}" draft behind that reads as a false restore.
export function persistBookingDraft(
  storage: DraftStorage,
  draft: BookingDraft,
  now = Date.now(),
): void {
  if (hasBookingDraftContent(draft)) {
    writeBookingDraft(storage, draft, now);
  } else {
    clearBookingDraft(storage);
  }
}
