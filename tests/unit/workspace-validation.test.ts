import { describe, expect, test } from "bun:test";
import { validatePresenceInput } from "@/lib/mechanic/mechanic-profile.service";
import { numericInput } from "@/lib/validation";
import { validateVehicleInput } from "@/lib/vehicles/vehicle.validation";

function validVehicleBody(overrides?: Record<string, unknown>) {
  return {
    licensePlate: "51A-123.45",
    brand: "Toyota",
    model: "Vios",
    year: 2019,
    vehicleType: "car",
    odometerKm: 45000,
    ...overrides,
  };
}

describe("numericInput", () => {
  test("accepts finite numbers and nonempty numeric strings", () => {
    expect(numericInput(0)).toBe(0);
    expect(numericInput(12.5)).toBe(12.5);
    expect(numericInput("12.5")).toBe(12.5);
    expect(numericInput(" 7 ")).toBe(7);
    expect(numericInput("abc")).toBeNaN();
  });

  test("rejects booleans, null, arrays, objects and blank strings", () => {
    for (const bad of [true, false, null, undefined, [], [1], {}, "", "  "]) {
      expect(numericInput(bad)).toBeNaN();
    }
  });
});

describe("validateVehicleInput", () => {
  test("accepts a valid body and canonicalizes the plate", () => {
    const result = validateVehicleInput(validVehicleBody());
    expect("value" in result).toBe(true);
    if ("value" in result) {
      expect(result.value.licensePlate).toBe("51A12345");
      expect(result.value.odometerKm).toBe(45000);
    }
  });

  test("gives different formats the same canonical plate", () => {
    const dashed = validateVehicleInput(validVehicleBody());
    const plain = validateVehicleInput(
      validVehicleBody({ licensePlate: "51a 12345" }),
    );
    if (!("value" in dashed) || !("value" in plain)) {
      throw new Error("expected valid inputs");
    }
    expect(dashed.value.licensePlate).toBe(plain.value.licensePlate);
  });

  test("rejects arrays and non-record bodies", () => {
    for (const bad of [null, undefined, [], [1], "x", 5, true]) {
      const result = validateVehicleInput(bad);
      expect("errors" in result && result.errors.form).toBeDefined();
    }
  });

  test("rejects invalid plates, blank text and oversized fields", () => {
    for (const plate of ["", "  ", "a", "-51A12345", "51A_12345"]) {
      const result = validateVehicleInput(
        validVehicleBody({ licensePlate: plate }),
      );
      expect("errors" in result && result.errors.licensePlate).toBeDefined();
    }
    const blank = validateVehicleInput(
      validVehicleBody({ brand: "   ", model: "" }),
    );
    if ("errors" in blank) {
      expect(blank.errors.brand).toBeDefined();
      expect(blank.errors.model).toBeDefined();
    } else {
      throw new Error("expected errors");
    }
  });

  test("year is optional, strict and bounded", () => {
    const empty = validateVehicleInput(validVehicleBody({ year: null }));
    expect("value" in empty && empty.value.year === null).toBe(true);
    const blank = validateVehicleInput(validVehicleBody({ year: "" }));
    expect("value" in blank && blank.value.year === null).toBe(true);
    const text = validateVehicleInput(validVehicleBody({ year: "2018" }));
    expect("value" in text && text.value.year === 2018).toBe(true);

    for (const year of [true, false, [], 1800, 1899, 3000, "abc"]) {
      const result = validateVehicleInput(validVehicleBody({ year }));
      expect("errors" in result && result.errors.year).toBeDefined();
    }
  });

  test("odometer is required and strictly numeric", () => {
    for (const bad of [true, false, null, undefined, [], {}, "", "abc", -1]) {
      const result = validateVehicleInput(
        validVehicleBody({ odometerKm: bad }),
      );
      expect("errors" in result && result.errors.odometerKm).toBeDefined();
    }
  });
});

function validPresenceBody(overrides?: Record<string, unknown>) {
  return {
    online: false,
    skills: ["engine", "tire"],
    baseLat: 10.775,
    baseLng: 106.7,
    ...overrides,
  };
}

describe("validatePresenceInput", () => {
  test("accepts a valid offline update and dedupes skills", () => {
    const result = validatePresenceInput(
      validPresenceBody({ skills: ["engine", "engine", "tire"] }),
    );
    expect("value" in result).toBe(true);
    if ("value" in result) {
      expect(result.value.skills).toEqual(["engine", "tire"]);
      expect(result.value.baseLat).toBe(10.775);
    }
  });

  test("rejects non-record bodies", () => {
    for (const bad of [null, undefined, [], "x", 5]) {
      const result = validatePresenceInput(bad);
      expect("errors" in result && result.errors.form).toBeDefined();
    }
  });

  test("rejects booleans, arrays and nulls as coordinates", () => {
    for (const lat of [false, [], [10], {}, "east"]) {
      const result = validatePresenceInput(validPresenceBody({ baseLat: lat }));
      expect("errors" in result && result.errors.location).toBeDefined();
    }
  });

  test("requires both coordinates together or neither", () => {
    const latOnly = validatePresenceInput(
      validPresenceBody({ baseLng: undefined }),
    );
    expect("errors" in latOnly && latOnly.errors.location).toBeDefined();
    const neither = validatePresenceInput(
      validPresenceBody({ baseLat: null, baseLng: null }),
    );
    expect("value" in neither).toBe(true);
    if ("value" in neither) {
      expect(neither.value.baseLat).toBeNull();
      expect(neither.value.baseLng).toBeNull();
    }
  });

  test("online requires coordinates", () => {
    const result = validatePresenceInput(
      validPresenceBody({
        online: true,
        baseLat: undefined,
        baseLng: undefined,
      }),
    );
    expect("errors" in result && result.errors.location).toBeDefined();
  });

  test("rejects unknown skills and non-boolean online", () => {
    const badSkill = validatePresenceInput(
      validPresenceBody({ skills: ["engine", "fly"] }),
    );
    expect("errors" in badSkill && badSkill.errors.skills).toBeDefined();
    const badOnline = validatePresenceInput(
      validPresenceBody({ online: "yes" }),
    );
    expect("errors" in badOnline && badOnline.errors.online).toBeDefined();
  });
});
