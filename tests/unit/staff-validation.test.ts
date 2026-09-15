import { describe, expect, test } from "bun:test";
import {
  generateTempPassword,
  validateStaffCreate,
  validateStaffUpdate,
} from "@/lib/auth/staff.validation";
import { validatePassword } from "@/lib/auth/validation";

const VALID = {
  fullName: "Tran Van Tho",
  phone: "0901111222",
  email: "tho@example.com",
  role: "mechanic" as const,
};

describe("validateStaffCreate", () => {
  test("accepts a valid mechanic payload", () => {
    expect(validateStaffCreate(VALID)).toBeNull();
  });

  test("accepts the dispatcher role", () => {
    expect(validateStaffCreate({ ...VALID, role: "dispatcher" })).toBeNull();
  });

  test("rejects customers on create (they self-register)", () => {
    const errors = validateStaffCreate({ ...VALID, role: "customer" });
    expect(errors?.role).toBeTruthy();
  });

  test("rejects the admin role", () => {
    const errors = validateStaffCreate({ ...VALID, role: "admin" as never });
    expect(errors?.role).toBeTruthy();
  });

  test("reports every invalid field", () => {
    const errors = validateStaffCreate({
      fullName: "A",
      phone: "123",
      email: "not-an-email",
      role: "owner" as never,
    });
    expect(errors?.fullName).toBeTruthy();
    expect(errors?.phone).toBeTruthy();
    expect(errors?.email).toBeTruthy();
    expect(errors?.role).toBeTruthy();
  });
});

describe("validateStaffUpdate", () => {
  test("accepts a valid payload and rejects admin role", () => {
    expect(validateStaffUpdate(VALID)).toBeNull();
    expect(
      validateStaffUpdate({ ...VALID, role: "admin" as never })?.role,
    ).toBeTruthy();
  });

  test("keeps existing customers editable", () => {
    expect(validateStaffUpdate({ ...VALID, role: "customer" })).toBeNull();
  });
});

describe("generateTempPassword", () => {
  test("produces a 12-char password passing validation", () => {
    for (let i = 0; i < 20; i += 1) {
      const password = generateTempPassword();
      expect(password).toHaveLength(12);
      expect(validatePassword(password)).toBeNull();
    }
  });

  test("produces unique values", () => {
    const seen = new Set(
      Array.from({ length: 10 }, () => generateTempPassword()),
    );
    expect(seen.size).toBeGreaterThan(1);
  });
});
