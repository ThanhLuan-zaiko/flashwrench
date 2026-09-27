import { describe, expect, test } from "bun:test";
import { validateCreateRescueInput } from "@/lib/rescue/rescue.validation";
import { makeRescueInput } from "../helpers/rescue.fixtures";

// Pure validation behind POST /api/rescue and the /rescue form:
// same rules on both sides, so the form never promises what the
// service rejects. No React, no mocks.
describe("validateCreateRescueInput", () => {
  test("accepts a complete guest rescue and normalizes values", () => {
    const result = validateCreateRescueInput(
      makeRescueInput({ vehiclePlate: "  51f-12345 ", phone: "+84912345678" }),
    );
    expect("value" in result).toBe(true);
    if (!("value" in result)) return;
    expect(result.value.fullName).toBe("Nguyen Van An");
    expect(result.value.phone).toBe("0912345678");
    expect(result.value.vehiclePlate).toBe("51F-12345");
    expect(result.value.issueType).toBe("flat_tire");
    expect(result.value.lat).toBe(10.7769);
    expect(result.value.lng).toBe(106.7009);
  });

  test("requires name, phone and issue type", () => {
    const result = validateCreateRescueInput(
      makeRescueInput({ fullName: "  ", phone: "", issueType: "" }),
    );
    expect("errors" in result).toBe(true);
    if (!("errors" in result)) return;
    expect(result.errors.fullName).toContain("họ và tên");
    expect((result.errors.phone ?? "").toLowerCase()).toContain(
      "số điện thoại",
    );
    expect(result.errors.issueType).toContain("sự cố");
  });

  test("rejects bad phones and unknown issue types", () => {
    const badPhone = validateCreateRescueInput(
      makeRescueInput({ phone: "123" }),
    );
    expect("errors" in badPhone).toBe(true);
    if ("errors" in badPhone) {
      expect((badPhone.errors.phone ?? "").toLowerCase()).toContain(
        "số điện thoại",
      );
    }

    const badIssue = validateCreateRescueInput(
      makeRescueInput({ issueType: "flying_car" }),
    );
    expect("errors" in badIssue).toBe(true);
    if ("errors" in badIssue) {
      expect(badIssue.errors.issueType).toContain("Sự cố");
    }
  });

  test("rejects short addresses and bad plates", () => {
    const result = validateCreateRescueInput(
      makeRescueInput({ address: "Q3", vehiclePlate: "!!!" }),
    );
    expect("errors" in result).toBe(true);
    if (!("errors" in result)) return;
    expect(result.errors.address).toContain("10 đến 300");
    expect(result.errors.vehiclePlate).toContain("Biển số");
  });

  test("rejects overlong descriptions and half coordinates", () => {
    const long = validateCreateRescueInput(
      makeRescueInput({ description: "x".repeat(1001) }),
    );
    expect("errors" in long).toBe(true);

    const half = validateCreateRescueInput(
      makeRescueInput({ lat: 10.7769, lng: null }),
    );
    expect("errors" in half).toBe(true);
    if (!("errors" in half)) return;
    expect(half.errors.location).toContain("bản đồ");
  });

  test("accepts a rescue without map pin or optional text", () => {
    const result = validateCreateRescueInput(
      makeRescueInput({
        lat: null,
        lng: null,
        province: "   ",
        description: "",
      }),
    );
    expect("value" in result).toBe(true);
    if (!("value" in result)) return;
    expect(result.value.lat).toBeNull();
    expect(result.value.lng).toBeNull();
    expect(result.value.province).toBeNull();
    expect(result.value.description).toBeNull();
  });
});
