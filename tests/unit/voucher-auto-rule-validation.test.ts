// Field-level validation for auto-grant rules: each trigger only accepts
// the numeric inputs it actually consumes, and every rejection is a field
// error map the form can render.
import { describe, expect, test } from "bun:test";
import { validateAutoRuleInput } from "@/lib/vouchers/auto-rule-validation";
import { VOUCHER_CAMPAIGN_ID } from "../helpers/voucher.fixtures";

const base = {
  name: "Khach quen",
  campaignId: VOUCHER_CAMPAIGN_ID,
};

describe("validateAutoRuleInput", () => {
  test("accepts a complete count rule", () => {
    expect(
      validateAutoRuleInput({
        ...base,
        triggerType: "booking_count",
        threshold: 5,
      }),
    ).toBeNull();
  });

  test("accepts triggers that take no numeric input", () => {
    for (const triggerType of ["signup", "review_created"] as const) {
      expect(validateAutoRuleInput({ ...base, triggerType })).toBeNull();
    }
  });

  test("accepts a win_back rule driven by windowDays", () => {
    expect(
      validateAutoRuleInput({
        ...base,
        triggerType: "win_back",
        windowDays: 30,
      }),
    ).toBeNull();
  });

  test("rejects a missing name and malformed campaign id", () => {
    const errors = validateAutoRuleInput({
      name: "   ",
      campaignId: "not-a-uuid",
      triggerType: "signup",
    });
    expect(errors?.name).toBeDefined();
    expect(errors?.campaignId).toBeDefined();
  });

  test("rejects an unknown trigger type", () => {
    const errors = validateAutoRuleInput({
      ...base,
      triggerType: "every_click",
    });
    expect(errors?.triggerType).toBeDefined();
  });

  test("count triggers need a positive integer threshold", () => {
    for (const threshold of [undefined, 0, -2, 2.5, "abc"]) {
      const errors = validateAutoRuleInput({
        ...base,
        triggerType: "order_count",
        threshold,
      });
      expect(errors?.threshold).toBeDefined();
    }
  });

  test("money triggers enforce the minimum threshold", () => {
    const errors = validateAutoRuleInput({
      ...base,
      triggerType: "spend_total",
      threshold: 500,
    });
    expect(errors?.threshold).toBeDefined();
    expect(
      validateAutoRuleInput({
        ...base,
        triggerType: "order_value",
        threshold: 50000,
      }),
    ).toBeNull();
  });

  test("win_back rejects missing or absurd windowDays", () => {
    for (const windowDays of [undefined, 0, -1, 1.5, 99999]) {
      const errors = validateAutoRuleInput({
        ...base,
        triggerType: "win_back",
        windowDays,
      });
      expect(errors?.windowDays).toBeDefined();
    }
  });

  test("numeric strings are accepted for thresholds", () => {
    expect(
      validateAutoRuleInput({
        ...base,
        triggerType: "booking_count",
        threshold: "3",
      }),
    ).toBeNull();
  });
});
