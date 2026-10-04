import { describe, expect, test } from "bun:test";
import {
  BOOKING_SELECTION_KEY,
  createBookingSelectionStore,
} from "@/lib/booking/booking-selection-store";
import { decodeBookingServiceIds } from "@/lib/booking/booking-service-selection";

const FIRST_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECOND_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("service selection persistence", () => {
  test("selection survives remounts without storing customer information", () => {
    const storage = memoryStorage();
    const first = createBookingSelectionStore(() => storage);
    first.toggleService(FIRST_ID);
    first.toggleService(SECOND_ID);
    const remounted = createBookingSelectionStore(() => storage);
    expect(decodeBookingServiceIds(remounted.getSnapshot())).toEqual([
      FIRST_ID,
      SECOND_ID,
    ]);
    expect(storage.getItem(BOOKING_SELECTION_KEY)).toBe(
      JSON.stringify([FIRST_ID, SECOND_ID]),
    );
    expect(remounted.getServerSnapshot()).toBe("");
  });

  test("adding and removing services notifies the mounted views", () => {
    const store = createBookingSelectionStore();
    let changes = 0;
    const unsubscribe = store.subscribe(() => {
      changes += 1;
    });
    store.toggleService(FIRST_ID);
    store.toggleService(FIRST_ID);
    expect(decodeBookingServiceIds(store.getSnapshot())).toEqual([]);
    expect(changes).toBe(2);
    unsubscribe();
    store.toggleService(SECOND_ID);
    expect(changes).toBe(2);
  });

  test("clears only submitted services after a successful booking", () => {
    const store = createBookingSelectionStore();
    store.setServiceIds([FIRST_ID, SECOND_ID]);
    store.removeServiceIds([FIRST_ID]);
    expect(decodeBookingServiceIds(store.getSnapshot())).toEqual([SECOND_ID]);
  });

  test("invalid changes leave the existing draft untouched", () => {
    const store = createBookingSelectionStore();
    store.setServiceIds([FIRST_ID]);
    expect(store.setServiceIds([FIRST_ID, FIRST_ID])).toBe(false);
    expect(store.toggleService("invalid")).toBe(false);
    expect(decodeBookingServiceIds(store.getSnapshot())).toEqual([FIRST_ID]);
  });

  test("removing remains possible at the service count limit", () => {
    const store = createBookingSelectionStore();
    const ids = Array.from(
      { length: 9 },
      (_, index) => `0000000${index}-bbbb-4bbb-8bbb-bbbbbbbbbbbb`,
    );
    store.setServiceIds(ids.slice(0, 8));
    expect(store.toggleService(ids[8])).toBe(false);
    expect(store.toggleService(ids[0])).toBe(true);
    expect(store.toggleService(ids[8])).toBe(true);
  });

  test("blocked browser storage falls back to a functioning in-memory draft", () => {
    const store = createBookingSelectionStore(() => {
      throw new Error("Storage blocked");
    });
    expect(store.getSnapshot()).toBe("");
    expect(store.toggleService(FIRST_ID)).toBe(true);
    expect(decodeBookingServiceIds(store.getSnapshot())).toEqual([FIRST_ID]);
  });
});
