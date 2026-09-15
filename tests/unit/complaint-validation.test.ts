import { describe, expect, test } from "bun:test";
import {
  validateComplaintInput,
  validateTransitionInput,
} from "@/lib/complaints/complaint-validation";

describe("validateComplaintInput", () => {
  const valid = {
    reporterName: "Nguyen Van A",
    reporterPhone: "0912345678",
    subject: "Tho den tre hai gio",
    body: "Tho hen 9 gio nhung 11 gio moi den, khong bao truoc.",
  };

  test("accepts a minimal valid payload", () => {
    expect(validateComplaintInput(valid)).toBeNull();
  });

  test("rejects blank reporters and malformed phones", () => {
    expect(
      validateComplaintInput({ ...valid, reporterName: "  " }),
    ).toMatchObject({ reporterName: expect.any(String) });
    expect(
      validateComplaintInput({ ...valid, reporterPhone: "abc" }),
    ).toMatchObject({ reporterPhone: expect.any(String) });
    expect(validateComplaintInput({ ...valid, reporterPhone: "" })).toBeNull();
  });

  test("rejects unknown ref types and overlong references", () => {
    expect(validateComplaintInput({ ...valid, refType: "sms" })).toMatchObject({
      refType: expect.any(String),
    });
    expect(
      validateComplaintInput({ ...valid, refId: "x".repeat(81) }),
    ).toMatchObject({ refId: expect.any(String) });
  });

  test("bounds subject and body lengths", () => {
    expect(validateComplaintInput({ ...valid, subject: "abc" })).toMatchObject({
      subject: expect.any(String),
    });
    expect(
      validateComplaintInput({ ...valid, body: "too short" }),
    ).toMatchObject({ body: expect.any(String) });
    expect(
      validateComplaintInput({ ...valid, body: "x".repeat(2001) }),
    ).toMatchObject({ body: expect.any(String) });
  });
});

describe("validateTransitionInput", () => {
  test("accepts review and reopen without a note", () => {
    expect(validateTransitionInput({ action: "start-review" })).toBeNull();
    expect(validateTransitionInput({ action: "reopen" })).toBeNull();
  });

  test("requires a note for resolve and reject", () => {
    expect(validateTransitionInput({ action: "resolve" })).toMatchObject({
      note: expect.any(String),
    });
    expect(
      validateTransitionInput({ action: "reject", note: "Xac minh xong." }),
    ).toBeNull();
    expect(
      validateTransitionInput({ action: "resolve", note: "ok" }),
    ).toMatchObject({ note: expect.any(String) });
  });

  test("rejects unknown actions", () => {
    expect(validateTransitionInput({ action: "delete" })).toMatchObject({
      form: expect.any(String),
    });
  });
});
