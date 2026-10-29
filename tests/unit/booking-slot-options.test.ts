// Day pills, hourly slots and step routing behind the stepped booking form.
import { describe, expect, test } from "bun:test";
import {
  bookingDayOptions,
  bookingTimeSlots,
  parseHoursLabel,
  splitScheduled,
} from "@/components/booking/booking-slot-options";
import {
  clampStep,
  stepOfFirstInvalid,
} from "@/components/booking/useBookingWizard";

describe("parseHoursLabel", () => {
  test("reads the shop window with an en dash or a hyphen", () => {
    expect(parseHoursLabel("07:00–20:00")).toEqual({
      opensAtMin: 420,
      closesAtMin: 1200,
    });
    expect(parseHoursLabel("8:30-17:00")).toEqual({
      opensAtMin: 510,
      closesAtMin: 1020,
    });
  });

  test("rejects missing, malformed or inverted windows", () => {
    expect(parseHoursLabel(null)).toBeNull();
    expect(parseHoursLabel("cả ngày")).toBeNull();
    expect(parseHoursLabel("20:00–07:00")).toBeNull();
  });
});

describe("splitScheduled", () => {
  test("splits a datetime-local value", () => {
    expect(splitScheduled("2026-10-30T09:00")).toEqual({
      day: "2026-10-30",
      time: "09:00",
    });
    expect(splitScheduled("")).toEqual({ day: "", time: "" });
  });
});

describe("bookingDayOptions", () => {
  const now = new Date("2026-10-29T10:00");

  test("labels today and counts forward from the earliest day", () => {
    const days = bookingDayOptions("2026-10-29T10:00", "", now, 4);
    expect(days.map((day) => day.value)).toEqual([
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
    expect(days[0]?.weekday).toBe("Hôm nay");
    expect(days[1]?.weekday).toBe("T6");
    expect(days[3]?.weekday).toBe("CN");
  });

  test("stops at the advance cap", () => {
    const days = bookingDayOptions(
      "2026-10-29T10:00",
      "2026-10-30T23:00",
      now,
      7,
    );
    expect(days).toHaveLength(2);
  });

  test("returns nothing for an unreadable floor", () => {
    expect(bookingDayOptions("", "", now)).toEqual([]);
  });
});

describe("bookingTimeSlots", () => {
  test("lists hourly slots inside the default window", () => {
    const slots = bookingTimeSlots("2026-10-30", "", "", null);
    expect(slots[0]).toBe("08:00");
    expect(slots.at(-1)).toBe("17:00");
    expect(slots).toHaveLength(10);
  });

  test("drops slots before the intake floor and after the cap", () => {
    expect(
      bookingTimeSlots("2026-10-30", "2026-10-30T15:20", "", {
        opensAtMin: 420,
        closesAtMin: 1200,
      }),
    ).toEqual(["16:00", "17:00", "18:00", "19:00"]);
    expect(
      bookingTimeSlots("2026-10-30", "", "2026-10-30T09:30", null),
    ).toEqual(["08:00", "09:00"]);
  });

  test("returns nothing without a day", () => {
    expect(bookingTimeSlots("", "", "", null)).toEqual([]);
  });
});

describe("clampStep", () => {
  test("keeps the step inside the flow", () => {
    expect(clampStep(-1, 4)).toBe(0);
    expect(clampStep(9, 4)).toBe(3);
    expect(clampStep(2, 4)).toBe(2);
    expect(clampStep(1, 0)).toBe(0);
  });
});

describe("stepOfFirstInvalid", () => {
  const rootWith = (owner: string | null | undefined) => ({
    querySelector: () =>
      owner === undefined
        ? null
        : {
            closest: () =>
              owner === null ? null : { getAttribute: () => owner },
          },
  });

  test("returns the wrapper step of the first flagged field", () => {
    expect(stepOfFirstInvalid(rootWith("2"), 4)).toBe(2);
  });

  test("sends problems outside every step to the last step", () => {
    expect(stepOfFirstInvalid(rootWith(null), 4)).toBe(3);
  });

  test("reports nothing when the form is clean", () => {
    expect(stepOfFirstInvalid(rootWith(undefined), 4)).toBeNull();
  });
});
