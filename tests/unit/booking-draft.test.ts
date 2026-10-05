// Booking draft persistence: envelope validation, TTL, content check
// and best-effort storage. Pure — nothing touches the DOM or React.
import { describe, expect, test } from "bun:test";
import {
  BOOKING_DRAFT_KEY,
  BOOKING_DRAFT_TTL_MS,
  type BookingDraft,
  clearBookingDraft,
  hasBookingDraftContent,
  persistBookingDraft,
  readBookingDraft,
  toBookingDraft,
  writeBookingDraft,
} from "@/components/booking/booking-draft";

const NOW = 1_760_000_000_000;

function makeDraft(overrides?: Partial<BookingDraft>): BookingDraft {
  return {
    contact: { fullName: "", phone: "", email: "" },
    scheduledAt: "2026-10-05T09:00",
    coords: null,
    address: {
      address: "",
      province: "",
      district: "",
      ward: "",
      street: "",
    },
    vehicle: {
      vehiclePlate: "",
      vehicleBrand: "",
      vehicleModel: "",
      notes: "",
    },
    voucherCode: "",
    ...overrides,
  };
}

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

function throwingStorage() {
  return {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
    removeItem: () => {
      throw new Error("blocked");
    },
  };
}

describe("booking draft round-trip", () => {
  test("write then read restores every field", () => {
    const storage = memoryStorage();
    const draft = makeDraft({
      contact: { fullName: "Nguyen Van A", phone: "0901", email: "a@x.vn" },
      coords: { lat: 10.7, lng: 106.6 },
      voucherCode: "GIAM50K",
    });
    draft.vehicle.notes = "Xe kêu lạ";
    writeBookingDraft(storage, draft, NOW);
    expect(readBookingDraft(storage, NOW)).toEqual(draft);
  });

  test("expired drafts and future timestamps read as null", () => {
    const storage = memoryStorage();
    writeBookingDraft(storage, makeDraft({ voucherCode: "ABC123" }), NOW);
    expect(
      readBookingDraft(storage, NOW + BOOKING_DRAFT_TTL_MS + 1),
    ).toBeNull();
    // A savedAt far in the future cannot be trusted.
    storage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({ v: 1, savedAt: NOW + 61_000, draft: makeDraft() }),
    );
    expect(readBookingDraft(storage, NOW)).toBeNull();
  });

  test("shape drift drops the whole draft", () => {
    const draft = makeDraft();
    expect(toBookingDraft({ v: 2, savedAt: NOW, draft }, NOW)).toBeNull();
    expect(
      toBookingDraft(
        {
          v: 1,
          savedAt: NOW,
          draft: { ...draft, vehicle: { vehiclePlate: "51A" } },
        },
        NOW,
      ),
    ).toBeNull(); // missing vehicle.notes
    expect(
      toBookingDraft(
        {
          v: 1,
          savedAt: NOW,
          draft: { ...draft, coords: { lat: "10", lng: 5 } },
        },
        NOW,
      ),
    ).toBeNull();
    const storage = memoryStorage();
    storage.setItem(BOOKING_DRAFT_KEY, "{broken");
    expect(readBookingDraft(storage, NOW)).toBeNull();
  });
});

describe("hasBookingDraftContent", () => {
  test("an empty draft with only the default slot is not content", () => {
    expect(hasBookingDraftContent(makeDraft())).toBe(false);
  });

  test("a typed code or pinned coords alone count", () => {
    expect(hasBookingDraftContent(makeDraft({ voucherCode: "GIAM50K" }))).toBe(
      true,
    );
    expect(
      hasBookingDraftContent(makeDraft({ coords: { lat: 1, lng: 2 } })),
    ).toBe(true);
  });
});

describe("persistBookingDraft", () => {
  test("an empty draft frees the key instead of writing an empty shell", () => {
    const storage = memoryStorage();
    writeBookingDraft(storage, makeDraft({ voucherCode: "ABC123" }), NOW);
    persistBookingDraft(storage, makeDraft(), NOW);
    expect(storage.getItem(BOOKING_DRAFT_KEY)).toBeNull();
  });
});

describe("storage hygiene", () => {
  test("the written payload never carries caller-side stray keys", () => {
    const storage = memoryStorage();
    const dirty = makeDraft({ voucherCode: "GIAM50K" }) as unknown as Record<
      string,
      unknown
    >;
    dirty.password = "secret";
    (dirty.vehicle as Record<string, unknown>).pin = "1234";
    writeBookingDraft(storage, dirty as unknown as BookingDraft, NOW);
    const raw = storage.getItem(BOOKING_DRAFT_KEY) ?? "";
    expect(raw).not.toContain("password");
    expect(raw).not.toContain("secret");
    expect(raw).not.toContain("pin");
  });

  test("a throwing storage degrades to a no-op", () => {
    const storage = throwingStorage();
    expect(readBookingDraft(storage, NOW)).toBeNull();
    expect(() =>
      writeBookingDraft(storage, makeDraft({ voucherCode: "ABC123" }), NOW),
    ).not.toThrow();
    expect(() => clearBookingDraft(storage)).not.toThrow();
  });
});
