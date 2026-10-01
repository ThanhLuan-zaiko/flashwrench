import { describe, expect, test } from "bun:test";
import {
  clearRescueDraft,
  hasRescueDraftContent,
  persistRescueDraft,
  RESCUE_DRAFT_KEY,
  type RescueDraft,
  readRescueDraft,
  writeRescueDraft,
} from "@/components/rescue/rescue-draft";
import {
  emptyRescueAddress,
  emptyRescueVehicle,
} from "@/components/rescue/rescue-form-state";

// Draft persistence behind /rescue: pure storage plumbing with a fake
// Storage — no DOM, no mocks.
function fakeStorage(initial?: Record<string, string>) {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    has: (key: string) => map.has(key),
  };
}

function emptyDraft(): RescueDraft {
  return {
    fullName: "",
    phone: "",
    email: "",
    issueType: "",
    description: "",
    coords: null,
    address: emptyRescueAddress(),
    vehicle: emptyRescueVehicle(),
  };
}

function makeDraft(overrides?: Partial<RescueDraft>): RescueDraft {
  return {
    ...emptyDraft(),
    fullName: "Nguyen Van An",
    phone: "0912345678",
    email: "an@example.com",
    issueType: "flat_tire",
    coords: { lat: 10.7769, lng: 106.7009 },
    address: { ...emptyRescueAddress(), address: "123 Nguyen Trai" },
    vehicle: { ...emptyRescueVehicle(), vehiclePlate: "51F-12345" },
    ...overrides,
  };
}

describe("rescue draft round-trip", () => {
  test("persists and restores a filled form", () => {
    const storage = fakeStorage();
    const draft = makeDraft();
    persistRescueDraft(storage, draft);

    expect(storage.has(RESCUE_DRAFT_KEY)).toBe(true);
    expect(readRescueDraft(storage)).toEqual(draft);
  });

  test("a draft without a map pin restores with null coords", () => {
    const storage = fakeStorage();
    persistRescueDraft(storage, makeDraft({ coords: null }));

    const restored = readRescueDraft(storage);
    expect(restored?.coords).toBeNull();
    expect(restored?.fullName).toBe("Nguyen Van An");
  });

  test("persisting an empty form frees the key", () => {
    const storage = fakeStorage();
    persistRescueDraft(storage, makeDraft());
    persistRescueDraft(storage, emptyDraft());

    expect(storage.has(RESCUE_DRAFT_KEY)).toBe(false);
    expect(readRescueDraft(storage)).toBeNull();
  });

  test("a submitted request clears the draft so sent info never restores", () => {
    const storage = fakeStorage();
    persistRescueDraft(storage, makeDraft());
    clearRescueDraft(storage);
    expect(readRescueDraft(storage)).toBeNull();
  });
});

describe("readRescueDraft", () => {
  test("returns null when nothing is stored", () => {
    expect(readRescueDraft(fakeStorage())).toBeNull();
  });

  test("drops malformed JSON and wrong shapes instead of half-restoring", () => {
    expect(
      readRescueDraft(fakeStorage({ [RESCUE_DRAFT_KEY]: "{not-json" })),
    ).toBeNull();
    expect(
      readRescueDraft(
        fakeStorage({
          [RESCUE_DRAFT_KEY]: JSON.stringify({ v: 2, draft: {} }),
        }),
      ),
    ).toBeNull();
    expect(
      readRescueDraft(
        fakeStorage({
          [RESCUE_DRAFT_KEY]: JSON.stringify({
            v: 1,
            draft: { fullName: 42, phone: "09" },
          }),
        }),
      ),
    ).toBeNull();
  });

  test("drops drafts whose pin is not a valid point", () => {
    const stored = fakeStorage({
      [RESCUE_DRAFT_KEY]: JSON.stringify({
        v: 1,
        draft: { ...makeDraft(), coords: { lat: "x", lng: 106 } },
      }),
    });
    expect(readRescueDraft(stored)).toBeNull();
  });

  test("storage that throws reads as empty instead of breaking the form", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(readRescueDraft(broken)).toBeNull();
    expect(() => writeRescueDraft(broken, makeDraft())).not.toThrow();
    expect(() => clearRescueDraft(broken)).not.toThrow();
    expect(() => persistRescueDraft(broken, makeDraft())).not.toThrow();
  });
});

describe("hasRescueDraftContent", () => {
  test("empty drafts are not worth restoring", () => {
    expect(hasRescueDraftContent(emptyDraft())).toBe(false);
  });

  test("any filled field counts", () => {
    expect(hasRescueDraftContent(makeDraft({ fullName: "" }))).toBe(true);
    expect(hasRescueDraftContent({ ...emptyDraft(), issueType: "other" })).toBe(
      true,
    );
  });
});
