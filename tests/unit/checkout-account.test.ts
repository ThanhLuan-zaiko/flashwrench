// Checkout recipient binding: the /checkout form locks "Tên người nhận"
// and "Số điện thoại" to the signed-in account instead of free input.
import { describe, expect, test } from "bun:test";
import { accountRecipient } from "@/components/checkout/checkout-utils";
import { makePublicUser } from "../helpers/auth.fixtures";

describe("accountRecipient", () => {
  test("maps the account full name and phone into the recipient fields", () => {
    const user = makePublicUser({
      fullName: "Tran Thi Be",
      phone: "0987654321",
    });
    expect(accountRecipient(user)).toEqual({
      recipientName: "Tran Thi Be",
      phone: "0987654321",
    });
  });

  test("falls back to empty strings when signed out or fields are blank", () => {
    expect(accountRecipient(null)).toEqual({ recipientName: "", phone: "" });
    expect(
      accountRecipient(makePublicUser({ fullName: "", phone: "" })),
    ).toEqual({ recipientName: "", phone: "" });
  });
});
