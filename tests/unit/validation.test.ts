import { describe, expect, test } from "bun:test";
import {
  isEmail,
  normalizeEmail,
  normalizePhone,
  validateChangePasswordInput,
  validateLoginInput,
  validateRegisterInput,
} from "@/lib/auth/validation";
import { makeRegisterInput } from "../helpers/auth.fixtures";

describe("normalizePhone", () => {
  test("keeps canonical local format untouched", () => {
    expect(normalizePhone("0912345678")).toBe("0912345678");
  });

  test("maps every +84/84/0084 spelling to the same local number", () => {
    expect(normalizePhone("+84912345678")).toBe("0912345678");
    expect(normalizePhone("84912345678")).toBe("0912345678");
    expect(normalizePhone("0084912345678")).toBe("0912345678");
  });

  test("strips separators before converting the prefix", () => {
    expect(normalizePhone("(+84) 912-345-678")).toBe("0912345678");
    expect(normalizePhone(" 0912 345 678 ")).toBe("0912345678");
  });
});

describe("normalizeEmail", () => {
  test("trims and lowercases", () => {
    expect(normalizeEmail("  An@Example.COM ")).toBe("an@example.com");
  });

  test("detects email identifiers", () => {
    expect(isEmail("an@example.com")).toBe(true);
    expect(isEmail("0912345678")).toBe(false);
  });
});

describe("validateRegisterInput", () => {
  test("accepts a valid payload", () => {
    expect(validateRegisterInput(makeRegisterInput())).toBeNull();
  });

  test("rejects blank, malformed and mismatched fields", () => {
    const errors = validateRegisterInput(
      makeRegisterInput({
        fullName: "A",
        phone: "123",
        email: "not-an-email",
        password: "short",
        confirmPassword: "different",
      }),
    );
    expect(errors).not.toBeNull();
    expect(errors?.fullName).toBeDefined();
    expect(errors?.phone).toBeDefined();
    expect(errors?.email).toBeDefined();
    expect(errors?.password).toBeDefined();
    expect(errors?.confirmPassword).toBeDefined();
  });

  test("requires letters and digits in the password", () => {
    const lettersOnly = validateRegisterInput(
      makeRegisterInput({ password: "password", confirmPassword: "password" }),
    );
    expect(lettersOnly?.password).toBeDefined();
    const digitsOnly = validateRegisterInput(
      makeRegisterInput({ password: "12345678", confirmPassword: "12345678" }),
    );
    expect(digitsOnly?.password).toBeDefined();
  });

  test("accepts +84 phone spellings because they normalize first", () => {
    expect(
      validateRegisterInput(makeRegisterInput({ phone: "+84912345678" })),
    ).toBeNull();
  });
});

describe("validateLoginInput", () => {
  test("accepts phone and email identifiers", () => {
    expect(
      validateLoginInput({ identifier: "0912345678", password: "secret123" }),
    ).toBeNull();
    expect(
      validateLoginInput({
        identifier: "an@example.com",
        password: "secret123",
      }),
    ).toBeNull();
  });

  test("rejects blank identifier and short passwords", () => {
    expect(
      validateLoginInput({ identifier: "", password: "secret123" }),
    ).toMatchObject({ identifier: expect.any(String) });
    expect(
      validateLoginInput({ identifier: "0912345678", password: "short" }),
    ).toMatchObject({ password: expect.any(String) });
  });
});

describe("validateChangePasswordInput", () => {
  const valid = {
    currentPassword: "secret123",
    newPassword: "brandnew1",
    confirmPassword: "brandnew1",
  };

  test("accepts a valid rotation", () => {
    expect(validateChangePasswordInput(valid)).toBeNull();
  });

  test("rejects reuse of the current password", () => {
    expect(
      validateChangePasswordInput({
        ...valid,
        newPassword: "secret123",
        confirmPassword: "secret123",
      })?.newPassword,
    ).toBeDefined();
  });

  test("rejects mismatched confirmation", () => {
    expect(
      validateChangePasswordInput({ ...valid, confirmPassword: "other1234" })
        ?.confirmPassword,
    ).toBeDefined();
  });
});
